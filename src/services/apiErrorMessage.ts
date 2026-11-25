import { ApiError } from "./apiError";

/**
 * Mensajes de negocio que la UI debe presentar con un texto claro y accionable.
 * Clave = `codigo` devuelto por el backend en el body de error.
 */
const MENSAJES_NEGOCIO: Record<string, string> = {
  PRODUCTO_SIN_COSTO:
    "No se pudo completar la operación: el producto no tiene precio de referencia (CPP) configurado. " +
    "Configúralo primero en Inventario (Producto → Precio de referencia) y vuelve a intentarlo.",
};

/**
 * Convierte un error de `apiFetch`/`fetch` en un mensaje legible para la UI.
 *
 * Prioriza el código de negocio (p. ej. `PRODUCTO_SIN_COSTO`) sobre el
 * `message` crudo del backend, para dar instrucciones claras al usuario.
 *
 * @param err     Error capturado (idealmente un `ApiError`).
 * @param data    Body JSON ya parseado (si el caller no usa apiFetch: para
 *                leer `message`/`codigo` de respuestas `Response`).
 * @param fallback Texto por defecto si no hay información útil.
 */
export function mensajeDeApiError(
  err: unknown,
  data?: { message?: string; codigo?: string } | null,
  fallback = "Ocurrió un error inesperado.",
): string {
  // 1) Código de negocio desde ApiError.
  if (err instanceof ApiError && err.businessCode && MENSAJES_NEGOCIO[err.businessCode]) {
    return MENSAJES_NEGOCIO[err.businessCode];
  }

  // 2) Código/mensaje de negocio desde el body (fetch crudo).
  const codigo = data?.codigo ?? (err instanceof ApiError ? err.businessCode : undefined);
  if (codigo && MENSAJES_NEGOCIO[codigo]) {
    return MENSAJES_NEGOCIO[codigo];
  }

  // 3) Mensaje del body o del error.
  if (data?.message) return data.message;
  if (err instanceof Error && err.message) return err.message;

  return fallback;
}

/** true si el error corresponde a un producto sin costo configurado. */
export function esProductoSinCosto(
  err: unknown,
  data?: { codigo?: string } | null,
): boolean {
  if (err instanceof ApiError) return err.isProductoSinCosto;
  return data?.codigo === "PRODUCTO_SIN_COSTO";
}
