import type { CandidatoProducto, ProductoResult, Proveedor } from "../types"

/**
 * Parser puro del resultado del OCR (`POST /api/movimientos/escanear`).
 *
 * Contrato real del backend:
 * ```
 * {
 *   ok: true,
 *   escaneo: {
 *     confianza,
 *     comprobante: { tipocomprobante, numero, serie, uuid, fechaemision, nit },
 *     proveedor,
 *     items: [{
 *       productoid, productocodigo, descripcion, cantidad, costounit,
 *       unidad, nivelConfianza, requiereRevision, candidatos: [...]
 *     }],
 *     advertencias,
 *     requiereRevisionManual
 *   }
 * }
 * ```
 *
 * Se prioriza esa estructura, pero se mantienen *fallbacks* tolerantes para
 * variantes antiguas (`{ data: { escaneo } }`, `cabecera`, alias en ítems, etc.)
 * para no romper con respuestas previas.
 */

export type OcrItemParsed = {
  /** id del producto si el OCR/backend lo logró vincular; null si es libre. */
  productoId: string | null
  nombre: string
  codigo: string
  unidad: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
  /** Confianza del match (0..1) si el backend la envía. */
  nivelConfianza?: number
  /** El backend pide revisión explícita de este ítem. */
  requiereRevision: boolean
  /** Candidatos sugeridos para vincular el ítem en 1 clic. */
  candidatos: CandidatoProducto[]
}

export type OcrParseResult = {
  fecha?: string
  tipoComprobante?: "FACTURA" | "RECIBO"
  serie?: string
  factura?: string
  uuid?: string
  observaciones?: string
  proveedorId?: string
  /** Confianza global del escaneo (0..1) si aplica. */
  confianza?: number
  /** Mensajes/advertencias del backend (no bloqueantes). */
  advertencias: string[]
  /** El backend indica que el documento requiere revisión manual. */
  requiereRevisionManual: boolean
  items: OcrItemParsed[]
  /** true si algún ítem quedó sin `productoId` o requiere revisión. */
  haySinVincular: boolean
}

// ---------------------------------------------------------------------------
// Helpers defensivos
// ---------------------------------------------------------------------------

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Devuelve el primer valor no vacío entre varias claves candidatas. */
function obtenerValor<T>(obj: AnyRecord | undefined, claves: string[]): T | undefined {
  if (!obj) return undefined
  for (const clave of claves) {
    const valor = obj[clave]
    if (valor !== undefined && valor !== null && valor !== "") {
      return valor as T
    }
  }
  return undefined
}

function toStringOrEmpty(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value).trim()
}

