// src/services/catalogosService.ts
const API_URL = import.meta.env.VITE_API_URL + "/api";

// Helper para obtener el token (si lo necesitas para bodegas, aunque usualmente catalogos son publicos o protegidos igual)
// En tu backend catalogos.ts NO pusimos authenticateToken, así que no es necesario header por ahora.
// Pero si decides protegerlo, descomenta la parte de headers.

export const catalogosService = {
  
  // Obtener lista de Bodegas
  async getBodegas() {
    const res = await fetch(`${API_URL}/catalogos/bodegas`);
    if (!res.ok) throw new Error("Error al cargar bodegas");
    return res.json();
  },

  // Obtener lista de Proveedores
  async getProveedores() {
    const res = await fetch(`${API_URL}/catalogos/proveedores`);
    if (!res.ok) throw new Error("Error al cargar proveedores");
    return res.json();
  },

  // Buscar Productos (Autocompletado)
  async buscarProductos(termino: string) {
    // Si el término es vacío, trae los primeros 20
    const query = termino ? `?q=${encodeURIComponent(termino)}` : "";
    const res = await fetch(`${API_URL}/catalogos/productos-busqueda${query}`);
    if (!res.ok) throw new Error("Error al buscar productos");
    return res.json();
  },


  // Obtener Fincas con sus Lotes (Cascada)
  async getFincasLotes() {
    const res = await fetch(`${API_URL}/catalogos/fincas-lotes`);
    if (!res.ok) throw new Error("Error al cargar fincas");
    return res.json();
  }

};