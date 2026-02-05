import { useEffect, useState } from "react";
import { 
  Sprout, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  DollarSign, 
  Package, 
  User, 
  X, 
  FileText,
  Loader2,
  Tractor,
  Layers,
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  RefreshCw, 
  CornerDownLeft,
  Truck,
  Droplets // 👈 Nuevo icono para aplicaciones
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/Badge"; 
import { cn } from "../../utils/cn"; 

const API_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS ACTUALIZADOS ---
type LoteBasic = {
  id: string;
  codigo: string;
  cultivo: string;
  area: string;
  estado: "ACTIVO" | "INACTIVO";
  encargados: string[];
  costoTotal: number;
  fechaSiembra: string | null; // 👈 NUEVO
  conteoAplicaciones: number; // 👈 NUEVO
};

type FincaGroup = {
  fincaId: string;
  nombreFinca: string;
  lotesActivos: LoteBasic[];
  lotesCerrados: LoteBasic[];
};

type DetalleHistorialItem = {
  id: string;
  fecha: string;
  documentoId: string;
  documentoCodigo: string;
  tipo: string;
  producto: string;
  cantidad: number;
  unidad: string;
  costoEstimado: number;
};

type DetalleLoteFull = {
  info: LoteBasic & { finca: string };
  historial: DetalleHistorialItem[];
};

// ... (Tipos de Movimiento Full se mantienen igual) ...
type MovimientoTipo = "INGRESO" | "SALIDA" | "TRANSFERENCIA" | "AJUSTE" | "DEVOLUCION";
type MovimientoEstado = "BORRADOR" | "APROBADO" | "ANULADO";

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

// ... (Componente MovimientosLotesPage y FincaSection se mantienen IGUAL) ...
// SOLO PONGO EL COMPONENTE PRINCIPAL PARA CONTEXTO, PERO EL CAMBIO REAL ESTA EN LoteCard

export function MovimientosLotesPage() {
  const { token } = useAuth();
  const [fincas, setFincas] = useState<FincaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/lotes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFincas(data);
      }
    } catch (error) {
      console.error("Error cargando lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [token]);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
             <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <Sprout size={28} /> 
             </div>
             Lotes Agrícolas
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-1">Control de costos y aplicaciones por lote.</p>
        </div>
        {!loading && (
           <div className="flex gap-4 text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"/> {fincas.reduce((acc, f) => acc + f.lotesActivos.length, 0)} Activos</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"/> {fincas.reduce((acc, f) => acc + f.lotesCerrados.length, 0)} Cerrados</span>
           </div>
        )}
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={48}/>
            <p className="text-slate-400 text-sm font-medium">Calculando costos...</p>
         </div>
      ) : fincas.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Tractor className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="text-slate-500">No tienes lotes asignados o registrados.</p>
         </div>
      ) : (
        <div className="space-y-8">
          {fincas.map((finca) => (
            <FincaSection 
              key={finca.fincaId} 
              finca={finca} 
              onSelectLote={(id) => setSelectedLoteId(id)}
            />
          ))}
        </div>
      )}

      {selectedLoteId && (
        <LoteDetalleModal 
          loteId={selectedLoteId} 
          onClose={() => setSelectedLoteId(null)} 
        />
      )}
    </div>
  );
}

