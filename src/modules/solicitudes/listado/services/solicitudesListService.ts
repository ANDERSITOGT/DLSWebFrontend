import { apiFetch } from "@/services/api"
import { ApiError } from "@/services/apiError"
import { extraerCantidad, toNumberOrNull } from "@/modules/movimientos/utils/format"
import type {
  CambioEstadoPayload,
  EntregarResultado,
  ListSolicitudesParams,
  SolicitudDetalle,
  SolicitudHistorialItem,
  SolicitudProducto,
  SolicitudResumen,
  SolicitudesMeta,
  SolicitudesPage,
} from "../types"

/**
 * Servicio del listado, detalle y acciones de Solicitudes.
 *
 * Todas las peticiones pasan por `apiFetch`, que inyecta el token
 * (`dls_token`) y aplica el kill-switch 401/403 + manejo centralizado de
 * errores de módulo (`ApiError`). La descarga del PDF también es autenticada.
 */

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return {} as T
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

/** Construye el query string de GET /api/solicitudes (sólo filtros con valor). */
export function buildSolicitudesQuery(params: ListSolicitudesParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.estado) search.set("estado", params.estado)
  if (params.tipo) search.set("tipo", params.tipo)
  if (params.bodegaId) search.set("bodegaId", params.bodegaId)
  const q = params.q?.trim()
  if (q) search.set("q", q)
  return search.toString()
}

/**
 * `GET /api/solicitudes` → `{ ok, solicitudes, meta }`.
 * Defensa: tolera respuestas sin `meta` (deriva una) o con `data` en lugar de
 * `solicitudes`.
 */
export async function listSolicitudes(params: ListSolicitudesParams): Promise<SolicitudesPage> {
  const query = buildSolicitudesQuery(params)
  const res = await apiFetch(`/api/solicitudes?${query}`)
  const body = await parseJson<unknown>(res)

  const fallbackMeta = (data: SolicitudResumen[]): SolicitudesMeta => ({
    total: data.length,
    page: params.page,
    limit: params.limit,
    totalPages: data.length > 0 ? 1 : 0,
  })

  // Contrato previo: array plano.
  if (Array.isArray(body)) {
    const data = body as SolicitudResumen[]
    return { solicitudes: data, meta: fallbackMeta(data) }
  }

  const obj = (body ?? {}) as {
    solicitudes?: unknown
    data?: unknown
    meta?: SolicitudesMeta
  }

  const solicitudes = Array.isArray(obj.solicitudes)
    ? (obj.solicitudes as SolicitudResumen[])
    : Array.isArray(obj.data)
      ? (obj.data as SolicitudResumen[])
      : []

  return { solicitudes, meta: obj.meta ?? fallbackMeta(solicitudes) }
}

/** Normaliza una línea de producto del detalle (cantidad/costos tolerantes). */
function normalizarProducto(raw: unknown, index: number): SolicitudProducto {
  const p = (raw ?? {}) as Record<string, unknown>
  // Mismo parser robusto que movimientos: prioriza `cantidadNumero` y tolera
  // textos con unidad (p.ej. "75 cc"), evitando que la cantidad quede en 0.
  const cantidad = extraerCantidad(p) ?? 0
  const costo =
    toNumberOrNull(p.costounit) ??
    toNumberOrNull(p.costoUnitario) ??
    toNumberOrNull(p.costo) ??
    null
  const subtotalLeido = toNumberOrNull(p.subtotal)
  const subtotal = subtotalLeido !== null ? subtotalLeido : costo !== null ? cantidad * costo : null

  return {
    id: String(p.id ?? `linea-${index}`),
    nombre: String(p.nombre ?? p.productoNombre ?? "Producto"),
    codigo: String(p.codigo ?? p.productoCodigo ?? ""),
    cantidad,
    unidad: String(p.unidad ?? ""),
    loteCodigo: (p.loteCodigo as string | null | undefined) ?? null,
    notas: (p.notas as string | null | undefined) ?? null,
    costounit: costo,
    subtotal,
  }
}

