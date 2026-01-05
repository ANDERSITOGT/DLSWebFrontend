// src/modules/configuracion/ConfiguracionPage.tsx
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield, LogOut } from "lucide-react";

export function ConfiguracionPage() {
  const { user, logout } = useAuth();

  // Función auxiliar para obtener iniciales (ej: Juan Perez -> JP)
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Gestiona tu perfil y preferencias de sesión.</p>
      </div>

      {/* Tarjeta de Perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          {/* Avatar con Iniciales */}
          <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">
            {user?.nombre ? getInitials(user.nombre) : "??"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.nombre}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {user?.rol}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Información Personal</h3>
            
            <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Mail size={18} />
                </div>
                <div>
                    <p className="text-xs text-slate-400">Correo Electrónico</p>
                    <p className="text-sm font-medium">{user?.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Shield size={18} />
                </div>
                <div>
                    <p className="text-xs text-slate-400">Rol de Usuario</p>
                    <p className="text-sm font-medium">{user?.rol}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <User size={18} />
                </div>
                <div>
                    <p className="text-xs text-slate-400">ID de Usuario</p>
                    <p className="text-xs font-mono bg-slate-100 px-1 rounded">{user?.id}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Zona de Peligro / Cerrar Sesión */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider mb-4">Sesión</h3>
        
        <button 
            onClick={logout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-100 transition-colors font-medium"
        >
            <LogOut size={18} />
            Cerrar Sesión Actual
        </button>
      </div>

    </div>
  );
}