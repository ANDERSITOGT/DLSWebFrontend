import type { SolicitudEstado, SolicitudTipo } from "../types"

// Reutilizamos los formateadores ya probados del módulo Movimientos para
// mantener una única fuente de verdad (zona horaria America/Guatemala, GTQ, etc.).
export {
  formatFechaHora,
  formatFechaCorta,
  formatHoraCorta,
  formatMonto,
  formatCantidad,
  toNumberOrNull,
} from "@/modules/movimientos/utils/format"

/** Etiqueta legible del estado. */
export function estadoLabel(estado: SolicitudEstado): string {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente"
    case "APROBADA":
      return "Aprobada"
    case "RECHAZADA":
      return "Rechazada"
    case "ENTREGADA":
      return "Entregada"
  }
}

/** Color de badge por estado (fondo claro + borde de acento). */
export const ESTADO_STYLES: Record<SolicitudEstado, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  APROBADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RECHAZADA: "bg-rose-50 text-rose-700 border-rose-200",
  ENTREGADA: "bg-blue-50 text-blue-700 border-blue-200",
}

/** Color de badge/ícono por tipo. */
export const TIPO_STYLES: Record<SolicitudTipo, { badge: string; icon: string; label: string }> = {
  DESPACHO: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "bg-sky-100 text-sky-600",
    label: "Despacho",
  },
  DEVOLUCION: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    icon: "bg-violet-100 text-violet-600",
    label: "Devolución",
  },
}