/** Normaliza un evento de historial. */
function normalizarHistorial(raw: unknown): SolicitudHistorialItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const h = (item ?? {}) as Record<string, unknown>
    const usuario = h.usuario as Record<string, unknown> | null | undefined
    return {
      accion: String(h.accion ?? ""),
      fecha: (h.fecha as string | null | undefined) ?? null,
      usuario:
        usuario && typeof usuario === "object"
          ? { id: String(usuario.id ?? ""), nombre: String(usuario.nombre ?? "") }
          : null,
      payload:
        h.payload && typeof h.payload === "object"
          ? (h.payload as Record<string, unknown>)
          : null,
    }
  })
}

/**
 * Normaliza el detalle completo: productos, `montoTotal` (deriva de subtotales
 * si no viene) e historial. Tolera líneas bajo `items`/`detalle`.
 */
function normalizarDetalle(raw: unknown): SolicitudDetalle {
  const d = (raw ?? {}) as Record<string, unknown> & Partial<SolicitudDetalle>
  const candidatas = [d.productos, (d as Record<string, unknown>).items, (d as Record<string, unknown>).detalle]
  const lineasRaw = candidatas.find((c): c is unknown[] => Array.isArray(c)) ?? []
  const productos = lineasRaw.map((p, i) => normalizarProducto(p, i))

  const sumaSubtotales = productos.some((p) => p.subtotal !== null)
    ? productos.reduce((acc, p) => acc + (p.subtotal ?? 0), 0)
    : null
  const montoLeido = toNumberOrNull(d.montoTotal)
  const montoTotal = montoLeido ?? sumaSubtotales

  return {
    id: String(d.id ?? ""),
    codigo: String(d.codigo ?? ""),
    fecha: String(d.fecha ?? ""),
    estado: (d.estado as SolicitudDetalle["estado"]) ?? "PENDIENTE",
    tipo: (d.tipo as SolicitudDetalle["tipo"]) ?? "DESPACHO",
    solicitante: (d.solicitante as SolicitudDetalle["solicitante"]) ?? null,
    aprobador: (d.aprobador as SolicitudDetalle["aprobador"]) ?? null,
    bodega: (d.bodega as SolicitudDetalle["bodega"]) ?? null,
    productos,
    documentoSalidaConsecutivo: (d.documentoSalidaConsecutivo as string | null) ?? null,
    montoTotal,
    historial: normalizarHistorial(d.historial),
  }
}

/** `GET /api/solicitudes/:id` → detalle normalizado. */
export async function getSolicitud(id: string): Promise<SolicitudDetalle> {
  const res = await apiFetch(`/api/solicitudes/${encodeURIComponent(id)}`)
  const body = await parseJson<unknown>(res)
  return normalizarDetalle(body)
}

/**
 * `PATCH /api/solicitudes/:id/estado` — aprobar/rechazar (ADMIN|BODEGUERO).
 * Devuelve el detalle actualizado.
 */
export async function cambiarEstadoSolicitud(
  id: string,
  payload: CambioEstadoPayload,
): Promise<SolicitudDetalle> {
  const res = await apiFetch(`/api/solicitudes/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  const body = await parseJson<unknown>(res)
  // El backend devuelve el detalle; si viene envuelto en { solicitud }, lo abrimos.
  const detalle =
    body && typeof body === "object" && "solicitud" in body
      ? (body as { solicitud: unknown }).solicitud
      : body
  return normalizarDetalle(detalle)
}

/**
 * `POST /api/solicitudes/:id/entregar` — generar documento y mover inventario.
 * Requiere estado APROBADA y rol ADMIN|BODEGUERO.
 */
export async function entregarSolicitud(id: string): Promise<EntregarResultado> {
  const res = await apiFetch(`/api/solicitudes/${encodeURIComponent(id)}/entregar`, {
    method: "POST",
  })
  const data = await parseJson<{ documentoId?: string; codigoDoc?: string }>(res)
  return {
    documentoId: data.documentoId ?? null,
    codigoDoc: data.codigoDoc ?? null,
  }
}

/** Dispara la descarga autenticada del PDF de una solicitud (Bearer + Blob). */
export async function exportSolicitudPdf(id: string): Promise<Blob> {
  const res = await apiFetch(`/api/solicitudes/${encodeURIComponent(id)}/export`)
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
