const API_URL = import.meta.env.VITE_API_URL + "/api";

// 1. Función para obtener el token del usuario logueado
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    // 👇 Si hay token, lo pegamos aquí. Si no, va vacío.
    "Authorization": token ? `Bearer ${token}` : "", 
  };
};

export const catalogosService = {
  
  // Obtener Bodegas (Pública)
  async getBodegas() {
    const res = await fetch(`${API_URL}/catalogos/bodegas`);
    if (!res.ok) throw new Error("Error al cargar bodegas");
    return res.json();
  },

  // Obtener Proveedores (Pública)
  async getProveedores() {
    const res = await fetch(`${API_URL}/catalogos/proveedores`);
    if (!res.ok) throw new Error("Error al cargar proveedores");
    return res.json();
  },

  // Buscar Productos (Pública)
  async buscarProductos(termino: string) {
    const query = termino ? `?q=${encodeURIComponent(termino)}` : "";
    const res = await fetch(`${API_URL}/catalogos/productos-busqueda${query}`);
    if (!res.ok) throw new Error("Error al buscar productos");
    return res.json();
  },

// 👇 ESTA ES LA QUE ARREGLA TU PROBLEMA
// Al agregar 'headers: getHeaders()', el backend te dejará pasar.
async getFincasLotes() {
  const res = await fetch(`${API_URL}/catalogos/fincas-lotes`, {
      headers: getHeaders() // ✅ Esto envía el token correctamente
  });
  
  // Si el token expiró o es inválido, lanzamos error
  if (res.status === 401) throw new Error("Sesión expirada o no autorizada");
  if (!res.ok) throw new Error("Error al cargar fincas");
  
  return res.json();
},

  // Para el módulo de configuración
  async getLotes() {
      const res = await fetch(`${API_URL}/catalogos/lotes`, {
          headers: getHeaders()
      });
      if (!res.ok) throw new Error("Error al cargar lotes");
      return res.json();
  }
};