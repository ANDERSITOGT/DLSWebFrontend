import { useCallback, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import type {
  Bodega,
  Finca,
  ItemSolicitud,
  ProductoResult,
  SolicitudPayload,
} from "./types"

/**
 * Hook orquestador del wizard de Nueva Solicitud.
 * Concentra catálogos, lista de ítems, validaciones derivadas y el submit.
 */
export function useNuevaSolicitud() {
  const { user } = useAuth()

  // --- Catálogos ---
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [fincas, setFincas] = useState<Finca[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // --- Paso 1 ---
  const [selectedBodega, setSelectedBodega] = useState("")
  const [obsGeneral, setObsGeneral] = useState("")

  // --- Paso 2: lista de ítems ---
  const [items, setItems] = useState<ItemSolicitud[]>([])

  // --- Submit ---
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [solicitudCreadaId, setSolicitudCreadaId] = useState<string | null>(null)

  // ============================================================
  // Carga inicial de catálogos
  // ============================================================
  useEffect(() => {
    let cancelado = false

    async function loadData() {
      setLoadingCatalogos(true)
      try {
        const [resBodegas, resFincas] = await Promise.all([
          apiFetch("/api/inventario/bodegas"),
          apiFetch("/api/fincas/fincas-lotes"),
        ])
        if (cancelado) return
        if (resBodegas.ok) setBodegas(await resBodegas.json())
        if (resFincas.ok) setFincas(await resFincas.json())
      } catch (error) {
        if (!cancelado) console.error("💥 Error cargando catálogos:", error)
      } finally {
        if (!cancelado) setLoadingCatalogos(false)
      }
    }

    loadData()
    return () => {
      cancelado = true
    }
  }, [])

  // ============================================================
  // Búsqueda async de productos (con token vía apiFetch)
  // ============================================================
  const buscarProductos = useCallback(async (termino: string): Promise<ProductoResult[]> => {
    try {
      const res = await apiFetch(
        `/api/productos/productos-busqueda?q=${encodeURIComponent(termino)}`
      )
      if (!res.ok) return []
      return (await res.json()) as ProductoResult[]
    } catch (error) {
      console.error("Error buscando productos:", error)
      return []
    }
  }, [])

  // ============================================================
  // Derivados
  // ============================================================
  const bodegaSeleccionada = useMemo(
    () => bodegas.find((b) => b.id === selectedBodega) ?? null,
    [bodegas, selectedBodega]
  )

  /** Suma de cantidades ya en la lista para un producto concreto. */
  const cantidadEnListaPorProducto = useCallback(
    (productoId: string) =>
      items
        .filter((i) => i.productoId === productoId)
        .reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  )

  /** Stock global (todas las fincas sumadas) por producto. */
  const totalesPorProducto = useMemo(() => {
    const mapa: Record<string, number> = {}
    items.forEach((i) => {
      mapa[i.productoId] = (mapa[i.productoId] || 0) + i.cantidad
    })
    return mapa
  }, [items])

  /** Verdadero si algún producto supera su stock disponible (snapshot). */
  const existeErrorStock = useMemo(
    () => items.some((i) => (totalesPorProducto[i.productoId] ?? 0) > i.stockMaximo),
    [items, totalesPorProducto]
  )

  const totalUnidades = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  )

  const hayCambios = items.length > 0 || selectedBodega !== "" || obsGeneral.trim() !== ""

  const paso1Completo = selectedBodega !== ""
  const paso2Completo = items.length > 0 && !existeErrorStock
  const todoListo = paso1Completo && paso2Completo

  // ============================================================
  // Mutaciones de la lista
  // ============================================================
  const agregarItem = useCallback((item: ItemSolicitud) => {
    setItems((prev) => [...prev, item])
  }, [])

  const actualizarItem = useCallback((key: string, item: ItemSolicitud) => {
    setItems((prev) => prev.map((i) => (i.key === key ? item : i)))
  }, [])

  const eliminarItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  // ============================================================
  // Submit
  // ============================================================
  const enviarSolicitud = useCallback(async (): Promise<string | null> => {
    if (!todoListo) return null
    if (!user?.id) {
      setErrorEnvio("No se ha identificado el usuario.")
      return null
    }

    setGuardando(true)
    setErrorEnvio(null)

    try {
      const payload: SolicitudPayload = {
        solicitanteid: user.id,
        bodegaid: selectedBodega,
        productos: items.map((i) => ({
          productoid: i.productoId,
          unidadid: i.unidadId,
          cantidad: i.cantidad,
          loteid: i.loteId,
          notas: i.notas,
        })),
        observaciones: obsGeneral,
      }

      const res = await apiFetch("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Error al guardar la solicitud")

      const id = data?.solicitud?.id ?? data?.id ?? null
      if (!id) throw new Error("La respuesta del servidor no incluyó el id de la solicitud.")

      setSolicitudCreadaId(id)
      return id
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al enviar la solicitud."
      setErrorEnvio(mensaje)
      return null
    } finally {
      setGuardando(false)
    }
  }, [todoListo, user?.id, selectedBodega, items, obsGeneral])

  return {
    // Catálogos
    bodegas,
    fincas,
    loadingCatalogos,
    bodegaSeleccionada,
    // Paso 1
    selectedBodega,
    setSelectedBodega,
    obsGeneral,
    setObsGeneral,
    // Ítems
    items,
    agregarItem,
    actualizarItem,
    eliminarItem,
    buscarProductos,
    cantidadEnListaPorProducto,
    // Derivados
    totalesPorProducto,
    existeErrorStock,
    totalUnidades,
    hayCambios,
    paso1Completo,
    paso2Completo,
    todoListo,
    // Submit
    guardando,
    errorEnvio,
    solicitudCreadaId,
    enviarSolicitud,
  }
}

export type NuevaSolicitudController = ReturnType<typeof useNuevaSolicitud>
