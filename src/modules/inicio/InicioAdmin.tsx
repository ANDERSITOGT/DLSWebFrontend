// src/modules/inicio/InicioAdmin.tsx
import { useEffect, useState } from "react";
import { StatCard } from "../../components/ui/StatCard";
import {
  Card,
  CardContent,
} from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { Badge } from "../../components/ui/Badge";
import { IconCircle } from "../../components/ui/IconCircle";

// Opcional: iconos si los estás usando en StatCard
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  DollarSign,
} from "lucide-react";

// ------------------------------
// Tipos que coinciden con /api/inicio/admin
// ------------------------------
type AdminDashboard = {
  resumenTop: {
    movimientosHoy: number;
    stockBajo: number;
    solicitudesActivas: number;
    valorInventario: number; // Q
  };
  resumenDelDia: {
    ingresos: number;
    salidas: number;
    aprobadas: number;
  };
  alertas: {
    stockBajo: {
      cantidad: number;
      descripcion: string;
    };
    productosProximosAVencer: {
      cantidad: number;
      descripcion: string;
    };
    proveedoresConPagosPendientes: {
      cantidad: number;
      descripcion: string;
    };
  };
};

export function InicioAdmin() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/inicio/admin");
        if (!res.ok) {
          throw new Error("Error al cargar el dashboard del admin");
        }
        const json: AdminDashboard = await res.json();
        setData(json);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const top = data?.resumenTop;
  const day = data?.resumenDelDia;
  const alertas = data?.alertas;

  // Formato simple para valor inventario
  const valorInvTexto =
    top && top.valorInventario > 0
      ? `Q${(top.valorInventario / 1_000_000).toFixed(1)}M`
      : "Q0";

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Inicio</h1>
        <p className="text-sm text-slate-500">
          Panel de control y resumen para el rol ADMIN.
        </p>
      </header>

      {/* Indicadores superiores */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Movimientos hoy"
          value={top?.movimientosHoy ?? 0}
          variant="blue"
          description="Registros de entradas y salidas"
          icon={<Activity className="w-4 h-4 text-sky-500" />}
        />
        <StatCard
          label="Stock bajo"
          value={top?.stockBajo ?? 0}
          variant="orange"
          description="Productos por debajo del mínimo"
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          label="Solicitudes"
          value={top?.solicitudesActivas ?? 0}
          variant="green"
          description="Solicitudes activas"
          icon={<ClipboardList className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Valor Inv."
          value={valorInvTexto}
          variant="purple"
          description="Valor estimado del inventario"
          icon={<DollarSign className="w-4 h-4 text-violet-500" />}
        />
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Cargando información…</p>
      )}
      {error && (
        <p className="text-sm text-red-500">Ocurrió un error: {error}</p>
      )}

      {/* Resumen del Día */}
      <section className="space-y-3">
        <SectionTitle title="Resumen del Día" />

        <div className="grid gap-4 md:grid-cols-3 max-w-5xl">
          <ResumenItem
            titulo="Ingresos"
            valor={day?.ingresos ?? 0}
            descripcion="Movimientos de ingreso"
            color="green"
          />
          <ResumenItem
            titulo="Salidas"
            valor={day?.salidas ?? 0}
            descripcion="Movimientos de salida"
            color="orange"
          />
          <ResumenItem
            titulo="Aprobadas"
            valor={day?.aprobadas ?? 0}
            descripcion="Solicitudes aprobadas hoy"
            color="blue"
          />
        </div>
      </section>

      {/* Alertas */}
      <section className="space-y-3 max-w-5xl">
        <SectionTitle title="Alertas" />

        <Card className="rounded-2xl">
          <CardContent className="p-0 divide-y divide-slate-100">
            <AlertaRow
              iconColor="orange"
              titulo={
                `${alertas?.stockBajo.cantidad ?? 0} ` +
                (alertas?.stockBajo.descripcion ?? "productos con stock bajo")
              }
              descripcion="Revisa el inventario para evitar desabastecimiento."
            />
            <AlertaRow
              iconColor="yellow"
              titulo={
                `${alertas?.productosProximosAVencer.cantidad ?? 0} ` +
                (alertas?.productosProximosAVencer.descripcion ??
                  "productos próximos a vencer")
              }
              descripcion="Lotes con vencimiento en menos de 30 días."
            />
            <AlertaRow
              iconColor="blue"
              titulo={
                `${alertas?.proveedoresConPagosPendientes.cantidad ?? 0} ` +
                (alertas?.proveedoresConPagosPendientes.descripcion ??
                  "proveedores con pagos pendientes")
              }
              descripcion="Facturas vencidas que requieren atención."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type ResumenItemProps = {
  titulo: string;
  valor: number;
  descripcion: string;
  color: "green" | "orange" | "blue";
};

function ResumenItem({
  titulo,
  valor,
  descripcion,
  color,
}: ResumenItemProps) {
  const colorClasses: Record<ResumenItemProps["color"], string> = {
    green: "bg-emerald-50 border-emerald-100 text-emerald-700",
    orange: "bg-amber-50 border-amber-100 text-amber-700",
    blue: "bg-sky-50 border-sky-100 text-sky-700",
  };

  return (
    <Card className={`rounded-2xl border ${colorClasses[color]}`}>
      <CardContent className="flex items-center gap-3 py-4">
        <IconCircle className="bg-white/70 text-current">
          <span className="text-xs">●</span>
        </IconCircle>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{titulo}</span>
          <span className="text-2xl font-semibold">{valor}</span>
          <span className="text-xs text-slate-600">{descripcion}</span>
        </div>
      </CardContent>
    </Card>
  );
}

type AlertaRowProps = {
  iconColor: "orange" | "yellow" | "blue";
  titulo: string;
  descripcion: string;
};

function AlertaRow({ iconColor, titulo, descripcion }: AlertaRowProps) {
  const colorMap: Record<AlertaRowProps["iconColor"], string> = {
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-sky-100 text-sky-600",
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <IconCircle className={colorMap[iconColor]}>
          <span className="text-xs">!</span>
        </IconCircle>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">
            {titulo}
          </span>
          <span className="text-xs text-slate-500">{descripcion}</span>
        </div>
      </div>

      <Badge
        variant="outline"
        className="text-[11px] px-2 py-0.5 text-slate-500"
      >
        Ver
      </Badge>
    </div>
  );
}
