import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";

const breadcrumbLabels: Record<string, string> = {
  bodega: "Bodega",
  inventario: "Inventario",
  movimientos: "Movimientos",
  lotes: "Lotes",
  solicitudes: "Solicitudes",
  proveedores: "Proveedores",
  configuracion: "Configuración",
  usuarios: "Usuarios",
  "asignacion-lotes": "Asignación de lotes",
  "edicion-critica": "Edición crítica",
  cosechas: "Cosechas",
  fincas: "Fincas",
  registro: "Registro de cosechas",
};

function getBreadcrumbLabel(segment: string) {
  const decodedSegment = decodeURIComponent(segment);
  return (
    breadcrumbLabels[decodedSegment] ??
    decodedSegment.charAt(0).toUpperCase() + decodedSegment.slice(1)
  );
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            asChild
            className="!text-slate-600 hover:!text-slate-900"
          >
            <Link to="/">
              <Home
                size={16}
                className="!text-slate-600 hover:!text-slate-900"
              />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const route = `/${segments.slice(0, index + 1).join("/")}`;
          const isCurrent = index === segments.length - 1;

          return (
            <Fragment key={route}>
              <BreadcrumbSeparator className="!text-slate-400" />
              <BreadcrumbItem>
                {isCurrent ? (
                  <BreadcrumbPage className="!font-bold !text-slate-900">
                    {getBreadcrumbLabel(segment)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    className="!text-slate-600 hover:!text-slate-900"
                  >
                    <Link to={route}>{getBreadcrumbLabel(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
