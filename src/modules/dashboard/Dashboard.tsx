import { Link, useNavigate } from "react-router-dom";
import { Plus, ShieldAlert } from "lucide-react";
import { useModulo } from "@/context/ModuleContext";
import { useAuth } from "@/context/AuthContext";
import { canCreateSolicitud, isSimpleMode } from "@/config/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "./useDashboard";
import { AlertasCard, ChartCard, DashboardSkeleton, KpiCard, ResumenCard } from "./widgets";

const KPI_COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#7c3aed"];

/** Copy del título según rol (guía §9.3: misma pantalla, distinto copy). */
function headerCopy(rol: string | undefined, modulo: "BODEGA" | "COSECHAS") {
  if (modulo === "COSECHAS") {
    return { title: "Inicio", subtitle: "Resumen de Cosechas" };
  }
  if (rol === "SOLICITANTE") {
    return { title: "Mis solicitudes", subtitle: "Resumen de tu actividad" };
  }
  if (rol === "VISOR") {
    return { title: "Solicitudes", subtitle: "Resumen general" };
  }
  return { title: "Inicio", subtitle: "Resumen de Bodega" };
}

function SinAcceso() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <div className="rounded-full bg-rose-50 p-3 text-rose-600">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Sin acceso a este módulo</h2>
        <p className="text-sm text-slate-500">
          Tu rol no tiene permisos para ver el contenido de este módulo.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { modulo } = useModulo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading } = useDashboard(modulo);

  const { title, subtitle } = headerCopy(user?.rol, modulo);
  const showSolicitudCta = modulo === "BODEGA" && canCreateSolicitud(user?.rol);
  const simple = isSimpleMode(user?.rol);

  // Badge de pendientes para el CTA "Ver mis solicitudes" (§9.1: se alimenta del KPI).
  const pendientes = data?.kpis.find((k) => k.id === "solicitudes-pendientes")?.value ?? null;

  // 403 de permisos de módulo -> "Sin acceso" (la sesión NO se cerró gracias a apiFetch).
  if (error?.isModuleForbidden) {
    return (
      <div className="h-full">
        <SinAcceso />
      </div>
    );
  }

  const hayAside = !!data && (data.resumenDia.length > 0 || data.alertas.length > 0);

  return (
    <div className="flex flex-col gap-3 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0 lg:h-full lg:min-h-0">
      {/* Cabecera compacta */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
        {showSolicitudCta && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="group gap-2 border-slate-300 bg-white font-semibold text-[#1e293b] shadow-sm transition-colors hover:border-[#1e3a8a]/40 hover:bg-slate-50 hover:text-[#1e3a8a] focus-visible:border-[#1e3a8a]/50 focus-visible:ring-[#1e3a8a]/20 max-sm:flex-1"
            >
              <Link to="/bodega/solicitudes">
                Ver mis solicitudes
                {pendientes !== null && pendientes > 0 && (
                  <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1e3a8a] px-1.5 text-[11px] font-bold leading-none text-white ring-1 ring-white/40">
                    {pendientes}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/bodega/solicitudes/nueva")}
              className="gap-1.5 border border-[#172554] bg-gradient-to-b from-[#1e3a8a] to-[#172554] font-semibold text-white shadow-[0_2px_6px_rgba(23,37,84,0.35)] transition-colors hover:from-[#1d4ed8] hover:to-[#1e3a8a] focus-visible:border-[#172554] focus-visible:ring-[#1e3a8a]/30 max-sm:flex-1"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva solicitud
            </Button>
          </div>
        )}
      </header>

      {loading && <DashboardSkeleton kpiCount={simple ? 2 : 4} />}

      {error && !error.isModuleForbidden && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          No se pudo cargar el dashboard: {error.message}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
          {/* Fila 1: KPIs (2 columnas en móvil, altura compacta) */}
          {data.kpis.length > 0 && (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
              {data.kpis.map((kpi, i) => (
                <KpiCard key={kpi.id} kpi={kpi} color={KPI_COLORS[i % KPI_COLORS.length]} />
              ))}
            </div>
          )}

          {/* Fila 2: gráficas + lateral. En <lg fluye (scroll); en lg se reparte sin desbordar. */}
          <div
            className={`grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 ${
              hayAside ? "lg:grid-cols-3" : ""
            }`}
          >
            {/* Columna de gráficas */}
            <div
              className={`grid grid-cols-1 gap-3 ${hayAside ? "lg:col-span-2" : ""} ${
                data.graficas.length > 1 ? "sm:grid-cols-2" : ""
              }`}
            >
              {data.graficas.map((g) => (
                <ChartCard key={g.id} grafica={g} />
              ))}
            </div>

            {/* Lateral: resumen + alertas */}
            {hayAside && (
              <aside className="grid grid-cols-1 gap-3 lg:col-span-1 lg:grid-rows-[auto_minmax(0,1fr)]">
                {data.resumenDia.length > 0 && <ResumenCard items={data.resumenDia} />}
                <AlertasCard alertas={data.alertas} />
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
