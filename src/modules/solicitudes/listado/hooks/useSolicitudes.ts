import { useCallback, useEffect, useRef, useState } from "react"
import { useDebounce } from "@/hooks/useDebounce"
import { ApiError } from "@/services/apiError"
import { listSolicitudes, toApiError } from "../services/solicitudesListService"
import {
  FILTROS_VACIOS,
  LIMITES_PAGINA,
  type LimitePagina,
  type ListSolicitudesParams,
  type SolicitudResumen,
  type SolicitudesFiltros,
  type SolicitudesMeta,
} from "../types"

const META_INICIAL: SolicitudesMeta = { total: 0, page: 1, limit: LIMITES_PAGINA[0], totalPages: 0 }

/** Debounce de la búsqueda `q` (ms). */
const DEBOUNCE_MS = 400

/** ¿Hay algún filtro activo? (para el botón "Limpiar filtros"). */
function hayFiltrosActivos(f: SolicitudesFiltros): boolean {
  return Boolean(f.estado || f.tipo || f.bodegaId || f.q)
}

/** Serializa los filtros sin `q` para compararlos por valor. */
function keyFiltrosSinQ(f: SolicitudesFiltros): string {
  return [f.estado, f.tipo, f.bodegaId].join("|")
}

/**
 * Hook orquestador del listado de Solicitudes.
 *
 * - Estado de servidor: `page`, `limit`, filtros (estado/tipo/bodega) y `q`
 *   con debounce de 400 ms.
 * - Una ÚNICA petición por cambio: `appliedKey` aplana (page, limit, filtros,
 *   q, reloadTick) en un string; las respuestas fuera de orden se descartan.
 * - Refresco MANUAL (sin polling): `refetch` incrementa `reloadTick`.
 */
export function useSolicitudes() {
  const [filtros, setFiltros] = useState<SolicitudesFiltros>(FILTROS_VACIOS)
  const debouncedQ = useDebounce(filtros.q, DEBOUNCE_MS)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<LimitePagina>(LIMITES_PAGINA[0])

  const [items, setItems] = useState<SolicitudResumen[]>([])
  const [meta, setMeta] = useState<SolicitudesMeta>(META_INICIAL)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const requestId = useRef(0)
  const [reloadTick, setReloadTick] = useState(0)

  const [appliedQ, setAppliedQ] = useState("")
  const qEfectiva = debouncedQ === filtros.q ? debouncedQ : appliedQ

  const filtrosKey = keyFiltrosSinQ(filtros)

  // Al cambiar filtros (debounced q incluido) volvemos a la página 1.
  useEffect(() => {
    setPage(1)
  }, [filtrosKey, debouncedQ])

  useEffect(() => {
    setAppliedQ(debouncedQ)
  }, [debouncedQ])

  const appliedKey = `${page}|${limit}|${filtrosKey}|${qEfectiva}|${reloadTick}`

  useEffect(() => {
    const id = ++requestId.current
    setFetching(true)
    setError(null)

    const params: ListSolicitudesParams = {
      page,
      limit,
      estado: filtros.estado || undefined,
      tipo: filtros.tipo || undefined,
      bodegaId: filtros.bodegaId || undefined,
      q: qEfectiva.trim() || undefined,
    }

    listSolicitudes(params)
      .then((result) => {
        if (id !== requestId.current) return
        setItems(result.solicitudes)
        setMeta(result.meta)
        // Página vacía (filtro restrictivo) → retrocede a la última válida.
        if (result.solicitudes.length === 0 && result.meta.total > 0 && page > 1) {
          setPage(Math.max(1, result.meta.totalPages))
        }
      })
      .catch((err) => {
        if (id !== requestId.current) return
        setError(toApiError(err))
        setItems([])
        setMeta(META_INICIAL)
      })
      .finally(() => {
        if (id === requestId.current) {
          setLoading(false)
          setFetching(false)
        }
      })
    // `filtros`/`qEfectiva` están "aplanados" en appliedKey a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey])

  const setFilter = useCallback(
    <K extends keyof SolicitudesFiltros>(key: K, value: SolicitudesFiltros[K]) => {
      setFiltros((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetFiltros = useCallback(() => setFiltros(FILTROS_VACIOS), [])

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

  const refetch = useCallback(() => setReloadTick((t) => t + 1), [])
  const retry = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

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
    // Filtros
    filtros,
    setFilter,
    resetFiltros,
    hayFiltrosActivos: hayFiltrosActivos(filtros),
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
    // Acciones
    refetch,
    retry,
  }
}

export type SolicitudesController = ReturnType<typeof useSolicitudes>
