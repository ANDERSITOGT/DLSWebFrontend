import type { MovimientoEstado, MovimientoTipo } from "../types"

/** Zona horaria de negocio. */
export const TZ = "America/Guatemala"

/** Formatea un ISO a fecha + hora legible en la zona de negocio. */
export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-GT", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

/** Formatea un ISO como fecha (sin hora). */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-GT", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Alias legible de `formatFecha` (dd/mm/aaaa en la zona de negocio). */
export const formatFechaCorta = formatFecha

/** Formatea un monto en quetzales. `null` → "—" (sin permiso o sin costo). */
export function formatMonto(monto: number | null | undefined): string {
  if (monto === null || monto === undefined) return "—"
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

/** Formatea un ISO como hora corta (hh:mm a. m./p. m.); "" si no aplica. */
export function formatHoraCorta(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("es-GT", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Convierte cualquier valor de la API a número (o `null`).
 *
 * El backend puede devolver las cantidades/costos como `string` (Postgres
 * `numeric`) o como número; este helper cubre ambos casos y descarta valores
 * no numéricos (evita `NaN` en la UI).
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    // Soporta coma decimal ("1,5") además del punto.
    const normalized = Number(value.replace(",", "."))
    return Number.isFinite(normalized) ? normalized : null
  }
  return null
}

/**
 * Extrae la cantidad de una línea de producto del detalle.
 *
 * El contrato nominal usa `cantidad`, pero según el tipo de documento el
 * backend puede exponerla con otros nombres (`cantidadEntregada`,
 * `cantidadRecibida`, `cantidadAjuste`) o anidada (`{ n: "1.5" }`). Se prueban
 * todas las variantes y se normaliza a número.
 */
export function extraerCantidad(linea: unknown): number | null {
  if (isRecord(linea)) {
    const directa =
      toNumberOrNull(linea.cantidad) ??
      toNumberOrNull(linea.cantidadEntregada) ??
      toNumberOrNull(linea.cantidadRecibida) ??
      toNumberOrNull(linea.cantidadAjuste) ??
      toNumberOrNull(linea.cantidadSolicitada) ??
      toNumberOrNull(linea.cantidadDevolver) ??
      toNumberOrNull(linea.qty)
    if (directa !== null) return directa
    if (isRecord(linea.cantidad)) {
      return toNumberOrNull(linea.cantidad.n) ?? toNumberOrNull(linea.cantidad.valor)
    }
  }
  return toNumberOrNull(linea)
}

/** Formatea una cantidad numérica (hasta 2 decimales, sin ceros sobrantes). */
export function formatCantidad(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("es-GT", { maximumFractionDigits: 2 }).format(n)
}

/** Color e ícono (lucide) por tipo de movimiento — sólo clases, sin JSX. */
export const TIPO_STYLES: Record<
  MovimientoTipo,
  { badge: string; icon: string; label: string }
> = {
  INGRESO: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "bg-emerald-100 text-emerald-600",
    label: "Ingreso",
  },
  SALIDA: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "bg-rose-100 text-rose-600",
    label: "Salida",
  },
  AJUSTE: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "bg-amber-100 text-amber-600",
    label: "Ajuste",
  },
  DEVOLUCION: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    icon: "bg-violet-100 text-violet-600",
    label: "Devolución",
  },
  TRANSFERENCIA: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "bg-sky-100 text-sky-600",
    label: "Transferencia",
  },
}

/** Color del badge por estado. */
export const ESTADO_STYLES: Record<MovimientoEstado, string> = {
  APROBADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BORRADOR: "bg-amber-50 text-amber-700 border-amber-200",
  ANULADO: "bg-slate-100 text-slate-500 border-slate-200",
}
