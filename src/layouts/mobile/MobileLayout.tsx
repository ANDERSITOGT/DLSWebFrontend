// src/layouts/mobile/MobileLayout.tsx
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Boxes,
  ArrowLeftRight,
  FileText,
} from "lucide-react";

type MobileLayoutProps = {
  children: ReactNode;
};

type MenuItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { label: "Inicio", to: "/", icon: <Home className="w-5 h-5" /> },
    {
      label: "Inventario",
      to: "/inventario",
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      label: "Movimientos",
      to: "/movimientos",
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      label: "Solicitudes",
      to: "/solicitudes",
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Contenido principal */}
      <main className="flex-1 p-4 pb-20">{children}</main>

      {/* Navbar inferior */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="text-[11px] flex flex-col items-center gap-1"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition 
                  ${
                    active
                      ? "border-blue-500 bg-blue-100 text-blue-600"
                      : "border-slate-300 text-slate-500"
                  }
                `}
              >
                {item.icon}
              </span>
              <span className={active ? "text-blue-600 font-medium" : ""}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
