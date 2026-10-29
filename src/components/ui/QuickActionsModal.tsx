import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  FileText,
  Box,
  Users,
  Sprout,
  ClipboardList,
  RotateCcw,
  PackageSearch
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

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
  onCreateProductClick,
  onInfoProductoClick // Nueva propiedad agregada
}: {
  onClose: () => void;
  onIngresoClick: () => void;
  onSolicitudClick: () => void;
  onAjusteClick: () => void;
  onDevolucionClick: () => void;
  onCreateProductClick: () => void;
  onInfoProductoClick: () => void;
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Acciones Rápidas</DialogTitle>
          <DialogDescription>
            Selecciona una acción para continuar
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto">

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
                desc="Correccion de inventario (+/-)"
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
                title="Solicitar Devolucion"
                desc="Regresar material a bodega"
                color="text-rose-600 bg-rose-50"
                onClick={() => { onClose(); onDevolucionClick(); }}
              />
            </div>
          )}

          {/* === CATALOGOS Y GESTION === */}
          {(canManageCatalog || isAdmin) && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gestion</p>

              {canManageCatalog && (
                <>
                    <ActionItem
                        icon={<Box size={20} />}
                        title="Crear Producto"
                        desc="Agregar nuevo producto al sistema"
                        color="text-indigo-600 bg-indigo-50"
                        onClick={() => { onClose(); onCreateProductClick(); }}
                    />

                    {/* Nueva accion agregada aqui */}
                    <ActionItem
                        icon={<PackageSearch size={20} />}
                        title="Informacion de Producto"
                        desc="Consultar y editar datos generales"
                        color="text-cyan-600 bg-cyan-50"
                        onClick={() => { onClose(); onInfoProductoClick(); }}
                    />

                    <ActionItem
                        icon={<Users size={20} />}
                        title="Proveedores"
                        desc="Gestionar lista y contactos"
                        color="text-pink-600 bg-pink-50"
                        onClick={() => handleNav("/bodega/proveedores")}
                    />
                </>
              )}

              {/* SOLO ADMIN: Gestion Unificada Fincas/Lotes */}
              {isAdmin && (
                <ActionItem
                    icon={<Sprout size={20} />}
                    title="Fincas y Lotes"
                    desc="Crear fincas y administrar lotes"
                    color="text-green-600 bg-green-50"
                    onClick={() => handleNav("/cosechas/fincas")}
                />
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
