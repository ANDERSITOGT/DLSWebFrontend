// src/services/api.ts

// Usamos la variable de entorno o localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * apiFetch: Cliente HTTP seguro.
 * Se encarga de inyectar el token correcto ("dls_token") 
 * y de cerrar la sesión si el usuario es desactivado.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 1. 👇 CORRECCIÓN: Usamos la clave correcta que definiste en AuthContext
  const token = localStorage.getItem("dls_token");

  // 2. Preparar Headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers as any, 
  };

  // Inyectar Token si existe
  if (token) {
    // @ts-ignore
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    // 3. Ejecutar petición
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // 4. INTERCEPTOR DE SEGURIDAD (Kill Switch) 🚨
    if (response.status === 401 || response.status === 403) {
      console.warn("⛔ Acceso denegado o sesión expirada. Cerrando sesión...");
      
      // 👇 CORRECCIÓN: Borramos las claves correctas
      localStorage.removeItem("dls_token");
      localStorage.removeItem("dls_user");
      
      // Redirección forzada para limpiar el estado de React (AuthContext)
      window.location.href = "/login";
      
      throw new Error("Sesión finalizada por seguridad.");
    }

    return response;

  } catch (error) {
    console.error("Error de red en apiFetch:", error);
    throw error;
  }
}