// Tipos compartidos del flujo de "Nuevo Ingreso".

/** Bodega mínima para selectores. */
export type Bodega = { id: string; nombre: string }

/** Proveedor mínimo para selectores. */
export type Proveedor = { id: string; nombre: string; nit: string }

/** Producto devuelto por la búsqueda de autocompletado. */
export type ProductoResult = {
  id: string
  nombre: string
  codigo: string
  precioref?: number
  unidad: { id?: string; abreviatura: string }
}

export type TipoComprobante = "FACTURA" | "RECIBO"

/**
 * Candidato sugerido por el OCR para vincular un ítem sin `productoid`.
 * Proviene del array `candidatos[]` de cada ítem del escaneo.
 */
export type CandidatoProducto = {
  id: string
  nombre: string
  codigo: string
  /** Score/confianza del match (0..1) si el backend lo envía. */
  score?: number
}

/**
 * Ítem dentro del wizard. `productoId` puede ser null cuando proviene del OCR
 * y aún no se ha vinculado a un producto del catálogo. En ese caso
 * `requiereRevision` es true y bloquea el avance al paso 3.
 */
export type ItemIngreso = {
  /** Id interno (uuid) para React y para distinguir ítems repetidos. */
  key: string
  productoId: string | null
  nombre: string
  codigo: string
  unidad: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
  /** Origen del ítem: manual o detectado por OCR. */
  origen: "manual" | "ocr"
  /** true cuando proviene del OCR y no está vinculado a un producto real. */
  requiereRevision: boolean
  /** Confianza del match OCR (0..1) si aplica. */
  nivelConfianza?: number
  /** Candidatos sugeridos por el OCR para vincular el ítem en 1 clic. */
  candidatos?: CandidatoProducto[]
}

/** Payload exacto que espera POST /api/movimientos/ingreso. */
export type IngresoPayload = {
  bodegaId: string
  proveedorId: string | null
  fecha: string
  tipoComprobante: TipoComprobante
  factura: string
  serie: string
  uuid: string
  observaciones: string
  items: Array<{
    productoId: string
    cantidad: number
    costo: number
  }>
}

/** Cabecera del documento (paso 1). */
export type CabeceraIngreso = {
  bodegaId: string
  fecha: string
  tipoComprobante: TipoComprobante
  proveedorId: string
  serie: string
  factura: string
  uuid: string
  observaciones: string
}
