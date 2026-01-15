// src/modules/solicitudes/SolicitudesPage.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";
import { useRefresh } from "../../context/RefreshContext"; 
import { useAuth } from "../../context/AuthContext"; 
import { 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  FileText, 
  Loader2, 
  Clock, 
  Truck, 
  Ban, 
  User, 
  MapPin, 
  Package,
  Calendar
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

// ------------------------------------
// Tipos
// ------------------------------------
type SolicitudEstado = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "ENTREGADA";

type SolicitudResumen = {
  id: string;
  codigo: string;
  fecha: string; 
  estado: SolicitudEstado;
  bodegaNombre: string;
  solicitanteNombre: string;
  totalProductos: number;
};

type ProductoEnSolicitud = {
  id: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidad: string;
  loteCodigo: string | null;
  notas: string | null;
};

type SolicitudDetalle = {
  id: string;
  codigo: string;
  fecha: string;
  estado: SolicitudEstado;
  solicitante: { id: string; nombre: string; };
  bodega: { id: string; nombre: string; } | null;
  productos: ProductoEnSolicitud[];
  documentoSalidaConsecutivo: string | null;
};

// ------------------------------------
// Página principal
// ------------------------------------
export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  
  const { refreshSolicitudes, triggerRefreshSolicitudes } = useRefresh(); 

  const filtros: Array<"Todas" | SolicitudEstado> = ["Todas", "PENDIENTE", "APROBADA", "RECHAZADA", "ENTREGADA"];
  const [filtroActivo, setFiltroActivo] = useState<"Todas" | SolicitudEstado>("Todas");

  const [detalleSeleccionado, setDetalleSeleccionado] = useState<SolicitudDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Función de carga
  const cargarSolicitudes = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoadingLista(true);
      setErrorLista(null);

      let url = `${API_BASE}/api/solicitudes`;
      if (filtroActivo !== "Todas") {
        url += `?estado=${filtroActivo}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      if (!silencioso) setErrorLista("No se pudieron cargar las solicitudes.");
    } finally {
      if (!silencioso) setLoadingLista(false);
    }
  }, [filtroActivo]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes, refreshSolicitudes]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarSolicitudes(true); 
    }, 15000);
    return () => clearInterval(intervalo);
  }, [cargarSolicitudes]);


  // --- Lógica del Modal ---
  const handleClickSolicitud = async (sol: SolicitudResumen) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    
    setDetalleSeleccionado({
        id: sol.id,
        codigo: sol.codigo,
        fecha: sol.fecha,
        estado: sol.estado,
        solicitante: { id: "", nombre: sol.solicitanteNombre },
        bodega: { id: "", nombre: sol.bodegaNombre },
        productos: [],
        documentoSalidaConsecutivo: null
    });

    try {
      const res = await fetch(`${API_BASE}/api/solicitudes/${sol.id}`);
      if (!res.ok) throw new Error("Error al cargar detalle");
      const data = (await res.json()) as SolicitudDetalle;
      setDetalleSeleccionado(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDetalleSeleccionado(null);
  };

  const handleExportPDF = () => {
     if(detalleSeleccionado) {
         window.open(`${API_BASE}/api/solicitudes/${detalleSeleccionado.id}/export`, "_blank");
     }
  };

  const handleAccionExitosa = () => {
    triggerRefreshSolicitudes(); 
  };

  return (
    <div className="space-y-6">
      <header className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Solicitudes</h1>
          <p className="text-sm text-slate-500">Gestión de pedidos a bodega.</p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
             <SectionTitle title="Bandeja de Entrada" />
             {!loadingLista && !errorLista && <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{solicitudes.length}</span>}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <button
              key={f}
              onClick={() => setFiltroActivo(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap border",
                filtroActivo === f 
                    ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {f === "Todas" ? "Todas" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {loadingLista && <div className="py-20 text-center text-slate-400 text-sm">Cargando solicitudes...</div>}
      {errorLista && <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">{errorLista}</div>}

      {!loadingLista && !errorLista && (
        <section className="space-y-3">
            {solicitudes.length === 0 ? (
                 <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500 text-sm font-medium">No hay solicitudes en este estado.</p>
                 </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
                {solicitudes.map((sol) => (
                    <SolicitudCard
                    key={sol.id}
                    solicitud={sol}
                    onClick={() => handleClickSolicitud(sol)}
                    />
                ))}
                </div>
            )}
        </section>
      )}

      {/* Modal Detalle */}
      {modalAbierto && detalleSeleccionado && (
        <SolicitudDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={cerrarModal}
          onExport={handleExportPDF}
          onAccionExitosa={handleAccionExitosa}
        />
      )}
    </div>
  );
}

// ------------------------------------
// Componentes Auxiliares
// ------------------------------------

function SolicitudCard({ solicitud, onClick }: { solicitud: SolicitudResumen; onClick: () => void; }) {
  // Configuración visual según estado
  const config = {
      PENDIENTE: { border: "border-l-amber-500", icon: <Clock size={20}/>, bgIcon: "bg-amber-100 text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" },
      APROBADA:  { border: "border-l-emerald-500", icon: <CheckCircle2 size={20}/>, bgIcon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      RECHAZADA: { border: "border-l-rose-500", icon: <Ban size={20}/>, bgIcon: "bg-rose-100 text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200" },
      ENTREGADA: { border: "border-l-blue-500", icon: <Truck size={20}/>, bgIcon: "bg-blue-100 text-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" }
  }[solicitud.estado];

  const fechaCorta = new Date(solicitud.fecha).toLocaleDateString();

  return (
    <Card 
        className={cn(
            "rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-l-[4px] border-y border-r border-slate-100 group", 
            config.border
        )} 
        onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header Tarjeta */}
        <div className="flex items-start gap-3">
             <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", config.bgIcon)}>
                {config.icon}
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-bold text-slate-800">{solicitud.codigo}</CardTitle>
                    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider", config.badge)}>
                        {solicitud.estado}
                    </Badge>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5"><MapPin size={12}/> {solicitud.bodegaNombre || "Sin asignar"}</p>
                    <p className="flex items-center gap-1.5"><User size={12}/> {solicitud.solicitanteNombre}</p>
                </div>
             </div>
        </div>

        {/* Footer Tarjeta */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-50 mt-1">
          <span className="flex items-center gap-1 font-medium text-slate-500"><Package size={12}/> {solicitud.totalProductos} items</span>
          <span className="flex items-center gap-1"><Calendar size={12}/> {fechaCorta}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Props del Modal
interface DetalleModalProps {
    detalle: SolicitudDetalle;
    loading: boolean;
    onClose: () => void;
    onExport: () => void;
    onAccionExitosa: () => void;
}

// Tipos de acciones posibles
type TipoAccion = "APROBAR" | "RECHAZAR" | "ENTREGAR" | null;

function SolicitudDetalleModal({ detalle, loading, onClose, onExport, onAccionExitosa }: DetalleModalProps) {
  const { token, user } = useAuth();
  
  const [confirmarAccion, setConfirmarAccion] = useState<TipoAccion>(null);
  const [procesando, setProcesando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState<{titulo: string, msg: string} | null>(null);

  const fechaCorta = new Date(detalle.fecha).toLocaleDateString();

  // Configuración de estilo del badge en el modal
  const badgeStyle = {
      PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
      APROBADA: "bg-emerald-100 text-emerald-700 border-emerald-200",
      RECHAZADA: "bg-rose-100 text-rose-700 border-rose-200",
      ENTREGADA: "bg-blue-100 text-blue-700 border-blue-200"
  }[detalle.estado];

  // 1. Lógica para APROBAR o RECHAZAR
  const handleCambiarEstado = async () => {
     if (!confirmarAccion) return;
     const nuevoEstado = confirmarAccion === "APROBAR" ? "APROBADA" : "RECHAZADA";

     setProcesando(true);
     try {
        const res = await fetch(`${API_BASE}/api/solicitudes/${detalle.id}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (!res.ok) throw new Error("Error al actualizar estado");
        
        setConfirmarAccion(null); 
        setExitoMsg({
            titulo: nuevoEstado === "APROBADA" ? "¡Solicitud Aprobada!" : "Solicitud Rechazada",
            msg: nuevoEstado === "APROBADA" 
                ? "La solicitud ha sido aprobada. Ahora está lista para entrega."
                : "La solicitud ha sido rechazada."
        });
        onAccionExitosa(); 
     } catch (error) {
        alert("Error: " + error);
        setConfirmarAccion(null);
     } finally {
        setProcesando(false);
     }
  };

  // 2. Lógica para ENTREGAR
  const handleEntregar = async () => {
    setProcesando(true);
    try {
        const res = await fetch(`${API_BASE}/api/solicitudes/${detalle.id}/entregar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al entregar");

        setConfirmarAccion(null);
        setExitoMsg({
            titulo: "¡Entrega Exitosa!",
            msg: `Se ha generado la salida: ${data.codigoDoc}. Inventario actualizado.`
        });
        onAccionExitosa();
    } catch (error) {
        alert("Error: " + error);
        setConfirmarAccion(null);
    } finally {
        setProcesando(false);
    }
  };

  const esAdminBodega = user?.rol === "ADMIN" || user?.rol === "BODEGUERO";
  const puedeAprobar = esAdminBodega && detalle.estado === "PENDIENTE";
  const puedeEntregar = esAdminBodega && detalle.estado === "APROBADA";

  // --- SUB-PANTALLAS ---

  // A. ÉXITO
  if (exitoMsg) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{exitoMsg.titulo}</h3>
                <p className="text-sm text-slate-500 mb-6">{exitoMsg.msg}</p>
                <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg">
                    Entendido
                </button>
             </div>
        </div>
    );
  }

  // B. CONFIRMACIÓN
  if (confirmarAccion) {
     const config = {
         APROBAR: { titulo: "¿Aprobar solicitud?", desc: `Se habilitará para entrega.`, btnColor: "bg-emerald-600 hover:bg-emerald-700", btnText: "Aprobar", icon: <CheckCircle2 className="text-emerald-600 w-10 h-10"/>, bgIcon: "bg-emerald-100", action: handleCambiarEstado },
         RECHAZAR: { titulo: "¿Rechazar solicitud?", desc: `Esta acción es irreversible.`, btnColor: "bg-rose-600 hover:bg-rose-700", btnText: "Rechazar", icon: <XCircle className="text-rose-600 w-10 h-10"/>, bgIcon: "bg-rose-100", action: handleCambiarEstado },
         ENTREGAR: { titulo: "¿Confirmar Entrega?", desc: `Se descontará del inventario.`, btnColor: "bg-blue-600 hover:bg-blue-700", btnText: "Entregar", icon: <PackageCheck className="text-blue-600 w-10 h-10"/>, bgIcon: "bg-blue-100", action: handleEntregar }
     }[confirmarAccion];

     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                <div className={`w-16 h-16 ${config.bgIcon} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {config.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{config.titulo}</h3>
                <p className="text-sm text-slate-500 mb-6 px-2">{config.desc}</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmarAccion(null)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition">Cancelar</button>
                    <button onClick={config.action} disabled={procesando} className={`flex-1 ${config.btnColor} text-white py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md`}>
                        {procesando && <Loader2 className="animate-spin w-4 h-4"/>}
                        {config.btnText}
                    </button>
                </div>
            </div>
        </div>
     );
  }

  // C. DETALLE
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-2 md:px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="mb-1"><Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", badgeStyle)}>{detalle.estado}</Badge></div>
            <h2 className="text-lg font-bold text-slate-900">{detalle.codigo}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onExport} className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-700 transition shadow-sm">
                <FileText size={14}/> PDF
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition border border-slate-200 bg-white">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Info Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-500 flex items-center gap-2"><Calendar size={14}/> Fecha</span>
                  <span className="text-xs font-bold text-slate-800">{fechaCorta}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-500 flex items-center gap-2"><User size={14}/> Solicitante</span>
                  <span className="text-xs font-bold text-slate-800">{detalle.solicitante.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 flex items-center gap-2"><MapPin size={14}/> Bodega Destino</span>
                  <span className="text-xs font-bold text-slate-800">{detalle.bodega?.nombre ?? "---"}</span>
              </div>
              {detalle.documentoSalidaConsecutivo && (
                   <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center bg-blue-50/50 -mx-4 px-4 py-2 -mb-4 rounded-b-xl">
                    <span className="text-xs font-bold text-blue-600">Documento de Salida</span>
                    <span className="text-xs font-mono font-bold text-blue-700">{detalle.documentoSalidaConsecutivo}</span>
                  </div>
              )}
          </div>
          
          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-slate-800 text-sm">Productos ({detalle.productos.length})</p>
                {loading && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Cargando...</span>}
            </div>
            
            <div className="space-y-2">
              {loading && detalle.productos.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">Cargando productos...</p>
              ) : (
                  detalle.productos.map((prod) => (
                    <div key={prod.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-emerald-100 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Package size={16}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-700 truncate pr-2">{prod.nombre}</span>
                          <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{Number(prod.cantidad)} {prod.unidad}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Código: {prod.codigo} {prod.loteCodigo && ` • Lote: ${prod.loteCodigo}`}
                        </p>
                        {prod.notas && <p className="text-[10px] text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded mt-1.5 font-medium">📝 {prod.notas}</p>}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Footer de Acciones */}
        {puedeAprobar && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button onClick={() => setConfirmarAccion("RECHAZAR")} className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3 rounded-xl text-xs transition active:scale-95 shadow-sm">
                    Rechazar
                </button>
                <button onClick={() => setConfirmarAccion("APROBAR")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-emerald-200 active:scale-95">
                    Aprobar Solicitud
                </button>
            </div>
        )}

        {puedeEntregar && (
             <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button onClick={() => setConfirmarAccion("ENTREGAR")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-blue-200 flex items-center justify-center gap-2 active:scale-95">
                    <PackageCheck size={16}/> Generar Documento de Salida
                </button>
             </div>
        )}

      </div>
    </div>
  );
}