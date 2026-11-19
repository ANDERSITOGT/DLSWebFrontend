// Tipos compartidos del flujo de "Nueva Solicitud".

export type Bodega = { id: string; nombre: string };

export type Lote = {
  id: string;
  codigo: string;
  cultivo: { nombre: string };
};

export type Finca = {
  id: string;
  nombre: string;
  lote: Lote[];
};

export type ProductoResult = {
  id: string;
  nombre: string;
  codigo: string;
  stockActual: number;
  unidad: { id: string; abreviatura: string };
};

export type ItemSolicitud = {
  /** Id interno (uuid) para React y para distinguir ítems repetidos. */
  key: string;
  productoId: string;
  nombre: string;
  codigo: string;
  unidadId: string;
  unidad: string;
  cantidad: number;
  /** Snapshot del stock disponible al momento de agregar. */
  stockMaximo: number;
  fincaId: string;
  fincaNombre: string;
  loteId: string;
  loteCodigo: string;
  notas: string;
};

/** Payload exacto que espera POST /api/solicitudes. */
export type SolicitudPayload = {
  solicitanteid: string;
  bodegaid: string;
  productos: Array<{
    productoid: string;
    unidadid: string;
    cantidad: number;
    loteid: string;
    notas: string;
  }>;
  observaciones: string;
};
