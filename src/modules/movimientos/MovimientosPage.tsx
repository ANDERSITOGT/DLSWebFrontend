// src/modules/movimientos/MovimientosPage.tsx
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
  aplicaciones: number;
  estado: EstadoLote;
};

type TipoDocumento = "INGRESO" | "SALIDA" | "TRANSFERENCIA";

type AplicacionLote = {
  id: string;
  documentoId: string;
  tipo: TipoDocumento;
  producto: string;
  cantidad: string; // "10 L"
  bodega: string;
  fecha: string; // ISO
};

type LoteDetalle = {
  lote: LoteResumen;
  aplicaciones: AplicacionLote[];
};

// -----------------------------
// MOCK: Lotes
// -----------------------------
const MOCK_LOTES: LoteResumen[] = [
  {
    id: "l-2024-089",
    codigo: "L-2024-089",
    finca: "Finca El Roble",
    cultivo: "Tomate",
    area: "2.5 mz",
    aplicaciones: 3,
    estado: "ACTIVO",
  },
  {
    id: "l-2024-095",
    codigo: "L-2024-095",
    finca: "Finca Los Ángeles",
    cultivo: "Pepino",
    area: "1.8 mz",
    aplicaciones: 2,
    estado: "ACTIVO",
  },
  {
    id: "l-2024-102",
    codigo: "L-2024-102",
    finca: "Finca Santa María",
    cultivo: "Tomate",
    area: "3.0 mz",
    aplicaciones: 2,
    estado: "ACTIVO",
  },
  {
    id: "l-2024-110",
    codigo: "L-2024-110",
    finca: "Finca El Roble",
    cultivo: "Pimiento",
    area: "1.5 mz",
    aplicaciones: 3,
    estado: "ACTIVO",
  },
  {
    id: "l-2024-121",
    codigo: "L-2024-121",
    finca: "Finca Los Ángeles",
    cultivo: "Tomate",
    area: "2.0 mz",
    aplicaciones: 1,
    estado: "ACTIVO",
  },
];

// -----------------------------
// MOCK: Detalle por lote
// (en la vida real esto vendrá del backend)
// -----------------------------
const MOCK_DETALLES: Record<string, LoteDetalle> = {
  "l-2024-095": {
    lote: MOCK_LOTES[1],
    aplicaciones: [
      {
        id: "mov-1",
        documentoId: "SAL-2025-00034",
        tipo: "SALIDA",
        producto: "Herbicida Glifosato",
        cantidad: "10 L",
        bodega: "Bodega Central",
        fecha: "2025-11-17T14:30:00",
      },
      {
        id: "mov-2",
        documentoId: "SAL-2025-00025",
        tipo: "SALIDA",
        producto: "Herbicida Glifosato",
        cantidad: "12 L",
        bodega: "Bodega Norte",
        fecha: "2025-11-08T09:15:00",
      },
    ],
  },
};

// Para los lotes que no tengan detalle explícito arriba
function getDetalleMock(lote: LoteResumen): LoteDetalle {
  const existente = MOCK_DETALLES[lote.id];
  if (existente) return existente;

  // detalle por defecto sin aplicaciones
  return {
    lote,
    aplicaciones: [],
  };
}