function FincaSection({ finca, onSelectLote }: { finca: FincaGroup; onSelectLote: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-100/50 border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 via-white to-white hover:from-blue-50/50 transition-all border-b border-slate-100 group"
      >
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
              <MapPin size={24} strokeWidth={2.5} />
           </div>
           <div className="text-left">
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{finca.nombreFinca}</h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                 <Layers size={14} className="text-slate-400"/>
                 {finca.lotesActivos.length} Lotes en Producción
              </p>
           </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
           <ChevronDown size={18} />
        </div>
      </button>

      {isOpen && (
        <div className="p-6 bg-slate-50/30">
           {finca.lotesActivos.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
               {finca.lotesActivos.map(lote => (
                 <LoteCard key={lote.id} lote={lote} onClick={() => onSelectLote(lote.id)} />
               ))}
             </div>
           )}

           {finca.lotesCerrados.length > 0 && (
             <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                   <div className="h-px bg-slate-200 w-8"></div>
                   Historial / Inactivos
                   <div className="h-px bg-slate-200 flex-1"></div>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 opacity-60 grayscale-[80%] hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  {finca.lotesCerrados.map(lote => (
                    <LoteCard key={lote.id} lote={lote} onClick={() => onSelectLote(lote.id)} />
                  ))}
                </div>
             </div>
           )}

           {finca.lotesActivos.length === 0 && finca.lotesCerrados.length === 0 && (
             <div className="text-center py-8">
                <p className="text-sm text-slate-400 italic">No hay registros en esta finca.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// TARJETA DE LOTE (Actualizada)
// ==========================================
function LoteCard({ lote, onClick }: { lote: LoteBasic; onClick: () => void }) {
  const isActivo = lote.estado === "ACTIVO";
  const fechaVisual = lote.fechaSiembra ? new Date(lote.fechaSiembra).toLocaleDateString() : "-";

  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer rounded-2xl p-5 transition-all duration-300
        bg-white border shadow-sm hover:shadow-xl hover:-translate-y-1
        ${isActivo 
            ? 'border-slate-200 border-t-4 border-t-emerald-500' 
            : 'border-slate-200 border-t-4 border-t-slate-300 bg-slate-50'} 
      `}
    >
      <div className="flex justify-between items-start mb-4">
         <div>
            <h4 className="font-extrabold text-slate-800 text-xl tracking-tight group-hover:text-emerald-700 transition-colors">
                {lote.codigo}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
                <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wide flex items-center gap-1">
                   <Sprout size={14}/> {lote.cultivo}
                </p>
                {/* 🟢 NUEVO: Fecha de siembra */}
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                   <Calendar size={10}/> {fechaVisual}
                </p>
            </div>
         </div>
         <Badge 
            variant={isActivo ? undefined : "outline"} 
            className={isActivo ? "bg-emerald-100 text-emerald-700 border-transparent shadow-none" : "text-slate-500 bg-slate-100 border-slate-200"}
         >
            {lote.estado}
         </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
         <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
            <span className="block text-[10px] text-blue-400 uppercase font-bold mb-0.5">Área</span>
            <span className="font-bold text-blue-700 text-sm">{lote.area}</span>
         </div>
         <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
            <span className="block text-[10px] text-emerald-500 uppercase font-bold mb-0.5">Inversión</span>
            <span className="font-bold text-emerald-700 text-sm flex items-center gap-0.5">
               Q{lote.costoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
         </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
         <div className="flex items-center gap-2 overflow-hidden flex-1">
            <User size={14} className="text-slate-300"/>
            <div className="flex flex-wrap gap-1">
                {lote.encargados.length > 0 ? (
                    lote.encargados.map((enc, idx) => (
                        <span key={idx} className="text-[10px] font-medium text-slate-500">
                        {enc}{idx < lote.encargados.length - 1 ? "," : ""}
                        </span>
                    ))
                ) : (
                    <span className="text-[10px] text-slate-300 italic">Sin asignar</span>
                )}
            </div>
         </div>
         
         {/* 🟢 NUEVO: Contador de Aplicaciones */}
         <div className="flex items-center gap-1.5 text-slate-400" title="Aplicaciones realizadas">
            <Droplets size={14} className="text-blue-400"/>
            <span className="text-xs font-bold text-slate-600">{lote.conteoAplicaciones}</span>
         </div>
      </div>
    </div>
  );
}

// ... (El resto del archivo: LoteDetalleModal, MovimientoFullModal, StatBox SE MANTIENEN IGUALES) ...
// ... Solo asegúrate de copiarlos si no los tienes a mano del mensaje anterior.

// ==========================================
// MODAL DE DETALLE DEL LOTE (Nivel 1)
// ==========================================
function LoteDetalleModal({ loteId, onClose }: { loteId: string; onClose: () => void }) {
  const { token } = useAuth();
  const [data, setData] = useState<DetalleLoteFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lotes/${loteId}`, {
           headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchDetail();
  }, [loteId]);

  const handleExportPDF = async () => {
     try {
        setExporting(true);
        const res = await fetch(`${API_BASE}/api/lotes/${loteId}/export`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al descargar PDF");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
     } catch (error) {
        console.error("Error exportando:", error);
        alert("No se pudo generar el reporte. Verifica tu sesión.");
     } finally {
        setExporting(false);
     }
  };

  if (!data && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
       <Loader2 className="animate-spin text-white" size={40}/>
    </div>
  );

  if (!data) return null;

  // Formatear fecha para el detalle
  const fechaSiembraVisual = data.info.fechaSiembra ? new Date(data.info.fechaSiembra).toLocaleDateString() : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
          
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-emerald-50/50 to-white">
             <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{data.info.codigo}</h2>
                   <Badge className={data.info.estado === "ACTIVO" ? "bg-emerald-500 text-white shadow-emerald-200 shadow-md border-transparent" : "bg-slate-200 text-slate-600"}>
                      {data.info.estado}
                   </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm font-medium text-slate-600">
                   <span className="flex items-center gap-1.5"><MapPin size={16} className="text-blue-500"/> {data.info.finca}</span>
                   <span className="text-slate-300">|</span> 
                   <span className="flex items-center gap-1.5"><Sprout size={16} className="text-emerald-500"/> {data.info.cultivo}</span>
                   <span className="text-slate-300">|</span> 
                   <span className="flex items-center gap-1.5"><Calendar size={16} className="text-amber-500"/> Siembra: {fechaSiembraVisual}</span>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                    onClick={handleExportPDF} 
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                   {exporting ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16}/>} 
                   Reporte PDF
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition border border-transparent hover:border-rose-100">
                   <X size={24}/>
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatBox label="Área Total" value={data.info.area} icon={<MapPin className="text-white" size={20}/>} colorClass="bg-blue-500 shadow-blue-200"/>
                <StatBox label="Encargados" value={data.info.encargados.length > 0 ? data.info.encargados.join(", ") : "Sin asignar"} icon={<User className="text-white" size={20}/>} colorClass="bg-violet-500 shadow-violet-200"/>
                <StatBox label="Costo Total" value={`Q${data.info.costoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="text-white" size={20}/>} colorClass="bg-emerald-500 shadow-emerald-200" isMoney />
             </div>

             <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    Historial de Aplicaciones
                </h3>
                <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {data.historial.length} registros
                </span>
             </div>

             <div className="space-y-3">
                {data.historial.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">No hay aplicaciones registradas.</p>
                    </div>
                )}
                
                {data.historial.map((item) => (
                   <div 
                        key={item.id} 
                        onClick={() => setSelectedMovimientoId(item.documentoId)} 
                        className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group cursor-pointer"
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <Package size={22}/>
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="font-bold text-slate-800 text-sm">{item.producto}</p>
                               <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                                  {item.documentoCodigo}
                               </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                               <Calendar size={12} className="text-emerald-500"/> 
                               <span className="font-medium text-slate-600">{new Date(item.fecha).toLocaleDateString()}</span>
                               <span className="text-slate-300">•</span>
                               {item.tipo}
                            </p>
                         </div>
                      </div>

                      <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 pl-2">
                         <div className="text-right">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cantidad</span>
                            <span className="font-bold text-slate-700 text-sm">{item.cantidad} {item.unidad}</span>
                         </div>
                         <div className="text-right min-w-[80px]">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Costo</span>
                            <span className="font-bold text-emerald-600 text-sm">Q{item.costoEstimado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {selectedMovimientoId && (
           <MovimientoFullModal 
                movimientoId={selectedMovimientoId} 
                onClose={() => setSelectedMovimientoId(null)}
           />
       )}
    </div>
  );
}

function MovimientoFullModal({ movimientoId, onClose }: { movimientoId: string; onClose: () => void }) {
    const { token } = useAuth();
    const [detalle, setDetalle] = useState<MovimientoDetalle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovimiento = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/movimientos/${movimientoId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if(res.ok) setDetalle(await res.json());
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        fetchMovimiento();
    }, [movimientoId]);

    const handleExport = () => {
        window.open(`${API_BASE}/api/movimientos/${movimientoId}/export`, "_blank");
    };

    if(!detalle && loading) return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <Loader2 className="animate-spin text-white" size={30}/>
        </div>
    );

    if(!detalle) return null;

    const fechaTexto = detalle.fecha ? new Date(detalle.fecha).toLocaleDateString() : "-";
    const codigoTitulo = detalle.consecutivo || detalle.codigo;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-in zoom-in-95">
                
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <div className="flex gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] bg-white text-slate-500 border-slate-200">{detalle.tipo}</Badge>
                            <Badge variant="outline" className={cn("text-[10px]", detalle.estado === 'APROBADO' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100")}>{detalle.estado}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{codigoTitulo}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"><FileText size={18}/></button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition"><X size={18}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha</p>
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Calendar size={12}/> {fechaTexto}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Responsable</p>
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User size={12}/> {detalle.creador || "-"}</p>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                        {detalle.origen && <div className="flex justify-between border-b border-slate-200 pb-1"><span>Origen</span><span className="font-bold">{detalle.origen}</span></div>}
                        {detalle.destino && <div className="flex justify-between border-b border-slate-200 pb-1"><span>Destino</span><span className="font-bold">{detalle.destino}</span></div>}
                        {detalle.proveedor && <div className="flex justify-between"><span>Proveedor</span><span className="font-bold">{detalle.proveedor}</span></div>}
                    </div>

                    {detalle.observacion && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800">
                            <span className="font-bold block mb-1">Observación:</span>{detalle.observacion}
                        </div>
                    )}

                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-2">Productos ({detalle.productos.length})</h4>
                        <div className="space-y-2">
                            {detalle.productos.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 border border-slate-100 rounded-lg bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Package size={14}/></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{p.productoNombre}</p>
                                            <p className="text-[10px] text-slate-400">{p.productoCodigo}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">{p.cantidad} <span className="text-slate-500 font-normal">{p.unidad}</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, icon, colorClass, isMoney = false }: any) {
   return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${colorClass}`}>
            {icon}
         </div>
         <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{label}</p>
            <p className={`font-bold text-base ${isMoney ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</p>
         </div>
      </div>
   );
}