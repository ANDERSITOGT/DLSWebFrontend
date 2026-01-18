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
  Calendar,
  RotateCcw, // Icono para Devoluciones
  AlertTriangle
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
  tipo: "DESPACHO" | "DEVOLUCION"; 
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
  tipo: "DESPACHO" | "DEVOLUCION"; 
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
    
    // Estado inicial optimista con el TIPO correcto
    setDetalleSeleccionado({
        id: sol.id,
        codigo: sol.codigo,
        fecha: sol.fecha,
        estado: sol.estado,
        tipo: sol.tipo, 
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
          <p className="text-sm text-slate-500">Gestión de pedidos y devoluciones.</p>
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
// 1. TARJETA INTELIGENTE (VISUALIZACIÓN CORREGIDA)
// ------------------------------------
function SolicitudCard({ solicitud, onClick }: { solicitud: SolicitudResumen; onClick: () => void; }) {
  // Verificamos si es devolución
  const isDevolucion = solicitud.tipo === "DEVOLUCION";

  // Configuración base
  let config = {
      border: "border-l-slate-200", 
      icon: <Clock size={20}/>, 
      bgIcon: "bg-slate-100 text-slate-500", 
      badge: "bg-slate-100 text-slate-600"
  };

  // Lógica de colores según Estado + Tipo
  if (isDevolucion) {
      // --- ESTILO DEVOLUCIÓN (VIOLETA) ---
      // RECHAZADA = GRIS (Cambio solicitado)
      switch (solicitud.estado) {
          case "PENDIENTE":
              config = { border: "border-l-violet-400", icon: <RotateCcw size={20}/>, bgIcon: "bg-violet-100 text-violet-600", badge: "bg-violet-50 text-violet-700 border-violet-200" };
              break;
          case "APROBADA":
              config = { border: "border-l-fuchsia-500", icon: <CheckCircle2 size={20}/>, bgIcon: "bg-fuchsia-100 text-fuchsia-600", badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" };
              break;
          case "ENTREGADA": 
              config = { border: "border-l-purple-600", icon: <PackageCheck size={20}/>, bgIcon: "bg-purple-100 text-purple-700", badge: "bg-purple-50 text-purple-800 border-purple-200" };
              break;
          case "RECHAZADA": // 👈 AHORA ES GRIS (Devolución rechazada)
              config = { border: "border-l-slate-500", icon: <Ban size={20}/>, bgIcon: "bg-slate-100 text-slate-600", badge: "bg-slate-50 text-slate-700 border-slate-200" };
              break;
      }
  } else {
      // --- ESTILO DESPACHO (AZUL/AMBAR) ---
      // RECHAZADA = ROJO (Cambio solicitado)
      switch (solicitud.estado) {
          case "PENDIENTE":
              config = { border: "border-l-amber-500", icon: <Clock size={20}/>, bgIcon: "bg-amber-100 text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" };
              break;
          case "APROBADA":
              config = { border: "border-l-emerald-500", icon: <CheckCircle2 size={20}/>, bgIcon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
              break;
          case "ENTREGADA":
              config = { border: "border-l-blue-500", icon: <Truck size={20}/>, bgIcon: "bg-blue-100 text-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" };
              break;
          case "RECHAZADA": // 👈 AHORA ES ROJO (Despacho rechazado)
              config = { border: "border-l-rose-500", icon: <Ban size={20}/>, bgIcon: "bg-rose-100 text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200" };
              break;
      }
  }

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
                        {isDevolucion && solicitud.estado === "PENDIENTE" ? "SOL. DEVOLUCIÓN" : solicitud.estado}
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

// ------------------------------------
// 2. MODAL DE DETALLE Y APROBACIÓN
// ------------------------------------
interface DetalleModalProps {
    detalle: SolicitudDetalle;
    loading: boolean;
    onClose: () => void;
    onExport: () => void;
    onAccionExitosa: () => void;
}

type TipoAccion = "APROBAR" | "RECHAZAR" | "ENTREGAR" | "CONFIRMAR_REINGRESO" | null;

function SolicitudDetalleModal({ detalle, loading, onClose, onExport, onAccionExitosa }: DetalleModalProps) {
  const { token, user } = useAuth();
  const isDevolucion = detalle.tipo === "DEVOLUCION";
  
  const [confirmarAccion, setConfirmarAccion] = useState<TipoAccion>(null);
  const [procesando, setProcesando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState<{titulo: string, msg: string} | null>(null);

  const fechaCorta = new Date(detalle.fecha).toLocaleDateString();

  // --- ACCIÓN: CAMBIAR ESTADO ---
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
                ? (isDevolucion ? "Reingreso autorizado. Confirma la recepción física." : "Lista para entrega.")
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

  // --- ACCIÓN: COMPLETAR (ENTREGAR / REINGRESAR) ---
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
            titulo: isDevolucion ? "¡Reingreso Exitoso!" : "¡Entrega Exitosa!",
            msg: `Documento generado: ${data.codigoDoc}. Inventario actualizado.`
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
  
  // Permisos
  const puedeAprobar = esAdminBodega && detalle.estado === "PENDIENTE";
  const puedeEntregar = esAdminBodega && detalle.estado === "APROBADA"; 

  // --- A. PANTALLA ÉXITO ---
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

  // --- B. MODAL DE CONFIRMACIÓN (PERSONALIZADO POR TIPO) ---
  if (confirmarAccion) {
     let config: any = {};

     if (isDevolucion) {
         // --- CONFIGURACIÓN PARA DEVOLUCIONES ---
         switch (confirmarAccion) {
             case "APROBAR":
                 config = { titulo: "¿Autorizar Devolución?", desc: "El solicitante podrá proceder a entregar el producto.", btnColor: "bg-violet-600 hover:bg-violet-700", btnText: "Autorizar", icon: <CheckCircle2 className="text-violet-600 w-10 h-10"/>, bgIcon: "bg-violet-100", action: handleCambiarEstado };
                 break;
             case "RECHAZAR":
                 config = { titulo: "¿Rechazar Devolución?", desc: "La solicitud será cancelada.", btnColor: "bg-rose-600 hover:bg-rose-700", btnText: "Rechazar", icon: <XCircle className="text-rose-600 w-10 h-10"/>, bgIcon: "bg-rose-100", action: handleCambiarEstado };
                 break;
             case "CONFIRMAR_REINGRESO": // Acción Específica
                 config = { 
                     titulo: "¿Confirmar Reingreso?", 
                     desc: "Al confirmar, los productos volverán a sumar al stock de la bodega.", 
                     btnColor: "bg-purple-600 hover:bg-purple-700", 
                     btnText: "Confirmar Reingreso", 
                     icon: <RotateCcw className="text-purple-600 w-10 h-10"/>, 
                     bgIcon: "bg-purple-100", 
                     action: handleEntregar 
                 };
                 break;
         }
     } else {
         // --- CONFIGURACIÓN PARA DESPACHOS (La normal) ---
         switch (confirmarAccion) {
             case "APROBAR":
                 config = { titulo: "¿Aprobar solicitud?", desc: "Se habilitará para entrega.", btnColor: "bg-emerald-600 hover:bg-emerald-700", btnText: "Aprobar", icon: <CheckCircle2 className="text-emerald-600 w-10 h-10"/>, bgIcon: "bg-emerald-100", action: handleCambiarEstado };
                 break;
             case "RECHAZAR":
                 config = { titulo: "¿Rechazar solicitud?", desc: "Esta acción es irreversible.", btnColor: "bg-rose-600 hover:bg-rose-700", btnText: "Rechazar", icon: <XCircle className="text-rose-600 w-10 h-10"/>, bgIcon: "bg-rose-100", action: handleCambiarEstado };
                 break;
             case "ENTREGAR":
                 config = { titulo: "¿Confirmar Entrega?", desc: "Se descontará del inventario.", btnColor: "bg-blue-600 hover:bg-blue-700", btnText: "Entregar", icon: <PackageCheck className="text-blue-600 w-10 h-10"/>, bgIcon: "bg-blue-100", action: handleEntregar };
                 break;
         }
     }

     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 border border-slate-100">
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

  // --- C. DETALLE PRINCIPAL ---
  const themeColor = isDevolucion ? "violet" : "blue"; // Color base
  const IconoHeader = isDevolucion ? RotateCcw : FileText;

  // Ajuste de colores tailwind dinámicos (Clases completas para que PurgeCSS no las borre si usas safelist, sino usar style o mapas)
  // Para seguridad, usaremos clases condicionales directas en el JSX abajo en lugar de concatenación dinámica compleja.

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-2 md:px-4 animate-in fade-in duration-200">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Dinámico */}
        <div className={cn("flex items-center justify-between border-b px-6 py-4", isDevolucion ? "bg-violet-50 border-violet-100" : "bg-blue-50 border-blue-100")}>
          <div className="flex items-center gap-3">
             <div className={cn("p-2 rounded-lg shadow-sm border", isDevolucion ? "bg-white text-violet-600 border-violet-100" : "bg-white text-blue-600 border-blue-100")}>
                <IconoHeader size={20} />
             </div>
             <div>
                <div className="flex items-center gap-2">
                    <h2 className={cn("text-lg font-bold", isDevolucion ? "text-violet-900" : "text-blue-900")}>{detalle.codigo}</h2>
                    <Badge className={cn("text-[10px] uppercase font-bold", isDevolucion ? "bg-white text-violet-700 border-violet-200" : "bg-white text-blue-700 border-blue-200")}>
                        {isDevolucion ? "Devolución" : "Despacho"}
                    </Badge>
                </div>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onExport} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition border border-slate-200 shadow-sm">
                <FileText size={14}/> PDF
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/50 text-slate-500 transition">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/30">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold tracking-wider">
                      <Calendar size={12}/> Fecha
                  </div>
                  <div className="font-semibold text-slate-700">{fechaCorta}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold tracking-wider">
                      <User size={12}/> Solicitante
                  </div>
                  <div className="font-semibold text-slate-700">{detalle.solicitante.nombre}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm col-span-2">
                  <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold tracking-wider">
                      <MapPin size={12}/> {isDevolucion ? "Bodega Destino (Reingreso)" : "Bodega Origen"}
                  </div>
                  <div className="font-semibold text-slate-700">{detalle.bodega?.nombre ?? "---"}</div>
              </div>
          </div>
          
          {detalle.documentoSalidaConsecutivo && (
               <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                   <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Documento Generado</span>
                   <span className="text-sm font-mono font-bold text-emerald-800">{detalle.documentoSalidaConsecutivo}</span>
               </div>
          )}
          
          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Package size={16} className="text-slate-400"/>
                    Productos ({detalle.productos.length})
                </p>
                {loading && <Loader2 size={14} className="animate-spin text-slate-400"/>}
            </div>
            
            <div className="space-y-2">
              {loading && detalle.productos.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs italic">Cargando detalle...</p>
              ) : (
                  detalle.productos.map((prod) => (
                    <div key={prod.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isDevolucion ? "bg-violet-50 text-violet-500" : "bg-blue-50 text-blue-500")}>
                          <Package size={18}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-slate-700 truncate">{prod.nombre}</span>
                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">{Number(prod.cantidad)} {prod.unidad}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap gap-2">
                            <span>COD: {prod.codigo}</span>
                            {prod.loteCodigo && <span className="text-slate-500 font-medium">• Lote: {prod.loteCodigo}</span>}
                        </div>
                        {prod.notas && <p className="text-[10px] text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded mt-1.5 border border-amber-100">📝 {prod.notas}</p>}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Footer de Acciones */}
        {puedeAprobar && (
            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button onClick={() => setConfirmarAccion("RECHAZAR")} className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3 rounded-xl text-xs transition active:scale-95">
                    Rechazar
                </button>
                <button onClick={() => setConfirmarAccion("APROBAR")} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16}/> {isDevolucion ? "Autorizar" : "Aprobar"}
                </button>
            </div>
        )}

        {puedeEntregar && (
             <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => setConfirmarAccion(isDevolucion ? "CONFIRMAR_REINGRESO" : "ENTREGAR")} 
                    className={cn(
                        "w-full text-white font-bold py-3 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-95",
                        isDevolucion ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                    )}
                >
                    {isDevolucion ? <RotateCcw size={16}/> : <PackageCheck size={16}/>} 
                    {isDevolucion ? "Confirmar Reingreso a Bodega" : "Generar Documento de Salida"}
                </button>
             </div>
        )}

      </div>
    </div>
  );
}