// src/modules/inicio/InicioSolicitante.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { Badge } from "../../components/ui/Badge";
import { StatCard } from "../../components/ui/StatCard";

// ICONOS
import { Loader2, CheckCircle, CalendarDays } from "lucide-react";

// --------------------------------------------------
// Tipos que coinciden con la API /api/inicio/solicitante
// --------------------------------------------------
type SolicitudDTO = {
  id: string;
  codigo: string;
  bodega: string;
  productos: string;
  fecha: string | null;
  estado: string;
};

type SolicitanteDashboard = {
  resumen: {
    pendientes: number;
    aprobadas: number;
    estaSemana: number;
  };
  enProceso: SolicitudDTO[];
  historial: SolicitudDTO[];
};

export function InicioSolicitante() {
  const [data, setData] = useState<SolicitanteDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/inicio/solicitante");

        if (!res.ok) {
          throw new Error("Error al cargar el dashboard del solicitante");
        }

        const json = (await res.json()) as SolicitanteDashboard;
        setData(json);
      } catch (err: unknown) {
        console.error(err);

        const message =
          err instanceof Error ? err.message : "Error desconocido";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const resumen = data?.resumen;

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Inicio</h1>
        <p className="text-sm text-slate-500">
          Panel de control y resumen para el rol SOLICITANTE.
        </p>
      </header>

      {/* Indicadores superiores */}
      <div className="grid gap-4 md:grid-cols-3 max-w-4xl">
        <StatCard
          label="Pendientes"
          value={resumen?.pendientes ?? 0}
          variant="yellow"
          description="Solicitudes aún en proceso"
          icon={<Loader2 className="w-4 h-4 text-yellow-500" />}
        />

        <StatCard
          label="Aprobadas"
          value={resumen?.aprobadas ?? 0}
          variant="green"
          description="Aprobadas recientemente"
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
        />

        <StatCard
          label="Esta semana"
          value={resumen?.estaSemana ?? 0}
          variant="blue"
          description="Solicitudes creadas esta semana"
          icon={<CalendarDays className="w-4 h-4 text-sky-500" />}
        />
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Cargando información…</p>
      )}

      {error && (
        <p className="text-sm text-red-500">Ocurrió un error: {error}</p>
      )}

      {/* En Proceso */}
      <section className="space-y-3">
        <SectionTitle title="En Proceso" />

        <div className="grid gap-3 md:grid-cols-2 max-w-4xl">
          {data?.enProceso.length ? (
            data.enProceso.map((s) => (
              <SolicitudCard
                key={s.id}
                codigo={s.codigo}
                bodega={s.bodega}
                productos={s.productos}
                fecha={s.fecha ?? ""}
                estado={s.estado}
                estadoVariant={
                  s.estado === "PENDIENTE"
                    ? "warning"
                    : s.estado === "APROBADA"
                    ? "success"
                    : "outline"
                }
              />
            ))
          ) : (
            <p className="text-xs text-slate-500">
              No hay solicitudes en proceso.
            </p>
          )}
        </div>
      </section>

      {/* Historial */}
      <section className="space-y-3">
        <SectionTitle title="Historial" />

        <div className="grid gap-3 md:grid-cols-2 max-w-4xl">
          {data?.historial.length ? (
            data.historial.map((s) => (
              <SolicitudCard
                key={s.id}
                codigo={s.codigo}
                bodega={s.bodega}
                productos={s.productos}
                fecha={s.fecha ?? ""}
                estado={s.estado}
                estadoVariant="outline"
                estadoExtraClass="text-sky-600 border-sky-300 bg-sky-50"
              />
            ))
          ) : (
            <p className="text-xs text-slate-500">
              No hay solicitudes en el historial.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ==========================================================
// COMPONENTE SOLICITUD CARD
// ==========================================================

type EstadoVariant = "success" | "warning" | "outline";

type SolicitudCardProps = {
  codigo: string;
  bodega: string;
  productos: string;
  fecha: string;
  estado: string;
  estadoVariant: EstadoVariant;
  estadoExtraClass?: string;
};

function SolicitudCard({
  codigo,
  bodega,
  productos,
  fecha,
  estado,
  estadoVariant,
  estadoExtraClass,
}: SolicitudCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{codigo}</CardTitle>
            <CardDescription className="text-xs">{bodega}</CardDescription>
          </div>

          <Badge
            variant={estadoVariant}
            className={
              "text-[11px] px-3 py-0.5 uppercase tracking-wide " +
              (estadoExtraClass ?? "")
            }
          >
            {estado}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>{productos}</span>
          <span>{fecha}</span>
        </div>
      </CardContent>
    </Card>
  );
}
