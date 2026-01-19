import { useState, useEffect } from "react";
import { 
  User, Mail, Plus, Key, 
  Loader2, X, AlertTriangle, Power, Shield 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "BODEGUERO" | "SOLICITANTE";
  activo: boolean; // 👈 Nuevo campo
  createdat: string;
};

export function UsuariosManager() {
  const { token, user: currentUser } = useAuth();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCrear, setShowCrear] = useState(false);
  const [usuarioAResetear, setUsuarioAResetear] = useState<Usuario | null>(null);
  const [usuarioAToggle, setUsuarioAToggle] = useState<Usuario | null>(null); // Para activar/desactivar

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsuarios(await res.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const toggleEstadoUsuario = async () => {
      if(!usuarioAToggle) return;
      try {
          const res = await fetch(`${API_BASE}/api/usuarios/${usuarioAToggle.id}/toggle-status`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) {
              setUsuarioAToggle(null);
              cargarUsuarios();
          } else {
              const d = await res.json();
              alert(d.message || "Error al cambiar estado");
          }
      } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4 animate-in fade-in duration-500">
      
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-500">Administra quién tiene acceso al sistema.</p>
        </div>
        <button 
          onClick={() => setShowCrear(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-indigo-200 transition flex items-center gap-2"
        >
          <Plus size={18}/> Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan={4} className="text-center py-8 text-slate-400">Cargando...</td></tr>
            ) : usuarios.map((u) => {
              const isAdmin = u.rol === 'ADMIN';
              const isMe = u.id === currentUser?.id;
              
              return (
                <tr key={u.id} className={`transition-colors ${!u.activo ? 'bg-slate-50 grayscale opacity-70' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${isAdmin ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {isAdmin ? <Shield size={16}/> : u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-700">{u.nombre} {isMe && "(Tú)"}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      u.rol === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.rol === 'BODEGUERO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      {u.activo ? (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">● Activo</span>
                      ) : (
                          <span className="text-slate-400 font-bold text-xs flex items-center gap-1">○ Inactivo</span>
                      )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Botón Password: Solo si no es otro admin */}
                      {(!isAdmin || isMe) && (
                          <button 
                            onClick={() => setUsuarioAResetear(u)}
                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition" 
                            title="Cambiar Contraseña"
                          >
                            <Key size={18}/>
                          </button>
                      )}

                      {/* Botón Activar/Desactivar: Solo si NO es Admin */}
                      {!isAdmin ? (
                          <button 
                            onClick={() => setUsuarioAToggle(u)}
                            className={`p-2 rounded-lg transition ${u.activo ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                            title={u.activo ? "Desactivar Acceso" : "Reactivar Acceso"}
                          >
                            <Power size={18}/>
                          </button>
                      ) : (
                          // Placeholder invisible para alinear si es admin
                          <div className="w-[34px]"></div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCrear && <CrearUsuarioModal onClose={() => setShowCrear(false)} onSuccess={() => { setShowCrear(false); cargarUsuarios(); }} />}

      {usuarioAResetear && <ResetPasswordModal usuario={usuarioAResetear} onClose={() => setUsuarioAResetear(null)} />}

      {/* --- MODAL CONFIRMAR CAMBIO DE ESTADO --- */}
      {usuarioAToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${usuarioAToggle.activo ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Power size={24}/>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">
                      {usuarioAToggle.activo ? "¿Desactivar Usuario?" : "¿Reactivar Usuario?"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 text-center">
                      {usuarioAToggle.activo 
                        ? `El usuario ${usuarioAToggle.nombre} perderá el acceso al sistema inmediatamente.`
                        : `El usuario ${usuarioAToggle.nombre} podrá volver a iniciar sesión.`
                      }
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setUsuarioAToggle(null)} className="flex-1 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600">Cancelar</button>
                      <button 
                        onClick={toggleEstadoUsuario} 
                        className={`flex-1 py-2 text-white rounded-xl font-bold ${usuarioAToggle.activo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                          {usuarioAToggle.activo ? "Desactivar" : "Reactivar"}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// ... (Los componentes CrearUsuarioModal y ResetPasswordModal se mantienen igual que antes, 
// solo cópialos del archivo anterior si los borraste)
// Si los necesitas de nuevo dímelo y te los pego aquí abajo.
// IMPORTANTE: En CrearUsuarioModal, recuerda usar el "handleSubmit" corregido que te di antes.

function CrearUsuarioModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({ nombre: "", email: "", password: "", rol: "SOLICITANTE" });
    const [enviando, setEnviando] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        try {
            const res = await fetch(`${API_BASE}/api/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error desconocido");
            onSuccess();
        } catch (err: any) { alert(err.message); } 
        finally { setEnviando(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <h3 className="font-bold text-slate-800">Nuevo Usuario</h3>
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="text-xs font-bold text-slate-700">Nombre</label><input className="w-full border rounded-xl p-2 text-sm mt-1" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-700">Email</label><input type="email" className="w-full border rounded-xl p-2 text-sm mt-1" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-700">Contraseña</label><input type="password" className="w-full border rounded-xl p-2 text-sm mt-1" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-700">Rol</label>
                            <select className="w-full border rounded-xl p-2 text-sm mt-1 bg-white" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                                <option value="SOLICITANTE">Solicitante</option>
                                <option value="BODEGUERO">Bodeguero</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold mt-2 hover:bg-indigo-700 transition flex justify-center items-center gap-2">
                        {enviando && <Loader2 className="animate-spin" size={18}/>} Guardar
                    </button>
                </form>
            </div>
        </div>
    );
}

function ResetPasswordModal({ usuario, onClose }: { usuario: Usuario, onClose: () => void }) {
    const { token } = useAuth();
    const [pass, setPass] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/${usuario.id}/reset-password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ newPassword: pass })
            });
            if(!res.ok) throw new Error("Error");
            alert("Contraseña actualizada con éxito.");
            onClose();
        } catch(e) { alert("Error al actualizar contraseña"); }
        finally { setEnviando(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="font-bold text-slate-800 mb-2">Cambiar Contraseña</h3>
                <p className="text-sm text-slate-500 mb-4">Nueva clave para <b>{usuario.nombre}</b>:</p>
                <form onSubmit={handleReset}>
                    <input type="text" className="w-full border rounded-lg p-2 mb-4 text-sm" required minLength={6} value={pass} onChange={e => setPass(e.target.value)} placeholder="Nueva contraseña..." />
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-bold text-slate-600">Cancelar</button>
                        <button type="submit" disabled={enviando} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}