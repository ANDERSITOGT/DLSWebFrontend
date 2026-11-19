import type { Formato } from "@/services/dashboardService";

/**
 * Formatea un valor según el `formato` del contrato (guía §6.3).
 * - numero  -> entero con separadores de miles
 * - moneda  -> Quetzales (GTQ)
 * - libras  -> número + "lb"
 * - metros  -> decimal + "lb/m" (rendimiento)
 */
export function formatValue(value: number, formato: Formato) {
  switch (formato) {
    case "moneda":
      return `Q${value.toLocaleString("es-GT", { maximumFractionDigits: 0 })}`;
    case "libras":
      return `${value.toLocaleString("es-GT", { maximumFractionDigits: 0 })} lb`;
    case "metros":
      return `${value.toLocaleString("es-GT", { maximumFractionDigits: 1 })} lb/m`;
    default:
      return value.toLocaleString("es-GT", { maximumFractionDigits: 0 });
  }
}
