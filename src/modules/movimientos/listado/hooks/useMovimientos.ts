import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/services/apiError"
import { useDebounce } from "@/hooks/useDebounce"
import { listMovimientos, toApiError } from "../../services/movimientosListService"
import {
  FILTROS_VACIOS,
  LIMITES_PAGINA,
  type LimitePagina,
  type ListMovimientosParams,
  type MovimientoResumen,
  type MovimientosFiltros,
  type MovimientosMeta,
} from "../../types"

const META_INICIAL: MovimientosMeta = { total: 0, page: 1, limit: LIMITES_PAGINA[0], totalPages: 0 }

/** Debounce de la búsqueda `q` (ms). */
const DEBOUNCE_MS = 400

/** ¿Hay algún filtro activo (para mostrar el botón "Limpiar filtros")? */
function hayFiltrosActivos(f: MovimientosFiltros): boolean {
  return Boolean(
    f.tipo || f.estado || f.proveedorId || f.solicitanteId || f.bodegaId || f.fechaInicio || f.fechaFin || f.q,
  )
}

/** Serializa los filtros (sin `q`) para compararlos por valor, no por identidad. */
function keyFiltrosSinQ(f: MovimientosFiltros): string {
  return [f.tipo, f.estado, f.proveedorId, f.solicitanteId, f.bodegaId, f.fechaInicio, f.fechaFin].join("|")
}

/**
 * Hook orquestador del listado de Movimientos.
 *
 * - Estado de servidor: `page`, `limit`, filtros de contexto y búsqueda `q`
 *   (debounced 400 ms).
 * - Una ÚNICA petición por cambio: `appliedKey` aplana (page, limit, filtros,
 *   q, reloadTick) en un string y el efecto se dispara con él; las respuestas
 *   fuera de orden se descartan con `requestId`.
 * - Refresco MANUAL: no hay polling. `refetch` incrementa `reloadTick` y la UI
 *   muestra el spinner de carga sólo mientras esa petición está en vuelo.
 * - `queryKey` expone los filtros aplicados (sin page/limit) para reutilizarlos
 *   EXACTAMENTE en la exportación del PDF.
 */
export function useMovimientos() {
  const [filtros, setFiltros] = useState<MovimientosFiltros>(FILTROS_VACIOS)
  const debouncedQ = useDebounce(filtros.q, DEBOUNCE_MS)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<LimitePagina>(LIMITES_PAGINA[0])

  const [items, setItems] = useState<MovimientoResumen[]>([])
  const [meta, setMeta] = useState<MovimientosMeta>(META_INICIAL)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const requestId = useRef(0)
  const [reloadTick, setReloadTick] = useState(0)

  // `q` aplicada: la debounced, salvo que el usuario siga escribiendo (en cuyo
  // caso conservamos la última enviada para evitar peticiones intermedias).
  const [appliedQ, setAppliedQ] = useState("")
  const qEfectiva = debouncedQ === filtros.q ? debouncedQ : appliedQ

  const filtrosKey = keyFiltrosSinQ(filtros)

  // Al cambiar filtros (debounced q incluido) volvemos a la página 1.
  useEffect(() => {
    setPage(1)
  }, [filtrosKey, debouncedQ])

  // Registrar el `q` aplicado cuando el debounce se estabiliza.
  useEffect(() => {
    setAppliedQ(debouncedQ)
  }, [debouncedQ])

  // Una sola "key" de petición: cualquier cambio aquí = una petición.
  const appliedKey = `${page}|${limit}|${filtrosKey}|${qEfectiva}|${reloadTick}`

  useEffect(() => {
    const id = ++requestId.current
    setFetching(true)
    setError(null)

    const params: ListMovimientosParams = {
      page,
      limit,
      tipo: filtros.tipo || undefined,
      estado: filtros.estado || undefined,
      proveedorId: filtros.proveedorId || undefined,
      solicitanteId: filtros.solicitanteId || undefined,
      bodegaId: filtros.bodegaId || undefined,
      fechaInicio: filtros.fechaInicio || undefined,
      fechaFin: filtros.fechaFin || undefined,
      q: qEfectiva.trim() || undefined,
    }

    listMovimientos(params)
      .then((result) => {
        if (id !== requestId.current) return
        setItems(result.data)
        setMeta(result.meta)
        // Página vacía (filtro restrictivo) → retrocede a la última válida.
        if (result.data.length === 0 && result.meta.total > 0 && page > 1) {
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

  // --- Acciones de filtros ---
  const setFilter = useCallback(
    <K extends keyof MovimientosFiltros>(key: K, value: MovimientosFiltros[K]) => {
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

  // --- Derivados ---
  const isFirstLoad = loading && items.length === 0
  const desde = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const hasta = Math.min(meta.page * meta.limit, meta.total)
  const hasPrev = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  /** Filtros aplicados (sin page/limit) para reutilizar en el export. */
  const queryKey: Omit<ListMovimientosParams, "page" | "limit"> = {
    tipo: filtros.tipo || undefined,
    estado: filtros.estado || undefined,
    proveedorId: filtros.proveedorId || undefined,
    solicitanteId: filtros.solicitanteId || undefined,
    bodegaId: filtros.bodegaId || undefined,
    fechaInicio: filtros.fechaInicio || undefined,
    fechaFin: filtros.fechaFin || undefined,
    q: qEfectiva.trim() || undefined,
  }

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
    queryKey,
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

export type MovimientosController = ReturnType<typeof useMovimientos>
