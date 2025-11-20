// src/layouts/desktop/DesktopLayout.tsx
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Boxes,
  ArrowLeftRight,
  FileText,
  Settings,
} from "lucide-react";

type DesktopLayoutProps = {
  children: ReactNode;
};

type MenuItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { label: "Inicio", to: "/", icon: <Home className="w-4 h-4" /> },
    {
      label: "Inventario",
      to: "/inventario",
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      label: "Movimientos",
      to: "/movimientos",
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      label: "Solicitudes",
      to: "/solicitudes",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: "Configuración",
      to: "/configuracion",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F7FA]">
      {/* Sidebar con degradado e íconos */}
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white flex flex-col">
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-white/10">
          <h1 className="text-lg font-semibold">DLS Web</h1>
          <p className="text-xs text-blue-100">Panel de Bodega</p>
        </div>

        {/* Menú */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition 
                  ${
                    active
                      ? "bg-white/20 font-semibold shadow-sm"
                      : "hover:bg-white/10"
                  }
                `}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Acciones rápidas */}
        <div className="px-4 py-3 border-t border-white/10">
          <button className="w-full rounded-lg bg-white/10 text-xs py-2 hover:bg-white/20 transition">
            + Acciones Rápidas
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
