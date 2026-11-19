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
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Alerta, Grafica, Kpi, ResumenItem } from "@/services/dashboardService";
import { formatValue } from "./format";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#7c3aed"];

const KPI_ICONS: Record<NonNullable<Kpi["icono"]>, LucideIcon> = {
  movimientos: Activity,
  stock: AlertTriangle,
  solicitudes: ClipboardList,
  inventario: DollarSign,
  cosecha: Sprout,
  despacho: Truck,
  lote: Ruler,
};

/**
 * Tarjeta de KPI compacta y legible:
 * - Icono + etiqueta arriba (label con clamp a 2 líneas, nunca se corta a media palabra).
 * - Valor grande protagonista.
 * - Descripción con clamp a 2 líneas.
 * - Sparkline como FONDO (absoluto, detrás del contenido): no invade el layout ni tapa el texto.
 * - Altura fija (`h-[104px]`): todas las tarjetas del grid quedan perfectamente alineadas.
 */
export function KpiCard({ kpi, color }: { kpi: Kpi; color: string }) {
  const Icon = KPI_ICONS[kpi.icono ?? "movimientos"] ?? Boxes;
  const data = (kpi.tendencia ?? []).map((v, i) => ({ i, v }));
  const config = { v: { label: kpi.label, color } } satisfies ChartConfig;
  const variacion = kpi.variacionPct;

  return (
    <Card
      size="sm"
      className="relative h-[92px] overflow-hidden py-0 last:odd:col-span-2 sm:h-[104px] xl:last:odd:col-span-1"
    >
      {data.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 opacity-60">
          <ChartContainer config={config} className="aspect-auto h-9 w-full">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <Area
                dataKey="v"
                type="monotone"
                stroke="var(--color-v)"
                fill="var(--color-v)"
                fillOpacity={0.12}
                strokeWidth={1.75}
                strokeOpacity={0.45}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      <CardContent className="relative z-10 flex h-full flex-col justify-between px-2.5 py-2 sm:px-3 sm:py-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1f`, color }}
            >
              <Icon size={15} />
            </span>
            <p className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">
              {kpi.label}
            </p>
          </div>
          {variacion === null ? (
            <span
              className="shrink-0 text-xs font-medium text-slate-400"
              title="Sin comparación con el periodo anterior"
            >
              —
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex shrink-0 items-center text-xs font-semibold",
                variacion > 0 && "text-emerald-600",
                variacion < 0 && "text-rose-600",
                variacion === 0 && "text-slate-500",
              )}
            >
              {variacion > 0 && <ArrowUpRight size={13} />}
              {variacion < 0 && <ArrowDownRight size={13} />}
              {Math.abs(variacion)}%
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xl font-bold leading-none tracking-tight text-slate-900 sm:text-2xl">
            {formatValue(kpi.value, kpi.formato)}
          </p>
          <p className="line-clamp-1 text-[11px] leading-snug text-slate-400">
            {kpi.descripcion}
          </p>
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
      <XAxis
        dataKey="etiqueta"
        tickLine={false}
        axisLine={false}
        tickMargin={6}
        fontSize={10}
        interval="preserveStartEnd"
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={28}
        fontSize={10}
        tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
      <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-[11px]" />} />
    </>
  );

  return (
    <Card size="sm" className="h-full min-h-[180px] lg:min-h-0">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">{grafica.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pb-2">
        {/* h-full: la gráfica ocupa el alto que el grid le asigna, sin scroll */}
        <ChartContainer config={config} className="aspect-auto h-full min-h-32 w-full">
          {grafica.tipo === "barras" ? (
            <BarChart data={grafica.datos} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              {axes}
              {grafica.series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={grafica.datos} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
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
    <Card size="sm" className="lg:h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Resumen del día</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((item, i) => {
          const hasTotal = item.total !== null && item.total > 0;
          const pct = hasTotal ? Math.min(100, Math.round((item.value / (item.total as number)) * 100)) : null;
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-slate-600">{item.label}</span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {formatValue(item.value, item.formato)}
                  {/* guía §6.6: si hay total, mostrar "value de total" */}
                  {item.total !== null && (
                    <span className="ml-1 font-normal text-slate-400">
                      de {formatValue(item.total, item.formato)}
                    </span>
                  )}
                </span>
              </div>
              {pct !== null && (
                <Progress
                  value={pct}
                  className="h-1.5 [&>[data-slot=progress-indicator]]:bg-[var(--progress-color)]"
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
  info: { icon: Info, badge: "outline" as const, className: "bg-sky-50 text-sky-600" },
  warning: { icon: AlertTriangle, badge: "warning" as const, className: "bg-amber-50 text-amber-600" },
  danger: { icon: AlertTriangle, badge: "danger" as const, className: "bg-rose-50 text-rose-600" },
};

export function AlertasCard({ alertas }: { alertas: Alerta[] }) {
  // guía §6.7: si no hay alertas, no renderizar la sección (el modo simple siempre viene vacío).
  if (alertas.length === 0) return null;

  return (
    <Card size="sm" className="lg:h-full lg:min-h-0">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-1">
        <CardTitle className="text-sm">Alertas</CardTitle>
        <Badge variant="outline">{alertas.length}</Badge>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {alertas.map((alerta) => {
            const { icon: Icon, className, badge } = NIVELES[alerta.nivel];
            return (
              <div key={alerta.id} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                <div className={cn("mt-0.5 rounded-md p-1.5", className)}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-slate-900">{alerta.titulo}</p>
                    <Badge variant={badge} className="shrink-0 px-1.5">
                      {alerta.cantidad}
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-xs text-slate-500">{alerta.descripcion}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="h-7 shrink-0 px-2 text-xs">
                  <Link to={alerta.ruta}>Ver</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton({ kpiCount = 4 }: { kpiCount?: number }) {
  return (
    <div className="flex flex-col gap-3 lg:h-full">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {Array.from({ length: kpiCount }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl last:odd:col-span-2 sm:h-24 xl:last:odd:col-span-1" />
        ))}
      </div>
      <div className="grid min-h-48 grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <Skeleton className="h-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-full rounded-xl" />
      </div>
    </div>
  );
}
