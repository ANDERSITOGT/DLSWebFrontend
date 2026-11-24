// Tipos del módulo Movimientos (contrato de GET /api/movimientos y /api/movimientos/:id).

export type MovimientoTipo =
  | "INGRESO"
  | "SALIDA"
  | "AJUSTE"
  | "DEVOLUCION"
  | "TRANSFERENCIA"

export type MovimientoEstado = "BORRADOR" | "APROBADO" | "ANULADO"

/** Bodega mínima tal como la devuelve la API. */
export type BodegaRef = { id: string; nombre: string }

/** Proveedor que viene enriquecido en cada movimiento. */
export type ProveedorRef = { id: string; nombre: string; nit: string | null }

/** Usuario mínimo (solicitante / creador). */
export type UsuarioRef = { id: string; nombre: string }

/** Comprobante fiscal asociado a un movimiento (puede no existir). */
export type ComprobanteRef = {
  tipocomprobante: string | null
  numero: string | null
  serie: string | null
}

/**
 * Registro de la lista (`GET /api/movimientos` → `data[]`).
 * `montoTotal` es `null` cuando el rol no puede ver importes (SOLICITANTE,
 * VISOR, COSECHA) o cuando el movimiento no tiene líneas con costo.
 */
export type MovimientoResumen = {
  id: string
  consecutivo: string
  tipo: MovimientoTipo
  estado: MovimientoEstado
  fecha: string | null
  observacion: string | null
  bodegaOrigen: BodegaRef | null
  bodegaDestino: BodegaRef | null
  proveedor: ProveedorRef | null
  solicitante: UsuarioRef | null
  creador: UsuarioRef
  comprobante: ComprobanteRef | null
  /** Cantidad de líneas (documento_item). */
  totalProductos: number
  /** Nombres de los primeros 2 productos, ej. "Fitophos, Urea 46%". */
  resumenProductos: string
  /** Suma de cantidad * costounit; `null` si el rol no ve importes. */
  montoTotal: number | null
}

/** Línea de producto del detalle (`GET /api/movimientos/:id`). */
export type MovimientoProducto = {
  id: string
  productoNombre: string
  productoCodigo: string
  /**
   * Cantidad de la línea. El servicio la normaliza a número (el backend puede
   * enviarla como `string`/`numeric` o con aliases tipo `cantidadEntregada`).
   */
  cantidad: number
  unidad: string
  loteCodigo: string | null
  loteId: string | null
  fincaNombre: string | null
  /** `null` si el rol no ve importes. */
  costounit: number | null
  /** `Number(cantidad) * Number(costounit ?? 0)`; `null` si el rol no ve importes. */
  subtotal: number | null
}

/** Detalle completo (`GET /api/movimientos/:id`). */
export type MovimientoDetalle = {
  id: string
  consecutivo: string
  tipo: MovimientoTipo
  estado: MovimientoEstado
  fecha: string | null
  observacion: string | null
  bodegaOrigen: BodegaRef | null
  bodegaDestino: BodegaRef | null
  proveedor: ProveedorRef | null
  solicitante: UsuarioRef | null
  creador: UsuarioRef
  comprobante: ComprobanteRef | null
  productos: MovimientoProducto[]
  /** Suma de subtotales; `null` si el rol no ve importes. */
  montoTotal: number | null
}

/** Metadatos de paginación devueltos por la API. */
export type MovimientosMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Respuesta envuelta del listado paginado. */
export type MovimientosPage = {
  data: MovimientoResumen[]
  meta: MovimientosMeta
}

/** Filtros de la pantalla de Movimientos (estado controlado por el hook). */
export type MovimientosFiltros = {
  tipo: MovimientoTipo | ""
  estado: MovimientoEstado | ""
  proveedorId: string
  solicitanteId: string
  bodegaId: string
  fechaInicio: string
  fechaFin: string
  q: string
}

/** Parámetros serializables de GET /api/movimientos. */
export type ListMovimientosParams = {
  page: number
  /** Backend: default 15, máx 100. */
  limit: number
  tipo?: MovimientoTipo
  estado?: MovimientoEstado
  proveedorId?: string
  solicitanteId?: string
  bodegaId?: string
  fechaInicio?: string
  fechaFin?: string
  q?: string
}

export const FILTROS_VACIOS: MovimientosFiltros = {
  tipo: "",
  estado: "",
  proveedorId: "",
  solicitanteId: "",
  bodegaId: "",
  fechaInicio: "",
  fechaFin: "",
  q: "",
}

/** Opciones del selector de límite (el backend acepta 1–100). */
export const LIMITES_PAGINA = [15, 25, 50, 100] as const
export type LimitePagina = (typeof LIMITES_PAGINA)[number]

export const TIPOS_MOVIMIENTO: MovimientoTipo[] = [
  "INGRESO",
  "SALIDA",
  "AJUSTE",
  "DEVOLUCION",
  "TRANSFERENCIA",
]

export const ESTADOS_MOVIMIENTO: MovimientoEstado[] = ["BORRADOR", "APROBADO", "ANULADO"]
