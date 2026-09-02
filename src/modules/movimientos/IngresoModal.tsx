// src/modules/movimientos/IngresoModal.tsx
import {
  Building2, Calculator,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Loader2,
  Package,
  Plus,
  PlusCircle,
  Receipt,
  Save,
  Trash2,
  User,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { catalogosService } from "../../services/catalogosService";
import BuscadorSelect, { type BuscadorOption } from "../../components/ui/BuscadorSelect";

// 👇 IMPORTANTE: Importamos el modal de crear producto
// Asegúrate que la ruta sea correcta según tu estructura de carpetas
import CrearProductoModal from "../inventario/components/CrearProductoModal";

interface IngresoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Bodega = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string; nit: string };

type ProductoResult = { 
    id: string; 
    nombre: string; 
    codigo: string; 
    precioref?: number; 
    unidad: { abreviatura: string } 
};

type ItemIngreso = {
  productoId: string | null;
  nombre: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  esLibre?: boolean;
  productoCodigo?: string;
};

const obtenerValor = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const normalizarTexto = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizarNit = (value: unknown) => {
  return normalizarTexto(value).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

const isValidScannerImage = (file: File) => {
  const validTypes = ["image/png", "image/jpeg", "image/jpg"];
  return validTypes.includes(file.type) || /\.(png|jpe?g)$/i.test(file.name);
};

const normalizarFecha = (value: unknown) => {
  if (!value) return "";
  const fechaTexto = normalizarTexto(value);
  if (!fechaTexto) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) return fechaTexto;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaTexto)) {
    const [dia, mes, anio] = fechaTexto.split("/");
    const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString().split("T")[0];
  }

  const fecha = new Date(fechaTexto);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toISOString().split("T")[0];
};

const normalizarUnidad = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return normalizarTexto(item.abreviatura ?? item.nombre ?? item.sigla ?? item.unidad ?? "");
  }
  return normalizarTexto(value);
};

const buscarProductoPorIdLocal = async (productoId: string): Promise<ProductoResult | null> => {
  if (!productoId) return null;

  try {
    const resultados = await catalogosService.buscarProductos(String(productoId));
    if (!Array.isArray(resultados)) return null;

    const match = resultados.find((producto) => {
      const idCoincide = String(producto.id) === String(productoId);
      const codigoCoincide = String(producto.codigo ?? "") === String(productoId);
      return idCoincide || codigoCoincide;
    });

    if (match) return match;
    return null;
  } catch (error) {
    console.warn("No se pudo resolver producto por ID en catálogo local:", error);
    return null;
  }
};

