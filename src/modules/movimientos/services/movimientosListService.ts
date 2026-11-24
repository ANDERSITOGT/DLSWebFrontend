import { apiFetch } from "@/services/api"
import { ApiError } from "@/services/apiError"
import { extraerCantidad, toNumberOrNull } from "../utils/format"
import type {
  ListMovimientosParams,
  MovimientoDetalle,
  MovimientoProducto,
  MovimientoResumen,
  MovimientosMeta,
  MovimientosPage,
} from "../types"

/**
 * Servicio del listado y detalle de Movimientos.
 *
 * Todas las peticiones pasan por `apiFetch`, que inyecta el token
 * (`dls_token`) y aplica el kill-switch 401/403. Los errores llegan como
 * `ApiError` tipado.
 */

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return {} as T
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

/**
 * Construye el `URLSearchParams` de GET /api/movimientos. Sólo se envían los
 * filtros con valor; `page`/`limit` siempre. El backend aplica el aislamiento
 * por rol (SOLICITANTE) y el rango de fechas en su propia zona horaria.
 */
export function buildMovimientosQuery(params: ListMovimientosParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.tipo) search.set("tipo", params.tipo)
  if (params.estado) search.set("estado", params.estado)
  if (params.proveedorId) search.set("proveedorId", params.proveedorId)
  if (params.solicitanteId) search.set("solicitanteId", params.solicitanteId)
  if (params.bodegaId) search.set("bodegaId", params.bodegaId)
  if (params.fechaInicio) search.set("fechaInicio", params.fechaInicio)
  if (params.fechaFin) search.set("fechaFin", params.fechaFin)
  const q = params.q?.trim()
  if (q) search.set("q", q)
  return search.toString()
}

/**
 * `GET /api/movimientos` → `{ data, meta }`.
 * Defensa: si el backend respondiera un array plano (contrato previo,
 * `{ movimientos }`), se normaliza a `{ data, meta }`.
 */
export async function listMovimientos(params: ListMovimientosParams): Promise<MovimientosPage> {
  const query = buildMovimientosQuery(params)
  const res = await apiFetch(`/api/movimientos?${query}`)
  const body = await parseJson<unknown>(res)

  const fallbackMeta = (data: MovimientoResumen[]): MovimientosMeta => ({
    total: data.length,
    page: params.page,
    limit: params.limit,
    totalPages: data.length > 0 ? 1 : 0,
  })

  // Contrato previo: array plano.
  if (Array.isArray(body)) {
    return { data: body as MovimientoResumen[], meta: fallbackMeta(body as MovimientoResumen[]) }
  }

  const obj = (body ?? {}) as {
    data?: unknown
    meta?: MovimientosMeta
    movimientos?: unknown
  }

  // Contrato legacy `{ movimientos: [...] }`.
  const data = Array.isArray(obj.data)
    ? (obj.data as MovimientoResumen[])
    : Array.isArray(obj.movimientos)
      ? (obj.movimientos as MovimientoResumen[])
      : []

  // `montoTotal` puede llegar como string (numeric) → se normaliza a número|null.
  const normalized = data.map((m) => ({ ...m, montoTotal: toNumberOrNull(m.montoTotal) }))

  return { data: normalized, meta: obj.meta ?? fallbackMeta(normalized) }
}

/**
 * Normaliza una línea de producto del detalle.
 *
 * - `cantidad` SIEMPRE numérica (acepta string/numeric, objetos anidados y
 *   aliases como `cantidadEntregada`). Si el backend la envía como `0` pero el
 *   subtotal y el costo unitario permiten derivarla (`subtotal / costounit`),
 *   se usa ese valor como respaldo seguro.
 * - `costounit` / `subtotal`: número o `null` (sin permiso de importes).
 * - Completa `id`, `productoNombre`, `productoCodigo`, `unidad` y `loteCodigo`
 *   con aliases tolerantes para no romper la UI si el backend cambia nombres.
 */
