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
  /**
   * Código de negocio devuelto por el backend (`body.codigo`), p. ej.
   * `PRODUCTO_SIN_COSTO`, `STOCK_INSUFICIENTE`, `TRANSICION_INVALIDA`.
   * Es independiente de `code` (que clasifica el tipo de fallo HTTP).
   */
  readonly businessCode?: string;

  constructor(message: string, status: number, code: ApiErrorCode, businessCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.businessCode = businessCode;
  }

  /** true si es un bloqueo de permisos recortable en la UI (no sesión). */
  get isModuleForbidden() {
    return this.code === "FORBIDDEN_MODULE";
  }

  /** true si el backend bloqueó la operación por falta de precio de referencia. */
  get isProductoSinCosto() {
    return this.businessCode === "PRODUCTO_SIN_COSTO";
  }
}

