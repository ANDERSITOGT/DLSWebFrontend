// src/modules/movimientos/MovimientosLotesPage.tsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";

const API_BASE = "http://localhost:3001";

// -----------------------------
// Tipos (coinciden con el backend)
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

type MovimientoTipo =
  | "INGRESO"
  | "SALIDA"
  | "TRANSFERENCIA"
  | "AJUSTE"
  | "DEVOLUCION";

type LoteAplicacion = {
  id: string;
  documentoId: string; // UUID del documento
  documentoCodigo: string; // consecutivo (SAL-2025-00034)
  tipo: MovimientoTipo;
  fecha: string | null;
  bodega: string | null;
  producto: string;
  cantidad: string; // "10 L"
  unidad: string;
};

// Detalle que se muestra en el modal de lote
type DetalleLote = {
  lote: LoteResumen;
  aplicaciones: LoteAplicacion[];
};

// -------- Documento (para el segundo modal) ----------
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
  const [lotes, setLotes] = useState<LoteResumen[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [errorLotes, setErrorLotes] = useState<string | null>(null);

  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DetalleLote | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [documentoSeleccionado, setDocumentoSeleccionado] =
    useState<DocumentoDetalle | null>(null);
  const [cargandoDocumento, setCargandoDocumento] = useState(false);

  // Cargar listado de lotes desde el backend
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        setLoadingLotes(true);
        setErrorLotes(null);

        const res = await fetch(`${API_BASE}/api/movimientos/lotes`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = await res.json();
        const data: LoteResumen[] = json.lotes ?? [];
        setLotes(data);
      } catch (err) {
        console.error("Error al cargar lotes:", err);
        setErrorLotes("No se pudieron cargar los lotes.");
      } finally {
        setLoadingLotes(false);
      }
    };

    cargarLotes();
  }, []);

  // click en tarjeta de lote → abre modal inmediato y luego carga historial
  const handleClickLote = async (lote: LoteResumen) => {
    const detalleBase: DetalleLote = {
      lote,
      aplicaciones: [],
    };

    setDetalleSeleccionado(detalleBase);
    setCargandoDetalle(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/movimientos/lotes/${lote.id}`
      );
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const json = await res.json();
      const detalleBack: DetalleLote = {
        lote: json.lote,
        aplicaciones: json.aplicaciones ?? [],
      };

      setDetalleSeleccionado(detalleBack);
    } catch (error) {
      console.error("Error al cargar detalle de lote:", error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModalLote = () => {
    setDetalleSeleccionado(null);
    setCargandoDetalle(false);
  };

  // Cuando se hace clic en una aplicación:
  // 1) Cerramos modal de lote y abrimos modal de documento con info base.
  // 2) Mostramos "Cargando productos…" mientras llega el detalle real.
  const handleVerDocumento = async (aplicacion: LoteAplicacion) => {
    // Cerramos el modal de lote
    setDetalleSeleccionado(null);

    // Base rápida para mostrar algo en el modal de documento
    const baseDoc: DocumentoDetalle = {
      id: aplicacion.documentoId,
      codigo: aplicacion.documentoCodigo,
      tipo: aplicacion.tipo,
      estado: "APROBADO", // se actualizará con lo que mande el backend
      fecha: aplicacion.fecha,
      origen: aplicacion.bodega,
      destino: null,
      proveedor: null,
      solicitante: null,
      creador: null,
      observacion: null,
      productos: [],
    };

    setDocumentoSeleccionado(baseDoc);
    setCargandoDocumento(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/movimientos/${aplicacion.documentoId}`
      );
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = (await res.json()) as DocumentoDetalle;
      setDocumentoSeleccionado(data);
    } catch (error) {
      console.error("Error al cargar documento:", error);
      // dejamos el baseDoc y solo quitamos el loader
    } finally {
      setCargandoDocumento(false);
    }
  };

  const cerrarModalDocumento = () => {
    setDocumentoSeleccionado(null);
    setCargandoDocumento(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Movimientos
        </h1>
        <p className="text-sm text-slate-500">
          Documentos de entrada y salida.
        </p>
      </header>

      {/* Tabs superiores (solo el tab LOTES está activo en esta página) */}
      <section className="space-y-4">
        <SectionTitle title="Lotes" />

        <div className="flex rounded-full bg-slate-100 p-1 w-full max-w-xs">
          {/* Tab que regresa a la lista de movimientos */}
          <Link
            to="/movimientos"
            className={cn(
              "flex-1 text-center rounded-full py-1.5 text-xs font-medium",
              "text-slate-500 hover:text-slate-900"
            )}
          >
            Movimientos
          </Link>

          {/* Tab actual (Lotes) */}
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium",
              "bg-white text-slate-900 shadow-sm cursor-default"
            )}
          >
            Lotes
          </button>
        </div>
      </section>

      {/* Estado de carga / error */}
      {loadingLotes && (
        <p className="text-xs text-slate-500">Cargando lotes…</p>
      )}
      {errorLotes && (
        <p className="text-xs text-rose-500">{errorLotes}</p>
      )}

      {/* Grid de lotes */}
      <section className="space-y-3">
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

      {/* Modal detalle de lote */}
      {detalleSeleccionado && (
        <LoteDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={cerrarModalLote}
          onVerDocumento={handleVerDocumento}
        />
      )}

      {/* Modal detalle de documento */}
      {documentoSeleccionado && (
        <DocumentoDetalleModal
          detalle={documentoSeleccionado}
          loading={cargandoDocumento}
          onClose={cerrarModalDocumento}
        />
      )}
    </div>
  );
}

