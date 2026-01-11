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
// 1. Importamos el contexto
import { useRefresh } from "../../context/RefreshContext"; 

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
  
  // 2. Usamos el valor del contexto para saber cuándo recargar
  const { refreshSolicitudes } = useRefresh(); 

  const filtros: Array<"Todas" | SolicitudEstado> = ["Todas", "PENDIENTE", "APROBADA", "RECHAZADA", "ENTREGADA"];
  const [filtroActivo, setFiltroActivo] = useState<"Todas" | SolicitudEstado>("Todas");

  const [detalleSeleccionado, setDetalleSeleccionado] = useState<SolicitudDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // 3. Función de carga extraída (useCallback) para poder reusarla
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

  // 4. Efecto Principal: Se dispara al inicio, al cambiar filtro O al cambiar refreshSolicitudes
  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes, refreshSolicitudes]); // 👈 ¡La clave está aquí!

  // 5. Efecto Polling: Actualiza silenciosamente cada 15 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarSolicitudes(true); // Carga silenciosa
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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Solicitudes</h1>
          <p className="text-sm text-slate-500">Gestión de solicitudes de productos</p>
        </div>
      </header>

      {/* Tabs */}
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

      {/* Lista */}
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

function SolicitudDetalleModal({ detalle, loading, onClose, onExport }: { detalle: SolicitudDetalle; loading: boolean; onClose: () => void; onExport: () => void; }) {
  const estadoColor = getEstadoColor(detalle.estado);
  const fechaCorta = new Date(detalle.fecha).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">Información</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium text-slate-800">{fechaCorta}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Solicitante</span><span className="font-medium text-slate-800">{detalle.solicitante.nombre}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Bodega</span><span className="font-medium text-slate-800">{detalle.bodega?.nombre ?? "---"}</span></div>
              {detalle.documentoSalidaConsecutivo && (
                   <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500">Doc. Salida</span><span className="font-medium text-blue-700">{detalle.documentoSalidaConsecutivo}</span>
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