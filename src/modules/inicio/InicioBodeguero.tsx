// src/modules/inicio/InicioBodeguero.tsx
import { useEffect, useState } from "react";
import { StatCard } from "../../components/ui/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import { fetchInicioBodeguero, type InicioBodegueroResponse } from "../../services/apiInicio";

// ICONOS (igual que ya teníamos)
import {
  ClipboardList,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
} from "lucide-react";

type MovimientoVariant = "success" | "danger" | "outline";

type MovimientoRowProps = {
  codigo: string;
  tipo: string;
  productos: string;
  fecha: string;
  variant: MovimientoVariant;
};

export function InicioBodeguero() {
  const [data, setData] = useState<InicioBodegueroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Llamada al backend al montar el componente
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const apiData = await fetchInicioBodeguero();
        if (isMounted) {
          setData(apiData);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudo cargar la información del inicio.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mientras carga, mostramos algo sencillo
  if (loading && !data) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Cargando panel de inicio...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  // Si por alguna razón no hay data pero tampoco error
  if (!data) {
    return null;
  }

  const { resumen, solicitudesPorAtender, movimientosDelDia } = data;

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
          value={resumen.pendientes}
          variant="blue"
          description="Solicitudes por atender"
          icon={<ClipboardList className="w-4 h-4 text-sky-500" />}
        />
        <StatCard
          label="Stock Bajo"
          value={resumen.stockBajo}
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
          {solicitudesPorAtender.map((solicitud) => (
            <Card key={solicitud.codigo} className="rounded-2xl">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {solicitud.codigo}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {solicitud.cliente}
                      <br />
                      {solicitud.bodega}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      solicitud.estado === "APROBADA"
                        ? "success"
                        : solicitud.estado === "PENDIENTE"
                        ? "warning"
                        : "outline"
                    }
                    className="text-[11px] px-3 py-0.5 uppercase tracking-wide"
                  >
                    {solicitud.estado}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>
                    {solicitud.productos}{" "}
                    {solicitud.productos === 1 ? "producto" : "productos"}
                  </span>
                  <span>{solicitud.fecha}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Últimos movimientos del día */}
      <section className="space-y-3 max-w-3xl">
        <SectionTitle title="Últimos Movimientos del Día" />

        <Card className="rounded-2xl">
          <CardContent className="divide-y divide-slate-100 p-0">
            {movimientosDelDia.map((mov) => {
              let variant: MovimientoVariant = "outline";
              let icon: JSX.Element = <ArrowRightLeft className="w-3 h-3" />;

              if (mov.tipo === "SALIDA") {
                variant = "danger";
                icon = <ArrowUpRight className="w-3 h-3" />;
              } else if (mov.tipo === "INGRESO") {
                variant = "success";
                icon = <ArrowDownRight className="w-3 h-3" />;
              }

              return (
                <MovimientoRow
                  key={mov.codigo}
                  codigo={mov.codigo}
                  tipo={mov.tipo}
                  variant={variant}
                  productos={
                    mov.productos +
                    (mov.productos === 1 ? " producto" : " productos")
                  }
                  fecha={mov.fecha}
                  icon={icon}
                />
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type MovimientoRowWithIconProps = MovimientoRowProps & {
  icon: JSX.Element;
};

function MovimientoRow({
  codigo,
  tipo,
  productos,
  fecha,
  variant,
  icon,
}: MovimientoRowWithIconProps) {
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
          {icon}
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
