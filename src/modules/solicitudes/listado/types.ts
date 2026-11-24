// Tipos del módulo Solicitudes (contrato de GET /api/solicitudes y /api/solicitudes/:id).

export type SolicitudEstado = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "ENTREGADA"

export type SolicitudTipo = "DESPACHO" | "DEVOLUCION"

/** Usuario mínimo (solicitante / aprobador / actor del historial). */
export type UsuarioRef = { id: string; nombre: string }

/** Bodega mínima tal como la devuelve la API. */
export type BodegaRef = { id: string; nombre: string }

/**
 * Registro de la lista (`GET /api/solicitudes` → `solicitudes[]`).
 */
export type SolicitudResumen = {
  id: string
  codigo: string
  fecha: string
  estado: SolicitudEstado
  tipo: SolicitudTipo
  bodegaNombre: string
  solicitanteNombre: string
  totalProductos: number
}

/**
 * Línea de producto del detalle (`GET /api/solicitudes/:id`).
 * `costounit` / `subtotal` llegan `null` cuando el rol no puede ver importes.
 */
export type SolicitudProducto = {
  id: string
  nombre: string
  codigo: string
  cantidad: number
  unidad: string
  loteCodigo: string | null
  notas: string | null
  costounit: number | null
  subtotal: number | null
}

/** Evento de auditoría del ciclo de vida (CREAR, APROBAR, RECHAZAR, ENTREGAR). */
export type SolicitudHistorialItem = {
  accion: string
  fecha: string | null
  usuario: UsuarioRef | null
  payload: Record<string, unknown> | null
}

/** Detalle completo (`GET /api/solicitudes/:id` → SolicitudDetalleDTO). */
export type SolicitudDetalle = {
  id: string
  codigo: string
  fecha: string
  estado: SolicitudEstado
  tipo: SolicitudTipo
  solicitante: UsuarioRef | null
  aprobador: UsuarioRef | null
  bodega: BodegaRef | null
  productos: SolicitudProducto[]
  documentoSalidaConsecutivo: string | null
  /** Suma de subtotales; `null` si el rol no ve importes o no hay costos. */
  montoTotal: number | null
  historial: SolicitudHistorialItem[]
}

/** Metadatos de paginación devueltos por la API. */
export type SolicitudesMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Respuesta envuelta del listado paginado. */
export type SolicitudesPage = {
  solicitudes: SolicitudResumen[]
  meta: SolicitudesMeta
}

/** Filtros de la pantalla de Solicitudes (estado controlado por el hook). */
export type SolicitudesFiltros = {
  estado: SolicitudEstado | ""
  tipo: SolicitudTipo | ""
  bodegaId: string
  q: string
}

/** Parámetros serializables de GET /api/solicitudes. */
export type ListSolicitudesParams = {
  page: number
  /** Backend: default 15. */
  limit: number
  estado?: SolicitudEstado
  tipo?: SolicitudTipo
  bodegaId?: string
  q?: string
}

export const FILTROS_VACIOS: SolicitudesFiltros = {
  estado: "",
  tipo: "",
  bodegaId: "",
  q: "",
}

/** Opciones del selector de límite. */
export const LIMITES_PAGINA = [15, 30, 50] as const
export type LimitePagina = (typeof LIMITES_PAGINA)[number]

/** Payload de PATCH /api/solicitudes/:id/estado. */
export type CambioEstadoPayload = {
  estado: "APROBADA" | "RECHAZADA"
  motivo?: string
}

/** Resultado de POST /api/solicitudes/:id/entregar. */
export type EntregarResultado = {
  documentoId: string | null
  codigoDoc: string | null
}
