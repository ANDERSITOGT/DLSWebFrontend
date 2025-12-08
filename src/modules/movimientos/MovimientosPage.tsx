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

// -----------------------------
// Tipos
// -----------------------------
type TipoDocumento = "INGRESO" | "SALIDA" | "TRANSFERENCIA";
type EstadoDocumento = "BORRADOR" | "APROBADO";

type MovimientoResumen = {
  id: string;
  codigo: string; // ej. SAL-2025-00034
  tipo: TipoDocumento;
  estado: EstadoDocumento;
  origen?: string; // bodega origen
  destino?: string; // bodega destino
  proveedor?: string;
  productosCount: number;
  fecha: string; // ISO o texto
};

// -----------------------------
// MOCK (luego conectamos al backend)
// -----------------------------
const MOCK_MOVIMIENTOS: MovimientoResumen[] = [
  {
    id: "1",
    codigo: "SAL-2025-00034",
    tipo: "SALIDA",
    estado: "APROBADO",
    origen: "Bodega Central",
    productosCount: 2,
    fecha: "2025-11-17T06:53:00",
  },
  {
    id: "2",
    codigo: "ING-2025-00089",
    tipo: "INGRESO",
    estado: "APROBADO",
    destino: "Bodega Central",
    proveedor: "Agroquímicos del Valle S.A.",
    productosCount: 1,
    fecha: "2025-11-17T10:15:00",
  },
  {
    id: "3",
    codigo: "TRF-2025-00012",
    tipo: "TRANSFERENCIA",
    estado: "APROBADO",
    origen: "Bodega Central",
    destino: "Bodega Norte",
    productosCount: 1,
    fecha: "2025-11-16T09:20:00",
  },
];

// -----------------------------
// Página de Movimientos (documentos)
// -----------------------------
export function MovimientosPage() {
  const [movimientos] = useState<MovimientoResumen[]>(MOCK_MOVIMIENTOS);

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

      {/* Tabs superiores: aquí Movimientos está activo */}
      <section className="space-y-4">
        <SectionTitle title="Movimientos" />

        <div className="flex rounded-full bg-slate-100 p-1 w-full max-w-xs">
          {/* Tab Movimientos (activo) */}
          <button
            type="button"
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium",
              "bg-white text-slate-900 shadow-sm"
            )}
          >
            Movimientos
          </button>

          {/* Tab Lotes → navega a /movimientos/lotes */}
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

      {/* Lista de movimientos */}
      <section className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {movimientos.map((mov) => (
            <MovimientoCard key={mov.id} movimiento={mov} />
          ))}
        </div>
      </section>
    </div>
  );
}

// -----------------------------
// Tarjeta de movimiento
// -----------------------------
type MovimientoCardProps = {
  movimiento: MovimientoResumen;
};

function MovimientoCard({ movimiento }: MovimientoCardProps) {
  const { codigo, tipo, estado, origen, destino, proveedor, productosCount, fecha } =
    movimiento;

  const tipoColor: string = {
    INGRESO: "bg-emerald-50 text-emerald-600 border-emerald-100",
    SALIDA: "bg-rose-50 text-rose-600 border-rose-100",
    TRANSFERENCIA: "bg-sky-50 text-sky-600 border-sky-100",
  }[tipo];

  const estadoColor: string =
    estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-amber-50 text-amber-600 border-amber-100";

  const fechaTexto = new Date(fecha).toLocaleDateString();

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: código + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[16px] leading-none">📄</span>
            <CardTitle className="text-sm font-semibold">
              {codigo}
            </CardTitle>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-2 py-0.5 uppercase tracking-wide border",
                tipoColor
              )}
            >
              {tipo}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-2 py-0.5 uppercase tracking-wide border",
                estadoColor
              )}
            >
              {estado}
            </Badge>
          </div>
        </div>

        {/* Cuerpo: origen/destino/proveedor */}
        <div className="space-y-0.5 text-xs text-slate-600">
          {origen && (
            <CardDescription className="text-xs text-slate-600">
              Origen: {origen}
            </CardDescription>
          )}
          {destino && (
            <CardDescription className="text-xs text-slate-600">
              Destino: {destino}
            </CardDescription>
          )}
          {proveedor && (
            <CardDescription className="text-xs text-slate-600">
              Proveedor: {proveedor}
            </CardDescription>
          )}
        </div>

        {/* Footer: productos + fecha */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>{productosCount} productos</span>
          <span>{fechaTexto}</span>
        </div>
      </CardContent>
    </Card>
  );
}
