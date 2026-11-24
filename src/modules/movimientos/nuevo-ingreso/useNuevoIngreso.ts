import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { apiFetch } from "@/services/api"
import { ApiError } from "@/services/apiError"
import { useAuth } from "@/context/AuthContext"
import { movimientosService, FacturaDuplicadaError, type IngresoCreado } from "./services/movimientosService"
import { parseOcrResponse, type OcrParseResult } from "./utils/ocrParser"
import type {
  Bodega,
  CandidatoProducto,
  IngresoPayload,
  ItemIngreso,
  ProductoResult,
  Proveedor,
  TipoComprobante,
} from "./types"

const DRAFT_PREFIX = "dls_draft_ingreso_"
const LAST_BODEGA_KEY = "dls_last_bodega_ingreso"
const CANTIDAD_MINIMA = 0.1
const PASO_MAX = 2

type BorradorIngreso = {
  bodegaId: string
  fecha: string
  tipoComprobante: TipoComprobante
  proveedorId: string
  serie: string
  factura: string
  uuid: string
  observaciones: string
  items: ItemIngreso[]
  paso: number
  actualizadoEn: number
}

const draftKey = (userId?: string | null) => `${DRAFT_PREFIX}${userId ?? "anon"}`

const hoyISO = () => new Date().toISOString().slice(0, 10)

function generarKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `ing-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const leerBorrador = (userId?: string | null): BorradorIngreso | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BorradorIngreso> | null
    if (!parsed || !Array.isArray(parsed.items)) return null
    return {
      bodegaId: parsed.bodegaId ?? "",
      fecha: parsed.fecha ?? hoyISO(),
      tipoComprobante: parsed.tipoComprobante === "RECIBO" ? "RECIBO" : "FACTURA",
      proveedorId: parsed.proveedorId ?? "",
      serie: parsed.serie ?? "",
      factura: parsed.factura ?? "",
      uuid: parsed.uuid ?? "",
      observaciones: parsed.observaciones ?? "",
      items: parsed.items as ItemIngreso[],
      paso: Number.isFinite(parsed.paso)
        ? Math.min(Math.max(Number(parsed.paso), 0), PASO_MAX)
        : 0,
      actualizadoEn: parsed.actualizadoEn ?? 0,
    }
  } catch (error) {
    console.warn("No se pudo leer el borrador de ingreso:", error)
    return null
  }
}

const tieneDatos = (borrador: BorradorIngreso | null): boolean =>
  !!borrador &&
  (borrador.items.length > 0 ||
    borrador.bodegaId !== "" ||
    borrador.factura.trim() !== "" ||
    borrador.observaciones.trim() !== "")

/**
 * Hook orquestador del wizard de Nuevo Ingreso.
 * Concentra catálogos, cabecera, ítems, validaciones derivadas, borrador
 * automático y el submit. La UI (pasos) solo consume este controller.
 */
export function useNuevoIngreso() {
  const { user } = useAuth()

  // --- Catálogos ---
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // --- Cabecera (paso 1) ---
  const [bodegaId, setBodegaId] = useState("")
  const [fecha, setFecha] = useState(hoyISO())
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("FACTURA")
  const [proveedorId, setProveedorId] = useState("")
  const [serie, setSerie] = useState("")
  const [factura, setFactura] = useState("")
  const [uuid, setUuid] = useState("")
  const [observaciones, setObservaciones] = useState("")

  // --- Navegación del wizard ---
  const [paso, setPaso] = useState(0)

  // --- Ítems (paso 2) ---
  const [items, setItems] = useState<ItemIngreso[]>([])

  // --- OCR ---
  const [scanning, setScanning] = useState(false)
  const [ocrInformacion, setOcrInformacion] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrAplicado, setOcrAplicado] = useState(false)

  // --- Borrador ---
  const [borradorRecuperado, setBorradorRecuperado] = useState(false)
  const restauracionLista = useRef(false)

  // --- Submit ---
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [resultado, setResultado] = useState<IngresoCreado | null>(null)

  // ============================================================
  // Restauración del borrador
  // ============================================================
  useEffect(() => {
    if (!user?.id) return
    const borrador = leerBorrador(user.id)
    restauracionLista.current = true
    if (!borrador || !tieneDatos(borrador)) return
    setBodegaId(borrador.bodegaId)
    setFecha(borrador.fecha)
    setTipoComprobante(borrador.tipoComprobante)
    setProveedorId(borrador.proveedorId)
    setSerie(borrador.serie)
    setFactura(borrador.factura)
    setUuid(borrador.uuid)
    setObservaciones(borrador.observaciones)
    setItems(borrador.items)
    setPaso(borrador.paso)
    setBorradorRecuperado(true)
  }, [user?.id])

  // ============================================================
  // Autoguardado (sin blobs: el borrador solo guarda texto + items)
  // ============================================================
  useEffect(() => {
    if (!user?.id || !restauracionLista.current) return
    try {
      const tieneContenido =
        items.length > 0 ||
        bodegaId !== "" ||
        factura.trim() !== "" ||
        observaciones.trim() !== ""
      if (!tieneContenido) {
        window.localStorage.removeItem(draftKey(user.id))
        return
      }
      const borrador: BorradorIngreso = {
        bodegaId,
        fecha,
        tipoComprobante,
        proveedorId,
        serie,
        factura,
        uuid,
        observaciones,
        items,
        paso,
        actualizadoEn: Date.now(),
      }
      window.localStorage.setItem(draftKey(user.id), JSON.stringify(borrador))
    } catch (error) {
      console.warn("No se pudo guardar el borrador de ingreso:", error)
    }
  }, [user?.id, bodegaId, fecha, tipoComprobante, proveedorId, serie, factura, uuid, observaciones, items, paso])

  // ============================================================
  // Carga inicial de catálogos + preselección de bodega
  // ============================================================
  useEffect(() => {
    let cancelado = false
    async function loadData() {
      setLoadingCatalogos(true)
      try {
        const [resBodegas, resProveedores] = await Promise.all([
          apiFetch("/api/inventario/bodegas"),
          apiFetch("/api/proveedores/catalogo"),
        ])
        if (cancelado) return
        const listadoBodegas: Bodega[] = resBodegas.ok ? await resBodegas.json() : []
        setBodegas(listadoBodegas)
        if (resProveedores.ok) setProveedores(await resProveedores.json())

        // Preselección: solo si no hay borrador con bodega elegida.
        const borrador = leerBorrador(user?.id)
        const hayBodegaEnBorrador = tieneDatos(borrador) && !!borrador?.bodegaId
        if (!hayBodegaEnBorrador) {
          const ultima = window.localStorage.getItem(LAST_BODEGA_KEY)
          const coincidencia = ultima
            ? listadoBodegas.find((b) => b.id === ultima)
            : undefined
          if (coincidencia) setBodegaId(coincidencia.id)
          else if (listadoBodegas.length === 1) setBodegaId(listadoBodegas[0].id)
        }
      } catch (error) {
        if (!cancelado) console.error("💥 Error cargando catálogos de ingreso:", error)
      } finally {
        if (!cancelado) setLoadingCatalogos(false)
      }
    }
    loadData()
    return () => {
      cancelado = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!loadingCatalogos) restauracionLista.current = true
  }, [loadingCatalogos])

  // ============================================================
  // Búsqueda async de productos
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
  // Derivados de cabecera / validaciones
  // ============================================================
  const bodegaSeleccionada = useMemo(
    () => bodegas.find((b) => b.id === bodegaId) ?? null,
    [bodegas, bodegaId]
  )
  const proveedorSeleccionado = useMemo(
    () => proveedores.find((p) => p.id === proveedorId) ?? null,
    [proveedores, proveedorId]
  )

  const esFactura = tipoComprobante === "FACTURA"

  /** Paso 1: bodega + factura; proveedor obligatorio solo en FACTURA. */
  const paso1Completo =
    bodegaId !== "" &&
    factura.trim() !== "" &&
    (!esFactura || proveedorId !== "")

  /** Hay ítems sin productoId o marcados para revisión. */
  const tieneItemsSinVincular = useMemo(
    () => items.some((i) => i.productoId === null || i.requiereRevision),
    [items]
  )

  /** Paso 2 completo: al menos un ítem, todos con cantidad > 0 y costos válidos. */
  const paso2Completo =
    items.length > 0 &&
    !tieneItemsSinVincular &&
    items.every((i) => i.cantidad > 0 && i.costoTotal >= 0)

  const todoListo = paso1Completo && paso2Completo

  const totalQ = useMemo(
    () => items.reduce((acc, i) => acc + i.costoTotal, 0),
    [items]
  )
  const totalUnidades = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  )

  // ============================================================
  // OCR
  // ============================================================
  const aplicarOcr = useCallback(
    (result: OcrParseResult) => {
      if (result.fecha) setFecha(result.fecha)
      if (result.tipoComprobante) setTipoComprobante(result.tipoComprobante)
      if (result.proveedorId) setProveedorId(result.proveedorId)
      if (result.serie) setSerie(result.serie)
      if (result.factura) setFactura(result.factura)
      if (result.uuid) setUuid(result.uuid)
      if (result.observaciones) setObservaciones(result.observaciones)

      if (result.items.length > 0) {
        const nuevos: ItemIngreso[] = result.items.map((it) => ({
          key: generarKey(),
          productoId: it.productoId,
          nombre: it.nombre,
          codigo: it.codigo,
          unidad: it.unidad,
          cantidad: it.cantidad > 0 ? it.cantidad : 1,
          costoUnitario: it.costoUnitario,
          costoTotal: it.costoTotal,
          origen: "ocr",
          // Revisión si el backend lo pide, no hay producto, o hay candidatos
          // pendientes de confirmar (requiereRevision explícito manda).
          requiereRevision: it.requiereRevision || it.productoId === null,
          ...(it.nivelConfianza !== undefined ? { nivelConfianza: it.nivelConfianza } : {}),
          ...(it.candidatos.length > 0 ? { candidatos: it.candidatos } : {}),
        }))
        setItems(nuevos)
      }

      // Mensajes informativos del backend (advertencias / revisión manual).
      const avisos: string[] = []
      if (result.requiereRevisionManual) {
        avisos.push("El documento requiere revisión manual de los datos detectados.")
      }
      if (result.advertencias.length > 0) {
        avisos.push(...result.advertencias)
      }
      if (avisos.length > 0) {
        setOcrInformacion(avisos.join(" · "))
      }
      setOcrAplicado(true)
    },
    []
  )

  /**
   * Ejecuta el escaneo OCR. Devuelve el resultado parseado o null si falla.
   * - 404 → motor OCR no desplegado: mensaje amigable (no es error fatal).
   * - otros errores → mensaje de error.
   */
  const escanearDocumento = useCallback(
    async (archivo: File): Promise<OcrParseResult | null> => {
      setScanning(true)
      setOcrError(null)
      setOcrInformacion(null)
      try {
        // Se envía el proveedorId actual (si ya se eligió) como pista al OCR.
        const res = await movimientosService.escanear(archivo, proveedorId)
        const payload = await res.json().catch(() => null)
        const result = parseOcrResponse(payload, proveedores)
        aplicarOcr(result)
        return result
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setOcrInformacion(
            "El escaneo automático aún no está disponible en este servidor. Puedes seguir registrando el ingreso manualmente.",
          )
          return null
        }
        const mensaje =
          error instanceof Error ? error.message : "No se pudo procesar la imagen."
        setOcrError(mensaje)
        return null
      } finally {
        setScanning(false)
      }
    },
    [proveedores, proveedorId, aplicarOcr]
  )

  const descartarOcrMensaje = useCallback(() => {
    setOcrInformacion(null)
    setOcrError(null)
  }, [])

  // ============================================================
  // Mutaciones de la lista de ítems
  // ============================================================
  const agregarItem = useCallback((item: ItemIngreso) => {
    setItems((prev) => [...prev, item])
  }, [])

  const actualizarItem = useCallback((key: string, item: ItemIngreso) => {
    setItems((prev) => prev.map((i) => (i.key === key ? item : i)))
  }, [])

  const eliminarItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  /** Edición rápida inline de cantidad (recalcula costo unitario/total). */
  const actualizarCantidadItem = useCallback((key: string, nuevaCantidad: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i
        const cantidad = Number.isFinite(nuevaCantidad)
          ? Math.max(CANTIDAD_MINIMA, nuevaCantidad)
          : CANTIDAD_MINIMA
        const costoUnitario = cantidad > 0 ? i.costoTotal / cantidad : 0
        return { ...i, cantidad, costoUnitario }
      })
    )
  }, [])

  /** Edición rápida inline de costo total (recalcula costo unitario). */
  const actualizarCostoItem = useCallback((key: string, nuevoCostoTotal: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i
        const costoTotal = Number.isFinite(nuevoCostoTotal)
          ? Math.max(0, nuevoCostoTotal)
          : 0
        const costoUnitario = i.cantidad > 0 ? costoTotal / i.cantidad : 0
        return { ...i, costoTotal, costoUnitario }
      })
    )
  }, [])

  /**
   * Vincula un ítem OCR a un candidato sugerido por el propio OCR en 1 clic.
   * El candidato trae id/nombre/codigo; asumimos la unidad detectada del ítem.
   */
  const vincularCandidato = useCallback(
    (key: string, candidato: CandidatoProducto) => {
      setItems((prev) =>
        prev.map((i) =>
          i.key === key
            ? {
                ...i,
                productoId: candidato.id,
                nombre: candidato.nombre || i.nombre,
                codigo: candidato.codigo || i.codigo,
                origen: "manual",
                requiereRevision: false,
                candidatos: undefined,
              }
            : i
        )
      )
    },
    []
  )

  /** Vincula un ítem OCR (sin productoId) a un producto existente. */
  const vincularItem = useCallback((key: string, producto: ProductoResult) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              productoId: producto.id,
              nombre: producto.nombre || i.nombre,
              codigo: producto.codigo || i.codigo,
              unidad: producto.unidad?.abreviatura || i.unidad,
              origen: "manual",
              requiereRevision: false,
            }
          : i
      )
    )
  }, [])

  // ============================================================
  // Reset / borrador
  // ============================================================
  const resetearFormulario = useCallback(() => {
    if (user?.id) window.localStorage.removeItem(draftKey(user.id))
    setBodegaId("")
    setFecha(hoyISO())
    setTipoComprobante("FACTURA")
    setProveedorId("")
    setSerie("")
    setFactura("")
    setUuid("")
    setObservaciones("")
    setItems([])
    setPaso(0)
    setErrorEnvio(null)
    setResultado(null)
    setBorradorRecuperado(false)
    setOcrAplicado(false)
    setOcrError(null)
    setOcrInformacion(null)
  }, [user?.id])

  const descartarBorrador = useCallback(() => {
    resetearFormulario()
  }, [resetearFormulario])

  // ============================================================
  // Submit
  // ============================================================
  const enviarIngreso = useCallback(async (): Promise<IngresoCreado | null> => {
    if (!todoListo) return null
    if (tieneItemsSinVincular) {
      setErrorEnvio("Hay ítems sin vincular a un producto. Resuélvelos antes de enviar.")
      return null
    }

    setEnviando(true)
    setErrorEnvio(null)

    try {
      const payload: IngresoPayload = {
        bodegaId,
        proveedorId: proveedorId || null,
        fecha,
        tipoComprobante,
        factura: factura.trim(),
        serie: serie.trim(),
        uuid: esFactura ? uuid.trim() : "",
        observaciones: observaciones.trim(),
        // El backend guarda `costo` directamente en documento_item.costounit
        // (costo UNITARIO) y multiplica por cantidad al calcular el subtotal.
        // Por eso se envía el costo unitario, nunca el total de la línea.
        items: items.map((i) => ({
          productoId: i.productoId as string,
          cantidad: i.cantidad,
          costo:
            i.cantidad > 0
              ? Number((i.costoTotal / i.cantidad).toFixed(4))
              : 0,
        })),
      }

      const creado = await movimientosService.crearIngreso(payload)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_BODEGA_KEY, bodegaId)
      }
      if (user?.id) window.localStorage.removeItem(draftKey(user.id))

      setResultado(creado)
      return creado
    } catch (error) {
      const mensaje =
        error instanceof FacturaDuplicadaError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Error al registrar el ingreso."
      setErrorEnvio(mensaje)
      return null
    } finally {
      setEnviando(false)
    }
  }, [
    todoListo,
    tieneItemsSinVincular,
    bodegaId,
    proveedorId,
    fecha,
    tipoComprobante,
    factura,
    serie,
    uuid,
    observaciones,
    esFactura,
    items,
    user?.id,
  ])

  return {
    // Catálogos
    bodegas,
    proveedores,
    loadingCatalogos,
    bodegaSeleccionada,
    proveedorSeleccionado,
    // Cabecera
    bodegaId,
    setBodegaId,
    fecha,
    setFecha,
    tipoComprobante,
    setTipoComprobante,
    esFactura,
    proveedorId,
    setProveedorId,
    serie,
    setSerie,
    factura,
    setFactura,
    uuid,
    setUuid,
    observaciones,
    setObservaciones,
    // Navegación
    paso,
    setPaso,
    // Ítems
    items,
    agregarItem,
    actualizarItem,
    eliminarItem,
    actualizarCantidadItem,
    actualizarCostoItem,
    vincularItem,
    vincularCandidato,
    buscarProductos,
    // OCR
    scanning,
    escanearDocumento,
    ocrInformacion,
    ocrError,
    ocrAplicado,
    descartarOcrMensaje,
    // Derivados
    totalQ,
    totalUnidades,
    tieneItemsSinVincular,
    paso1Completo,
    paso2Completo,
    todoListo,
    // Borrador
    borradorRecuperado,
    descartarBorrador,
    resetearFormulario,
    // Submit
    enviando,
    errorEnvio,
    resultado,
    enviarIngreso,
  }
}

export type NuevoIngresoController = ReturnType<typeof useNuevoIngreso>
