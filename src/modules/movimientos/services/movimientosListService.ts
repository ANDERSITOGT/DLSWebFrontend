import { apiFetch } from "@/services/api"
import { ApiError } from "@/services/apiError"
import type {
  ListMovimientosParams,
  MovimientoDetalle,
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

  return { data, meta: obj.meta ?? fallbackMeta(data) }
}

/**
 * `GET /api/movimientos/:id` → detalle.
 * Acepta id o consecutivo (el backend resuelve ambos). Si el backend responde
 * 404 con code MOVIMIENTO_NO_ENCONTRADO, se propaga el `ApiError` 404.
 */
export async function getMovimiento(id: string): Promise<MovimientoDetalle> {
  const res = await apiFetch(`/api/movimientos/${encodeURIComponent(id)}`)
  return parseJson<MovimientoDetalle>(res)
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
