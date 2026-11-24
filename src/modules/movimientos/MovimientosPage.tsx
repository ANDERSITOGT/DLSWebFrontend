import { MovimientosListView } from "./listado/MovimientosListView"
/**
 * Punto de entrada del módulo Movimientos. La implementación vive en
 * `./listado/` (composición + hook + servicios + vistas + detalle).
 */
export function MovimientosPage() {
  return <MovimientosListView />
}

