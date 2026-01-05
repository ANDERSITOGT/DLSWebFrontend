// src/layouts/desktop/DesktopLayout.tsx
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { QuickActionsModal } from "../../components/ui/QuickActionsModal";
import { IngresoModal } from "../../modules/movimientos/IngresoModal"; // 👈 Importante
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
  const [showActions, setShowActions] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false); // 👈 Estado nuevo
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
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white flex flex-col fixed h-full z-10">
        <div className="px-5 py-4 border-b border-white/10">
          <h1 className="text-lg font-semibold">DLS Web</h1>
          <p className="text-xs text-blue-100">Panel de Bodega</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        <div className="px-4 py-3 border-t border-white/10">
          <button 
            onClick={() => setShowActions(true)}
            className="w-full rounded-lg bg-white/10 text-xs py-2 hover:bg-white/20 transition flex items-center justify-center gap-2 font-medium"
          >
            + Acciones Rápidas
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 ml-64 overflow-auto">
        {children}
      </main>

      {/* 👇 Lógica de Modales */}
      {showActions && (
        <QuickActionsModal 
          onClose={() => setShowActions(false)} 
          onIngresoClick={() => setShowIngresoModal(true)} // Conexión
        />
      )}

      {showIngresoModal && (
        <IngresoModal 
          onClose={() => setShowIngresoModal(false)}
          onSuccess={() => {
            setShowIngresoModal(false);
            // Aquí recargaremos la tabla en el futuro
          }}
        />
      )}
    </div>
  );
}