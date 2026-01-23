import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Sprout, Check, Search, X, Save, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // Usamos tu contexto de Auth

// URL Base desde variable de entorno
const API_BASE = import.meta.env.VITE_API_URL;

// Tipos de datos
interface Lote {
  id: string;
  codigo: string;
  finca: { nombre: string };
}

interface UsuarioSolicitante {
  id: string;
  nombre: string;
  email: string;
  lotes_asignados: {
    lote: Lote;
  }[];
}

export function AsignacionLotesPage() {
  const navigate = useNavigate();
  const { token } = useAuth(); // Obtenemos el token del contexto

  // --- ESTADOS DE SEGURIDAD (Igual que en UsuariosPage) ---
  const [accesoConcedido, setAccesoConcedido] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // --- ESTADOS DE DATOS ---
  const [solicitantes, setSolicitantes] = useState<UsuarioSolicitante[]>([]);
  const [todosLosLotes, setTodosLosLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DEL MODAL ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioSolicitante | null>(null);
  const [lotesSeleccionadosTemp, setLotesSeleccionadosTemp] = useState<string[]>([]);
  const [busquedaLote, setBusquedaLote] = useState("");
  const [saving, setSaving] = useState(false);

  // 1. Verificar Acceso (Copiado de tu lógica de UsuariosPage)
  const handleVerificarAcceso = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerificando(true);
      setErrorAuth(null);

      try {
          const res = await fetch(`${API_BASE}/api/usuarios/verificar-acceso`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ password: passwordInput })
          });

          if (res.ok) {
              setAccesoConcedido(true);
              cargarDatos(); // 👈 Si pasa, cargamos los datos
          } else {
              setErrorAuth("Contraseña incorrecta.");
          }
      } catch (err) {
          setErrorAuth("Error de conexión.");
      } finally {
          setVerificando(false);
      }
  };

  // 2. Función para cargar datos (fetch manual)
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar solicitantes
      const resUsuarios = await fetch(`${API_BASE}/api/usuarios/solicitantes-asignacion`, { headers });
      if(!resUsuarios.ok) throw new Error("Error cargando usuarios");
      const dataUsuarios = await resUsuarios.json();
      setSolicitantes(dataUsuarios);

      // Cargar catálogo de lotes
      const resLotes = await fetch(`${API_BASE}/api/catalogos/lotes`, { headers });
      if(!resLotes.ok) throw new Error("Error cargando lotes");
      const dataLotes = await resLotes.json();
      setTodosLosLotes(dataLotes);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Abrir modal
  const abrirModalEdicion = (usuario: UsuarioSolicitante) => {
    setSelectedUser(usuario);
    const idsActuales = usuario.lotes_asignados.map((item) => item.lote.id);
    setLotesSeleccionadosTemp(idsActuales);
    setBusquedaLote("");
    setModalOpen(true);
  };

  // 4. Toggle Checkbox
  const toggleLote = (loteId: string) => {
    setLotesSeleccionadosTemp((prev) => 
      prev.includes(loteId) 
        ? prev.filter(id => id !== loteId) 
        : [...prev, loteId] 
    );
  };

  // 5. Guardar Cambios
  const guardarCambios = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      
      const res = await fetch(`${API_BASE}/api/usuarios/${selectedUser.id}/asignar-lotes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lotesIds: lotesSeleccionadosTemp })
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      await cargarDatos(); // Recargar lista
      setModalOpen(false);
    } catch (error) {
      console.error("Error guardando asignación:", error);
      alert("Error al guardar la asignación.");
    } finally {
      setSaving(false);
    }
  };

  // Filtrado visual
  const lotesFiltrados = todosLosLotes.filter(l => 
    l.codigo.toLowerCase().includes(busquedaLote.toLowerCase()) ||
    l.finca.nombre.toLowerCase().includes(busquedaLote.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate("/configuracion")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Volver a Configuración
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asignación de Lotes</h1>
          <p className="text-sm text-slate-500">Administra qué lotes puede gestionar cada solicitante.</p>
        </div>
      </div>

      {/* --- BLOQUEO DE SEGURIDAD --- */}
      {!accesoConcedido ? (
          <div className="flex justify-center mt-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                      <Lock size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Protegido</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      Confirma tu contraseña de administrador para gestionar las asignaciones.
                  </p>

                  <form onSubmit={handleVerificarAcceso} className="space-y-4">
                      <input 
                          type="password" 
                          placeholder="Tu contraseña actual..."
                          className="w-full text-center border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          autoFocus
                      />
                      
                      {errorAuth && <p className="text-xs text-rose-500 font-bold">{errorAuth}</p>}

                      <button 
                          type="submit" 
                          disabled={verificando || !passwordInput}
                          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                          {verificando ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                          Verificar Acceso
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          /* --- CONTENIDO PRINCIPAL (SOLO SI HAY ACCESO) --- */
          <>
            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando datos...</div>
            ) : solicitantes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">No hay usuarios con rol de SOLICITANTE activos.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {solicitantes.map((user) => (
                    <div key={user.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                    
                    {/* Header Card */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <User size={18} />
                        </div>
                        <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-800 truncate">{user.nombre}</h3>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Body Card */}
                    <div className="p-4 flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Lotes Asignados ({user.lotes_asignados.length})
                        </p>
                        
                        {user.lotes_asignados.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.lotes_asignados.slice(0, 5).map((item) => (
                                    <span key={item.lote.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100">
                                        {item.lote.codigo}
                                    </span>
                                ))}
                                {user.lotes_asignados.length > 5 && (
                                    <span className="px-2 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded border border-slate-100">
                                        +{user.lotes_asignados.length - 5} más
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Sin lotes asignados</p>
                        )}
                    </div>

                    {/* Footer Card */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button 
                            onClick={() => abrirModalEdicion(user)}
                            className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                        >
                            <Sprout size={16} className="text-emerald-600"/>
                            Gestionar Asignación
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </>
      )}

      {/* ================= MODAL DE EDICIÓN (Igual que antes) ================= */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Editar Asignación</h2>
                        <p className="text-sm text-slate-500">Selecciona los lotes para <span className="font-bold text-slate-700">{selectedUser.nombre}</span></p>
                    </div>
                    <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar lote por código o finca..."
                            value={busquedaLote}
                            onChange={(e) => setBusquedaLote(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {lotesFiltrados.map((lote) => {
                            const isSelected = lotesSeleccionadosTemp.includes(lote.id);
                            return (
                                <label 
                                    key={lote.id} 
                                    className={`
                                        flex items-center p-3 rounded-xl border cursor-pointer transition-all
                                        ${isSelected 
                                            ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                                        ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}
                                    `}>
                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isSelected}
                                        onChange={() => toggleLote(lote.id)}
                                    />
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                            {lote.codigo}
                                        </p>
                                        <p className="text-xs text-slate-500">{lote.finca.nombre}</p>
                                    </div>
                                </label>
                            );
                        })}
                        {lotesFiltrados.length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-400 italic">No se encontraron lotes.</div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button 
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={guardarCambios}
                        disabled={saving}
                        className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Guardando..." : (
                            <>
                                <Save size={16} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}