function toNumberOrZero(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

/** Normaliza NIT quitando guiones/espacios para comparar. */
function normalizarNit(value: string): string {
  return value.replace(/[\s-]/g, "").toLowerCase()
}

/** Normaliza fecha a `YYYY-MM-DD` para input[type=date]. */
function normalizarFecha(value: unknown): string | undefined {
  const raw = toStringOrEmpty(value)
  if (!raw) return undefined
  // Intento directo ISO.
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  // Formato dd/mm/yyyy frecuente en facturas.
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (match) {
    const [, d, m, y] = match
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return undefined
}

/** Resuelve el proveedor por id / objectId / NIT / nombre (cascada). */
function resolverProveedor(
  proveedorOcr: unknown,
  proveedores: Proveedor[]
): string | undefined {
  if (!proveedorOcr) return undefined

  if (typeof proveedorOcr === "string") {
    // Puede venir como id, NIT o nombre.
    const directo = proveedores.find((p) => p.id === proveedorOcr)
    if (directo) return directo.id
    const porNit = proveedores.find((p) => normalizarNit(p.nit) === normalizarNit(proveedorOcr))
    if (porNit) return porNit.id
    const porNombre = proveedores.find(
      (p) => p.nombre.toLowerCase() === proveedorOcr.toLowerCase()
    )
    return porNombre?.id
  }

  if (isRecord(proveedorOcr)) {
    const id = obtenerValor<string>(proveedorOcr, ["id", "proveedorId", "objectId"])
    if (id && proveedores.some((p) => p.id === id)) return id
    const nit = obtenerValor<string>(proveedorOcr, ["nit", "NIT"])
    if (nit) {
      const porNit = proveedores.find((p) => normalizarNit(p.nit) === normalizarNit(nit))
      if (porNit) return porNit.id
    }
    const nombre = obtenerValor<string>(proveedorOcr, ["nombre", "razonSocial", "name"])
    if (nombre) {
      const porNombre = proveedores.find(
        (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
      )
      if (porNombre) return porNombre.id
    }
  }

  return undefined
}

/** Extrae el array de ítems probando múltiples alias. */
function extraerItems(doc: AnyRecord): unknown[] {
  const candidatos = [
    doc.items,
    doc.productos,
    doc.lineas,
    doc.detalle,
    doc.detalles,
    doc.products,
  ]
  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) return candidato
  }
  return []
}

/**
 * Normaliza el array `candidatos[]` de un ítem OCR. Cada candidato puede venir
 * con distintos alias (`id`/`productoid`, `nombre`/`descripcion`,
 * `codigo`/`productocodigo`, `score`/`confianza`).
 */
function parseCandidatos(raw: unknown): CandidatoProducto[] {
  if (!Array.isArray(raw)) return []
  const out: CandidatoProducto[] = []
  for (const c of raw) {
    if (!isRecord(c)) continue
    const id = toStringOrEmpty(obtenerValor<unknown>(c, ["id", "productoid", "productoId"]))
    if (!id) continue
    const scoreRaw = obtenerValor<unknown>(c, ["score", "confianza", "nivelConfianza", "match"])
    const score = scoreRaw === undefined ? undefined : toNumberOrZero(scoreRaw)
    out.push({
      id,
      nombre:
        toStringOrEmpty(obtenerValor<unknown>(c, ["nombre", "descripcion", "producto"])) ||
        id,
      codigo: toStringOrEmpty(obtenerValor<unknown>(c, ["codigo", "productocodigo", "code"])),
      ...(score !== undefined ? { score } : {}),
    })
  }
  return out
}

/** Mapea un ítem del OCR a la forma normalizada (prioriza el contrato real). */
function parseItem(raw: unknown): OcrItemParsed {
  const item = isRecord(raw) ? raw : {}
  const cantidad =
    toNumberOrZero(
      obtenerValor<unknown>(item, ["cantidad", "quantity", "qty"])
    ) || 1
  const costoTotal = toNumberOrZero(
    obtenerValor<unknown>(item, ["costoTotal", "total", "importe", "subtotal", "monto"])
  )
  // Contrato real: `costounit`. Aliases: costoUnitario/costo/precioUnitario...
  const costoUnitarioRaw = toNumberOrZero(
    obtenerValor<unknown>(item, [
      "costounit",
      "costoUnitario",
      "costo",
      "precioUnitario",
      "precio",
      "unitario",
    ])
  )
  const costoUnitario =
    costoUnitarioRaw > 0 ? costoUnitarioRaw : cantidad > 0 ? costoTotal / cantidad : 0
  const costoTotalFinal = costoTotal > 0 ? costoTotal : costoUnitario * cantidad

  // Contrato real: `productoid`; aliases: productoId/id.
  const productoIdRaw = obtenerValor<unknown>(item, ["productoid", "productoId", "id"])
  const productoId =
    typeof productoIdRaw === "string" && productoIdRaw.trim() !== ""
      ? productoIdRaw
      : null

  const candidatos = parseCandidatos(obtenerValor<unknown>(item, ["candidatos", "candidates"]))

  const nivelConfianzaRaw = obtenerValor<unknown>(item, [
    "nivelConfianza",
    "confianza",
    "confidence",
  ])
  const nivelConfianza =
    nivelConfianzaRaw === undefined ? undefined : toNumberOrZero(nivelConfianzaRaw)

  // requiereRevision explícito del backend, o inferido si no hay productoId.
  const requiereRevisionRaw = obtenerValor<unknown>(item, [
    "requiereRevision",
    "requiere_revision",
  ])
  const requiereRevision =
    typeof requiereRevisionRaw === "boolean"
      ? requiereRevisionRaw
      : productoId === null

  return {
    productoId,
    nombre:
      toStringOrEmpty(
        obtenerValor<unknown>(item, ["descripcion", "nombre", "producto", "description"])
      ) || "Ítem sin nombre",
    // Contrato real: `productocodigo`; aliases: codigo/code/sku.
    codigo: toStringOrEmpty(obtenerValor<unknown>(item, ["productocodigo", "codigo", "code", "sku"])),
    unidad: toStringOrEmpty(obtenerValor<unknown>(item, ["unidad", "unit", "medida"])) || "UND",
    cantidad,
    costoUnitario,
    costoTotal: costoTotalFinal,
    ...(nivelConfianza !== undefined ? { nivelConfianza } : {}),
    requiereRevision,
    candidatos,
  }
}

// ---------------------------------------------------------------------------
// Parser principal
// ---------------------------------------------------------------------------

/** Extrae el array `advertencias` como strings. Acepta string o string[]. */
function parseAdvertencias(raw: unknown): string[] {
  if (typeof raw === "string") return raw.trim() ? [raw.trim()] : []
  if (Array.isArray(raw)) {
    return raw.map((a) => toStringOrEmpty(a)).filter((a) => a !== "")
  }
  return []
}

/**
 * Normaliza la respuesta del OCR a un `OcrParseResult` tipado.
 *
 * Contrato real: `{ ok, escaneo: {...} }`. Se toleran además (en orden):
 *  - `{ data: { escaneo: {...} } }`
 *  - `{ escaneo: {...} }`
 *  - `{ data: {...} }`
 *  - `{ resultado: {...} }`
 *  - `{ documento: {...} }`
 *  - objeto raíz directamente
 */
export function parseOcrResponse(
  payload: unknown,
  proveedores: Proveedor[]
): OcrParseResult {
  const root = isRecord(payload) ? payload : {}

  // Desenvuelve capas hasta encontrar el objeto "escaneo/documento".
  let doc: AnyRecord = root
  if (isRecord(root.escaneo)) {
    doc = root.escaneo as AnyRecord
  } else if (isRecord(root.data)) {
    const data = root.data as AnyRecord
    doc = isRecord(data.escaneo) ? (data.escaneo as AnyRecord) : data
  } else if (isRecord(root.resultado)) {
    doc = root.resultado as AnyRecord
  } else if (isRecord(root.documento)) {
    doc = root.documento as AnyRecord
  }

  // Contrato real: cabecera en `doc.comprobante`. Fallbacks: cabecera/header/encabezado/doc.
  const cabecera = isRecord(doc.comprobante)
    ? (doc.comprobante as AnyRecord)
    : isRecord(doc.cabecera)
      ? (doc.cabecera as AnyRecord)
      : isRecord(doc.header)
        ? (doc.header as AnyRecord)
        : isRecord(doc.encabezado)
          ? (doc.encabezado as AnyRecord)
          : doc

  // Contrato real: `tipocomprobante`; aliases diversos.
  const tipoRaw = toStringOrEmpty(
    obtenerValor<unknown>(cabecera, [
      "tipocomprobante",
      "tipoComprobante",
      "tipo",
      "tipoDocumento",
      "tipo_comprobante",
    ])
  ).toUpperCase()
  const tipoComprobante: "FACTURA" | "RECIBO" | undefined =
    tipoRaw === "FACTURA" ? "FACTURA" : tipoRaw === "RECIBO" ? "RECIBO" : undefined

  const items = extraerItems(doc).map(parseItem)
  const haySinVincular = items.some((i) => i.productoId === null || i.requiereRevision)

  const confianzaRaw = obtenerValor<unknown>(doc, ["confianza", "confidence"])
  const confianza = confianzaRaw === undefined ? undefined : toNumberOrZero(confianzaRaw)

  const requiereRevisionManualRaw = obtenerValor<unknown>(doc, [
    "requiereRevisionManual",
    "requiere_revision_manual",
  ])
  const requiereRevisionManual =
    typeof requiereRevisionManualRaw === "boolean" ? requiereRevisionManualRaw : false

  return {
    // Contrato real: `fechaemision`; aliases fechaEmision/fecha/date.
    fecha: normalizarFecha(
      obtenerValor<unknown>(cabecera, ["fechaemision", "fechaEmision", "fecha", "date"])
    ),
    tipoComprobante,
    serie: toStringOrEmpty(
      obtenerValor<unknown>(cabecera, ["serie", "serieFactura"])
    ) || undefined,
    // Contrato real: `numero`; aliases factura/numeroFactura/noFactura.
    factura: toStringOrEmpty(
      obtenerValor<unknown>(cabecera, ["numero", "factura", "numeroFactura", "noFactura"])
    ) || undefined,
    uuid: toStringOrEmpty(
      obtenerValor<unknown>(cabecera, ["uuid", "UUID", "dte", "codigoGeneracion"])
    ) || undefined,
    observaciones: toStringOrEmpty(
      obtenerValor<unknown>(cabecera, ["observaciones", "notas", "notes"])
    ) || undefined,
    proveedorId: resolverProveedor(
      obtenerValor<unknown>(doc, ["proveedor", "vendor", "supplier", "emisor"]) ??
        obtenerValor<unknown>(cabecera, ["proveedor", "nit", "emisor"]),
      proveedores
    ),
    ...(confianza !== undefined ? { confianza } : {}),
    advertencias: parseAdvertencias(
      obtenerValor<unknown>(doc, ["advertencias", "warnings", "warning"])
    ),
    requiereRevisionManual,
    items,
    haySinVincular,
  }
}

/**
 * Convierte un `OcrItemParsed` a un `ProductoResult` mínimo para autoselección
 * cuando se logra vincular con un producto del catálogo.
 */
export function ocrItemToProducto(item: OcrItemParsed): ProductoResult | null {
  if (!item.productoId) return null
  return {
    id: item.productoId,
    nombre: item.nombre,
    codigo: item.codigo,
    unidad: { abreviatura: item.unidad },
  }
}