// -----------------------------
// Tarjeta de lote
// -----------------------------
type LoteCardProps = {
  lote: LoteResumen;
  onClick: () => void;
};

function LoteCard({ lote, onClick }: LoteCardProps) {
  const estadoColor =
    lote.estado === "ACTIVO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* header: código + estado */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[16px] leading-none">📍</span>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold">
                {lote.codigo}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Finca: {lote.finca}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
              estadoColor
            )}
          >
            {lote.estado}
          </Badge>
        </div>

        {/* cuerpo: cultivo + área */}
        <div className="text-xs text-slate-600 space-y-0.5">
          <p>
            <span className="font-medium">Cultivo:</span> {lote.cultivo}
          </p>
          <p>
            <span className="font-medium">Área:</span> {lote.area}
          </p>
        </div>

        {/* footer: cantidad de aplicaciones */}
        <div className="pt-1 text-[11px] text-slate-500">
          {lote.aplicacionesCount} aplicaciones
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Modal detalle de lote
// -----------------------------
type LoteDetalleModalProps = {
  detalle: DetalleLote;
  loading: boolean;
  onClose: () => void;
  onVerDocumento: (aplicacion: LoteAplicacion) => void;
};

function LoteDetalleModal({
  detalle,
  loading,
  onClose,
  onVerDocumento,
}: LoteDetalleModalProps) {
  const { lote, aplicaciones } = detalle;

  const estadoColor =
    lote.estado === "ACTIVO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-slate-100 text-slate-500 border-slate-200";

  const handleExportHistorial = () => {
    // Endpoint que generará el PDF del historial del lote
    window.open(
      `${API_BASE}/api/movimientos/lotes/${lote.id}/export`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              {lote.codigo}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                estadoColor
              )}
            >
              {lote.estado}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          {/* Información del lote */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Información del Lote
            </p>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-800">
              <div>
                <p className="text-slate-500">Código</p>
                <p className="font-medium">{lote.codigo}</p>
              </div>
              <div>
                <p className="text-slate-500">Finca</p>
                <p className="font-medium">{lote.finca}</p>
              </div>
              <div>
                <p className="text-slate-500">Cultivo</p>
                <p className="font-medium">{lote.cultivo}</p>
              </div>
              <div>
                <p className="text-slate-500">Área</p>
                <p className="font-medium">{lote.area}</p>
              </div>
            </div>
          </section>

          {/* Historial de aplicaciones */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Historial de Aplicaciones
              {aplicaciones.length > 0 && ` (${aplicaciones.length})`}
            </p>

            {loading && (
              <p className="text-[11px] text-slate-500">
                Cargando historial…
              </p>
            )}

            {!loading && aplicaciones.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No hay aplicaciones registradas para este lote.
              </p>
            )}

            <div className="space-y-2">
              {aplicaciones.map((ap) => (
                <div
                  key={ap.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 cursor-pointer hover:bg-slate-50"
                  onClick={() => onVerDocumento(ap)}
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-800">
                        {ap.documentoCodigo}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-2 py-0.5 uppercase tracking-wide bg-rose-50 text-rose-600 border-rose-100"
                      >
                        {ap.tipo}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {ap.producto}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cantidad: {ap.cantidad} {ap.unidad} · Bodega:{" "}
                      {ap.bodega ?? "-"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {ap.fecha
                        ? new Date(ap.fecha).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer con botón Exportar */}
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={handleExportHistorial}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            📄 Exportar historial
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Modal detalle de documento
// -----------------------------
type DocumentoDetalleModalProps = {
  detalle: DocumentoDetalle;
  loading: boolean;
  onClose: () => void;
};

function DocumentoDetalleModal({
  detalle,
  loading,
  onClose,
}: DocumentoDetalleModalProps) {
  const {
    codigo,
    tipo,
    estado,
    fecha,
    origen,
    destino,
    proveedor,
    solicitante,
    creador,
    productos,
    observacion,
    id,
  } = detalle;

  const tipoColor: string = {
    INGRESO: "bg-emerald-50 text-emerald-600 border-emerald-100",
    SALIDA: "bg-rose-50 text-rose-600 border-rose-100",
    TRANSFERENCIA: "bg-sky-50 text-sky-600 border-sky-100",
    AJUSTE: "bg-amber-50 text-amber-600 border-amber-100",
    DEVOLUCION: "bg-violet-50 text-violet-600 border-violet-100",
  }[tipo];

  const estadoColor: string =
    estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : estado === "BORRADOR"
      ? "bg-amber-50 text-amber-600 border-amber-100"
      : "bg-slate-50 text-slate-600 border-slate-200";

  const fechaTexto = fecha
    ? new Date(fecha).toLocaleDateString()
    : "-";

  const handleExportDocumento = () => {
    window.open(`${API_BASE}/api/movimientos/${id}/export`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {codigo}
            </h2>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  tipoColor
                )}
              >
                {tipo}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  estadoColor
                )}
              >
                {estado}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDocumento}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
            >
              📄 Exportar
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          {/* Información del documento */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Información del Documento
            </p>
            <div className="rounded-2xl border border-slate-100 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-800">
              <div>
                <p className="text-slate-500">Fecha</p>
                <p className="font-medium">{fechaTexto}</p>
              </div>
              {origen && (
                <div>
                  <p className="text-slate-500">Bodega Origen</p>
                  <p className="font-medium">{origen}</p>
                </div>
              )}
              {destino && (
                <div>
                  <p className="text-slate-500">Bodega Destino</p>
                  <p className="font-medium">{destino}</p>
                </div>
              )}
              {proveedor && (
                <div className="col-span-2">
                  <p className="text-slate-500">Proveedor</p>
                  <p className="font-medium">{proveedor}</p>
                </div>
              )}
              {solicitante && (
                <div>
                  <p className="text-slate-500">Solicitante</p>
                  <p className="font-medium">{solicitante}</p>
                </div>
              )}
              {creador && (
                <div>
                  <p className="text-slate-500">Registrado por</p>
                  <p className="font-medium">{creador}</p>
                </div>
              )}
              {observacion && (
                <div className="col-span-2">
                  <p className="text-slate-500">Observación</p>
                  <p className="font-medium">{observacion}</p>
                </div>
              )}
            </div>
          </section>

          {/* Productos */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Productos ({productos.length})
            </p>

            {loading && (
              <p className="text-[11px] text-slate-500">
                Cargando productos…
              </p>
            )}

            {!loading && productos.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No hay productos registrados en este documento.
              </p>
            )}

            <div className="space-y-2">
              {productos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                >
                  <div className="mt-1 text-lg">📦</div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-800">
                        {p.productoNombre}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-900">
                        {p.cantidad}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Código: {p.productoCodigo}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Lote: {p.loteCodigo ?? "-"}
                    </p>
                    {p.fincaNombre && (
                      <p className="text-[10px] text-slate-400">
                        Finca: {p.fincaNombre}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
