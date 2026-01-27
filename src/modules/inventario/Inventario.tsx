import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";
import { 
  Search, 
  Filter, 
  FileText, 
  Package, 
  X,
  AlertCircle,
  ArrowDownLeft, 
  ArrowUpRight,  
  ArrowRightLeft, 
  RefreshCw,       
  CornerDownLeft,
  Loader2
} from "lucide-react";
// 👇 1. IMPORTAMOS EL CONTEXTO
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

// -----------------------------
// Tipos de datos
// -----------------------------
type EstadoStock = "Normal" | "Bajo" | "Crítico";
type EstadoProducto = "ACTIVO" | "INACTIVO";

type ProductoInventario = {
  id: string;
  nombre: string;
  codigo: string;
  detalle: string;
  categoria: string;
  unidad: string;
  stockTotal: string;
  estadoProducto: EstadoProducto;
  estadoStock: EstadoStock;
};

type MovimientoResumenItem = {
  id: string;
  documentoId: string; 
  documentoUuid?: string;
  tipo: string;
  cantidadConSigno: string;
  unidad: string;
  bodega: string;
  lote: string | null;
  fecha: string | null;
};

type DetalleProducto = {
  producto: {
    id: string;
    nombre: string;
    codigo: string;
    detalle: string;
    categoria: string;
    unidad: string;
    estadoProducto: EstadoProducto;
  };
  existenciaTotal: {
    cantidad: number;
    unidad: string;
    texto: string;
    estadoStock: EstadoStock;
  };
  movimientos: MovimientoResumenItem[];
};

type CategoriaFiltro = {
  id: string;
  nombre: string;
};

type MovimientoTipo = "INGRESO" | "SALIDA" | "TRANSFERENCIA" | "AJUSTE" | "DEVOLUCION";
type MovimientoEstado = "BORRADOR" | "APROBADO" | "ANULADO" | "CARGANDO..."; 

type ProductoEnMovimiento = {
  id: string;
  productoNombre: string;
  productoCodigo: string;
  cantidad: string; 
  unidad: string;
  loteCodigo: string | null;
  loteId: string | null;
  fincaNombre: string | null;
};

type MovimientoFullDetalle = {
  id: string;
  codigo: string;
  tipo: MovimientoTipo | string;
  estado: MovimientoEstado;
  fecha: string | null;
  origen: string | null;
  destino: string | null;
  proveedor: string | null;
  solicitante: string | null;
  creador: string | null;
  productos: ProductoEnMovimiento[];
  observacion: string | null;
  cargandoCompleto?: boolean; 
};