export function IngresoModal({ onClose, onSuccess }: IngresoModalProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const scannerCameraInputRef = useRef<HTMLInputElement>(null);
  
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerPreview, setScannerPreview] = useState<string | null>(null);
  const [scannerFile, setScannerFile] = useState<File | null>(null);
  
  const [successData, setSuccessData] = useState<{ codigo: string } | null>(null);

  // Datos de Catálogos
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Paso 1: Encabezado
  const [selectedBodega, setSelectedBodega] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState("");

  // Datos Comprobante
  const [tipoComprobante, setTipoComprobante] = useState<"FACTURA" | "RECIBO">("FACTURA");
  const [factura, setFactura] = useState("");
  const [serie, setSerie] = useState("");
  const [uuid, setUuid] = useState("");

  // Paso 2: Items
  const [items, setItems] = useState<ItemIngreso[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ocrConfirmado, setOcrConfirmado] = useState(false);
  
  // 👇 ESTADO PARA EL MODAL DE CREAR PRODUCTO
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Formulario Producto
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoResult | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [tempCant, setTempCant] = useState<number | string>(1);
  const [tempCostoTotal, setTempCostoTotal] = useState<number | string>(0);

  // Carga inicial
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [listaBodegas, listaProveedores] = await Promise.all([
          catalogosService.getBodegas(),
          catalogosService.getProveedores()
        ]);
        setBodegas(listaBodegas);
        setProveedores(listaProveedores);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const resetScannerSelection = () => {
    setScannerFile(null);
    setScannerError(null);
    setScannerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (scannerInputRef.current) scannerInputRef.current.value = "";
    if (scannerCameraInputRef.current) scannerCameraInputRef.current.value = "";
  };

  const handleScannerSelection = useCallback((file?: File) => {
    if (!file) return;
    if (isScanning) return;

    if (!isValidScannerImage(file)) {
      setScannerError("Solo se permiten imágenes en formato PNG o JPG.");
      setShowScannerModal(true);
      return;
    }

    setScannerError(null);
    setScannerFile(file);
    setShowScannerModal(true);
    setScannerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, [isScanning]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isScanning) return;
      const file = e.clipboardData?.files?.[0];
      if (!file) return;
      if (isValidScannerImage(file)) {
        e.preventDefault();
        handleScannerSelection(file);
        setShowScannerModal(true);
      } else {
        e.preventDefault();
        setScannerError("Solo se permiten imágenes en formato PNG o JPG.");
        setShowScannerModal(true);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleScannerSelection, isScanning]);

  const procesarDocumento = async (file: File) => {
    if (!file || isScanning) return;
    if (!isValidScannerImage(file)) {
      setScannerError("Solo se permiten imágenes en formato PNG o JPG.");
      setShowScannerModal(true);
      return;
    }

    setIsScanning(true);
    setScannerError(null);
    const formData = new FormData();
    formData.append("documento", file);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movimientos/escanear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      console.log("Respuesta OCR:", data);

      if (!res.ok) {
        throw new Error(data?.message || "Error al escanear el documento");
      }

      const payload = data?.data ?? data?.resultado ?? data?.documento ?? data ?? {};

      const rawProveedor = obtenerValor(
        (payload as Record<string, unknown>) ?? {},
        [
          "proveedor",
          "proveedorData",
          "nombreProveedor",
          "emisor",
          "nombre",
          "proveedorNombre",
          "proveedorInfo",
          "vendor",
          "supplier"
        ]
      );

      const rawItems = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.productos)
          ? payload.productos
          : Array.isArray(payload?.lineas)
            ? payload.lineas
            : Array.isArray(payload?.detalle)
              ? payload.detalle
              : [];

      const fechaEscaneada = normalizarFecha(
        obtenerValor((payload as Record<string, unknown>) ?? {}, [
          "fecha",
          "fechaEmision",
          "fechaFactura",
          "fechaDocumento"
        ])
      );
      if (fechaEscaneada) setFecha(fechaEscaneada);

      const tipoEscaneado = normalizarTexto(
        obtenerValor((payload as Record<string, unknown>) ?? {}, [
          "tipo",
          "tipoComprobante",
          "tipoDocumento"
        ])
      ).toLowerCase();

      if (tipoEscaneado === "factura") {
        setTipoComprobante("FACTURA");
      } else if (tipoEscaneado === "recibo") {
        setTipoComprobante("RECIBO");
      }

      const serieEscaneada = obtenerValor((payload as Record<string, unknown>) ?? {}, ["serie"]);
      if (serieEscaneada !== "") setSerie(String(serieEscaneada));

      const numeroFactura = obtenerValor((payload as Record<string, unknown>) ?? {}, [
        "numero",
        "factura",
        "numeroDocumento",
        "numeroFactura"
      ]);
      if (numeroFactura !== "") setFactura(String(numeroFactura));

      const uuidEscaneado = obtenerValor((payload as Record<string, unknown>) ?? {}, ["uuid"]);
      if (uuidEscaneado !== "") setUuid(String(uuidEscaneado));

      const observacionesOCR = obtenerValor((payload as Record<string, unknown>) ?? {}, [
        "observaciones",
        "notas",
        "descripcion",
        "comentarios"
      ]);
      if (observacionesOCR !== "") setObs(String(observacionesOCR));

      const proveedorId = obtenerValor((payload as Record<string, unknown>) ?? {}, [
        "proveedorId",
        "idProveedor",
        "vendorId",
        "supplierId"
      ]);

      const proveedorPayload = (rawProveedor && typeof rawProveedor === "object")
        ? (rawProveedor as Record<string, unknown>)
        : null;

      const proveedorObjectId = proveedorPayload?.id ?? proveedorPayload?.proveedorId ?? proveedorPayload?.idProveedor ?? "";
      const proveedorNombreOCR = proveedorPayload?.nombre ?? proveedorPayload?.nombreProveedor ?? proveedorPayload?.emisor ?? "";
      const proveedorNitOCR = proveedorPayload?.nit ?? proveedorPayload?.NIT ?? "";

      setSelectedProveedor("");

      if (proveedorId && String(proveedorId).trim() !== "") {
        const proveedorCoincidente = proveedores.find((proveedor) => String(proveedor.id) === String(proveedorId));
        if (proveedorCoincidente) {
          setSelectedProveedor(proveedorCoincidente.id);
        }
      } else if (proveedorObjectId && String(proveedorObjectId).trim() !== "") {
        const proveedorCoincidente = proveedores.find((proveedor) => String(proveedor.id) === String(proveedorObjectId));
        if (proveedorCoincidente) {
          setSelectedProveedor(proveedorCoincidente.id);
        }
      } else {
        const nombreStr = normalizarTexto(proveedorNombreOCR);
        const nitStr = normalizarNit(proveedorNitOCR);

        if (nombreStr || nitStr) {
          const proveedorCoincidente = proveedores.find((proveedor) => {
            const nitProveedorActual = normalizarNit(proveedor.nit);
            const nombreProveedorActual = normalizarTexto(proveedor.nombre).toLowerCase();
            const nombreOCR = nombreStr.toLowerCase();
            const nitOCR = normalizarNit(nitStr);

            if (nitOCR && nitProveedorActual && nitOCR === nitProveedorActual) return true;
            if (nombreOCR && nombreProveedorActual.includes(nombreOCR)) return true;
            return false;
          });

          if (proveedorCoincidente) {
            setSelectedProveedor(proveedorCoincidente.id);
          }
        }
      }

      const itemsEscaneados: ItemIngreso[] = [];

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        for (const item of rawItems) {
          const itemData = (item ?? {}) as Record<string, unknown>;

          const cantidad = Number(
            itemData.cantidad ??
            itemData.qty ??
            itemData.unidades ??
            itemData.cant ??
            0
          );

          if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

          const precioUnitario = Number(
            itemData.precioUnitario ??
            itemData.precio_unitario ??
            itemData.precio ??
            itemData.unitario ??
            itemData.costoUnitario ??
            itemData.precioBase ??
            0
          );

          const subtotal = Number(
            itemData.subtotal ??
            itemData.total ??
            itemData.monto ??
            itemData.precioTotal ??
            itemData.costoTotal ??
            itemData.totalLinea ??
            0
          );

          const productoId = itemData.productoId ?? itemData.productoid ?? null;
          const tieneProductoId = productoId !== null && productoId !== undefined && String(productoId).trim() !== "";
          const esLibre = itemData.esLibre === true || !tieneProductoId;

          const descripcion = normalizarTexto(
            itemData.descripcion ??
            itemData.nombre ??
            itemData.producto ??
            itemData.productoNombre ??
            itemData.detalle ??
            itemData.concepto ??
            ""
          );

          const nombreProducto = normalizarTexto(
            itemData.productoNombre ??
            itemData.nombre ??
            itemData.descripcion ??
            itemData.producto ??
            ""
          );

          const productoCodigo = normalizarTexto(
            itemData.productoCodigo ??
            itemData.codigo ??
            itemData.code ??
            ""
          );

          const unidad = normalizarUnidad(
            itemData.unidad ??
            itemData.unidadMedida ??
            itemData.unidadNombre ??
            itemData.medida ??
            ""
          );

          const costoTotal = Number.isFinite(subtotal) && subtotal > 0
            ? subtotal
            : (Number.isFinite(precioUnitario) && precioUnitario > 0 ? precioUnitario * cantidad : 0);
          const costoUnitarioCalc = Number.isFinite(precioUnitario) && precioUnitario > 0
            ? precioUnitario
            : (costoTotal > 0 && cantidad > 0 ? costoTotal / cantidad : 0);

          if (tieneProductoId) {
            const productoLocal = await buscarProductoPorIdLocal(String(productoId));
            const productoFinal = productoLocal ?? {
              id: String(productoId),
              nombre: nombreProducto || descripcion || "Producto detectado",
              codigo: productoCodigo || "",
              unidad: { abreviatura: unidad || "" },
              precioref: costoUnitarioCalc || 0
            };

            itemsEscaneados.push({
              productoId: String(productoId),
              nombre: productoFinal.nombre,
              unidad: productoFinal.unidad?.abreviatura || unidad || "",
              cantidad,
              costoUnitario: costoUnitarioCalc,
              costoTotal,
              esLibre: false,
              productoCodigo: productoFinal.codigo
            });
            continue;
          }

          if (esLibre) {
            itemsEscaneados.push({
              productoId: null,
              nombre: nombreProducto || descripcion || "Producto libre",
              unidad: unidad || "",
              cantidad,
              costoUnitario: costoUnitarioCalc,
              costoTotal,
              esLibre: true,
              productoCodigo: productoCodigo || ""
            });
            continue;
          }
        }
      }

      setItems(itemsEscaneados);
      setShowAddForm(false);
      setOcrConfirmado(false);
      // El usuario debe revisar y confirmar el OCR antes de avanzar al paso 2.
      // No forzar la navegación automática después del escaneo.
    } catch (error) {
      console.error("Error OCR:", error);
      setScannerError("No se pudo procesar la imagen. Verifica el archivo o intenta nuevamente.");
      alert("Error al escanear documento: " + error);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (scannerInputRef.current) {
        scannerInputRef.current.value = "";
      }
      if (scannerCameraInputRef.current) {
        scannerCameraInputRef.current.value = "";
      }
    }
  };

  const resetFormularioProducto = () => {
    setProdSeleccionado(null);
    setTempCant(1);
    setTempCostoTotal(0);
    setEditingItemIndex(null);
    setShowAddForm(false);
  };

  const buscarOpcionesProducto = async (termino: string): Promise<BuscadorOption<ProductoResult>[]> => {
    try {
      const productos = await catalogosService.buscarProductos(termino);
      return productos.map((producto: ProductoResult) => ({
        label: `${producto.nombre} (${producto.codigo})`,
        value: producto.id,
        data: producto
      }));
    } catch (error) {
      console.error("Error buscando productos:", error);
      return [];
    }
  };

  const handleEditarItem = (index: number) => {
    const itemActual = items[index];
    if (!itemActual) return;

    const productoBase: ProductoResult = {
      id: itemActual.productoId ?? "",
      nombre: itemActual.nombre,
      codigo: itemActual.productoCodigo ?? "",
      unidad: { abreviatura: itemActual.unidad || "" },
      precioref: itemActual.costoUnitario
    };

    setEditingItemIndex(index);
    setProdSeleccionado(productoBase);
    setTempCant(itemActual.cantidad);
    setTempCostoTotal(itemActual.costoTotal);
    setShowAddForm(true);
  };

  // Agregar Item
  const handleAgregarItem = () => {
    const cantNum = Number(tempCant);
    const costoTotalNum = Number(tempCostoTotal);

    if (!prodSeleccionado || isNaN(cantNum) || cantNum < 0.0001 || isNaN(costoTotalNum) || costoTotalNum < 0) {
        return; 
    }

    const costoUnitarioCalc = costoTotalNum > 0 ? (costoTotalNum / cantNum) : 0;

    const nuevo: ItemIngreso = {
      productoId: prodSeleccionado.id || null,
      nombre: prodSeleccionado.nombre,
      unidad: prodSeleccionado.unidad?.abreviatura || "",
      cantidad: cantNum,
      costoUnitario: costoUnitarioCalc, 
      costoTotal: costoTotalNum,
      productoCodigo: prodSeleccionado.codigo || undefined
    };

    setItems((prev) => {
      if (editingItemIndex !== null) {
        return prev.map((item, index) => index === editingItemIndex ? nuevo : item);
      }
      return [...prev, nuevo];
    });

    resetFormularioProducto();
  };

  const handleEliminarItem = (index: number) => {
    const nueva = [...items];
    nueva.splice(index, 1);
    setItems(nueva);
    if (editingItemIndex === index) {
      resetFormularioProducto();
    }
  };

  // Finalizar
  const handleFinalizar = async () => {
    if (showAddForm) return;

    setGuardando(true);
    try {
      const payload = {
        bodegaId: selectedBodega,
        proveedorId: selectedProveedor || null,
        fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
        tipoComprobante,
        factura,
        serie: tipoComprobante === "FACTURA" ? serie : "",
        uuid: tipoComprobante === "FACTURA" ? uuid : "",
        observaciones: obs,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          costo: i.costoUnitario 
        }))
      };

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movimientos/ingreso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      setSuccessData({ 
          codigo: data.documento.consecutivo || "INGRESO REGISTRADO" 
      });

    } catch (error) {
      alert("Error al guardar: " + error);
    } finally {
      setGuardando(false);
    }
  };

  const totalIngreso = items.reduce((acc, item) => acc + item.costoTotal, 0);
  const unitarioPreview = (Number(tempCostoTotal) > 0 && Number(tempCant) > 0) 
      ? (Number(tempCostoTotal) / Number(tempCant)) 
      : 0;

  if (successData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="text-slate-700 w-10 h-10" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Ingreso Exitoso!</h2>
          <p className="text-slate-500 mb-6 text-sm">
            El inventario ha sido actualizado.
            <br/>
            Referencia: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded mt-2 inline-block border border-slate-200">{successData.codigo}</span>
          </p>
          <button 
            onClick={() => { onSuccess(); onClose(); }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-300"
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (isScanning) return;
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (isValidScannerImage(file)) {
          handleScannerSelection(file);
        } else {
          setScannerError("Solo se permiten imágenes en formato PNG o JPG.");
          setShowScannerModal(true);
        }
      }}
    >
      
      <div className="bg-slate-50 w-full h-full sm:h-[85vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:px-6 flex justify-between items-center text-white shrink-0 shadow-md z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Nuevo Ingreso</h2>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
               <span className={`px-2 py-0.5 rounded-full ${step === 1 ? 'bg-white/20 text-white' : ''}`}>Paso 1</span>
               <ChevronLeft size={12}/>
               <span className={`px-2 py-0.5 rounded-full ${step === 2 ? 'bg-white/20 text-white' : ''}`}>Paso 2</span>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth bg-slate-50">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                <Loader2 className="animate-spin text-slate-600" size={48}/>
                <p className="text-sm font-medium text-slate-500">Cargando catálogos...</p>
             </div>
          ) : (
            <>
              {/* === PASO 1: GENERAL === */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                   
                   {/* Sección Bodega y Fecha */}
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <h3 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <Building2 size={16}/> Destino y Fecha
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bodega Destino *</label>
                           <select 
                             value={selectedBodega}
                             onChange={(e) => setSelectedBodega(e.target.value)}
                             className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 focus:bg-white transition-all"
                           >
                             <option value="">-- Seleccione --</option>
                             {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha de Ingreso</label>
                           <div className="relative">
                               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                               <input 
                                 type="date" 
                                 value={fecha}
                                 onChange={(e) => setFecha(e.target.value)}
                                 className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 focus:bg-white transition-all"
                               />
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Sección Proveedor y Documento */}
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <h3 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <User size={16}/> Proveedor y Documentación
                      </h3>

                      {(selectedProveedor || factura || serie || uuid) && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 font-medium">
                          {selectedProveedor && (
                            <span className="inline-flex items-center mr-3">Proveedor detectado: {proveedores.find((p) => p.id === selectedProveedor)?.nombre || "seleccionado"}</span>
                          )}
                          {(factura || serie || uuid) && (
                            <span className="inline-flex items-center">Factura: {serie ? `${serie}-` : ""}{factura || "documento"}{uuid ? ` · UUID: ${uuid}` : ""}</span>
                          )}
                        </div>
                      )}
                      
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Proveedor *</label>
                         <BuscadorSelect<Proveedor>
                           options={proveedores.map((proveedor) => ({
                             label: `${proveedor.nombre} (NIT: ${proveedor.nit || "C/F"})`,
                             value: proveedor.id,
                             data: proveedor
                           }))}
                           value={proveedores
                             .filter((proveedor) => proveedor.id === selectedProveedor)
                             .map((proveedor) => ({
                               label: `${proveedor.nombre} (NIT: ${proveedor.nit || "C/F"})`,
                               value: proveedor.id,
                               data: proveedor
                             }))[0] ?? null}
                           onChange={(option) => setSelectedProveedor(option?.value ?? "")}
                           placeholder="Seleccione Proveedor..."
                           isClearable
                           noOptionsMessage="No se encontraron proveedores"
                         />
                      </div>

                      <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-200">
                          <button 
                            onClick={() => setTipoComprobante("FACTURA")}
                            className={`flex-1 p-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                tipoComprobante === "FACTURA" 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                             <FileText size={16} /> Factura
                          </button>
                          <button 
                            onClick={() => setTipoComprobante("RECIBO")}
                            className={`flex-1 p-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                tipoComprobante === "RECIBO" 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                             <Receipt size={16} /> Recibo / Otro
                          </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {tipoComprobante === "FACTURA" && (
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Serie</label>
                                <input 
                                  type="text" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ej. A"
                                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                             </div>
                          )}
                          <div className={tipoComprobante === "RECIBO" ? "sm:col-span-3" : "sm:col-span-2"}>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                  {tipoComprobante === "FACTURA" ? "Número *" : "No. Documento *"}
                              </label>
                              <input 
                                type="text" value={factura} onChange={(e) => setFactura(e.target.value)} placeholder="Ej. 12345678"
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                              />
                          </div>
                          {tipoComprobante === "FACTURA" && (
                             <div className="sm:col-span-3">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UUID (SAT)</label>
                                <input 
                                  type="text" value={uuid} onChange={(e) => setUuid(e.target.value)} placeholder="Código de autorización..."
                                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-mono"
                                />
                             </div>
                          )}
                      </div>

                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Observaciones</label>
                         <textarea 
                           value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Notas opcionales..."
                           className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* === PASO 2: ITEMS === */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300 h-full flex flex-col">
                  
                  {/* Lista Vacía */}
                  {!showAddForm && items.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                           <Package className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg">Sin productos</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Registra los productos según el total de la factura.</p>
                        <button onClick={() => setShowAddForm(true)} className="bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-200 flex items-center gap-2">
                           <Plus size={18}/> Agregar Item
                        </button>
                      </div>
                  )}

                  {/* Formulario Agregar */}
                  {showAddForm && (
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 space-y-4 relative ring-4 ring-slate-100">
                       <button onClick={() => setShowAddForm(false)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>
                       <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 mb-4">Detalle del Producto</h3>

                       {/* Buscador */}
                       {!prodSeleccionado ? (
                         <div className="relative">
                            {/* 🆕 AQUÍ ESTÁ EL ACCESO DIRECTO PARA CREAR PRODUCTO */}
                            <div className="flex justify-between items-end mb-1">
                               <label className="text-xs font-bold text-slate-500 uppercase block">Buscar Producto</label>
                               <button 
                                 onClick={() => setShowCreateProduct(true)}
                                 className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 hover:bg-indigo-50 px-2 py-0.5 rounded transition"
                               >
                                 <PlusCircle size={14}/> Crear Nuevo
                               </button>
                            </div>

                            <BuscadorSelect<ProductoResult>
                              loadOptions={buscarOpcionesProducto}
                              value={null}
                              onChange={(option) => {
                                const producto = option?.data;
                                if (producto) {
                                  setProdSeleccionado(producto);
                                  setTempCostoTotal(0);
                                }
                              }}
                              placeholder="Nombre o código..."
                              isClearable={false}
                              noOptionsMessage="No se encontraron productos"
                            />
                         </div>
                       ) : (
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                             <div className="flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-full text-slate-600 shadow-sm"><CheckCircle2 size={20}/></div>
                                 <div>
                                     <span className="font-bold text-slate-900 text-sm block">{prodSeleccionado.nombre}</span>
                                     <span className="text-xs text-slate-500 font-medium">{prodSeleccionado.codigo}</span>
                                 </div>
                             </div>
                             <button onClick={() => setProdSeleccionado(null)} className="text-slate-400 hover:text-red-500 text-xs font-bold px-3 py-1 hover:bg-white rounded-lg transition">Cambiar</button>
                          </div>
                       )}

                       {/* Inputs Cantidad y Costo */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad ({prodSeleccionado?.unidad.abreviatura})</label>
                              <input 
                                type="number" min="0.1" value={tempCant} onChange={(e) => setTempCant(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-bold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Costo Total (Q)</label>
                              <div className="relative">
                                <input 
                                    type="number" min="0" value={tempCostoTotal} onChange={(e) => setTempCostoTotal(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-bold text-slate-800 pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Calculator size={16}/></span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-medium mt-1 text-right">
                                Unitario calc: Q{unitarioPreview.toFixed(4)}
                              </p>
                           </div>
                       </div>
                       
                       <div className="pt-2">
                           <button 
                             onClick={handleAgregarItem} 
                             disabled={!prodSeleccionado || Number(tempCant) < 0.0001} 
                             className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-slate-200"
                           >
                              {editingItemIndex !== null ? "Guardar Cambios" : "Confirmar Item"}
                           </button>
                       </div>
                    </div>
                  )}

                  {/* Lista de Items Agregados */}
                  {!showAddForm && items.length > 0 && (
                    <div className="space-y-3 pb-20 sm:pb-0">
                       <div className="flex justify-between items-center px-1">
                          <h3 className="font-bold text-slate-700 text-sm">Productos ({items.length})</h3>
                          <button onClick={() => setShowAddForm(true)} className="text-slate-600 text-xs font-bold hover:bg-white px-2 py-1 rounded transition flex items-center gap-1 border border-transparent hover:border-slate-200">
                             <Plus size={14}/> Agregar otro
                          </button>
                       </div>

                       <div className="grid gap-3">
                          {items.map((item, idx) => (
                             <div
                               key={idx}
                               onClick={() => handleEditarItem(idx)}
                               className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-slate-300 hover:shadow-md transition-all"
                             >
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                       <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium mr-2">{item.cantidad} {item.unidad}</span>
                                       <span className="text-slate-400 text-[10px]">(Unit: Q{item.costoUnitario.toFixed(2)})</span>
                                    </p>
                                 </div>
                                 <div className="text-right flex items-center gap-3">
                                     <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Línea</p>
                                        <p className="font-bold text-slate-800 text-base">Q{item.costoTotal.toFixed(2)}</p>
                                     </div>
                                     <button
                                       type="button"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleEliminarItem(idx);
                                       }}
                                       className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition ml-2"
                                     >
                                        <Trash2 size={18}/>
                                     </button>
                                 </div>
                             </div>
                          ))}
                          
                          <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg mt-4">
                              <span className="text-sm font-medium text-slate-300">Total Factura</span>
                              <span className="text-xl font-bold">Q{totalIngreso.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Fijo */}
        <div className="p-4 sm:px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center gap-3 shrink-0 z-20">
           {step === 1 && (
             <div className="flex items-center gap-2">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/png,image/jpeg,image/jpg"
                 className="hidden"
                 onChange={(e) => {
                   if (e.target.files?.[0]) handleScannerSelection(e.target.files[0]);
                 }}
               />
               <input
                 ref={scannerInputRef}
                 type="file"
                 accept="image/png,image/jpeg,image/jpg"
                 className="hidden"
                 onChange={(e) => {
                   if (e.target.files?.[0]) handleScannerSelection(e.target.files[0]);
                 }}
               />
               <input
                 ref={scannerCameraInputRef}
                 type="file"
                 accept="image/*"
                 capture="environment"
                 className="hidden"
                 onChange={(e) => {
                   if (e.target.files?.[0]) handleScannerSelection(e.target.files[0]);
                 }}
               />

               <button
                 type="button"
                 onClick={() => setShowScannerModal(true)}
                 disabled={isScanning}
                 className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
               >
                 {isScanning ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16} />}
                 {isScanning ? "Procesando..." : "Escanear"}
               </button>
             </div>
           )}

           {step === 2 ? (
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition">
                 <ChevronLeft size={18}/> Atrás
              </button>
           ) : <div className={step === 1 ? "ml-auto" : ""} />}
           
           {step === 1 ? (
             <button 
               onClick={() => {
                 if (items.length > 0 && !ocrConfirmado) {
                   setOcrConfirmado(true);
                 }
                 setStep(2);
               }} 
               disabled={!selectedBodega || !selectedProveedor || !factura} 
               className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-300 transition-all active:scale-95 ml-auto"
             >
               {items.length > 0 ? "Continuar" : "Siguiente"}
             </button>
           ) : (
             <button 
               onClick={handleFinalizar} 
               disabled={items.length === 0 || guardando || showAddForm} 
               className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 shadow-lg shadow-slate-300 transition-all active:scale-95 ml-auto"
             >
                 {guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                 {showAddForm ? "Termina de agregar..." : "Finalizar Ingreso"}
             </button>
           )}
        </div>
      </div>

      {showScannerModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">OCR</p>
                <h3 className="text-xl font-bold text-slate-800">Escanear documento</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetScannerSelection();
                  setShowScannerModal(false);
                }}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-all"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (isScanning) return;
                const file = e.dataTransfer.files?.[0];
                if (file) handleScannerSelection(file);
              }}
              onClick={() => {
                if (!isScanning) scannerInputRef.current?.click();
              }}
            >
              {scannerPreview ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img src={scannerPreview} alt="Vista previa del documento" className="h-52 w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-slate-600">{scannerFile?.name || "Documento"}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scannerInputRef.current?.click();
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetScannerSelection();
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 rounded-full bg-white p-4 text-slate-600 shadow-sm border border-slate-200">
                    <Camera size={28} />
                  </div>
                  <p className="text-lg font-bold text-slate-800">Arrastra tu factura o recibo aquí</p>
                  <p className="mt-2 text-sm text-slate-500">PNG o JPG</p>
                </div>
              )}
            </div>

            {scannerError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {scannerError}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => scannerCameraInputRef.current?.click()}
                disabled={isScanning}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-sm font-bold transition"
              >
                Tomar Foto
              </button>
              <button
                type="button"
                onClick={() => scannerInputRef.current?.click()}
                disabled={isScanning}
                className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-sm font-bold transition"
              >
                Seleccionar Archivo
              </button>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-100 px-3 py-3 text-center text-xs font-medium text-slate-500 flex items-center justify-center">
                Ctrl + V
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  resetScannerSelection();
                  setShowScannerModal(false);
                }}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!scannerFile || isScanning) return;
                  setShowScannerModal(false);
                  await procesarDocumento(scannerFile);
                }}
                disabled={!scannerFile || isScanning}
                className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 text-sm font-bold transition flex items-center gap-2"
              >
                {isScanning ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                {isScanning ? "Procesando..." : "Procesar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 RENDERIZADO DEL MODAL SECUNDARIO: CREAR PRODUCTO */}
      {showCreateProduct && (
        <CrearProductoModal
          isOpen={showCreateProduct}
          onClose={() => setShowCreateProduct(false)}
          onSuccess={() => {
             // Al tener éxito, solo cerramos. El usuario puede buscar su nuevo producto.
             setShowCreateProduct(false);
          }}
        />
      )}

    </div>
  );
}