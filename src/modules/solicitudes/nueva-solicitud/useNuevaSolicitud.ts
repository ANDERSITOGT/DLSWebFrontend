import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { apiFetch } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import type {
  Bodega,
  Finca,
  ItemSolicitud,
  ProductoResult,
  SolicitudPayload,
} from "./types"

/** Borrador persistido en localStorage para poder retomar la solicitud. */
type BorradorSolicitud = {
  selectedBodega: string
  obsGeneral: string
  items: ItemSolicitud[]
  /** Índice del paso actual del wizard (0-based). */
  paso: number
  actualizadoEn: number
}

const DRAFT_PREFIX = "dls_draft_solicitud_"
const LAST_BODEGA_KEY = "dls_last_bodega"
/** Cantidad mínima aceptada por ítem (nunca <= 0). */
const CANTIDAD_MINIMA = 0.1

const draftKey = (userId?: string | null) => `${DRAFT_PREFIX}${userId ?? "anon"}`

const leerBorrador = (userId?: string | null): BorradorSolicitud | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BorradorSolicitud> | null
    if (!parsed || !Array.isArray(parsed.items)) return null
    return {
      selectedBodega: parsed.selectedBodega ?? "",
      obsGeneral: parsed.obsGeneral ?? "",
      items: parsed.items as ItemSolicitud[],
      paso: Number.isFinite(parsed.paso) ? Math.min(Math.max(Number(parsed.paso), 0), 2) : 0,
      actualizadoEn: parsed.actualizadoEn ?? 0,
    }
  } catch (error) {
    console.warn("No se pudo leer el borrador de solicitud:", error)
    return null
  }
}

const tieneDatos = (borrador: BorradorSolicitud | null): boolean =>
  !!borrador &&
  (borrador.items.length > 0 ||
    borrador.selectedBodega !== "" ||
    borrador.obsGeneral.trim() !== "")

const guardarBorrador = (userId: string | null | undefined, borrador: BorradorSolicitud) => {
  if (typeof window === "undefined") return
  try {
    const tieneContenido =
      borrador.items.length > 0 ||
      borrador.selectedBodega !== "" ||
      borrador.obsGeneral.trim() !== ""
    if (!tieneContenido) {
      window.localStorage.removeItem(draftKey(userId))
      return
    }
    window.localStorage.setItem(draftKey(userId), JSON.stringify(borrador))
  } catch (error) {
    console.warn("No se pudo guardar el borrador de solicitud:", error)
  }
}

const eliminarBorrador = (userId: string | null | undefined) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(draftKey(userId))
  } catch (error) {
    console.warn("No se pudo eliminar el borrador de solicitud:", error)
  }
}

/**
 * Hook orquestador del wizard de Nueva Solicitud.
 * Concentra catálogos, lista de ítems, validaciones derivadas, borrador
 * automático en localStorage y el submit.
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

  // --- Navegación del wizard (persistida en el borrador) ---
  const [paso, setPaso] = useState(0)

  // --- Paso 2: lista de ítems ---
  const [items, setItems] = useState<ItemSolicitud[]>([])

  // --- Borrador ---
  const [borradorRecuperado, setBorradorRecuperado] = useState(false)
  /** Evita que el efecto de autoguardado pise el borrador antes de restaurarlo. */
  const restauracionLista = useRef(false)

  // --- Submit ---
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [solicitudCreadaId, setSolicitudCreadaId] = useState<string | null>(null)

  // ============================================================
  // Restauración del borrador al entrar
  // ============================================================
  useEffect(() => {
    if (!user?.id) return
    const borrador = leerBorrador(user.id)
    restauracionLista.current = true
    if (!tieneDatos(borrador) || !borrador) return
    setSelectedBodega(borrador.selectedBodega)
    setObsGeneral(borrador.obsGeneral)
    setItems(borrador.items)
    setPaso(borrador.paso)
    setBorradorRecuperado(true)
    // Solo en el primer montaje / cambio de usuario.
  }, [user?.id])

  // ============================================================
  // Autoguardado del borrador
  // ============================================================
  useEffect(() => {
    if (!user?.id) return
    if (!restauracionLista.current) return
    guardarBorrador(user.id, {
      selectedBodega,
      obsGeneral,
      items,
      paso,
      actualizadoEn: Date.now(),
    })
  }, [user?.id, selectedBodega, obsGeneral, items, paso])

  // ============================================================
  // Carga inicial de catálogos + preselección inteligente de bodega
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
        let listadoBodegas: Bodega[] = []
        if (resBodegas.ok) {
          listadoBodegas = (await resBodegas.json()) as Bodega[]
          setBodegas(listadoBodegas)
        }
        if (resFincas.ok) setFincas(await resFincas.json())

        // Preselección: solo si no hay borrador activo con bodega elegida.
        const borradorActivo = leerBorrador(user?.id)
        const hayBodegaEnBorrador =
          tieneDatos(borradorActivo) && !!borradorActivo?.selectedBodega
        if (!hayBodegaEnBorrador) {
          const ultimaBodega =
            typeof window !== "undefined"
              ? window.localStorage.getItem(LAST_BODEGA_KEY)
              : null
          const coincidencia = ultimaBodega
            ? listadoBodegas.find((b) => b.id === ultimaBodega)
            : undefined
          if (coincidencia) {
            setSelectedBodega(coincidencia.id)
          } else if (listadoBodegas.length === 1) {
            setSelectedBodega(listadoBodegas[0].id)
          }
        }
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
  }, [user?.id])

  // Marca el autoguardado como listo cuando los catálogos terminan de cargar
  // (para que la preselección de bodega también quede persistida).
  useEffect(() => {
    if (!loadingCatalogos) restauracionLista.current = true
  }, [loadingCatalogos])

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

  /** Edición rápida de cantidad desde la lista (nunca <= 0). */
  const actualizarCantidadItem = useCallback((key: string, nuevaCantidad: number) => {
    const cantidad = Number.isFinite(nuevaCantidad)
      ? Math.max(CANTIDAD_MINIMA, nuevaCantidad)
      : CANTIDAD_MINIMA
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, cantidad } : i)))
  }, [])

  // ============================================================
  // Reset / borrador
  // ============================================================
  const resetearFormulario = useCallback(() => {
    eliminarBorrador(user?.id)
    setSelectedBodega("")
    setObsGeneral("")
    setItems([])
    setPaso(0)
    setErrorEnvio(null)
    setSolicitudCreadaId(null)
    setBorradorRecuperado(false)
  }, [user?.id])

  /** Descarta el borrador completo (localStorage + estado). */
  const descartarBorrador = useCallback(() => {
    resetearFormulario()
  }, [resetearFormulario])

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

      // Recordar la última bodega usada para futuras solicitudes.
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_BODEGA_KEY, selectedBodega)
      }
      // Éxito: el borrador ya no es necesario.
      eliminarBorrador(user.id)

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
    // Navegación del wizard
    paso,
    setPaso,
    // Ítems
    items,
    agregarItem,
    actualizarItem,
    eliminarItem,
    actualizarCantidadItem,
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
    // Borrador
    borradorRecuperado,
    descartarBorrador,
    resetearFormulario,
    // Submit
    guardando,
    errorEnvio,
    solicitudCreadaId,
    enviarSolicitud,
  }
}

export type NuevaSolicitudController = ReturnType<typeof useNuevaSolicitud>
