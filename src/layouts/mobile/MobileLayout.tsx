// src/layouts/mobile/MobileLayout.tsx
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { QuickActionsModal } from "../../components/ui/QuickActionsModal";
import { IngresoModal } from "../../modules/movimientos/IngresoModal"; // 👈 Importante
import {
  Home,
  Boxes,
  ArrowLeftRight,
  FileText,
  Plus,
  Settings 
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
  const [showActions, setShowActions] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false); // 👈 Estado nuevo
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
    {
      label: "Ajustes",
      to: "/configuracion",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {children}
      </main>

      <button
        onClick={() => setShowActions(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center text-white active:scale-95 transition-transform z-40 hover:bg-blue-700"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        {menuItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="text-[10px] sm:text-[11px] flex flex-col items-center gap-1 w-full"
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
              <span className={`truncate w-full text-center ${active ? "text-blue-600 font-medium" : "text-slate-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

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
          onSuccess={() => setShowIngresoModal(false)}
        />
      )}
    </div>
  );
}