// -----------------------------
// Componente Inventario
// -----------------------------
export function Inventario() {
  // 👇 2. OBTENEMOS EL TOKEN Y USUARIO
  const { user, token } = useAuth();
  
  // 👇 3. LÓGICA CORREGIDA: Agregamos "VISOR" aquí
  const puedeVerDetalle = ["ADMIN", "BODEGUERO", "VISOR"].includes(user?.rol || "");

  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [detalleProducto, setDetalleProducto] = useState<DetalleProducto | null>(null);
  const [cargandoDetalleProd, setCargandoDetalleProd] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoFullDetalle | null>(null);
  
  // Filtros
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(""); 
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false);

  const cargarInventario = useCallback(async (silencioso = false) => {
      try {
        if (!silencioso) setCargando(true);
        if (!silencioso) setError(null);

        // 👇 AGREGAMOS HEADERS
        const res = await fetch(`${API_BASE}/api/inventario`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al cargar inventario");
        const json = await res.json();
        setProductos(json.productos ?? []);
      } catch (err: unknown) {
        console.error(err);
        if (!silencioso) {
             const message = err instanceof Error ? err.message : "Error desconocido";
             setError(message);
        }
      } finally {
        if (!silencioso) setCargando(false);
      }
  }, [token]);

  useEffect(() => {
    cargarInventario(); 
    const intervalo = setInterval(() => {
        cargarInventario(true); 
    }, 15000);
    return () => clearInterval(intervalo);
  }, [cargarInventario]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        // 👇 AGREGAMOS HEADERS
        const res = await fetch(`${API_BASE}/api/categorias`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const json = (await res.json()) as { categorias: CategoriaFiltro[] };
        setCategorias(json.categorias ?? []);
      } catch (err) { console.error(err); }
    };
    fetchCategorias();
  }, [token]);

  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase();
    const coincideTexto =
      term.length === 0 ||
      p.nombre.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term);
    const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
    return coincideTexto && coincideCategoria;
  });

  const handleClickProducto = async (producto: ProductoInventario) => {
    if (!puedeVerDetalle) return;

    const [cantidadTexto, unidadTexto] = producto.stockTotal.split(" ");
    const cantidadNum = Number(cantidadTexto.replace(",", ".")) || 0;
    const unidad = unidadTexto ?? producto.unidad;

    setDetalleProducto({
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        detalle: producto.detalle,
        categoria: producto.categoria,
        unidad: producto.unidad,
        estadoProducto: producto.estadoProducto,
      },
      existenciaTotal: {
        cantidad: cantidadNum,
        unidad,
        texto: producto.stockTotal,
        estadoStock: producto.estadoStock,
      },
      movimientos: [], 
    });
    setCargandoDetalleProd(true);

    try {
      // 👇 AGREGAMOS HEADERS
      const res = await fetch(`${API_BASE}/api/inventario/${producto.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al cargar detalle");
      const json = (await res.json()) as DetalleProducto;
      setDetalleProducto(json);
    } catch (err) { console.error(err); } 
    finally { setCargandoDetalleProd(false); }
  };

  const handleOpenMovimiento = async (itemResumen: MovimientoResumenItem) => {
      const esqueleto: MovimientoFullDetalle = {
          id: itemResumen.documentoUuid || itemResumen.documentoId, 
          codigo: itemResumen.documentoId,
          tipo: itemResumen.tipo,
          estado: "CARGANDO...", 
          fecha: itemResumen.fecha,
          origen: null,
          destino: null,
          proveedor: null,
          solicitante: null,
          creador: null,
          productos: [],
          observacion: null, // 👇 PROPIEDAD FALTANTE AGREGADA
          cargandoCompleto: true 
      };

      setMovimientoSeleccionado(esqueleto);

      try {
          const idParaFetch = itemResumen.documentoUuid || itemResumen.documentoId;
          // 👇 AGREGAMOS HEADERS
          const res = await fetch(`${API_BASE}/api/movimientos/${idParaFetch}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error("Error al cargar movimiento");
          
          const data = (await res.json()) as MovimientoFullDetalle;
          setMovimientoSeleccionado({ ...data, cargandoCompleto: false });
      } catch (error) {
          console.error(error);
          setMovimientoSeleccionado(prev => prev ? { ...prev, estado: "ANULADO", cargandoCompleto: false } : null);
          alert("No se pudo cargar el detalle completo del movimiento.");
      }
  };

  const handleExportPdf = () => {
    window.open(`${API_BASE}/api/inventario/pdf`, "_blank");
  };

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventario</h1>
        <p className="text-sm text-slate-500">Gestión de productos y existencias.</p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-xl relative">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMostrandoFiltros((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all shadow-sm ${mostrandoFiltros ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={14} /> Filtros
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
            >
              <FileText size={14} /> Exportar
            </button>
          </div>
        </div>

        {mostrandoFiltros && (
          <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setCategoriaFiltro("")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-medium transition-all",
                  !categoriaFiltro
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaFiltro(cat.nombre)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-medium transition-all",
                    categoriaFiltro === cat.nombre
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        {!cargando && !error && (
            <div className="flex items-center gap-2">
                <SectionTitle title="Productos" />
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{productosFiltrados.length}</span>
            </div>
        )}

        {cargando && <div className="py-20 text-center text-slate-400 text-sm">Cargando inventario...</div>}
        {error && <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">Error: {error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productosFiltrados.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              onClick={puedeVerDetalle ? () => handleClickProducto(producto) : undefined}
            />
          ))}

          {!cargando && productosFiltrados.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                <p className="text-slate-500 font-medium">No se encontraron productos.</p>
            </div>
          )}
        </div>
      </section>

      {detalleProducto && (
        <DetalleProductoModal
          detalle={detalleProducto}
          onClose={() => setDetalleProducto(null)}
          loading={cargandoDetalleProd}
          onOpenMovimiento={handleOpenMovimiento} 
        />
      )}

      {movimientoSeleccionado && (
          <MovimientoDetalleModal
             detalle={movimientoSeleccionado}
             onClose={() => setMovimientoSeleccionado(null)}
          />
      )}
    </div>
  );
}

