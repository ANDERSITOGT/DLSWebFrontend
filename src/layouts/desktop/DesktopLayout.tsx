// src/layouts/desktop/DesktopLayout.tsx
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Boxes, 
  ArrowLeftRight, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  AlertTriangle
} from "lucide-react";

// Contextos
import { useAuth } from "../../context/AuthContext";
import { useRefresh } from "../../context/RefreshContext";

// Modales (Tus componentes originales)
import { QuickActionsModal } from "../../components/ui/QuickActionsModal";
import { IngresoModal } from "../../modules/movimientos/IngresoModal"; 
import { NuevaSolicitudModal } from "../../modules/solicitudes/NuevaSolicitudModal";

type DesktopLayoutProps = {
  children: ReactNode;
};

// Configuración del Menú con los nuevos colores
const menuItems = [
  { 
    label: "Inicio", 
    to: "/", 
    icon: <Home size={20} />, 
    color: "group-hover:text-blue-400", 
    activeClass: "bg-blue-500/20 text-blue-300 border-r-4 border-blue-500" 
  },
  { 
    label: "Inventario", 
    to: "/inventario", 
    icon: <Boxes size={20} />, 
    color: "group-hover:text-emerald-400", 
    activeClass: "bg-emerald-500/20 text-emerald-300 border-r-4 border-emerald-500"
  },
  { 
    label: "Movimientos", 
    to: "/movimientos", 
    icon: <ArrowLeftRight size={20} />, 
    color: "group-hover:text-amber-400", 
    activeClass: "bg-amber-500/20 text-amber-300 border-r-4 border-amber-500"
  },
  { 
    label: "Solicitudes", 
    to: "/solicitudes", 
    icon: <FileText size={20} />, 
    color: "group-hover:text-violet-400", 
    activeClass: "bg-violet-500/20 text-violet-300 border-r-4 border-violet-500"
  },
  { 
    label: "Configuración", 
    to: "/configuracion", 
    icon: <Settings size={20} />, 
    color: "group-hover:text-slate-300", 
    activeClass: "bg-slate-500/30 text-slate-200 border-r-4 border-slate-400"
  },
];

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const { user, logout } = useAuth(); // Para nombre de usuario y logout
  const location = useLocation();
  const { triggerRefreshSolicitudes } = useRefresh(); 

  // --- ESTADOS ---
  const [showActions, setShowActions] = useState(false);       // Modal Acciones Rápidas
  const [showIngresoModal, setShowIngresoModal] = useState(false); // Modal Ingreso
  const [showSolicitudModal, setShowSolicitudModal] = useState(false); // Modal Solicitud
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);   // Modal Confirmar Salida

  // Imagen de fondo para el sidebar
  const bgImage = "https://images.unsplash.com/photo-1625246333195-58197bd000aa?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 relative flex flex-col shadow-2xl z-20">
        
        {/* Fondos del Sidebar */}
        <div className="absolute inset-0 z-0 bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }} />
        <div className="absolute inset-0 z-0 bg-slate-900/90 backdrop-blur-[2px]" />

        {/* Contenido Sidebar (Z-10 para estar sobre el fondo) */}
        <div className="relative z-10 flex flex-col h-full text-white">
          
          {/* Header Logo */}
          <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
            <div className="font-bold text-xl tracking-wide flex items-center gap-2">
               <span className="bg-gradient-to-tr from-emerald-400 to-blue-500 bg-clip-text text-transparent">DLS Web</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-white/5">
             <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 backdrop-blur-md border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs shadow-lg">
                  {user?.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-medium truncate">{user?.nombre}</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.rol}</p>
                </div>
             </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    group relative flex items-center px-6 py-3.5 text-sm font-medium transition-all duration-200
                    ${active ? item.activeClass : "text-slate-400 hover:bg-white/5 hover:text-white"}
                  `}
                >
                  <span className={`mr-3 transition-colors ${active ? "" : item.color}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {/* Barra lateral iluminada si está activo */}
                  {active && <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
            
            {/* Botón Acciones Rápidas (Abre TU modal existente) */}
            <button
              onClick={() => setShowActions(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-emerald-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               <Plus size={20}/> Acciones Rápidas
            </button>

            {/* Logout con Confirmación */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>

        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0">
         {/* Header móvil opcional */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sm:hidden">
            <span className="font-bold text-slate-700">DLS Web</span>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
           {children}
        </div>
      </main>

      {/* --- MODALES --- */}

      {/* 1. Modal de Acciones Rápidas (Reutilizando el tuyo) */}
      {showActions && (
        <QuickActionsModal 
          onClose={() => setShowActions(false)} 
          onIngresoClick={() => setShowIngresoModal(true)} // Conexión a Ingreso
          onSolicitudClick={() => setShowSolicitudModal(true)} // Conexión a Solicitud
        />
      )}

      {/* 2. Modal de Ingreso */}
      {showIngresoModal && (
        <IngresoModal 
          onClose={() => setShowIngresoModal(false)}
          onSuccess={() => {
            setShowIngresoModal(false);
            triggerRefreshSolicitudes(); // Refrescamos por si acaso
          }}
        />
      )}

      {/* 3. Modal de Solicitud */}
      {showSolicitudModal && (
        <NuevaSolicitudModal
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={() => {
            setShowSolicitudModal(false);
            triggerRefreshSolicitudes(); // Refrescamos solicitudes
          }}
        />
      )}

      {/* 4. Modal de Confirmación Logout (Nuevo) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-rose-600 w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">¿Cerrar Sesión?</h3>
                <p className="text-sm text-slate-500 mb-6">¿Estás seguro de que quieres salir del sistema?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={logout}
                        className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-lg shadow-rose-200"
                    >
                        Sí, Salir
                    </button>
                </div>
             </div>
        </div>
      )}

    </div>
  );
}