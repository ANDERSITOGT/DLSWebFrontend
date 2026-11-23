import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/services/apiError"
import {
  createContacto,
  createProveedor,
  deleteContacto,
  listProveedores,
  toApiError,
  updateProveedor,
} from "@/services/proveedoresService"
import { useDebounce } from "@/hooks/useDebounce"
import {
  LIMITES_PAGINA,
  type ContactoPayload,
  type LimitePagina,
  type Proveedor,
  type ProveedorPayload,
  type ProveedoresMeta,
} from "./types"

const META_INICIAL: ProveedoresMeta = { total: 0, page: 1, limit: 10, totalPages: 0 }

/**
 * Hook orquestador del listado de Proveedores.
 *
 * Responsabilidades:
 * - Estado de servidor: página, límite, término de búsqueda (debounced) y `q`
 *   aplicado; recarga única cada vez que cambia el "query key".
 * - Estado derivado: rango visible, puede ir a anterior/siguiente.
 * - Mutaciones (crear/editar proveedor, alta/baja de contacto) que hacen
 *   `refetch()` para mantener sincronizado el panel abierto y los badges.
 *
 * La vista debe derivar el proveedor activo del Sheet desde `items` usando el
 * `id` guardado, de modo que el refetch actualice el panel al instante.
 */
export function useProveedores() {
  // --- Búsqueda ---
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 350)

  // --- Paginación en servidor ---
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<LimitePagina>(LIMITES_PAGINA[0])

  // --- Datos ---
  const [items, setItems] = useState<Proveedor[]>([])
  const [meta, setMeta] = useState<ProveedoresMeta>(META_INICIAL)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  /** Contador de peticiones para descartar respuestas fuera de orden. */
  const requestId = useRef(0)

  // Al cambiar el término (debounced) volvemos a la primera página.
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  const load = useCallback(
    async (currentPage: number, currentLimit: number, currentQuery: string) => {
      const id = ++requestId.current
      setFetching(true)
      setError(null)
      try {
        const result = await listProveedores({
          page: currentPage,
          limit: currentLimit,
          q: currentQuery,
        })
        if (id !== requestId.current) return
        setItems(result.data)
        setMeta(result.meta)

        // Si la página actual quedó vacía tras un borrado, retrocede una.
        if (result.data.length === 0 && result.meta.total > 0 && currentPage > 1) {
          setPage(Math.max(1, result.meta.totalPages))
        }
      } catch (err) {
        if (id !== requestId.current) return
        setError(toApiError(err))
        setItems([])
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          setFetching(false)
        }
      }
    },
    [],
  )

  // Carga inicial y recarga al cambiar query/página/límite.
  useEffect(() => {
    load(page, limit, debouncedQuery)
  }, [load, page, limit, debouncedQuery])

  const refetch = useCallback(() => {
    return load(page, limit, debouncedQuery)
  }, [load, page, limit, debouncedQuery])

  const retry = useCallback(() => {
    setLoading(true)
    return load(page, limit, debouncedQuery)
  }, [load, page, limit, debouncedQuery])

  const clearQuery = useCallback(() => setQuery(""), [])

  const changeLimit = useCallback((value: LimitePagina) => {
    setLimit(value)
    setPage(1)
  }, [])

  const goToNext = useCallback(() => {
    setPage((p) => (p < meta.totalPages ? p + 1 : p))
  }, [meta.totalPages])

  const goToPrev = useCallback(() => {
    setPage((p) => (p > 1 ? p - 1 : 1))
  }, [])

  const findById = useCallback(
    (id: string | null) => (id ? items.find((p) => p.id === id) ?? null : null),
    [items],
  )

  // --- Mutaciones ---

  /** Crea un proveedor y recarga el listado. Devuelve el creado. */
  const crear = useCallback(
    async (payload: ProveedorPayload) => {
      const created = await createProveedor(payload)
      await refetch()
      return created
    },
    [refetch],
  )

  /** Edita un proveedor y recarga el listado. Devuelve el actualizado. */
  const editar = useCallback(
    async (id: string, payload: Partial<ProveedorPayload>) => {
      const updated = await updateProveedor(id, payload)
      await refetch()
      return updated
    },
    [refetch],
  )

  /** Alta de contacto + recarga (actualiza panel abierto y badge). */
  const agregarContacto = useCallback(
    async (proveedorId: string, payload: ContactoPayload) => {
      const contacto = await createContacto(proveedorId, payload)
      await refetch()
      return contacto
    },
    [refetch],
  )

  /** Baja de contacto + recarga. */
  const eliminarContacto = useCallback(
    async (contactoId: string) => {
      await deleteContacto(contactoId)
      await refetch()
    },
    [refetch],
  )

  // --- Derivados de paginación ---
  const isFirstLoad = loading && items.length === 0
  const desde = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const hasta = Math.min(meta.page * meta.limit, meta.total)
  const hasPrev = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  return {
    // Datos
    items,
    meta,
    // Estado
    loading,
    fetching,
    isFirstLoad,
    error,
    // Búsqueda
    query,
    setQuery,
    clearQuery,
    // Paginación
    page: meta.page || page,
    limit,
    setLimit: changeLimit,
    goToNext,
    goToPrev,
    hasPrev,
    hasNext,
    desde,
    hasta,
    // Derivados
    findById,
    // Acciones
    refetch,
    retry,
    crear,
    editar,
    agregarContacto,
    eliminarContacto,
  }
}

export type ProveedoresController = ReturnType<typeof useProveedores>
