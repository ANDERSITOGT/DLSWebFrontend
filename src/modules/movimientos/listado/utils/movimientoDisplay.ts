import type { MovimientoResumen, MovimientoTipo } from "../../types"

/** Etiqueta legible por tipo. */
export const TIPO_LABEL: Record<MovimientoTipo, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
  DEVOLUCION: "Devolución",
  TRANSFERENCIA: "Transferencia",
}

/** Tipos en los que el proveedor es la contraparte principal. */
export function usaProveedor(tipo: MovimientoTipo): boolean {
  return tipo === "INGRESO" || tipo === "DEVOLUCION"
}

/** Tipos en los que el solicitante es la contraparte principal. */
export function usaSolicitante(tipo: MovimientoTipo): boolean {
  return tipo === "SALIDA"
}

/**
 * Nombre de la contraparte del movimiento según su tipo:
 * - INGRESO / DEVOLUCION → Proveedor
 * - SALIDA → Solicitante
 * - Resto → Creador (quien lo registró)
 */
export function contraparte(m: MovimientoResumen): { nombre: string; rol: "proveedor" | "solicitante" | "creador" } {
  if (usaProveedor(m.tipo) && m.proveedor) return { nombre: m.proveedor.nombre, rol: "proveedor" }
  if (usaSolicitante(m.tipo) && m.solicitante) return { nombre: m.solicitante.nombre, rol: "solicitante" }
  return { nombre: m.creador?.nombre ?? "—", rol: "creador" }
}

/** Resume el comprobante fiscal como "FACTURA A-123" o "A-123" si no hay tipo. */
export function formatComprobante(
  c: MovimientoResumen["comprobante"],
): string | null {
  if (!c) return null
  const serie = c.serie?.trim()
  const numero = c.numero?.trim()
  const cuerpo = [serie, numero].filter(Boolean).join("-")
  if (!cuerpo) return null
  return c.tipocomprobante ? `${c.tipocomprobante} ${cuerpo}` : cuerpo
}

/** ¿La bodega origen y destino coinciden (transferencia interna del mismo sitio)? */
export function bodegasDistintas(m: MovimientoResumen): boolean {
  if (!m.bodegaOrigen || !m.bodegaDestino) return true
  return m.bodegaOrigen.id !== m.bodegaDestino.id
}
