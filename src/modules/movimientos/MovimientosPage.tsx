// src/modules/movimientos/MovimientosPage.tsx
import { useState } from "react";
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

// ------------------------------------
// Tipos
// ------------------------------------
type TipoDocumento = "INGRESO" | "SALIDA" | "TRANSFERENCIA";
type EstadoDocumento = "BORRADOR" | "APROBADO";

type MovimientoResumen = {
  id: string;
  codigo: string; // SAL-2025-00034
  tipo: TipoDocumento;
  estado: EstadoDocumento;
  origen?: string | null;
  destino?: string | null;
  proveedor?: string | null;
  productosCount: number;
  fecha: string; // ISO
};

type MovimientoProductoDetalle = {
  id: string;
  nombreProducto: string;
  codigoProducto: string;
  cantidad: string; // "50 kg", "10 L"
  loteCodigo: string;
};

type DetalleDocumento = {
  documento: MovimientoResumen;
  productos: MovimientoProductoDetalle[];
};

// ------------------------------------
// MOCK DATA (luego se conectará al backend)
// ------------------------------------
const MOCK_MOVIMIENTOS: MovimientoResumen[] = [
  {
    id: "m1",
    codigo: "SAL-2025-00034",
    tipo: "SALIDA",
    estado: "APROBADO",
    origen: "Bodega Central",
    destino: null,
    proveedor: null,
    productosCount: 2,
    fecha: "2025-11-17T00:00:00",
  },
  {
    id: "m2",
    codigo: "ING-2025-00089",
    tipo: "INGRESO",
    estado: "APROBADO",
    origen: null,
    destino: "Bodega Central",
    proveedor: "Agroquímicos del Valle S.A.",
    productosCount: 1,
    fecha: "2025-11-17T00:00:00",
  },
  {
    id: "m3",
    codigo: "TRF-2025-00012",
    tipo: "TRANSFERENCIA",
    estado: "APROBADO",
    origen: "Bodega Central",
    destino: "Bodega Norte",
    proveedor: null,
    productosCount: 1,
    fecha: "2025-11-16T00:00:00",
  },
];

const MOCK_DETALLE_POR_DOC: Record<string, DetalleDocumento> = {
  m1: {
    documento: MOCK_MOVIMIENTOS[0],
    productos: [
      {
        id: "p1",
        nombreProducto: "Fertilizante NPK 20-20-20",
        codigoProducto: "FERT-001",
        cantidad: "50 kg",
        loteCodigo: "L-2024-089",
      },
      {
        id: "p2",
        nombreProducto: "Herbicida Glifosato",
        codigoProducto: "HERB-012",
        cantidad: "10 L",
        loteCodigo: "L-2024-095",
      },
    ],
  },
  m2: {
    documento: MOCK_MOVIMIENTOS[1],
    productos: [
      {
        id: "p3",
        nombreProducto: "Insecticida Orgánico",
        codigoProducto: "INSEC-019",
        cantidad: "25 L",
        loteCodigo: "L-2024-102",
      },
    ],
  },
  m3: {
    documento: MOCK_MOVIMIENTOS[2],
    productos: [
      {
        id: "p4",
        nombreProducto: "Fertilizante NPK 20-20-20",
        codigoProducto: "FERT-001",
        cantidad: "40 kg",
        loteCodigo: "L-2024-110",
      },
    ],
  },
};

// ------------------------------------
// Página principal de Movimientos
// ------------------------------------
export function MovimientosPage() {
  const [movimientos] = useState<MovimientoResumen[]>(MOCK_MOVIMIENTOS);

  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DetalleDocumento | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Al hacer click en una tarjeta abrimos el modal rápido y cargamos detalle
  const handleClickMovimiento = async (mov: MovimientoResumen) => {
    setCargandoDetalle(true);

    try {
      // Más adelante aquí haremos fetch al backend:
      // const res = await fetch(`/api/movimientos/${mov.id}`);
      // const detalleReal = await res.json();
      // Por ahora usamos el mock:
      const detalleMock = MOCK_DETALLE_POR_DOC[mov.id] ?? {
        documento: mov,
        productos: [],
      };

      setDetalleSeleccionado(detalleMock);
    } catch (error) {
      console.error("Error al cargar detalle de movimiento:", error);
      setDetalleSeleccionado({
        documento: mov,
        productos: [],
      });
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
        <h1 className="text-xl font-semibold text-slate-900">Movimientos</h1>
        <p className="text-sm text-slate-500">
          Documentos de entrada y salida.
        </p>
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
  }[movimiento.tipo];

  const estadoColor: string =
    movimiento.estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  const fechaCorta = new Date(movimiento.fecha).toLocaleDateString();

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
          <span>
            {movimiento.productosCount}{" "}
            {movimiento.productosCount === 1 ? "producto" : "productos"}
          </span>
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
  detalle: DetalleDocumento;
  loading: boolean;
  onClose: () => void;
};

function MovimientoDetalleModal({
  detalle,
  loading,
  onClose,
}: MovimientoDetalleModalProps) {
  const { documento, productos } = detalle;

  const tipoColor: string = {
    INGRESO: "bg-emerald-50 text-emerald-700 border-emerald-100",
    SALIDA: "bg-rose-50 text-rose-700 border-rose-100",
    TRANSFERENCIA: "bg-sky-50 text-sky-700 border-sky-100",
  }[documento.tipo];

  const estadoColor: string =
    documento.estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  const fechaCorta = new Date(documento.fecha).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {documento.codigo}
            </h2>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  tipoColor
                )}
              >
                {documento.tipo}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  estadoColor
                )}
              >
                {documento.estado}
              </Badge>
            </div>
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
              {documento.origen && (
                <div>
                  <p className="text-slate-500">
                    {documento.tipo === "INGRESO" ? "Bodega Destino" : "Bodega Origen"}
                  </p>
                  <p className="font-medium">{documento.origen}</p>
                </div>
              )}
              {documento.destino && (
                <div>
                  <p className="text-slate-500">
                    {documento.tipo === "TRANSFERENCIA"
                      ? "Bodega Destino"
                      : "Destino"}
                  </p>
                  <p className="font-medium">{documento.destino}</p>
                </div>
              )}
              {documento.proveedor && (
                <div className="col-span-2">
                  <p className="text-slate-500">Proveedor</p>
                  <p className="font-medium">{documento.proveedor}</p>
                </div>
              )}
            </div>
          </section>

          {/* Productos */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Productos{" "}
              {productos.length > 0 && `(${productos.length})`}
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
                  <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-[13px]">
                    📦
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-800">
                        {p.nombreProducto}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-900">
                        {p.cantidad}
                      </span>
                    </div>
                    <CardDescription className="text-[10px]">
                      Código: {p.codigoProducto}
                    </CardDescription>
                    <p className="text-[10px] text-slate-500">
                      Lote: {p.loteCodigo}
                    </p>
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