function normalizarProducto(raw: unknown, index: number): MovimientoProducto {
  const p = (raw ?? {}) as Record<string, unknown>
  const cantidadLeida = extraerCantidad(p)
  const costo =
    toNumberOrNull(p.costounit) ??
    toNumberOrNull(p.costoUnitario) ??
    toNumberOrNull(p.costo_unit) ??
    toNumberOrNull(p.costoUnit) ??
    toNumberOrNull(p.precioUnitario) ??
    toNumberOrNull(p.costo)
  const subtotalLeido = toNumberOrNull(p.subtotal) ?? toNumberOrNull(p.costoTotal)

  // Respaldo: si la cantidad llega ausente o en 0 pero hay costo unitario y
  // subtotal válidos (> 0), se deriva `subtotal / costounit`. Cubre los casos
  // en que el backend omite el campo o lo serializa como 0 (ej. ING-2026-0151).
  let cantidad = cantidadLeida ?? 0
  if (cantidad <= 0 && costo !== null && costo > 0 && subtotalLeido !== null && subtotalLeido > 0) {
    const derivada = subtotalLeido / costo
    if (Number.isFinite(derivada) && derivada > 0) cantidad = Math.round(derivada * 100) / 100
  }

  const subtotal = subtotalLeido !== null ? subtotalLeido : costo !== null ? cantidad * costo : null
  const unidad = p.unidad
  const unidadTexto =
    typeof unidad === "string"
      ? unidad
      : unidad && typeof unidad === "object" && "abreviatura" in unidad
        ? String((unidad as { abreviatura?: unknown }).abreviatura ?? "")
        : ""

  return {
    id: String(p.id ?? `linea-${index}`),
    productoNombre: String(p.productoNombre ?? p.nombre ?? "Producto"),
    productoCodigo: String(p.productoCodigo ?? p.codigo ?? ""),
    cantidad,
    unidad: unidadTexto,
    loteCodigo: (p.loteCodigo as string | null | undefined) ?? null,
    loteId: (p.loteId as string | null | undefined) ?? null,
    fincaNombre: (p.fincaNombre as string | null | undefined) ?? null,
    costounit: costo,
    subtotal,
  }
}

/**
 * Normaliza el detalle completo (productos y montoTotal) antes de la UI.
 *
 * Tolera que las líneas lleguen bajo otros nombres (`items`, `detalle`,
 * `lineas`) además de `productos`, y si `montoTotal` no viene (o viene en 0
 * teniendo subtotales válidos) lo deriva de la suma de subtotales.
 */
function normalizarDetalle(raw: MovimientoDetalle): MovimientoDetalle {
  const cuerpo = (raw ?? {}) as MovimientoDetalle & Record<string, unknown>
  const candidatas = [cuerpo.productos, cuerpo.items, cuerpo.detalle, cuerpo.lineas]
  const lineasRaw = candidatas.find((c): c is unknown[] => Array.isArray(c)) ?? []
  const productos = lineasRaw.map((p, i) => normalizarProducto(p, i))
  const sumaSubtotales = productos.some((p) => p.subtotal !== null)
    ? productos.reduce((acc, p) => acc + (p.subtotal ?? 0), 0)
    : null
  const montoLeido = toNumberOrNull(cuerpo.montoTotal)
  const montoTotal = montoLeido !== null && montoLeido !== 0 ? montoLeido : sumaSubtotales
  return { ...cuerpo, productos, montoTotal }
}

/**
 * `GET /api/movimientos/:id` → detalle.
 * Acepta id o consecutivo (el backend resuelve ambos). Si el backend responde
 * 404 con code MOVIMIENTO_NO_ENCONTRADO, se propaga el `ApiError` 404.
 */
export async function getMovimiento(id: string): Promise<MovimientoDetalle> {
  const res = await apiFetch(`/api/movimientos/${encodeURIComponent(id)}`)
  return normalizarDetalle(await parseJson<MovimientoDetalle>(res))
}

/** Dispara la descarga autenticada del PDF de un movimiento (por id). */
export async function exportMovimientoPdf(id: string): Promise<Blob> {
  const res = await apiFetch(`/api/movimientos/${encodeURIComponent(id)}/export`)
  return res.blob()
}

/** Normaliza cualquier error a `ApiError` para la UI. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(
    error instanceof Error ? error.message : "Error desconocido",
    0,
    "HTTP_ERROR",
  )
}

