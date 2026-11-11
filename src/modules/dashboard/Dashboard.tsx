import { useModulo } from "@/context/ModuleContext";
import { useDashboard } from "./useDashboard";
import { AlertasCard, ChartCard, DashboardSkeleton, KpiCard, ResumenCard } from "./widgets";

const KPI_COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#7c3aed"];

export function Dashboard() {
  const { modulo } = useModulo();
  const { data, error, loading } = useDashboard(modulo);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inicio</h1>
        <p className="text-sm text-slate-600">
          Resumen de {modulo === "BODEGA" ? "Bodega" : "Cosechas"}
        </p>
      </header>

      {loading && <DashboardSkeleton />}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudo cargar el dashboard: {error}
        </div>
      )}

      {data && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {data.kpis.map((kpi, i) => (
                <KpiCard key={kpi.id} kpi={kpi} color={KPI_COLORS[i % KPI_COLORS.length]} />
              ))}
            </div>
            <div className="grid gap-4 2xl:grid-cols-2">
              {data.graficas.map((g) => (
                <ChartCard key={g.id} grafica={g} />
              ))}
            </div>
          </div>
          <aside className="space-y-6">
            <ResumenCard items={data.resumenDia} />
            <AlertasCard alertas={data.alertas} />
          </aside>
        </div>
      )}
    </section>
  );
}
