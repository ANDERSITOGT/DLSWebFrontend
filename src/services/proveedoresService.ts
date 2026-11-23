import { apiFetch } from "./api"
import { ApiError } from "./apiError"
import type {
  Contacto,
  ContactoPayload,
  ListProveedoresParams,
  Proveedor,
  ProveedorPayload,
  ProveedoresPage,
} from "@/pages/proveedores/types"

/**
 * Servicio del módulo de Proveedores. Toda petición pasa por `apiFetch`, que
 * inyecta el token (`dls_token`) y aplica el kill-switch 401/403.
 *
 * Errores de negocio (400/409) llegan como `ApiError` con el `message` que
 * devuelve el backend, listo para mostrarse en la UI.
 */

/** Descarta respuestas sin cuerpo (p. ej. 204) para no romper el parseo. */
async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return {} as T
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

export async function listProveedores({
  page,
  limit,
  q,
}: ListProveedoresParams): Promise<ProveedoresPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const termino = q?.trim()
  if (termino) params.set("q", termino)

  const res = await apiFetch(`/api/proveedores?${params.toString()}`)
  const body = await parseJson<Partial<ProveedoresPage> | Proveedor[]>(res)

  // Defensa: normaliza por si llegara un array plano (contrato anterior).
  if (Array.isArray(body)) {
    return {
      data: body,
      meta: { total: body.length, page, limit, totalPages: 1 },
    }
  }

  const data = Array.isArray(body.data) ? body.data : []
  const meta = body.meta ?? {
    total: data.length,
    page,
    limit,
    totalPages: data.length > 0 ? 1 : 0,
  }
  return { data, meta }
}

export async function createProveedor(payload: ProveedorPayload): Promise<Proveedor> {
  const res = await apiFetch("/api/proveedores", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseJson<Proveedor>(res)
}

export async function updateProveedor(
  id: string,
  payload: Partial<ProveedorPayload>,
): Promise<Proveedor> {
  const res = await apiFetch(`/api/proveedores/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return parseJson<Proveedor>(res)
}

export async function createContacto(
  proveedorId: string,
  payload: ContactoPayload,
): Promise<Contacto> {
  const res = await apiFetch(`/api/proveedores/${proveedorId}/contactos`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseJson<Contacto>(res)
}

export async function deleteContacto(contactoId: string): Promise<void> {
  await apiFetch(`/api/proveedores/contactos/${contactoId}`, { method: "DELETE" })
}

/** Normaliza cualquier error a `ApiError` para la UI. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(
    error instanceof Error ? error.message : "Error desconocido",
    0,
    "HTTP_ERROR",
  )
}