// -----------------------------
// Página principal de Movimientos
// -----------------------------
export function MovimientosPage() {
  const [tab, setTab] = useState<"movimientos" | "lotes">("lotes");

  // En el futuro vendrán del backend
  const [lotes] = useState<LoteResumen[]>(MOCK_LOTES);

  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteResumen | null>(
    null
  );

  const abrirDetalleLote = (lote: LoteResumen) => {
    setLoteSeleccionado(lote);
  };

  const cerrarModal = () => setLoteSeleccionado(null);

  return (
    <div className="space-y-6">
      {/* Encabezado general */}
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Movimientos</h1>
        <p className="text-sm text-slate-500">
          Documentos de entrada y salida.
        </p>
      </header>

      {/* Tabs Movimientos / Lotes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title={tab === "lotes" ? "Lotes" : "Movimientos"} />
        </div>

        <div className="flex max-w-md rounded-full bg-slate-100 p-1 text-xs">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 px-3 text-center transition",
              tab === "movimientos"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500"
            )}
            onClick={() => setTab("movimientos")}
          >
            Movimientos
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 px-3 text-center transition",
              tab === "lotes"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500"
            )}
            onClick={() => setTab("lotes")}
          >
            Lotes
          </button>
        </div>
      </section>

      {/* Contenido según tab */}
      {tab === "lotes" ? (
        <section className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lotes.map((lote) => (
              <LoteCard
                key={lote.id}
                lote={lote}
                onClick={() => abrirDetalleLote(lote)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {/* Placeholder por ahora, luego lo sustituimos por la lista real */}
          <p className="text-sm text-slate-500">
            Vista de <strong>Movimientos</strong> aún pendiente de implementar.
          </p>
        </section>
      )}

      {/* Modal de detalle de lote */}
      {loteSeleccionado && (
        <LoteDetalleModal
          detalle={getDetalleMock(loteSeleccionado)}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}

// -----------------------------
// Tarjeta de Lote
// -----------------------------
type LoteCardProps = {
  lote: LoteResumen;
  onClick: () => void;
};

function LoteCard({ lote, onClick }: LoteCardProps) {
  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header código + estado */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="text-emerald-500">📍</span>
              {lote.codigo}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Finca: {lote.finca}
            </CardDescription>
            <CardDescription className="text-xs text-slate-600">
              Cultivo: {lote.cultivo}
            </CardDescription>
            <CardDescription className="text-xs text-slate-600">
              Área: {lote.area}
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-100"
            >
              {lote.estado}
            </Badge>
            <span className="text-slate-400 text-xs">›</span>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Footer: aplicaciones */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {lote.aplicaciones}{" "}
            {lote.aplicaciones === 1 ? "aplicación" : "aplicaciones"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Modal de detalle de lote
// -----------------------------
type LoteDetalleModalProps = {
  detalle: LoteDetalle;
  onClose: () => void;
};

function LoteDetalleModal({ detalle, onClose }: LoteDetalleModalProps) {
  const { lote, aplicaciones } = detalle;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              {lote.codigo}
            </h2>
            <p className="text-[11px] text-slate-500">{lote.finca}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-100"
            >
              {lote.estado}
            </Badge>
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
          {/* Información del lote */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Información del Lote
            </p>
            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 grid grid-cols-2 gap-y-1 gap-x-4 text-[11px]">
              <p className="text-slate-500">Código</p>
              <p className="text-slate-800">{lote.codigo}</p>

              <p className="text-slate-500">Finca</p>
              <p className="text-slate-800">{lote.finca}</p>

              <p className="text-slate-500">Cultivo</p>
              <p className="text-slate-800">{lote.cultivo}</p>

              <p className="text-slate-500">Área</p>
              <p className="text-slate-800">{lote.area}</p>
            </div>
          </section>

          {/* Historial de aplicaciones */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Historial de Aplicaciones ({aplicaciones.length})
            </p>

            {aplicaciones.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No hay aplicaciones registradas para este lote.
              </p>
            )}

            <div className="space-y-2">
              {aplicaciones.map((ap) => {
                const esSalida = ap.tipo === "SALIDA";
                const colorTipo = esSalida
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : ap.tipo === "INGRESO"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-sky-50 text-sky-600 border-sky-100";

                const fechaCorta = new Date(ap.fecha).toLocaleDateString();

                return (
                  <div
                    key={ap.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    <div className="mt-1 text-slate-500 text-sm">📄</div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-800">
                          {ap.documentoId}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-2 py-0.5 uppercase tracking-wide border",
                              colorTipo
                            )}
                          >
                            {ap.tipo}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            {fechaCorta}
                          </span>
                          <span className="text-slate-400 text-xs">›</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {ap.producto}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Cantidad: {ap.cantidad}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Bodega: {ap.bodega}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer: botón Exportar historial (sin lógica aún) */}
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            onClick={() => {
              // aquí luego llamamos al backend para exportar el historial del lote
              console.log("Exportar historial de", lote.codigo);
            }}
          >
            ⬇️ Exportar historial
          </button>
        </div>
      </div>
    </div>
  );
}
