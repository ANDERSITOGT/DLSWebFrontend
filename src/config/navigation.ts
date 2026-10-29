import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  FileText,
  Home,
  Settings,
  Sprout,
  Store,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
};

export const bodegaNavigation: NavigationItem[] = [
  { label: "Inicio", to: "/", icon: Home },
  {
    label: "Inventario",
    to: "/bodega/inventario",
    icon: Boxes,
    description: "Consulta productos y existencias disponibles.",
  },
  {
    label: "Movimientos",
    to: "/bodega/movimientos",
    icon: ArrowLeftRight,
    description: "Registra y revisa entradas, salidas y ajustes.",
  },
  {
    label: "Solicitudes",
    to: "/bodega/solicitudes",
    icon: FileText,
    description: "Gestiona las solicitudes de productos.",
  },
  {
    label: "Proveedores",
    to: "/bodega/proveedores",
    icon: Store,
    description: "Administra proveedores y sus contactos.",
  },
  {
    label: "Configuración",
    to: "/bodega/configuracion",
    icon: Settings,
    description: "Configura usuarios y opciones de bodega.",
  },
];

export const cosechasNavigation: NavigationItem[] = [
  {
    label: "Fincas",
    to: "/cosechas/fincas",
    icon: Store,
    description: "Consulta y administra las fincas registradas.",
  },
  {
    label: "Cosechas",
    to: "/cosechas/registro",
    icon: Sprout,
    description: "Registra y consulta la producción de las cosechas.",
  },
];
