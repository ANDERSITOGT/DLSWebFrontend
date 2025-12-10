// src/modules/movimientos/MovimientosPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

// ------------------------------------
// Tipos que corresponden al backend
// ------------------------------------
type MovimientoTipo =
  | "INGRESO"
  | "SALIDA"
  | "TRANSFERENCIA"
  | "AJUSTE"
  | "DEVOLUCION";

type MovimientoEstado = "BORRADOR" | "APROBADO" | "ANULADO";

type MovimientoResumen = {
  id: string;
  codigo: string;
  tipo: MovimientoTipo;
  estado: MovimientoEstado;
  origen: string | null;
  destino: string | null;
  proveedor: string | null;
  productos: string; // "2 productos"
  fecha: string | null; // ISO
};

type ProductoEnMovimiento = {
  id: string;
  productoNombre: string;
  productoCodigo: string;
  cantidad: string; // "50 kg"
  unidad: string;
  loteCodigo: string | null;
  loteId: string | null;
  fincaNombre: string | null;
};

type MovimientoDetalle = {
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

// ------------------------------------
// Página principal de Movimientos
// ------------------------------------
export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoResumen[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<MovimientoDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Cargar listado desde el backend
  useEffect(() => {
    const cargarMovimientos = async () => {
      try {
        setLoadingLista(true);
        setErrorLista(null);

        const res = await fetch(`${API_BASE}/api/movimientos`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = await res.json();
        const data: MovimientoResumen[] = json.movimientos ?? [];
        setMovimientos(data);
      } catch (err) {
        console.error("Error al cargar movimientos:", err);
        setErrorLista("No se pudieron cargar los movimientos.");
      } finally {
        setLoadingLista(false);
      }
    };

    cargarMovimientos();
  }, []);

  // Al hacer click en una tarjeta:
  // 1) Abrimos el modal inmediatamente con info básica.
  // 2) Mostramos "Cargando productos…" mientras llega el detalle real.
  const handleClickMovimiento = async (mov: MovimientoResumen) => {
    // 1) Base para mostrar algo inmediato en el modal
    const detalleBase: MovimientoDetalle = {
      id: mov.id,
      codigo: mov.codigo,
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
      // 2) Pedimos el detalle real al backend
      const res = await fetch(`${API_BASE}/api/movimientos/${mov.id}`);
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = (await res.json()) as MovimientoDetalle;
      setDetalleSeleccionado(data);
    } catch (error) {
      console.error("Error al cargar detalle de movimiento:", error);
      // Dejamos el detalle base y solo apagamos el loader
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModal = () => {
    setDetalleSeleccionado(null);
    setCargandoDetalle(false);
  };

  // Export general (toda la lista)
  const handleExportListado = () => {
    window.open(`${API_BASE}/api/movimientos/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Movimientos</h1>
          <p className="text-sm text-slate-500">
            Documentos de entrada y salida.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportListado}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
        >
          📄 Exportar listado
        </button>
      </header>

      {/* Tabs superiores */}
      <section className="space-y-4">
        <SectionTitle title="Movimientos" />

        <div className="flex rounded-full bg-slate-100 p-1 w-full max-w-xs">
          {/* Tab activo: Movimientos */}
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium",
              "bg-white text-slate-900 shadow-sm"
            )}
          >
            Movimientos
          </button>

          {/* Tab Lotes: navega a /movimientos/lotes */}
          <Link
            to="/movimientos/lotes"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium text-center",
              "text-slate-500 hover:text-slate-700"
            )}
          >
            Lotes
          </Link>
        </div>
      </section>

      {/* Estado de carga / error */}
      {loadingLista && (
        <p className="text-xs text-slate-500">Cargando movimientos…</p>
      )}
      {errorLista && (
        <p className="text-xs text-rose-500">{errorLista}</p>
      )}

      {/* Grid de tarjetas de movimientos */}
      <section className="space-y-3">
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

      {/* Modal de detalle */}
      {detalleSeleccionado && (
        <MovimientoDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}

// ------------------------------------
// Tarjeta individual de movimiento
// ------------------------------------
type MovimientoCardProps = {
  movimiento: MovimientoResumen;
  onClick: () => void;
};

function MovimientoCard({ movimiento, onClick }: MovimientoCardProps) {
  const tipoColor: string = {
    INGRESO: "bg-emerald-50 text-emerald-700 border-emerald-100",
    SALIDA: "bg-rose-50 text-rose-700 border-rose-100",
    TRANSFERENCIA: "bg-sky-50 text-sky-700 border-sky-100",
    AJUSTE: "bg-amber-50 text-amber-700 border-amber-100",
    DEVOLUCION: "bg-violet-50 text-violet-700 border-violet-100",
  }[movimiento.tipo];

  const estadoColor: string =
    movimiento.estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : movimiento.estado === "BORRADOR"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-slate-50 text-slate-600 border-slate-200";

  const fechaCorta = movimiento.fecha
    ? new Date(movimiento.fecha).toLocaleDateString()
    : "-";

  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: código + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[16px] leading-none">📄</span>
            <CardTitle className="text-sm font-semibold">
              {movimiento.codigo}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                tipoColor
              )}
            >
              {movimiento.tipo}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                estadoColor
              )}
            >
              {movimiento.estado}
            </Badge>
          </div>
        </div>

        {/* Info principal */}
        <div className="space-y-0.5 text-xs text-slate-600">
          {movimiento.origen && (
            <p>
              <span className="font-medium">Origen:</span>{" "}
              {movimiento.origen}
            </p>
          )}
          {movimiento.destino && (
            <p>
              <span className="font-medium">Destino:</span>{" "}
              {movimiento.destino}
            </p>
          )}
          {movimiento.proveedor && (
            <p>
              <span className="font-medium">Proveedor:</span>{" "}
              {movimiento.proveedor}
            </p>
          )}
        </div>

        {/* Footer: productos + fecha */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>{movimiento.productos}</span>
          <span>{fechaCorta}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------
// Modal de detalle de movimiento
// ------------------------------------
type MovimientoDetalleModalProps = {
  detalle: MovimientoDetalle;
  loading: boolean;
  onClose: () => void;
};

function MovimientoDetalleModal({
  detalle,
  loading,
  onClose,
}: MovimientoDetalleModalProps) {
  const tipoColor: string = {
    INGRESO: "bg-emerald-50 text-emerald-700 border-emerald-100",
    SALIDA: "bg-rose-50 text-rose-700 border-rose-100",
    TRANSFERENCIA: "bg-sky-50 text-sky-700 border-sky-100",
    AJUSTE: "bg-amber-50 text-amber-700 border-amber-100",
    DEVOLUCION: "bg-violet-50 text-violet-700 border-violet-100",
  }[detalle.tipo];

  const estadoColor: string =
    detalle.estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : detalle.estado === "BORRADOR"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-slate-50 text-slate-600 border-slate-200";

  const fechaCorta = detalle.fecha
    ? new Date(detalle.fecha).toLocaleDateString()
    : "-";

  const handleExportDocumento = () => {
    window.open(`${API_BASE}/api/movimientos/${detalle.id}/export`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {detalle.codigo}
            </h2>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  tipoColor
                )}
              >
                {detalle.tipo}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  estadoColor
                )}
              >
                {detalle.estado}
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
          {/* Información general */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Información del Documento
            </p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-800">
              <div>
                <p className="text-slate-500">Fecha</p>
                <p className="font-medium">{fechaCorta}</p>
              </div>
              {detalle.origen && (
                <div>
                  <p className="text-slate-500">Bodega Origen</p>
                  <p className="font-medium">{detalle.origen}</p>
                </div>
              )}
              {detalle.destino && (
                <div>
                  <p className="text-slate-500">Bodega Destino</p>
                  <p className="font-medium">{detalle.destino}</p>
                </div>
              )}
              {detalle.proveedor && (
                <div className="col-span-2">
                  <p className="text-slate-500">Proveedor</p>
                  <p className="font-medium">{detalle.proveedor}</p>
                </div>
              )}
              {detalle.solicitante && (
                <div>
                  <p className="text-slate-500">Solicitante</p>
                  <p className="font-medium">{detalle.solicitante}</p>
                </div>
              )}
              {detalle.creador && (
                <div>
                  <p className="text-slate-500">Registrado por</p>
                  <p className="font-medium">{detalle.creador}</p>
                </div>
              )}
              {detalle.observacion && (
                <div className="col-span-2">
                  <p className="text-slate-500">Observación</p>
                  <p className="font-medium">{detalle.observacion}</p>
                </div>
              )}
            </div>
          </section>

          {/* Productos */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Productos{" "}
              {detalle.productos.length > 0 &&
                `(${detalle.productos.length})`}
            </p>

            {loading && (
              <p className="text-[11px] text-slate-500">
                Cargando productos…
              </p>
            )}

            {!loading && detalle.productos.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No hay productos registrados en este documento.
              </p>
            )}

            <div className="space-y-2">
              {detalle.productos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                >
                  <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-[13px]">
                    📦
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-800">
                        {p.productoNombre}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-900">
                        {p.cantidad}
                      </span>
                    </div>
                    <CardDescription className="text-[10px]">
                      Código: {p.productoCodigo}
                    </CardDescription>
                    <p className="text-[10px] text-slate-500">
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
