import { useNavigate } from "react-router-dom"; // 👈 Importante
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield, LogOut, Users, ChevronRight } from "lucide-react";

export function ConfiguracionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // 👈 Hook de navegación

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Gestiona tu perfil y preferencias de sesión.</p>
      </div>

      {/* 1. Tarjeta de Perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm shrink-0">
            {user?.nombre ? getInitials(user.nombre) : "??"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.nombre}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
              {user?.rol}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Información Personal</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                        <Mail size={18} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-slate-400 font-medium">Correo</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{user?.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                        <Shield size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Rol</p>
                        <p className="text-sm font-bold text-slate-700">{user?.rol}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. ADMINISTRACIÓN (SOLO ADMIN) - ACCESO DIRECTO */}
      {user?.rol === "ADMIN" && (
          <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Administración</h3>
              
              <button 
                onClick={() => navigate("/usuarios")} // 👈 REDIRECCIÓN A LA NUEVA PÁGINA
                className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group text-left"
              >
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users size={24} />
                      </div>
                      <div>
                          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Gestión de Usuarios</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Crear nuevos usuarios, editar roles y restablecer contraseñas.</p>
                      </div>
                  </div>
                  <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                      <ChevronRight size={24} />
                  </div>
              </button>
          </div>
      )}

      {/* 3. Zona de Peligro */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sesión</h3>
        <button 
            onClick={logout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 border border-rose-100 transition-all font-bold text-sm shadow-sm active:scale-95"
        >
            <LogOut size={18} />
            Cerrar Sesión Actual
        </button>
      </div>

    </div>
  );
}