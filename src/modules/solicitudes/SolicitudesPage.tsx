import { SolicitudesListView } from "./listado/SolicitudesListView"

/**
 * Punto de entrada del módulo Solicitudes. La implementación vive en
 * `./listado/` (composición + hook + servicios + vistas + detalle en Sheet).
 */
export default function SolicitudesPage() {
  return <SolicitudesListView />
}
