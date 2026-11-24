import { exportSolicitudPdf } from "../services/solicitudesListService"

/**
 * Descarga el PDF de una solicitud de forma autenticada.
 *
 * `GET /api/solicitudes/:id/export` ahora exige `Bearer`, por lo que ya NO se
 * puede abrir con `window.open` ni `<a href>`: se pide el binario con `apiFetch`
 * (que inyecta el token) y se descarga con un enlace temporal.
 */
export async function exportSolicitudDetalle(id: string, filename = `solicitud-${id}.pdf`) {
  const blob = await exportSolicitudPdf(id)

  if (typeof document === "undefined") return

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Libera el objeto URL en el siguiente tick (algunos navegadores lo requieren).
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
