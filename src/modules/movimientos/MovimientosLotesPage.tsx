import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";
import { 
  MapPin, 
  Sprout, 
  Ruler, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  X, 
  Package, 
  Leaf 
} from "lucide-react";
// 👇 1. IMPORTAR AUTH
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

// -----------------------------
// Tipos
// -----------------------------
type EstadoLote = "ACTIVO" | "INACTIVO";

type LoteResumen = {
  id: string;
  codigo: string;
  finca: string;
  cultivo: string;
  area: string; // "2.5 mz"
  estado: EstadoLote;
  aplicacionesCount: number;
};

type MovimientoTipo = "INGRESO" | "SALIDA" | "TRANSFERENCIA" | "AJUSTE" | "DEVOLUCION";

type LoteAplicacion = {
  id: string;
  documentoId: string;
  documentoCodigo: string;
  tipo: MovimientoTipo;
  fecha: string | null;
  bodega: string | null;
  producto: string;
  cantidad: string;
  unidad: string;
};

type DetalleLote = {
  lote: LoteResumen;
  aplicaciones: LoteAplicacion[];
};

// -------- Documento ----------
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

type DocumentoDetalle = {
  id: string;
  codigo: string;
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

// -----------------------------
// Página de Lotes
// -----------------------------
export function MovimientosLotesPage() {
  // 👇 2. OBTENER TOKEN
  const { token } = useAuth();

  const [lotes, setLotes] = useState<LoteResumen[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [errorLotes, setErrorLotes] = useState<string | null>(null);

  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleLote | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoDetalle | null>(null);
  const [cargandoDocumento, setCargandoDocumento] = useState(false);

  useEffect(() => {
    const cargarLotes = async () => {
      try {
        setLoadingLotes(true);
        setErrorLotes(null);
        // 👇 3. AGREGAR HEADER AUTH
        const res = await fetch(`${API_BASE}/api/movimientos/lotes`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const json = await res.json();
        setLotes(json.lotes ?? []);
      } catch (err) {
        console.error("Error al cargar lotes:", err);
        setErrorLotes("No se pudieron cargar los lotes.");
      } finally {
        setLoadingLotes(false);
      }
    };
    cargarLotes();
  }, [token]); // Agregar token como dependencia

  const handleClickLote = async (lote: LoteResumen) => {
    setDetalleSeleccionado({ lote, aplicaciones: [] });
    setCargandoDetalle(true);
    try {
      // 👇 4. AGREGAR HEADER AUTH
      const res = await fetch(`${API_BASE}/api/movimientos/lotes/${lote.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();
      setDetalleSeleccionado({ lote: json.lote, aplicaciones: json.aplicaciones ?? [] });
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleVerDocumento = async (aplicacion: LoteAplicacion) => {
    // Base rápida
    setDocumentoSeleccionado({
      id: aplicacion.documentoId,
      codigo: aplicacion.documentoCodigo,
      tipo: aplicacion.tipo,
      estado: "APROBADO",
      fecha: aplicacion.fecha,
      origen: aplicacion.bodega,
      destino: null,
      proveedor: null,
      solicitante: null,
      creador: null,
      observacion: null,
      productos: [],
    });
    setCargandoDocumento(true);

    try {
      // 👇 5. AGREGAR HEADER AUTH
      const res = await fetch(`${API_BASE}/api/movimientos/${aplicacion.documentoId}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = (await res.json()) as DocumentoDetalle;
      setDocumentoSeleccionado(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoDocumento(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Movimientos</h1>
        <p className="text-sm text-slate-500">Gestión de lotes y aplicaciones.</p>
      </header>

      <section className="space-y-4">
        <div className="flex rounded-xl bg-slate-100 p-1 w-full max-w-sm shadow-inner">
          <Link
            to="/movimientos"
            className="flex-1 text-center rounded-lg py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
          >
            Movimientos
          </Link>
          <button className="flex-1 rounded-lg py-2 text-xs font-bold bg-white text-slate-800 shadow-sm transition-all">
            Lotes Agrícolas
          </button>
        </div>
      </section>

      {loadingLotes && <div className="py-20 text-center text-slate-400 text-sm">Cargando lotes...</div>}
      {errorLotes && <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">{errorLotes}</div>}

      <section className="space-y-3">
        {!loadingLotes && !errorLotes && (
             <div className="flex items-center gap-2 mb-4">
                <SectionTitle title="Lotes Activos" />
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{lotes.length}</span>
            </div>
        )}
        <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
          {lotes.map((lote) => (
            <LoteCard
              key={lote.id}
              lote={lote}
              onClick={() => handleClickLote(lote)}
            />
          ))}
        </div>
      </section>

      {detalleSeleccionado && (
        <LoteDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={() => setDetalleSeleccionado(null)}
          onVerDocumento={handleVerDocumento}
        />
      )}

      {documentoSeleccionado && (
        <DocumentoDetalleModal
          detalle={documentoSeleccionado}
          loading={cargandoDocumento}
          onClose={() => setDocumentoSeleccionado(null)}
        />
      )}
    </div>
  );
}

// -----------------------------
// Tarjeta de lote (Rediseñada)
// -----------------------------
function LoteCard({ lote, onClick }: { lote: LoteResumen; onClick: () => void; }) {
  const isActive = lote.estado === "ACTIVO";
  const statusConfig = isActive
      ? { border: "border-l-emerald-500", iconBg: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : { border: "border-l-slate-300",   iconBg: "bg-slate-100 text-slate-500",     badge: "bg-slate-50 text-slate-600 border-slate-200" };

  return (
    <Card
      className={cn(
          "rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-l-[4px] border-y border-r border-slate-100 group", 
          statusConfig.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4">
        {/* Icono Lateral */}
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", statusConfig.iconBg)}>
            <MapPin size={20} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
            {/* Header */}
            <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-bold text-slate-800">{lote.codigo}</CardTitle>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider", statusConfig.badge)}>
                    {lote.estado}
                </Badge>
            </div>
            
            <p className="text-xs text-slate-500 font-medium">{lote.finca}</p>

            {/* Info Grid */}
            <div className="flex gap-4 mt-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Sprout size={14} className="text-emerald-500"/>
                    <span className="font-semibold">{lote.cultivo}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Ruler size={14} className="text-blue-500"/>
                    <span>{lote.area}</span>
                </div>
            </div>
            
            <div className="pt-1 mt-1 text-[10px] text-slate-400 text-right">
                {lote.aplicacionesCount} aplicaciones registradas
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Modal detalle de lote (Rediseñado)
// -----------------------------
function LoteDetalleModal({ detalle, loading, onClose, onVerDocumento }: { detalle: DetalleLote; loading: boolean; onClose: () => void; onVerDocumento: (app: LoteAplicacion) => void; }) {
  const { lote, aplicaciones } = detalle;
  const handleExport = () => window.open(`${API_BASE}/api/movimientos/lotes/${lote.id}/export`, "_blank");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={10}/> Lote Agrícola</span>
              <h2 className="text-lg font-bold text-slate-900">{lote.codigo}</h2>
              <p className="text-xs text-slate-500">{lote.finca}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={handleExport} className="flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-sm">
               <FileText size={14}/> Historial
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition border border-slate-200 bg-white">
               <X size={16}/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                  <Sprout className="text-emerald-500 mb-1" size={20}/>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold">Cultivo</span>
                  <span className="text-sm font-bold text-emerald-900">{lote.cultivo}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                  <Ruler className="text-blue-500 mb-1" size={20}/>
                  <span className="text-[10px] text-blue-600 uppercase font-bold">Área</span>
                  <span className="text-sm font-bold text-blue-900">{lote.area}</span>
              </div>
          </div>

          {/* Timeline de aplicaciones */}
          <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                Historial de Aplicaciones
                {loading && <span className="text-[10px] font-normal text-slate-400">Cargando...</span>}
              </h3>

              {!loading && aplicaciones.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">Sin aplicaciones registradas.</p>
              )}

              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {aplicaciones.map((ap) => (
                    <div key={ap.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Dot del timeline */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-200 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 text-slate-500">
                            <Leaf size={14} />
                        </div>
                        
                        {/* Tarjeta de evento */}
                        <div 
                            onClick={() => onVerDocumento(ap)}
                            className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all ml-4 md:ml-0"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded">{ap.tipo}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Calendar size={10}/> {ap.fecha ? new Date(ap.fecha).toLocaleDateString() : "-"}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 mb-0.5">{ap.producto}</p>
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] text-slate-500">{ap.documentoCodigo}</p>
                                <span className="text-xs font-bold text-slate-800">{ap.cantidad} {ap.unidad}</span>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Modal detalle de documento (Igual que en MovimientosPage)
// -----------------------------
function DocumentoDetalleModal({ detalle, loading, onClose }: { detalle: DocumentoDetalle; loading: boolean; onClose: () => void; }) {
  const fechaTexto = detalle.fecha ? new Date(detalle.fecha).toLocaleDateString() : "-";
  const handleExport = () => window.open(`${API_BASE}/api/movimientos/${detalle.id}/export`, "_blank");

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
              <div className="flex gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-500">{detalle.tipo}</Badge>
                <Badge variant="outline" className={cn("text-[10px]", detalle.estado === 'APROBADO' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>{detalle.estado}</Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{detalle.codigo}</h2>
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-slate-500">Fecha</span><span className="text-xs font-bold text-slate-700">{fechaTexto}</span></div>
              {detalle.origen && <div className="flex justify-between"><span className="text-xs text-slate-500">Origen</span><span className="text-xs font-bold text-slate-700">{detalle.origen}</span></div>}
              {detalle.creador && <div className="flex justify-between"><span className="text-xs text-slate-500">Registrado por</span><span className="text-xs font-bold text-slate-700">{detalle.creador}</span></div>}
          </div>

          <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Productos ({detalle.productos.length})</h3>
              {loading && <p className="text-xs text-slate-400">Cargando...</p>}
              <div className="space-y-2">
                {detalle.productos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Package size={16}/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{p.productoNombre}</p>
                                <p className="text-[10px] text-slate-400">{p.productoCodigo}</p>
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