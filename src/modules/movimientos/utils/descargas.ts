import { apiFetch } from "@/services/api"
import type { ListMovimientosParams } from "../types"
import { buildMovimientosQuery } from "../services/movimientosListService"

/**
 * Dispara una descarga de binario (PDF) a través de `apiFetch`, de modo que el
 * token `Bearer` viaja en la cabecera (a diferencia de `window.open`, la ruta
 * `/export` exige autenticación).
 *
 * Se usa en las dos rutas de exportación:
 *  - GET /api/movimientos/export        (reutiliza `buildMovimientosQuery`,
 *    filtrando exactamente lo visible en pantalla).
 *  - GET /api/movimientos/:id/export    (detalle).
 */

async function downloadBlob(endpoint: string, filename: string) {
  const res = await apiFetch(endpoint)
  const blob = await res.blob()

  if (typeof document === "undefined") return

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Libera el objeto URL en el siguiente tick (algunos navegadores requieren
  // que el click ya haya sido procesado).
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Descarga el listado filtrado: GET /api/movimientos/export?... */
export async function exportMovimientosListado(
  params: Omit<ListMovimientosParams, "page" | "limit"> & { page?: number; limit?: number },
  filename = "movimientos.pdf",
) {
  const query = buildMovimientosQuery({ page: params.page ?? 1, limit: params.limit ?? 15, ...params })
  await downloadBlob(`/api/movimientos/export?${query}`, filename)
}

/** Descarga el PDF del detalle: GET /api/movimientos/:id/export */
export async function exportMovimientoDetalle(id: string, filename = `movimiento-${id}.pdf`) {
  await downloadBlob(`/api/movimientos/${encodeURIComponent(id)}/export`, filename)
}
