// src/modules/movimientos/MovimientosLotesPage.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";

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

type TipoMovimientoAplicacion = "SALIDA"; // por ahora solo SALIDA (aplicaciones)

type LoteAplicacion = {
  id: string;
  tipo: TipoMovimientoAplicacion;
  documentoId: string;
  producto: string;
  cantidad: string; // "10 L"
  bodega: string;
  fecha: string; // ISO o texto
};

// Detalle que se muestra en el modal
type DetalleLote = {
  lote: LoteResumen;
  aplicaciones: LoteAplicacion[];
};

// -----------------------------
// MOCK (luego vendrá el backend)
// -----------------------------
const MOCK_LOTES: LoteResumen[] = [
  {
    id: "1",
    codigo: "L-2024-089",
    finca: "Finca El Roble",
    cultivo: "Tomate",
    area: "2.5 mz",
    estado: "ACTIVO",
    aplicacionesCount: 3,
  },
  {
    id: "2",
    codigo: "L-2024-095",
    finca: "Finca Los Ángeles",
    cultivo: "Pepino",
    area: "1.8 mz",
    estado: "ACTIVO",
    aplicacionesCount: 2,
  },
  {
    id: "3",
    codigo: "L-2024-102",
    finca: "Finca Santa María",
    cultivo: "Tomate",
    area: "3.0 mz",
    estado: "ACTIVO",
    aplicacionesCount: 2,
  },
  {
    id: "4",
    codigo: "L-2024-110",
    finca: "Finca El Roble",
    cultivo: "Pimiento",
    area: "1.5 mz",
    estado: "ACTIVO",
    aplicacionesCount: 3,
  },
  {
    id: "5",
    codigo: "L-2024-121",
    finca: "Finca Los Ángeles",
    cultivo: "Tomate",
    area: "2.0 mz",
    estado: "ACTIVO",
    aplicacionesCount: 1,
  },
];

// Historial falso por ahora (normalmente vendrá del backend)
const MOCK_APLICACIONES_POR_LOTE: Record<string, LoteAplicacion[]> = {
  "1": [
    {
      id: "a1",
      tipo: "SALIDA",
      documentoId: "SAL-2025-00034",
      producto: "Herbicida Glifosato",
      cantidad: "10 L",
      bodega: "Bodega Central",
      fecha: "2025-11-17T06:53:00",
    },
    {
      id: "a2",
      tipo: "SALIDA",
      documentoId: "SAL-2025-00025",
      producto: "Herbicida Glifosato",
      cantidad: "12 L",
      bodega: "Bodega Norte",
      fecha: "2025-11-08T06:50:00",
    },
  ],
  "2": [
    {
      id: "b1",
      tipo: "SALIDA",
      documentoId: "SAL-2025-00040",
      producto: "Fertilizante NPK 20-20-20",
      cantidad: "8 kg",
      bodega: "Bodega Central",
      fecha: "2025-11-20T09:30:00",
    },
  ],
  // etc. puedes completar luego
};

// -----------------------------
// Página de Lotes
// -----------------------------
export function MovimientosPage() {
  const [lotes] = useState<LoteResumen[]>(MOCK_LOTES);

  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DetalleLote | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // click en tarjeta → abre modal inmediato con info básica y carga historial
  const handleClickLote = async (lote: LoteResumen) => {
    // Detalle provisional (sin historial todavía)
    const detalleBase: DetalleLote = {
      lote,
      aplicaciones: [],
    };

    setDetalleSeleccionado(detalleBase);
    setCargandoDetalle(true);

    try {
      // aquí luego llamaremos al backend: GET /api/movimientos/lotes/:id
      // por ahora usamos MOCK_APLICACIONES_POR_LOTE
      const aplicaciones =
        MOCK_APLICACIONES_POR_LOTE[lote.id] ?? [];

      // simulación de retardo leve para ver el "cargando"
      // await new Promise((r) => setTimeout(r, 400));

      setDetalleSeleccionado({
        lote,
        aplicaciones,
      });
    } catch (error) {
      console.error("Error al cargar detalle de lote:", error);
      // más adelante podríamos mostrar un toast
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModal = () => {
    setDetalleSeleccionado(null);
    setCargandoDetalle(false);
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
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium",
              "text-slate-500"
            )}
          >
            Movimientos
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium",
              "bg-white text-slate-900 shadow-sm"
            )}
          >
            Lotes
          </button>
        </div>
      </section>

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

      {/* Modal detalle */}
      {detalleSeleccionado && (
        <LoteDetalleModal
          detalle={detalleSeleccionado}
          loading={cargandoDetalle}
          onClose={cerrarModal}
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
};

function LoteDetalleModal({
  detalle,
  loading,
  onClose,
}: LoteDetalleModalProps) {
  const { lote, aplicaciones } = detalle;

  const estadoColor =
    lote.estado === "ACTIVO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-slate-100 text-slate-500 border-slate-200";

  const handleExportHistorial = () => {
    // Más adelante aquí llamaremos al backend para generar el PDF
    // Por ahora solo un log.
    console.log("Exportar historial de lote:", lote.codigo);
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
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-800">
                        {ap.documentoId}
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
                      Cantidad: {ap.cantidad} · Bodega: {ap.bodega}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(ap.fecha).toLocaleDateString()}
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
