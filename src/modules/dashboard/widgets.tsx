import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  DollarSign,
  Info,
  Ruler,
  Sprout,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Alerta, Formato, Grafica, Kpi, ResumenItem } from "@/services/dashboardService";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b"];

function formatValue(value: number, formato: Formato) {
  switch (formato) {
    case "moneda":
      return `Q${value.toLocaleString("es-GT", { maximumFractionDigits: 0 })}`;
    case "libras":
      return `${value.toLocaleString("es-GT", { maximumFractionDigits: 0 })} lb`;
    case "metros":
      return `${value.toLocaleString("es-GT", { maximumFractionDigits: 1 })} lb/m`;
    default:
      return value.toLocaleString("es-GT");
  }
}

const KPI_ICONS: Record<NonNullable<Kpi["icono"]>, LucideIcon> = {
  movimientos: Activity,
  stock: AlertTriangle,
  solicitudes: ClipboardList,
  inventario: DollarSign,
  cosecha: Sprout,
  despacho: Truck,
  lote: Ruler,
};

export function KpiCard({ kpi, color }: { kpi: Kpi; color: string }) {
  const Icon = KPI_ICONS[kpi.icono ?? "movimientos"] ?? Boxes;
  const data = kpi.tendencia.map((v, i) => ({ i, v }));
  const config = { v: { label: kpi.label, color } } satisfies ChartConfig;
  const variacion = kpi.variacionPct;

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: `${color}1f`, color }}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500">{kpi.label}</p>
          <p className="text-2xl font-bold text-slate-900">{formatValue(kpi.value, kpi.formato)}</p>
          <p className="truncate text-xs text-slate-500">{kpi.descripcion}</p>
        </div>
        <div className="flex w-24 shrink-0 flex-col items-end gap-1">
          {variacion !== null && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold",
                variacion > 0 && "text-emerald-600",
                variacion < 0 && "text-rose-600",
                variacion === 0 && "text-slate-500",
              )}
            >
              {variacion > 0 && <ArrowUpRight size={14} />}
              {variacion < 0 && <ArrowDownRight size={14} />}
              {Math.abs(variacion)}%
            </span>
          )}
          <ChartContainer config={config} className="aspect-auto h-10 w-full">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <Area dataKey="v" type="monotone" stroke="var(--color-v)" fill="var(--color-v)" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartCard({ grafica }: { grafica: Grafica }) {
  const config = Object.fromEntries(
    grafica.series.map((s, i) => [s.key, { label: s.label, color: COLORS[i % COLORS.length] }]),
  ) satisfies ChartConfig;
  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis tickLine={false} axisLine={false} width={40} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{grafica.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          {grafica.tipo === "barras" ? (
            <BarChart data={grafica.datos}>
              {axes}
              {grafica.series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={grafica.datos}>
              {axes}
              {grafica.series.map((s) => (
                <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ResumenCard({ items }: { items: ResumenItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del día</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, i) => {
          const pct = item.total ? Math.min(100, Math.round((item.value / item.total) * 100)) : null;
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{formatValue(item.value, item.formato)}</span>
              </div>
              {pct !== null && (
                <Progress
                  value={pct}
                  className="h-2 [&>[data-slot=progress-indicator]]:bg-[var(--progress-color)]"
                  style={{ "--progress-color": COLORS[i % COLORS.length] } as React.CSSProperties}
                />
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-500">Sin actividad hoy.</p>}
      </CardContent>
    </Card>
  );
}

const NIVELES = {
  info: { icon: Info, className: "bg-sky-50 text-sky-600" },
  warning: { icon: AlertTriangle, className: "bg-amber-50 text-amber-600" },
  danger: { icon: AlertTriangle, className: "bg-rose-50 text-rose-600" },
} as const;

export function AlertasCard({ alertas }: { alertas: Alerta[] }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100">
        {alertas.map((alerta) => {
          const { icon: Icon, className } = NIVELES[alerta.nivel];
          return (
            <div key={alerta.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={cn("rounded-lg p-2", className)}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{alerta.titulo}</p>
                <p className="text-xs text-slate-500">{alerta.descripcion}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={alerta.ruta}>Ver</Link>
              </Button>
            </div>
          );
        })}
        {alertas.length === 0 && <p className="text-sm text-slate-500">Sin alertas.</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
