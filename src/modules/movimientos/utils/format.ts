import type { MovimientoEstado, MovimientoTipo } from "../types"

/** Zona horaria de negocio. */
export const TZ = "America/Guatemala"

/**
 * Devuelve "hoy" como `YYYY-MM-DD` calculado explícitamente en America/Guatemala.
 *
 * `new Date().toISOString().slice(0, 10)` devuelve el día en UTC, por lo que en
 * Guatemala (UTC-6) saltaba al día siguiente después de las 18:00 locales. Este
 * helper calcula el día real de negocio con `Intl.DateTimeFormat` (locale
 * `en-CA`, que produce directamente el formato `YYYY-MM-DD`).
 */
export function hoyGuatemalaISO(): string {
  // en-CA formatea como `YYYY-MM-DD` por defecto.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/**
 * Convierte un timestamp ISO del backend a `YYYY-MM-DD` en America/Guatemala,
 * para rellenar `<input type="date">` sin depender de `.split("T")[0]` (que
 * trunca en UTC y puede desplazar el día).
 */
export function aFechaInputGT(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/**
 * Convierte el valor de un `<input type="date">` (`YYYY-MM-DD`) a ISO con el
 * offset de Guatemala (`T12:00:00-06:00`) antes de enviarlo al backend. El
 * mediodía local evita que cualquier conversión posterior a UTC desplace el
 * día. Si el valor no tiene el formato esperado, se devuelve tal cual.
 */
export function fechaDiaAISO(yyyyMmDd: string): string {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd
  return `${yyyyMmDd}T12:00:00-06:00`
}

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
 * Extrae la parte numérica de un string que puede llevar unidad u otro texto
 * (p.ej. `"75 cc"`, `"12.5 L"`, `"1,5 KG"`, `"+12.5"`, `"-3"`).
 *
 * A diferencia de `toNumberOrNull` (que exige un string 100% numérico), aquí
 * se toma el primer número encontrado y se ignora el resto. Devuelve `null` si
 * no hay ningún número.
 */
export function parseNumeroDesdeTexto(value: string): number | null {
  const limpio = value.trim()
  if (limpio === "") return null
  // Primer número: signo opcional + dígitos con coma/punto decimal opcional.
  const match = limpio.match(/[+-]?\d+(?:[.,]\d+)?/)
  if (!match) return null
  const num = Number(match[0].replace(",", "."))
  return Number.isFinite(num) ? num : null
}

/** Número a partir de un valor por número o por texto con unidad ("75 cc"). */
function candidatoNumero(value: unknown): number | null {
  const directo = toNumberOrNull(value)
  if (directo !== null) return directo
  if (typeof value === "string") return parseNumeroDesdeTexto(value)
  return null
}

/**
 * Extrae la cantidad de una línea de producto del detalle.
 *
 * Prioridad:
 * 1. `cantidadNumero`: número puro que manda el backend de movimientos.
 *    (`cantidad` viene como texto con unidad, p.ej. `"75 cc"`, que `Number()`
 *    no parsea). Se lee PRIMERO para no caer en `0` en roles sin importes
 *    (VISOR / SOLICITANTE / COSECHA), que además no traen costo ni subtotal.
 * 2. `cantidad` y aliases conocidos (`cantidadEntregada`, `cantidadRecibida`,
 *    `cantidadAjuste`, `cantidadDevolver`, etc.): si llegan como texto con
 *    unidad se les extrae la parte numérica.
 * 3. Variantes anidadas (`{ n: "1.5" }` / `{ valor }` / `{ value }`).
 */
export function extraerCantidad(linea: unknown): number | null {
  if (isRecord(linea)) {
    // 1) Número puro explícito del backend (contrato de movimientos).
    const numeroExplicito = toNumberOrNull(linea.cantidadNumero)
    if (numeroExplicito !== null) return numeroExplicito

    // 2) Campos directos (acepta número o string con unidad).
    const candidatos: unknown[] = [
      linea.cantidad,
      linea.cant,
      linea.qty,
      linea.cantidadEntregada,
      linea.cantidadRecibida,
      linea.cantidadAjuste,
      linea.cantidadSolicitada,
      linea.cantidadDevolver,
      linea.cantidad_unidad,
    ]
    for (const candidato of candidatos) {
      const num = candidatoNumero(candidato)
      if (num !== null) return num
    }

    // 3) Anidada: { n: "1.5" } / { valor } / { value }.
    const anidada = linea.cantidad ?? linea.cant
    if (isRecord(anidada)) {
      for (const candidato of [anidada.n, anidada.valor, anidada.value, anidada.cantidad]) {
        const num = candidatoNumero(candidato)
        if (num !== null) return num
      }
    }
  }
  return candidatoNumero(linea)
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

/**
 * Acento lateral (border-l-4) por tipo para filas de tabla. Se aplica en la
 * primera celda de cada fila para no romper el `border-collapse`.
 */
export const TIPO_ACCENT: Record<MovimientoTipo, string> = {
  INGRESO: "border-l-4 border-l-emerald-500",
  SALIDA: "border-l-4 border-l-rose-500",
  AJUSTE: "border-l-4 border-l-amber-500",
  DEVOLUCION: "border-l-4 border-l-violet-500",
  TRANSFERENCIA: "border-l-4 border-l-sky-500",
}

/** Color del monto según tipo (destacado en ingresos, neutro en el resto). */
export function montoStyle(tipo: MovimientoTipo): { text: string; bg: string } {
  if (tipo === "INGRESO") return { text: "text-emerald-700", bg: "bg-emerald-50/40" }
  return { text: "text-slate-800", bg: "" }
}

/** Color del badge por estado. */
export const ESTADO_STYLES: Record<MovimientoEstado, string> = {
  APROBADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BORRADOR: "bg-amber-50 text-amber-700 border-amber-200",
  ANULADO: "bg-slate-100 text-slate-500 border-slate-200",
}
