// src/modules/inicio/InicioSolicitante.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { Badge } from "../../components/ui/Badge";
import { StatCard } from "../../components/ui/StatCard";

// ------------------------------
// ICONOS
// ------------------------------
import { Loader2, CheckCircle, CalendarDays } from "lucide-react";

export function InicioSolicitante() {
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
          value={1}
          variant="yellow"
          description="Solicitudes aún en proceso"
          icon={<Loader2 className="w-4 h-4 text-yellow-500" />}
        />

        <StatCard
          label="Aprobadas"
          value={1}
          variant="green"
          description="Aprobadas recientemente"
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
        />

        <StatCard
          label="Esta semana"
          value={2}
          variant="blue"
          description="Solicitudes creadas esta semana"
          icon={<CalendarDays className="w-4 h-4 text-sky-500" />}
        />
      </div>

      {/* En Proceso */}
      <section className="space-y-3">
        <SectionTitle title="En Proceso" />

        <div className="grid gap-3 md:grid-cols-2 max-w-4xl">
          {/* Solicitud aprobada */}
          <SolicitudCard
            codigo="SOL-2025-0010"
            bodega="Bodega Central"
            productos="4 productos"
            fecha="2025-11-15"
            estado="APROBADA"
            estadoVariant="success"
          />

          {/* Solicitud pendiente */}
          <SolicitudCard
            codigo="SOL-2025-0013"
            bodega="Bodega Norte"
            productos="2 productos"
            fecha="2025-11-17"
            estado="PENDIENTE"
            estadoVariant="warning"
          />
        </div>
      </section>

      {/* Historial */}
      <section className="space-y-3">
        <SectionTitle title="Historial" />

        <div className="grid gap-3 md:grid-cols-2 max-w-4xl">
          <SolicitudCard
            codigo="SOL-2025-0009"
            bodega="Bodega Sur"
            productos="2 productos"
            fecha="2025-11-14"
            estado="ENTREGADA"
            estadoVariant="outline"
            estadoExtraClass="text-sky-600 border-sky-300 bg-sky-50"
          />

          <SolicitudCard
            codigo="SOL-2025-0008"
            bodega="Bodega Central"
            productos="3 productos"
            fecha="2025-11-13"
            estado="ENTREGADA"
            estadoVariant="outline"
            estadoExtraClass="text-sky-600 border-sky-300 bg-sky-50"
          />
        </div>
      </section>
    </div>
  );
}

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
            <CardTitle className="text-sm font-semibold">
              {codigo}
            </CardTitle>
            <CardDescription className="text-xs">
              {bodega}
            </CardDescription>
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
