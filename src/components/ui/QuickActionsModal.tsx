//src/components/ui/QuickActionsModal.tsx

import { useNavigate } from "react-router-dom";
import { 
  X, 
  ArrowDownToLine, 
  FileText, 
  Box, 
  Users, 
  Sprout, 
  ClipboardList,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type ActionItemProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  color?: string;
};

function ActionItem({ icon, title, desc, onClick, color = "text-blue-600 bg-blue-50" }: ActionItemProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{title}</div>
        <div className="text-xs text-gray-400">{desc}</div>
      </div>
    </button>
  );
}

export function QuickActionsModal({ 
  onClose, 
  onIngresoClick,
  onSolicitudClick, 
  onAjusteClick,
  onDevolucionClick,
  onCreateProductClick
}: { 
  onClose: () => void;
  onIngresoClick: () => void;
  onSolicitudClick: () => void; 
  onAjusteClick: () => void;
  onDevolucionClick: () => void;
  onCreateProductClick: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rol = user?.rol; 

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  // PERMISOS
  const showMovimientos = rol === "ADMIN" || rol === "BODEGUERO";
  const showSolicitudes = rol === "ADMIN" || rol === "SOLICITANTE" || rol === "BODEGUERO";
  const canManageCatalog = rol === "ADMIN" || rol === "BODEGUERO";
  const isAdmin = rol === "ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-800">Acciones Rápidas</h3>
            <p className="text-xs text-gray-500">Selecciona una acción para continuar</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* === MOVIMIENTOS === */}
          {showMovimientos && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Movimientos</p>
              
              <ActionItem 
                icon={<ArrowDownToLine size={20} />} 
                title="Registrar Ingreso" 
                desc="Registrar entrada de productos"
                onClick={() => { onClose(); onIngresoClick(); }} 
              />
              
              <ActionItem 
                icon={<ClipboardList size={20} />} 
                title="Registrar Ajuste" 
                desc="Corrección de inventario (+/-)"
                color="text-amber-600 bg-amber-50"
                onClick={() => { onClose(); onAjusteClick(); }} 
              />
            </div>
          )}

          {/* === SOLICITUDES === */}
          {showSolicitudes && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solicitudes</p>
              <ActionItem 
                icon={<FileText size={20} />} 
                title="Nueva Solicitud" 
                desc="Solicitar productos de bodega"
                color="text-emerald-600 bg-emerald-50"
                onClick={() => { onClose(); onSolicitudClick(); }}
              />

              <ActionItem 
                icon={<RotateCcw size={20} />} 
                title="Solicitar Devolución" 
                desc="Regresar material a bodega"
                color="text-rose-600 bg-rose-50"
                onClick={() => { onClose(); onDevolucionClick(); }}
              />
            </div>
          )}

          {/* === CATÁLOGOS Y GESTIÓN === */}
          {(canManageCatalog || isAdmin) && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gestión</p>
              
              {canManageCatalog && (
                <>
                    <ActionItem 
                        icon={<Box size={20} />} 
                        title="Crear Producto" 
                        desc="Agregar nuevo producto" 
                        color="text-indigo-600 bg-indigo-50" 
                        onClick={() => { onClose(); onCreateProductClick(); }} 
                    />
                    
                    <ActionItem 
                        icon={<Users size={20} />} 
                        title="Proveedores" 
                        desc="Gestionar lista y contactos" 
                        color="text-pink-600 bg-pink-50" 
                        onClick={() => handleNav("/proveedores")} 
                    />
                </>
              )}

              {/* SOLO ADMIN: Gestión Unificada Fincas/Lotes */}
              {isAdmin && (
                <ActionItem 
                    icon={<Sprout size={20} />} 
                    title="Fincas y Lotes" 
                    desc="Crear fincas y administrar lotes" 
                    color="text-green-600 bg-green-50" 
                    onClick={() => handleNav("/fincas")} 
                />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}