// -----------------------------
// Componentes UI Auxiliares
// -----------------------------

// 👇 TARJETA OPTIMIZADA PARA MÓVIL
function ProductoCard({ producto, onClick }: { producto: ProductoInventario; onClick?: () => void; }) {
  const stockConfig = {
    Normal: { border: "border-l-emerald-500", iconBg: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Bajo:   { border: "border-l-amber-500",   iconBg: "bg-amber-100 text-amber-600",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
    Crítico:{ border: "border-l-rose-500",    iconBg: "bg-rose-100 text-rose-600",     badge: "bg-rose-50 text-rose-700 border-rose-200" },
  }[producto.estadoStock];

  const isInteractive = !!onClick;

  return (
    <Card
      className={cn(
          "rounded-xl border-l-[4px] border-y border-r border-slate-100 overflow-hidden", 
          isInteractive ? "shadow-sm hover:shadow-md cursor-pointer transition-all" : "cursor-default opacity-95",
          stockConfig.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 flex gap-3 sm:gap-4 items-start">
        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", stockConfig.iconBg)}>
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1 gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={producto.nombre}>{producto.nombre}</h3>
                <Badge variant="outline" className={cn("shrink-0 text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider h-fit", producto.estadoProducto === 'ACTIVO' ? "border-emerald-200 text-emerald-600" : "border-slate-200 text-slate-400")}>
                    {producto.estadoProducto === 'ACTIVO' ? 'ACT' : 'INA'}
                </Badge>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mb-2 truncate">{producto.codigo} • {producto.categoria}</p>
            <div className="flex items-end justify-between mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-slate-50">
                <div>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold">Existencia</p>
                      <p className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[120px]">{producto.stockTotal}</p>
                </div>
                <Badge variant="outline" className={cn("text-[9px] sm:text-[10px] border shrink-0", stockConfig.badge)}>
                    {producto.estadoStock}
                </Badge>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DetalleProductoModalProps {
  detalle: DetalleProducto;
  loading: boolean;
  onClose: () => void;
  onOpenMovimiento: (item: MovimientoResumenItem) => void;
}

function DetalleProductoModal({ detalle, loading, onClose, onOpenMovimiento }: DetalleProductoModalProps) {
  const { producto, existenciaTotal, movimientos } = detalle;
  const isNegative = existenciaTotal.cantidad < 0;

  const movimientosVisibles = movimientos.slice(0, 50);
  const totalOcultos = Math.max(0, movimientos.length - 50);

  const getIcon = (tipo: string) => {
      switch(tipo) {
          case 'INGRESO': return <ArrowDownLeft size={16} className="text-emerald-600" />;
          case 'SALIDA': return <ArrowUpRight size={16} className="text-rose-600" />;
          case 'TRANSFERENCIA': return <ArrowRightLeft size={16} className="text-sky-600" />;
          case 'AJUSTE': return <RefreshCw size={16} className="text-amber-600" />;
          case 'DEVOLUCION': return <CornerDownLeft size={16} className="text-violet-600" />;
          default: return <FileText size={16} className="text-slate-400" />;
      }
  };

  const getBgColor = (tipo: string) => {
      switch(tipo) {
          case 'INGRESO': return "bg-emerald-100";
          case 'SALIDA': return "bg-rose-100";
          case 'TRANSFERENCIA': return "bg-sky-100";
          case 'AJUSTE': return "bg-amber-100";
          case 'DEVOLUCION': return "bg-violet-100";
          default: return "bg-slate-100";
      }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{producto.categoria}</span>
              <h2 className="text-lg font-bold text-slate-900">{producto.nombre}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                  {producto.codigo}
                  {producto.detalle && <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded">{producto.detalle}</span>}
              </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className={cn("rounded-2xl p-6 text-center border shadow-sm", isNegative ? "bg-rose-50 border-rose-100" : "bg-gradient-to-br from-slate-50 to-white border-slate-200")}>
               <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", isNegative ? "text-rose-400" : "text-slate-400")}>Existencia Total</p>
               <div className="flex items-baseline justify-center gap-1">
                   <span className={cn("text-4xl font-extrabold tracking-tight", isNegative ? "text-rose-600" : "text-slate-800")}>{existenciaTotal.cantidad}</span>
                   <span className={cn("text-sm font-medium", isNegative ? "text-rose-500" : "text-slate-500")}>{existenciaTotal.unidad}</span>
               </div>
               {isNegative && <div className="flex items-center justify-center gap-1 mt-2 text-rose-600 text-xs font-bold bg-rose-100 py-1 px-3 rounded-full inline-flex"><AlertCircle size={12}/> Stock Negativo</div>}
          </div>

          <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
                <span>Últimos Movimientos</span>
                {loading && <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Cargando...</span>}
              </h3>
              <div className="space-y-2">
                {!loading && movimientos.length === 0 && <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Sin movimientos registrados.</p>}
                
                {movimientosVisibles.map((m) => {
                    const esIngreso = m.tipo === "INGRESO" || m.tipo === "DEVOLUCION";
                    return (
                        <div 
                            key={m.id} 
                            onClick={() => onOpenMovimiento(m)} 
                            className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors", getBgColor(m.tipo))}>
                                    {getIcon(m.tipo)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{m.documentoId}</p>
                                    <p className="text-[10px] text-slate-400">{m.bodega} {m.lote && `• ${m.lote}`}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("text-xs font-bold", esIngreso ? "text-emerald-600" : "text-rose-600")}>{m.cantidadConSigno} {m.unidad}</p>
                                <p className="text-[9px] text-slate-400">{m.fecha ? new Date(m.fecha).toLocaleDateString() : ""}</p>
                            </div>
                        </div>
                    );
                })}
                {totalOcultos > 0 && (
                     <div className="text-center py-2 text-xs text-slate-400 italic bg-slate-50 rounded-lg">
                         ... y {totalOcultos} movimientos más antiguos no mostrados.
                     </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovimientoDetalleModal({ detalle, onClose }: { detalle: MovimientoFullDetalle; onClose: () => void; }) {
    const handleExportDocumento = () => {
        window.open(`${API_BASE}/api/movimientos/${detalle.id}/export`, "_blank");
    };

    const isLoading = detalle.cargandoCompleto;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in zoom-in-95">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                             {detalle.codigo}
                             {isLoading && <Loader2 size={14} className="animate-spin text-slate-400"/>}
                        </h2>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-white">{detalle.tipo}</Badge>
                            <Badge variant="outline" className="text-[10px] bg-white">{detalle.estado}</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportDocumento} className="rounded-full bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition"><FileText size={16}/></button>
                        <button onClick={onClose} className="rounded-full bg-white border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 transition"><X size={16}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div><p className="text-slate-500">Fecha</p><p className="font-bold text-slate-700">{detalle.fecha ? new Date(detalle.fecha).toLocaleDateString() : "-"}</p></div>
                        {detalle.origen ? (
                             <div><p className="text-slate-500">Origen</p><p className="font-bold text-slate-700">{detalle.origen}</p></div>
                        ) : isLoading ? (
                             <div className="animate-pulse h-8 bg-slate-200 rounded w-20"></div>
                        ) : null}
                        
                        {detalle.destino && <div><p className="text-slate-500">Destino</p><p className="font-bold text-slate-700">{detalle.destino}</p></div>}
                        {detalle.creador && <div><p className="text-slate-500">Registrado por</p><p className="font-bold text-slate-700">{detalle.creador}</p></div>}
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Productos ({isLoading ? '...' : detalle.productos.length})</h3>
                        
                        {isLoading && detalle.productos.length === 0 ? (
                             <div className="space-y-2">
                                  <div className="h-12 bg-slate-50 rounded-lg animate-pulse w-full"></div>
                                  <div className="h-12 bg-slate-50 rounded-lg animate-pulse w-full"></div>
                             </div>
                        ) : (
                             <div className="space-y-2">
                                {detalle.productos.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Package size={16}/></div>
                                            <div>
                                                <p className="font-bold text-slate-700">{p.productoNombre}</p>
                                                <p className="text-[10px] text-slate-400">{p.productoCodigo} {p.loteCodigo && `• ${p.loteCodigo}`}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-800">{p.cantidad} {p.unidad}</span>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}