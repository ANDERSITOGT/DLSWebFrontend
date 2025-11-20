// src/modules/inicio/InicioBodeguero.tsx
import { StatCard } from "../../components/ui/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";

// ICONOS
import { ClipboardList, AlertTriangle } from "lucide-react";

export function InicioBodeguero() {
  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Inicio</h1>
        <p className="text-sm text-slate-500">
          Panel de control y resumen para el rol BODEGUERO.
        </p>
      </header>

      {/* Indicadores superiores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        <StatCard
          label="Pendientes"
          value={2}
          variant="blue"
          description="Solicitudes por atender"
          icon={<ClipboardList className="w-4 h-4 text-sky-500" />}
        />
        <StatCard
          label="Stock Bajo"
          value={8}
          variant="orange"
          description="Productos con existencias críticas"
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Solicitudes por atender */}
      <section className="space-y-3">
        <SectionTitle
          title="Solicitudes por Atender"
          rightSlot={
            <button className="text-xs font-medium text-sky-600 hover:underline">
              Ver todas las solicitudes
            </button>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 max-w-4xl">
          {/* Solicitud pendiente */}
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    SOL-2025-0012
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Juan Pérez
                    <br />
                    Bodega Central
                  </CardDescription>
                </div>
                <Badge variant="warning">PENDIENTE</Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>5 productos</span>
                <span>2025-11-17</span>
              </div>
            </CardContent>
          </Card>

          {/* Solicitud aprobada */}
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    SOL-2025-0011
                  </CardTitle>
                  <CardDescription className="text-xs">
                    María González
                    <br />
                    Bodega Norte
                  </CardDescription>
                </div>
                <Badge variant="success">APROBADA</Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>3 productos</span>
                <span>2025-11-16</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Últimos movimientos del día */}
      <section className="space-y-3 max-w-3xl">
        <SectionTitle title="Últimos Movimientos del Día" />

        <Card className="rounded-2xl">
          <CardContent className="divide-y divide-slate-100 p-0">
            {/* Movimiento 1 */}
            <MovimientoRow
              codigo="SAL-2025-00034"
              tipo="SALIDA"
              variant="danger"
              productos="2 productos"
              fecha="2025-11-18 14:30"
            />
            {/* Movimiento 2 */}
            <MovimientoRow
              codigo="ING-2025-00089"
              tipo="INGRESO"
              variant="success"
              productos="1 productos"
              fecha="2025-11-18 12:15"
            />
            {/* Movimiento 3 */}
            <MovimientoRow
              codigo="TRF-2025-00012"
              tipo="TRANSFERENCIA"
              variant="outline"
              productos="1 productos"
              fecha="2025-11-18 10:45"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type MovimientoVariant = "success" | "danger" | "outline";

type MovimientoRowProps = {
  codigo: string;
  tipo: string;
  productos: string;
  fecha: string;
  variant: MovimientoVariant;
};

function MovimientoRow({
  codigo,
  tipo,
  productos,
  fecha,
  variant,
}: MovimientoRowProps) {
  const colorMap: Record<MovimientoVariant, string> = {
    success: "text-emerald-500 border-emerald-200",
    danger: "text-rose-500 border-rose-200",
    outline: "text-sky-500 border-sky-200",
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs",
            colorMap[variant]
          )}
        >
          ●
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">
            {codigo}
          </span>
          <span className="text-xs text-slate-500">{productos}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <Badge
          variant="outline"
          className="text-[11px] px-2 py-0.5 uppercase tracking-wide"
        >
          {tipo}
        </Badge>
        <span className="text-[11px] text-slate-500">{fecha}</span>
      </div>
    </div>
  );
}
