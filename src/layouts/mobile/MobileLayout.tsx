// src/layouts/mobile/MobileLayout.tsx
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Boxes, 
  ArrowLeftRight, 
  FileText, 
  Settings, 
  Plus
} from "lucide-react";

// Contextos
import { useAuth } from "../../context/AuthContext";
import { useRefresh } from "../../context/RefreshContext";

// Modales
import { QuickActionsModal } from "../../components/ui/QuickActionsModal";
import { IngresoModal } from "../../modules/movimientos/IngresoModal"; 
import { NuevaSolicitudModal } from "../../modules/solicitudes/NuevaSolicitudModal";

type MobileLayoutProps = {
  children: ReactNode;
};

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  const { user } = useAuth(); 
  const { triggerRefreshSolicitudes } = useRefresh();

  // --- ESTADOS ---
  const [showActions, setShowActions] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);

  // Configuración del Menú Inferior (5 Items)
  const navItems = [
    { 
      to: "/", 
      icon: <Home size={20} />, 
      label: "Inicio",
      activeColor: "text-blue-400",
      indicatorColor: "bg-blue-400"
    },
    { 
      to: "/inventario", 
      icon: <Boxes size={20} />, 
      label: "Stock",
      activeColor: "text-emerald-400",
      indicatorColor: "bg-emerald-400"
    },
    { 
        to: "/movimientos", 
        icon: <ArrowLeftRight size={20} />, 
        label: "Movim.",
        activeColor: "text-amber-400",
        indicatorColor: "bg-amber-400"
    },
    { 
      to: "/solicitudes", 
      icon: <FileText size={20} />, 
      label: "Solicit.",
      activeColor: "text-violet-400",
      indicatorColor: "bg-violet-400"
    },
    { 
        to: "/configuracion", 
        icon: <Settings size={20} />, 
        label: "Ajustes",
        activeColor: "text-slate-200",
        indicatorColor: "bg-slate-200"
      },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. Header Móvil */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
         {/* Tono oscuro solicitado */}
         <span className="font-bold text-xl text-slate-800 tracking-tight">
            DLS Web
         </span>
         
         {/* Avatar */}
         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200">
            {user?.nombre.charAt(0).toUpperCase()}
         </div>
      </header>

      {/* 2. Contenido Principal */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {children}
      </main>

      {/* 3. Botón Flotante (+) - Restaurado a la derecha */}
      <button
        onClick={() => setShowActions(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-600/40 flex items-center justify-center text-white active:scale-95 transition-transform z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* 4. Barra de Navegación Inferior (Dark Mode) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-center h-16 relative px-1">
            {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                    <Link 
                        key={item.to} 
                        to={item.to} 
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 group"
                    >
                        <div className={`transition-colors duration-200 ${isActive ? item.activeColor : "text-slate-500 group-hover:text-slate-300"}`}>
                            {item.icon}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${isActive ? item.activeColor : "text-slate-600"}`}>
                            {item.label}
                        </span>
                        {/* Indicador de activo */}
                        {isActive && <div className={`absolute bottom-0 w-8 h-1 rounded-t-full ${item.indicatorColor} opacity-50 blur-[2px]`} />}
                    </Link>
                );
            })}
        </div>
      </nav>

      {/* --- MODALES --- */}
      {showActions && (
        <QuickActionsModal 
          onClose={() => setShowActions(false)} 
          onIngresoClick={() => setShowIngresoModal(true)} 
          onSolicitudClick={() => setShowSolicitudModal(true)} 
        />
      )}

      {showIngresoModal && (
        <IngresoModal 
          onClose={() => setShowIngresoModal(false)}
          onSuccess={() => {
            setShowIngresoModal(false);
            triggerRefreshSolicitudes(); 
          }}
        />
      )}

      {showSolicitudModal && (
        <NuevaSolicitudModal
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={() => {
            setShowSolicitudModal(false);
            triggerRefreshSolicitudes(); 
          }}
        />
      )}
    </div>
  );
}