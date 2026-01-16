// src/modules/movimientos/MovimientosPage.tsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";
import { 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  RefreshCw, 
  CornerDownLeft, 
  Package, 
  X,
  Calendar,
  MapPin,
  User,
  Truck,
  Loader2,
  Clock // Icono de reloj para la hora
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

// ------------------------------------
// Tipos
// ------------------------------------
type MovimientoTipo = "INGRESO" | "SALIDA" | "TRANSFERENCIA" | "AJUSTE" | "DEVOLUCION";
type MovimientoEstado = "BORRADOR" | "APROBADO" | "ANULADO";

type MovimientoResumen = {
  id: string;
  codigo: string;       
  consecutivo?: string; 
  tipo: MovimientoTipo;
  estado: MovimientoEstado;
  origen: string | null;
  destino: string | null;
  proveedor: string | null;
  productos: string; 
  fecha: string | null;     // Fecha Documento
  createdat?: string;       // Fecha Registro (Bitácora)
};

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

type MovimientoDetalle = {
  id: string;
  codigo: string;
  consecutivo?: string; 
  tipo: MovimientoTipo;
  estado: MovimientoEstado;
  fecha: string | null;
  origen: string | null;
  destino: string | null;
  proveedor: string | null;
  solicitante: string | null;
  creador: string | null;
  productos: ProductoEnMovimiento[];
  observacion: string | null;
};

// ------------------------------------
// Página principal
// ------------------------------------
export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoResumen[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<MovimientoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarMovimientos = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingLista(true);
      else setIsRefreshing(true);
      
      setErrorLista(null);
      const res = await fetch(`${API_BASE}/api/movimientos`);
      
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();
      
      const lista = json.movimientos ?? [];

      // 👇 ORDENAMIENTO POR BITÁCORA (createdat)
      lista.sort((a: MovimientoResumen, b: MovimientoResumen) => {
         // Usamos createdat, si no existe (datos viejos) usamos fecha
         const dateA = new Date(a.createdat || a.fecha || 0).getTime();
         const dateB = new Date(b.createdat || b.fecha || 0).getTime();
         return dateB - dateA; // Descendente (Lo más nuevo arriba)
      });

      setMovimientos(lista);

    } catch (err) {
      console.error("Error al cargar movimientos:", err);
      if (!silent) setErrorLista("No se pudieron cargar los movimientos.");
    } finally {
      setLoadingLista(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarMovimientos();
    const intervalo = setInterval(() => {
        cargarMovimientos(true); 
    }, 5000);
    return () => clearInterval(intervalo);
  }, [cargarMovimientos]);


  const handleClickMovimiento = async (mov: MovimientoResumen) => {
    const detalleBase: MovimientoDetalle = {
      id: mov.id,
      codigo: mov.codigo,
      consecutivo: mov.consecutivo,
      tipo: mov.tipo,
      estado: mov.estado,
      fecha: mov.fecha,
      origen: mov.origen,
      destino: mov.destino,
      proveedor: mov.proveedor,
      solicitante: null,
      creador: null,
      observacion: null,
      productos: [],
    };

    setDetalleSeleccionado(detalleBase);
    setCargandoDetalle(true);

    try {
      const res = await fetch(`${API_BASE}/api/movimientos/${mov.id}`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = (await res.json()) as MovimientoDetalle;
      setDetalleSeleccionado(data);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleExportListado = () => {
    window.open(`${API_BASE}/api/movimientos/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <header className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Movimientos
              {isRefreshing && <Loader2 size={14} className="animate-spin text-slate-400"/>}
          </h1>
          <p className="text-sm text-slate-500">Historial de entradas y salidas.</p>
        </div>
        <button
          onClick={handleExportListado}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <FileText size={16}/> Exportar Listado
        </button>
      </header>

      <section className="space-y-4">
        <div className="flex rounded-xl bg-slate-100 p-1 w-full max-w-sm shadow-inner">
          <button className="flex-1 rounded-lg py-2 text-xs font-bold bg-white text-slate-800 shadow-sm transition-all">
            Movimientos
          </button>
          <Link
            to="/movimientos/lotes"
            className="flex-1 text-center rounded-lg py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
          >
            Lotes Agrícolas
          </Link>
        </div>
      </section>

      {loadingLista && <div className="py-20 text-center text-slate-400 text-sm">Cargando movimientos...</div>}
      {errorLista && <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">{errorLista}</div>}

      <section className="space-y-3">
        {!loadingLista && !errorLista && (
             <div className="flex items-center gap-2 mb-4">
                <SectionTitle title="Bitácora Reciente" />
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{movimientos.length}</span>
            </div>
        )}
        <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
          {movimientos.map((mov) => (
            <MovimientoCard
              key={mov.id}
              movimiento={mov}
              onClick={() => handleClickMovimiento(mov)}
            />
          ))}
        </div>
      </section>

      {detalleSeleccionado && (
        <MovimientoDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={() => setDetalleSeleccionado(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------
// Tarjeta individual (Muestra FECHA Y HORA DE REGISTRO)
// ------------------------------------
function MovimientoCard({ movimiento, onClick }: { movimiento: MovimientoResumen; onClick: () => void; }) {
  const tipoConfig = {
    INGRESO:       { border: "border-l-emerald-500", icon: <ArrowDownLeft size={20}/>,  bgIcon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    SALIDA:        { border: "border-l-rose-500",    icon: <ArrowUpRight size={20}/>,   bgIcon: "bg-rose-100 text-rose-600",       badge: "bg-rose-50 text-rose-700 border-rose-200" },
    TRANSFERENCIA: { border: "border-l-sky-500",     icon: <ArrowRightLeft size={20}/>, bgIcon: "bg-sky-100 text-sky-600",         badge: "bg-sky-50 text-sky-700 border-sky-200" },
    AJUSTE:        { border: "border-l-amber-500",   icon: <RefreshCw size={20}/>,      bgIcon: "bg-amber-100 text-amber-600",     badge: "bg-amber-50 text-amber-700 border-amber-200" },
    DEVOLUCION:    { border: "border-l-violet-500",  icon: <CornerDownLeft size={20}/>, bgIcon: "bg-violet-100 text-violet-600",   badge: "bg-violet-50 text-violet-700 border-violet-200" },
  }[movimiento.tipo];

  const estadoBadge = movimiento.estado === "APROBADO" 
      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
      : movimiento.estado === "BORRADOR" 
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-500 border-slate-200";

  // 👇 LÓGICA DE VISUALIZACIÓN DE FECHA Y HORA (BITÁCORA)
  // Usamos 'createdat' para mostrar cuándo ocurrió realmente.
  // Transformamos a hora de Guatemala.
  let fechaVisual = "-";
  if (movimiento.createdat) {
      fechaVisual = new Date(movimiento.createdat).toLocaleString('es-GT', {
          timeZone: 'America/Guatemala',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
      });
  } else if (movimiento.fecha) {
      // Fallback para datos antiguos sin createdat
      fechaVisual = new Date(movimiento.fecha).toLocaleDateString('es-GT', { timeZone: 'UTC' });
  }

  const codigoMostrar = movimiento.consecutivo || movimiento.codigo;

  return (
    <Card
      className={cn(
          "rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-l-[4px] border-y border-r border-slate-100 group", 
          tipoConfig.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", tipoConfig.bgIcon)}>
            {tipoConfig.icon}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                        {codigoMostrar}
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{movimiento.tipo}</p>
                </div>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider", estadoBadge)}>
                    {movimiento.estado}
                </Badge>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {movimiento.origen && (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400"/>
                        <span className="truncate">De: <span className="font-semibold">{movimiento.origen}</span></span>
                    </div>
                )}
                {movimiento.destino && (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400"/>
                        <span className="truncate">A: <span className="font-semibold">{movimiento.destino}</span></span>
                    </div>
                )}
                {movimiento.proveedor && (
                    <div className="flex items-center gap-1.5">
                        <Truck size={12} className="text-slate-400"/>
                        <span className="truncate">Prov: <span className="font-semibold">{movimiento.proveedor}</span></span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1"><Package size={12}/> {movimiento.productos}</span>
                {/* Mostramos fecha y hora */}
                <span className="flex items-center gap-1 font-medium text-slate-500"><Clock size={12}/> {fechaVisual}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------
// Modal Detalle (Mantiene FECHA DOCUMENTO)
// ------------------------------------
function MovimientoDetalleModal({ detalle, loading, onClose }: { detalle: MovimientoDetalle; loading: boolean; onClose: () => void; }) {
  
  // 👇 MANTENEMOS LA FECHA DOCUMENTO (CONTABLE)
  const fechaTexto = detalle.fecha 
    ? new Date(detalle.fecha).toLocaleDateString('es-GT', { timeZone: 'UTC' }) 
    : "-";
    
  const handleExport = () => window.open(`${API_BASE}/api/movimientos/${detalle.id}/export`, "_blank");
  const codigoTitulo = detalle.consecutivo || detalle.codigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
             <div className="flex gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-500">{detalle.tipo}</Badge>
                <Badge variant="outline" className={cn("text-[10px]", detalle.estado === 'APROBADO' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>{detalle.estado}</Badge>
             </div>
             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase">
                 {codigoTitulo}
             </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-sm">
               <FileText size={14}/> PDF
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition border border-slate-200 bg-white">
               <X size={16}/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Fecha Documento</p>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> {fechaTexto}</p>
                  </div>
                  {detalle.creador && (
                      <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Registrado por</p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400"/> {detalle.creador}</p>
                      </div>
                  )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  {detalle.origen && (
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs text-slate-500">Origen</span>
                          <span className="text-xs font-bold text-slate-800 text-right">{detalle.origen}</span>
                      </div>
                  )}
                  {detalle.destino && (
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs text-slate-500">Destino</span>
                          <span className="text-xs font-bold text-slate-800 text-right">{detalle.destino}</span>
                      </div>
                  )}
                  {detalle.proveedor && (
                      <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Proveedor</span>
                          <span className="text-xs font-bold text-slate-800 text-right">{detalle.proveedor}</span>
                      </div>
                  )}
              </div>
          </div>

          {detalle.observacion && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800">
                  <span className="font-bold block mb-1 text-amber-600">Observación:</span>
                  {detalle.observacion}
              </div>
          )}

          <div>
             <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
                <span>Productos ({detalle.productos.length})</span>
                {loading && <span className="text-[10px] font-normal text-slate-400">Cargando...</span>}
             </h3>
             
             {!loading && detalle.productos.length === 0 && (
                 <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">Sin productos.</p>
             )}

             <div className="space-y-2">
                {detalle.productos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-emerald-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Package size={18}/>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{p.productoNombre}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                    {p.productoCodigo} 
                                    {p.loteCodigo && <span className="bg-slate-100 px-1.5 rounded text-slate-500 font-medium">Lote: {p.loteCodigo}</span>}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{p.cantidad} <span className="text-xs font-medium text-slate-500">{p.unidad}</span></span>
                    </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}