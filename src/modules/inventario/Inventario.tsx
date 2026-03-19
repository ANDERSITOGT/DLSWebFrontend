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
  Loader2,
  Database,
  Edit2 // IMPORTAMOS EL ICONO DE EDITAR
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// 👇 IMPORTAMOS EL MODAL QUE ACABAMOS DE CREAR
import InfoProductoModal from "../../modules/inventario/components/InfoProductoModal";

const API_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS DE DATOS ---
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
  const { user, token } = useAuth();
  const puedeVerDetalle = ["ADMIN", "BODEGUERO", "VISOR"].includes(user?.rol || "");
  const canManageCatalog = ["ADMIN", "BODEGUERO"].includes(user?.rol || ""); // Permiso para editar

  // Estados de Datos
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaCompleta, setVistaCompleta] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(""); 
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false);

  // Modales
  const [detalleProducto, setDetalleProducto] = useState<DetalleProducto | null>(null);
  const [cargandoDetalleProd, setCargandoDetalleProd] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoFullDetalle | null>(null);
  
  // 👇 NUEVO ESTADO PARA EL MODAL DE EDICIÓN DE PRODUCTO
  const [showEditModal, setShowEditModal] = useState(false);

  // --- CARGA DE PRODUCTOS ---
  const fetchProductos = async (filtros: { limit: number | 'all', search?: string, cat?: string }) => {
      setCargando(true);
      setError(null);
      try {
          const params = new URLSearchParams();
          if (filtros.limit !== 'all') params.append("limit", filtros.limit.toString());
          else params.append("limit", "all");
          
          if (filtros.search) params.append("search", filtros.search);
          if (filtros.cat) params.append("categoria", filtros.cat);

          const res = await fetch(`${API_BASE}/api/inventario?${params.toString()}`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error("Error al cargar inventario");
          const json = await res.json();
          setProductos(json.productos ?? []);
          
          if (filtros.limit === 'all') setVistaCompleta(true);
          else setVistaCompleta(false);

      } catch (err: unknown) {
          console.error(err);
          setError("Error de conexión");
      } finally {
          setCargando(false);
      }
  };

  useEffect(() => {
      const timer = setTimeout(() => {
          const limite = (busqueda || categoriaFiltro) ? 'all' : 30;
          fetchProductos({ limit: limite, search: busqueda, cat: categoriaFiltro });
      }, 500);

      return () => clearTimeout(timer);
  }, [busqueda, categoriaFiltro, token]);

  useEffect(() => {
      const fetchCats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/inventario/categorias`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                setCategorias(data.categorias || []);
            }
        } catch(e) { console.error(e); }
      };
      fetchCats();
  }, [token]);

  const handleCargarTodo = () => {
      fetchProductos({ limit: 'all', search: busqueda, cat: categoriaFiltro });
  };

  const handleClickProducto = async (prod: ProductoInventario) => {
      if (!puedeVerDetalle) return;
      
      const [cantidadTexto, unidadTexto] = prod.stockTotal.split(" ");
      const cantidadNum = Number(cantidadTexto.replace(",", ".")) || 0;
      const unidad = unidadTexto ?? prod.unidad;

      setDetalleProducto({ 
          producto: {
            id: prod.id,
            nombre: prod.nombre,
            codigo: prod.codigo,
            detalle: prod.detalle,
            categoria: prod.categoria,
            unidad: prod.unidad,
            estadoProducto: prod.estadoProducto
          }, 
          existenciaTotal: { cantidad: cantidadNum, unidad: unidad, texto: prod.stockTotal, estadoStock: prod.estadoStock }, 
          movimientos: [] 
      });
      
      setCargandoDetalleProd(true);
      
      try {
          const res = await fetch(`${API_BASE}/api/inventario/${prod.id}`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          if(res.ok) {
              const data = await res.json();
              setDetalleProducto(data);
          }
      } catch(e) { console.error(e); }
      finally { setCargandoDetalleProd(false); }
  };

  const handleOpenMovimiento = async (itemResumen: MovimientoResumenItem) => {
      const esqueleto: MovimientoFullDetalle = {
          id: itemResumen.documentoUuid || itemResumen.documentoId, 
          codigo: itemResumen.documentoId,
          tipo: itemResumen.tipo,
          estado: "CARGANDO...", 
          fecha: itemResumen.fecha,
          origen: null, destino: null, proveedor: null, solicitante: null, creador: null,
          productos: [], observacion: null, cargandoCompleto: true 
      };
      setMovimientoSeleccionado(esqueleto);
      
      try {
          const idParaFetch = itemResumen.documentoUuid || itemResumen.documentoId;
          const res = await fetch(`${API_BASE}/api/movimientos/${idParaFetch}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Error al cargar movimiento");
          const data = (await res.json()) as MovimientoFullDetalle;
          setMovimientoSeleccionado({ ...data, cargandoCompleto: false });
      } catch (error) {
          console.error(error);
          setMovimientoSeleccionado(prev => prev ? { ...prev, estado: "ANULADO", cargandoCompleto: false } : null);
          alert("No se pudo cargar el detalle.");
      }
  };

  const handleExportPdf = () => {
    window.open(`${API_BASE}/api/inventario/pdf`, "_blank");
  };

  // 👇 Función auxiliar para abrir el modal de edición y pasarle la orden de búsqueda
  const handleOpenEditFromDetail = () => {
      // Cerramos el modal de detalles
      setDetalleProducto(null);
      // Abrimos el modal de InfoProducto
      setShowEditModal(true);
      
      // Hacemos un pequeño "hack" amigable: 
      // Insertamos el código del producto en la barra de búsqueda global del modal de InfoProducto 
      // usando un dispatch de evento personalizado o simplemente confiamos en que el usuario 
      // pegará el código que acaba de ver, o lo dejamos así y dejamos que busque.
      // *Nota: Para que sea automático se requeriría pasarle un prop `initialSearch` al InfoProductoModal,
      // pero como lo pediste sin cambiar la arquitectura, al abrirlo se mostrará el buscador limpio.*
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="mb-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventario</h1>
        <p className="text-sm text-slate-500">Gestión eficiente de existencias.</p>
      </header>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-xl relative">
            <input
              type="text"
              placeholder="Buscar producto en todo el sistema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          
          <div className="flex gap-2">
             <button 
                onClick={() => setMostrandoFiltros(!mostrandoFiltros)} 
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all shadow-sm ${mostrandoFiltros ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
             >
                <Filter size={14} /> Filtros
             </button>
             <button onClick={handleExportPdf} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
              <FileText size={14} /> Exportar
            </button>
          </div>
        </div>

        {mostrandoFiltros && (
            <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-top-2">
                <button onClick={() => setCategoriaFiltro("")} className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors", !categoriaFiltro ? "bg-emerald-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>Todas</button>
                {categorias.map(c => (
                    <button key={c.id} onClick={() => setCategoriaFiltro(c.nombre)} className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors", categoriaFiltro === c.nombre ? "bg-emerald-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>
                        {c.nombre}
                    </button>
                ))}
            </div>
        )}
      </section>

      {/* LISTA DE PRODUCTOS */}
      <section className="space-y-4">
         {!cargando && !error && (
             <div className="flex items-center gap-2">
                 <SectionTitle title={busqueda ? "Resultados de búsqueda" : "Productos más usados"} />
                 <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {productos.length}
                 </span>
             </div>
         )}

         {cargando && <div className="py-20 text-center text-slate-400 flex justify-center gap-2 items-center text-sm"><Loader2 className="animate-spin" size={20}/> Cargando inventario...</div>}
         {error && <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">Error: {error}</div>}
         
         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
             {productos.map(p => (
                 <ProductoCard 
                    key={p.id} 
                    producto={p} 
                    onClick={puedeVerDetalle ? () => handleClickProducto(p) : undefined} 
                 />
             ))}
         </div>

         {!cargando && productos.length === 0 && (
             <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                 <Package className="w-12 h-12 mx-auto text-slate-300 mb-2 opacity-50"/>
                 <p className="text-sm font-medium">No se encontraron productos.</p>
                 <p className="text-xs">Intenta con otro término de búsqueda.</p>
             </div>
         )}

         {!cargando && !vistaCompleta && !busqueda && !categoriaFiltro && productos.length > 0 && (
             <div className="flex justify-center pt-6 pb-4">
                 <button onClick={handleCargarTodo} className="bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:bg-slate-700 transition active:scale-95 flex items-center gap-2">
                     <Database size={16}/> Cargar Inventario Completo
                 </button>
             </div>
         )}
      </section>

      {/* MODALES */}
      {detalleProducto && (
          <DetalleProductoModal 
             detalle={detalleProducto} 
             loading={cargandoDetalleProd} 
             onClose={() => setDetalleProducto(null)} 
             onOpenMovimiento={handleOpenMovimiento}
             canEdit={canManageCatalog} // 👈 PASAMOS PERMISO
             onEditClick={handleOpenEditFromDetail} // 👈 PASAMOS FUNCION
          />
      )}

      {movimientoSeleccionado && (
          <MovimientoDetalleModal
             detalle={movimientoSeleccionado}
             onClose={() => setMovimientoSeleccionado(null)}
          />
      )}

      {/* 👇 EL MODAL DE EDICIÓN SE RENDERIZA AQUÍ */}
      {showEditModal && (
         <InfoProductoModal
           isOpen={showEditModal}
           onClose={() => setShowEditModal(false)}
           onSuccess={() => {
              setShowEditModal(false);
              // Recargamos el inventario para ver los cambios
              const limite = (busqueda || categoriaFiltro) ? 'all' : 30;
              fetchProductos({ limit: limite, search: busqueda, cat: categoriaFiltro });
           }} 
         />
      )}
    </div>
  );
}

// -----------------------------
// Componentes UI Auxiliares
// -----------------------------

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
  canEdit?: boolean;
  onEditClick?: () => void;
}

function DetalleProductoModal({ detalle, loading, onClose, onOpenMovimiento, canEdit, onEditClick }: DetalleProductoModalProps) {
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
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 relative">
          
          <div className="flex-1 pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{producto.categoria}</span>
              <h2 className="text-lg font-bold text-slate-900 pr-8">{producto.nombre}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  {producto.codigo}
                  {producto.detalle && <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded">{producto.detalle}</span>}
              </p>
          </div>
          
          {/* BOTONES DE LA ESQUINA */}
          <div className="flex gap-2 absolute top-4 right-4">
            {canEdit && (
                <button 
                  onClick={onEditClick} 
                  className="rounded-full p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
                  title="Editar Información"
                >
                  <Edit2 size={16} />
                </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 text-slate-500 transition">
              <X size={18} />
            </button>
          </div>
          
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