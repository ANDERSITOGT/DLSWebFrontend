// src/services/catalogosService.ts
import { apiFetch } from "./api"

/**
 * Catálogos de apoyo (bodegas, proveedores, productos, fincas/lotes).
 *
 * Todas las llamadas pasan por `apiFetch`, lo que garantiza:
 * - Token correcto (`dls_token`, igual que AuthContext).
 * - Kill-switch consistente ante 401 y distinción de 403 de módulo.
 * - Errores tipados (`ApiError`) en lugar de `Error` genéricos.
 */

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new Error("Respuesta inválida del servidor.")
  }
}
/** Bodega mínima para selectores. */
export type BodegaCatalogo = { id: string; nombre: string }

/** Proveedor mínimo para selectores (incluye `nit` según el contrato actual). */
export type ProveedorCatalogo = { id: string; nombre: string; nit: string }

/** Producto devuelto por la búsqueda de autocompletado. */
export type ProductoCatalogo = {
  id: string
  nombre: string
  codigo: string
  precioref?: number
  unidad: { abreviatura: string }
}

export const catalogosService = {
  /** Bodegas disponibles para el selector. */
  async getBodegas() {
    const res = await apiFetch("/api/inventario/bodegas")
    return parseJson<BodegaCatalogo[]>(res)
  },

  /** Proveedores para el selector de ingreso de mercancía. */
  async getProveedores() {
    const res = await apiFetch("/api/proveedores/catalogo")
    return parseJson<ProveedorCatalogo[]>(res)
  },

  /** Búsqueda de productos por texto (autocompletado). */
  async buscarProductos(termino: string) {
    const query = termino ? `?q=${encodeURIComponent(termino)}` : ""
    const res = await apiFetch(`/api/productos/productos-busqueda${query}`)
    return parseJson<ProductoCatalogo[]>(res)
  },

  /** Fincas con sus lotes asociados. */
async getFincasLotes() {
    const res = await apiFetch("/api/fincas/fincas-lotes")
    return parseJson<unknown[]>(res)
  },
  
  /** Catálogo de lotes para el módulo de configuración. */
  async getLotes() {
    const res = await apiFetch("/api/lotes/catalogo")
    return parseJson<unknown[]>(res)
  },
  }

