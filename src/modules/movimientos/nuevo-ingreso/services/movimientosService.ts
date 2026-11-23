import { apiFetch } from "@/services/api"
import { ApiError } from "@/services/apiError"
import type { IngresoPayload } from "../types"

/**
 * Resultado mínimo que la página necesita para la pantalla de éxito.
 * `documentoId` siempre existe; `consecutivo` puede faltar (se usa fallback).
 */
export type IngresoCreado = {
  documentoId: string
  consecutivo: string | null
}

/** Error tipado cuando el backend detecta una factura duplicada (409). */
export class FacturaDuplicadaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FacturaDuplicadaError"
  }
}

/**
 * Tipos MIME que el motor OCR (tesseract.js) puede procesar. PDF queda fuera:
 * el backend responde `400 ARCHIVO_INVALIDO`.
 */
export const MIME_OCR_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const

/** Atributo `accept` para el `<input type="file">` (alineado a MIME_OCR_PERMITIDOS). */
export const ACCEPT_OCR =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"

/** ¿El archivo es una imagen que el OCR puede procesar? */
export function esImagenEscaneable(archivo: File): boolean {
  if (archivo.type) {
    return (MIME_OCR_PERMITIDOS as readonly string[]).includes(archivo.type)
  }
  // Fallback por extensión si el navegador no reporta el type.
  return /\.(jpe?g|png|webp)$/i.test(archivo.name)
}

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Lanza una `FacturaDuplicadaError` si el error es un 409 de factura duplicada.
 * Se apoya tanto en el status HTTP como en el código de negocio del mensaje.
 */
function mapIngresoError(error: unknown): never {
  if (error instanceof ApiError) {
    const mensaje = error.message || ""
    if (error.status === 409 || /FACTURA_DUPLICADA|ya existe|duplicad/i.test(mensaje)) {
      throw new FacturaDuplicadaError(
        mensaje || "Ya existe un ingreso registrado con esta factura.",
      )
    }
  }
  throw error
}

export const movimientosService = {
  /**
   * Envía una imagen (JPG/PNG/WebP) al escáner OCR.
   *
   * Contrato real `POST /api/movimientos/escanear` (multipart/form-data):
   *   - `archivo`     (obligatorio): la imagen a procesar.
   *   - `proveedorId` (opcional): si ya hay un proveedor seleccionado, el backend
   *     lo usa como pista para mejorar el matching de ítems.
   *
   * Respuesta esperada:
   *   `{ ok: true, escaneo: { confianza, comprobante: {...}, proveedor,
   *      items: [...], advertencias, requiereRevisionManual } }`
   *
   * tesseract.js solo procesa imágenes: un PDF provoca `400 ARCHIVO_INVALIDO`.
   * El input de la UI ya restringe a JPG/PNG/WebP, pero validamos aquí también
   * como red de seguridad antes de gastar una petición.
   *
   * Si el motor OCR aún no está desplegado el backend responde 404; se propaga
   * el `ApiError` (status 404) para que la UI lo trate de forma amable.
   */
  async escanear(archivo: File, proveedorId?: string | null): Promise<Response> {
    if (!esImagenEscaneable(archivo)) {
      throw new ApiError(
        "Solo se permiten imágenes JPG, PNG o WebP para el escaneo OCR.",
        400,
        "HTTP_ERROR",
      )
    }
    const formData = new FormData()
    formData.append("archivo", archivo)
    if (proveedorId && proveedorId.trim() !== "") {
      formData.append("proveedorId", proveedorId)
    }
    // apiFetch detecta `body instanceof FormData` y NO fija Content-Type, de
    // modo que el navegador agrega el boundary multipart correcto.
    return apiFetch("/api/movimientos/escanear", {
      method: "POST",
      body: formData,
    })
  },

  /**
   * Registra un ingreso de mercadería. `POST /api/movimientos/ingreso`.
   * Respuesta del contrato: `{ ok, documento, message }`.
   */
  async crearIngreso(payload: IngresoPayload): Promise<IngresoCreado> {
    try {
      const res = await apiFetch("/api/movimientos/ingreso", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const data = await readJsonSafe(res)
      const doc = (data as { documento?: { id?: string; consecutivo?: string } } | null)?.documento
      const documentoId = doc?.id ?? null
      if (!documentoId) {
        throw new Error("La respuesta del servidor no incluyó el documento del ingreso.")
      }
      return {
        documentoId,
        consecutivo: doc?.consecutivo ?? null,
      }
    } catch (error) {
      mapIngresoError(error)
    }
  },

  /** URL del comprobante PDF del ingreso (ruta pública según contrato). */
  exportUrl(documentoId: string): string {
    return `/api/movimientos/${documentoId}/export`
  },
}
