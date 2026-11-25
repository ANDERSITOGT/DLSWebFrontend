// src/services/api.ts
import { ApiError } from "./apiError";

/**
 * URL base de la API.
 *
 * Se normaliza para tolerar valores ausentes o con barra final:
 * - Sin `VITE_API_URL` → `http://localhost:4000`.
 * - `VITE_API_URL="http://host/api"` → sin duplicar `/api`.
 */
const RAW_API_URL = (import.meta.env.VITE_API_URL ?? "").trim();
export const API_URL = (RAW_API_URL || "http://localhost:4000").replace(/\/+$/, "");

/**
 * Detecta si un 403 corresponde a "rol sin permiso para este módulo".
 *
 * El backend usa 403 tanto para el kill-switch (usuario desactivado / token
 * expirado) como para módulo no permitido. Por seguridad el criterio es
 * CONSERVADOR: solo tratamos como "solo permisos de módulo" si el mensaje es
 * inequívoco. Cualquier otro 403 cae en el kill-switch (cierra sesión).
 */
function isModuleForbiddenMessage(message: string): boolean {
  const m = message.toLowerCase();
  // Mensaje oficial del contrato: "No tiene permisos para ver este módulo"
  return m.includes("permisos para ver este m") || m.includes("permiso para ver este m");
}

/**
 * Detecta el kill-switch de sesión (usuario desactivado / token inválido).
 */
function isSessionKillMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("desactivad") ||
    m.includes("token") ||
    m.includes("sesión") ||
    m.includes("sesion") ||
    m.includes("expirad") ||
    m.includes("no autenticado") ||
    m.includes("unauthorized")
  );
}

function clearSessionAndRedirect() {
  localStorage.removeItem("dls_token");
  localStorage.removeItem("dls_user");
  // Redirección forzada para limpiar el estado de React (AuthContext)
  window.location.href = "/login";
}

/**
 * apiFetch: Cliente HTTP seguro.
 *
 * - Inyecta el token ("dls_token") en Authorization.
 * - Ante 401 cierra sesión (kill-switch) y redirige al login.
 * - Ante 403 decide:
 *     · Si el mensaje indica "módulo no permitido" -> NO cierra sesión; lanza
 *       ApiError con code FORBIDDEN_MODULE para que la vista muestre
 *       "Sin acceso a este módulo".
 *     · Si el mensaje indica kill-switch (desactivado/token) o NO se puede
 *       diferenciar -> limpia sesión y manda al login (comportamiento seguro).
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 1. Token con la clave correcta definida en AuthContext
  const token = localStorage.getItem("dls_token");

    // 2. Preparar Headers
  // Si el body es FormData (multipart), NO fijamos Content-Type: el navegador
  // debe agregar el boundary correcto. Cualquier otra petición envía JSON.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  // Inyectar Token si existe
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    // 3. Ejecutar petición
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // 4. Interceptor de seguridad
    if (response.ok) {
      return response;
    }

        // Leemos el body una sola vez para inspeccionar el mensaje y el código de negocio.
    let message = "";
    let codigo = "";
    try {
      const parsed = await response.clone().json();
      message = typeof parsed?.message === "string" ? parsed.message : "";
      codigo = typeof parsed?.codigo === "string" ? parsed.codigo : "";
    } catch {
      // Sin body JSON: seguimos con message vacío.
    }
    const businessCode = codigo || undefined;

    // --- 401: siempre kill-switch (token expirado / inválido) ---
    if (response.status === 401) {
      console.warn("⛔ Sesión expirada o no autorizada. Cerrando sesión...");
      clearSessionAndRedirect();
      throw new ApiError(
        message || "Sesión expirada. Vuelve a iniciar sesión.",
        401,
        "UNAUTHORIZED",
        businessCode,
      );
    }

    // --- 403: distinguir módulo vs kill-switch ---
    if (response.status === 403) {
      // Caso seguro de permisos de módulo: NO cerramos sesión.
      if (isModuleForbiddenMessage(message) && !isSessionKillMessage(message)) {
        throw new ApiError(
          message || "No tiene permisos para ver este módulo",
          403,
          "FORBIDDEN_MODULE",
          businessCode,
        );
      }

      // Cualquier otro 403 (o mensaje ambiguo) -> kill-switch por seguridad.
      console.warn("⛔ Acceso denegado o cuenta desactivada. Cerrando sesión...");
      clearSessionAndRedirect();
      throw new ApiError(
        message || "Sesión finalizada por seguridad.",
        403,
        "ACCOUNT_DISABLED",
        businessCode,
      );
    }

    // Otros errores HTTP: no cerramos sesión, devolvemos ApiError genérico.
    throw new ApiError(
      message || `Error HTTP ${response.status}`,
      response.status,
      "HTTP_ERROR",
      businessCode,
    );
  } catch (error) {
    // Si es un ApiError ya tipado, lo dejamos pasar sin re-loguear ruido.
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("Error de red en apiFetch:", error);
    throw error;
  }
}
