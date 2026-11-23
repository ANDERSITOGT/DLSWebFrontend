/** Tipos del módulo de Proveedores (contrato del backend). */

export type Contacto = {
  id: string;
  proveedorid: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  puesto: string | null;
  notas: string | null;
  createdat: string;
};

export type Proveedor = {
  id: string;
  nombre: string;
  nit: string | null;
  notas: string | null;
  createdat: string;
  proveedor_contacto: Contacto[];
};

/** Metadatos de paginación devueltos por GET /api/proveedores. */
export type ProveedoresMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Respuesta envuelta del listado paginado. */
export type ProveedoresPage = {
  data: Proveedor[];
  meta: ProveedoresMeta;
};

/** Payload de creación / edición de datos generales del proveedor. */
export type ProveedorPayload = {
  nombre: string;
  nit: string;
  notas: string;
};

/** Payload para dar de alta un contacto. */
export type ContactoPayload = {
  nombre: string;
  telefono: string;
  email: string;
  puesto: string;
  notas: string;
};

/** Parámetros del listado en servidor. */
export type ListProveedoresParams = {
  page: number;
  limit: number;
  q?: string;
};

export const LIMITES_PAGINA = [10, 20, 50] as const;
export type LimitePagina = (typeof LIMITES_PAGINA)[number];
