// src/services/apiError.ts

/**
 * Error HTTP tipado del cliente API.
 *
 * Permite distinguir el motivo de un fallo sin tener que parsear strings:
 *   - status 403 + code "FORBIDDEN_MODULE" -> el rol no tiene permiso para el
 *     módulo solicitado. La UI debe mostrar "Sin acceso", NO cerrar sesión.
 *   - status 403 + code "ACCOUNT_DISABLED" -> usuario desactivado (kill-switch).
 *     apiFetch ya limpió la sesión y redirigió al login.
 *   - status 401 -> token expirado/inválido. apiFetch también cierra sesión.
 *
 * Importante: el kill-switch (401/403 de sesión) sigue viviendo en apiFetch.
 * Este tipo solo conserva el detalle para que la vista pueda reaccionar.
 */
export type ApiErrorCode =
  | "FORBIDDEN_MODULE"
  | "ACCOUNT_DISABLED"
  | "UNAUTHORIZED"
  | "HTTP_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** true si es un bloqueo de permisos recortable en la UI (no sesión). */
  get isModuleForbidden() {
    return this.code === "FORBIDDEN_MODULE";
  }
}
