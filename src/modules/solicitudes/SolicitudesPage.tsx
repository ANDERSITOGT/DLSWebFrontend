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
import { CheckCircle2, AlertTriangle, XCircle, PackageCheck, FileText, Loader2 } from "lucide-react"; // Nuevos iconos

const API_BASE = "http://localhost:3001";

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
    // No cerramos el modal aquí, el modal interno maneja su cierre tras el éxito
  };

  return (
    <div className="space-y-6">
      <header className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Solicitudes</h1>
          <p className="text-sm text-slate-500">Gestión de solicitudes de productos</p>
        </div>
      </header>

      <section className="space-y-4">
        <SectionTitle title="Mis Solicitudes" />
        <div className="flex flex-wrap gap-1 rounded-full bg-slate-100 p-1 w-full sm:w-auto overflow-x-auto">
          {filtros.map((f) => (
            <button
              key={f}
              onClick={() => setFiltroActivo(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                filtroActivo === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f === "Todas" ? "Todas" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {loadingLista && <p className="text-xs text-slate-500">Cargando solicitudes...</p>}
      {errorLista && <p className="text-xs text-rose-500">{errorLista}</p>}

      {!loadingLista && !errorLista && (
        <section className="space-y-3">
            {solicitudes.length === 0 ? (
                 <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-400 text-sm">No hay solicitudes en este estado.</p>
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
  const estadoColor = getEstadoColor(solicitud.estado);
  const fechaCorta = new Date(solicitud.fecha).toLocaleDateString();

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
             <div className="text-[16px] leading-none">📋</div>
            <CardTitle className="text-sm font-semibold">{solicitud.codigo}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 uppercase tracking-wide border", estadoColor)}>
            {solicitud.estado}
          </Badge>
        </div>
        <div className="space-y-0.5 text-xs text-slate-600">
          <p><span className="font-medium">Bodega:</span> {solicitud.bodegaNombre || "Sin asignar"}</p>
          <p><span className="font-medium">Solicitante:</span> {solicitud.solicitanteNombre}</p>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50 mt-1">
          <span>{solicitud.totalProductos} productos</span>
          <span>{fechaCorta}</span>
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
  
  // Estados para controlar los "Modales Bonitos" dentro del modal
  const [confirmarAccion, setConfirmarAccion] = useState<TipoAccion>(null);
  const [procesando, setProcesando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState<{titulo: string, msg: string} | null>(null);

  const estadoColor = getEstadoColor(detalle.estado);
  const fechaCorta = new Date(detalle.fecha).toLocaleDateString();

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
        
        // Éxito
        setConfirmarAccion(null); // Quitar confirmación
        setExitoMsg({
            titulo: nuevoEstado === "APROBADA" ? "¡Solicitud Aprobada!" : "Solicitud Rechazada",
            msg: nuevoEstado === "APROBADA" 
                ? "La solicitud ha sido aprobada correctamente. Ahora puede generar la salida."
                : "La solicitud ha sido rechazada."
        });
        onAccionExitosa(); // Recargar lista de fondo
     } catch (error) {
        alert("Error: " + error);
        setConfirmarAccion(null);
     } finally {
        setProcesando(false);
     }
  };

  // 2. Lógica para ENTREGAR (Generar Salida)
  const handleEntregar = async () => {
    setProcesando(true);
    try {
        // Llamada al NUEVO ENDPOINT del Backend
        const res = await fetch(`${API_BASE}/api/solicitudes/${detalle.id}/entregar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al entregar");

        // Éxito
        setConfirmarAccion(null);
        setExitoMsg({
            titulo: "¡Entrega Exitosa!",
            msg: `Se ha generado el documento de salida: ${data.codigoDoc}. El inventario ha sido descontado.`
        });
        onAccionExitosa();
    } catch (error) {
        alert("Error: " + error);
        setConfirmarAccion(null);
    } finally {
        setProcesando(false);
    }
  };

  // Permisos
  const esAdminBodega = user?.rol === "ADMIN" || user?.rol === "BODEGUERO";
  const puedeAprobar = esAdminBodega && detalle.estado === "PENDIENTE";
  const puedeEntregar = esAdminBodega && detalle.estado === "APROBADA";

  // --- RENDERS DE SUB-PANTALLAS (MODALES BONITOS) ---

  // A. PANTALLA DE ÉXITO
  if (exitoMsg) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-green-600 w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{exitoMsg.titulo}</h3>
                <p className="text-sm text-slate-500 mb-6">{exitoMsg.msg}</p>
                <button 
                    onClick={onClose} 
                    className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition"
                >
                    Entendido, cerrar
                </button>
             </div>
        </div>
    );
  }

  // B. PANTALLA DE CONFIRMACIÓN (APROBAR / RECHAZAR / ENTREGAR)
  if (confirmarAccion) {
     const config = {
         APROBAR: {
             titulo: "¿Aprobar solicitud?",
             desc: `Se aprobará la solicitud ${detalle.codigo}. Luego podrás generar el documento de salida.`,
             btnColor: "bg-emerald-600 hover:bg-emerald-700",
             btnText: "Aprobar",
             icon: <CheckCircle2 className="text-emerald-600 w-10 h-10" />,
             bgIcon: "bg-emerald-100",
             action: handleCambiarEstado
         },
         RECHAZAR: {
             titulo: "¿Rechazar solicitud?",
             desc: `Se rechazará la solicitud ${detalle.codigo}. Esta acción no se puede deshacer.`,
             btnColor: "bg-rose-600 hover:bg-rose-700",
             btnText: "Rechazar",
             icon: <XCircle className="text-rose-600 w-10 h-10" />,
             bgIcon: "bg-rose-100",
             action: handleCambiarEstado
         },
         ENTREGAR: {
            titulo: "¿Generar Salida de Inventario?",
            desc: `Se creará un documento de salida y se descontarán los productos del inventario real.`,
            btnColor: "bg-blue-600 hover:bg-blue-700",
            btnText: "Confirmar Entrega",
            icon: <PackageCheck className="text-blue-600 w-10 h-10" />,
            bgIcon: "bg-blue-100",
            action: handleEntregar
         }
     }[confirmarAccion];

     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                <div className={`w-16 h-16 ${config.bgIcon} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {config.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{config.titulo}</h3>
                <p className="text-sm text-slate-500 mb-6 px-2">{config.desc}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmarAccion(null)}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={config.action}
                        disabled={procesando}
                        className={`flex-1 ${config.btnColor} text-white py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2`}
                    >
                        {procesando && <Loader2 className="animate-spin w-4 h-4"/>}
                        {config.btnText}
                    </button>
                </div>
            </div>
        </div>
     );
  }

  // C. PANTALLA DE DETALLE (NORMAL)
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">{detalle.codigo}</h2>
            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 uppercase tracking-wide border", estadoColor)}>
              {detalle.estado}
            </Badge>
          </div>
          <div className="flex gap-2">
            <button onClick={onExport} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors" title="Exportar PDF">🖨️</button>
            <button onClick={onClose} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">Información</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium text-slate-800">{fechaCorta}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Solicitante</span><span className="font-medium text-slate-800">{detalle.solicitante.nombre}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Bodega</span><span className="font-medium text-slate-800">{detalle.bodega?.nombre ?? "---"}</span></div>
              {detalle.documentoSalidaConsecutivo && (
                   <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500">Doc. Salida</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 rounded">{detalle.documentoSalidaConsecutivo}</span>
                  </div>
              )}
            </div>
          </section>
          
          <section className="space-y-2">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-slate-800">Productos ({detalle.productos.length})</p>
                {loading && <span className="text-[10px] text-slate-400">Actualizando...</span>}
            </div>
            <div className="space-y-2">
              {loading && detalle.productos.length === 0 ? (
                  <p className="text-center py-4 text-slate-400">Cargando productos...</p>
              ) : (
                  detalle.productos.map((prod) => (
                    <div key={prod.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-[14px]">📦</div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-800">{prod.nombre}</span>
                          <span className="text-[11px] font-bold text-slate-900">{Number(prod.cantidad)} {prod.unidad}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Código: {prod.codigo} {prod.loteCodigo && ` • Lote: ${prod.loteCodigo}`}
                        </p>
                        {prod.notas && <p className="text-[10px] text-amber-600 bg-amber-50 inline-block px-1 rounded mt-1">📝 {prod.notas}</p>}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>

        {/* FOOTER DINÁMICO */}
        
        {/* CASO 1: PENDIENTE (Botones Aprobar/Rechazar) */}
        {puedeAprobar && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                    onClick={() => setConfirmarAccion("RECHAZAR")}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold py-2.5 rounded-xl text-xs transition active:scale-95"
                >
                    Rechazar
                </button>
                <button 
                    onClick={() => setConfirmarAccion("APROBAR")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95"
                >
                    Aprobar Solicitud
                </button>
            </div>
        )}

        {/* CASO 2: APROBADA (Botón Generar Salida) */}
        {puedeEntregar && (
             <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                    onClick={() => setConfirmarAccion("ENTREGAR")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                    <FileText size={16}/> Generar Documento de Salida
                </button>
             </div>
        )}

      </div>
    </div>
  );
}

function getEstadoColor(estado: SolicitudEstado): string {
  switch (estado) {
    case "PENDIENTE": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "APROBADA": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "RECHAZADA": return "bg-rose-50 text-rose-700 border-rose-200";
    case "ENTREGADA": return "bg-slate-100 text-slate-700 border-slate-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}