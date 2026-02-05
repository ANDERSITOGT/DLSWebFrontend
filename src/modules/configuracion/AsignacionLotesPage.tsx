import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  Search, 
  X, 
  Save, 
  Loader2, 
  Check, 
  MapPin, 
  ChevronDown,
  ChevronRight,
  Archive,
  Layers,
  Sprout,
  User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS DE DATOS ---
interface Lote {
  id: string;
  codigo: string;
  estado: string; // "ABIERTO" | "CERRADO"
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
  const { token } = useAuth();

  // --- ESTADOS DE SEGURIDAD ---
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

  // 1. Verificar Acceso
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
              cargarDatos(); 
          } else {
              setErrorAuth("Contraseña incorrecta.");
          }
      } catch (err) {
          setErrorAuth("Error de conexión.");
      } finally {
          setVerificando(false);
      }
  };

  // 2. Cargar datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [resUsuarios, resLotes] = await Promise.all([
        fetch(`${API_BASE}/api/usuarios/solicitantes-asignacion`, { headers }),
        fetch(`${API_BASE}/api/catalogos/lotes`, { headers })
      ]);

      if(resUsuarios.ok) setSolicitantes(await resUsuarios.json());
      if(resLotes.ok) setTodosLosLotes(await resLotes.json());

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

  // 4. Toggle Checkbox (Lógica)
  const toggleLote = (loteId: string) => {
    setLotesSeleccionadosTemp((prev) => 
      prev.includes(loteId) ? prev.filter(id => id !== loteId) : [...prev, loteId] 
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
      
      await cargarDatos();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // --- PREPARACIÓN DE DATOS AGRUPADOS ---
  const lotesFiltrados = todosLosLotes.filter(l => 
    l.codigo.toLowerCase().includes(busquedaLote.toLowerCase()) ||
    l.finca.nombre.toLowerCase().includes(busquedaLote.toLowerCase())
  );

  const lotesPorFinca = lotesFiltrados.reduce((acc, lote) => {
    const fincaNombre = lote.finca.nombre;
    if (!acc[fincaNombre]) acc[fincaNombre] = [];
    acc[fincaNombre].push(lote);
    return acc;
  }, {} as Record<string, Lote[]>);

  const fincasOrdenadas = Object.keys(lotesPorFinca).sort();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
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

      {/* --- PANTALLA DE BLOQUEO --- */}
      {!accesoConcedido ? (
          <div className="flex justify-center mt-10">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                      <Lock size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Protegido</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      Confirma tu contraseña de administrador para continuar.
                  </p>
                  <form onSubmit={handleVerificarAcceso} className="space-y-4">
                      <input 
                          type="password" placeholder="Tu contraseña..."
                          className="w-full text-center border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                          autoFocus
                      />
                      {errorAuth && <p className="text-xs text-rose-500 font-bold">{errorAuth}</p>}
                      <button type="submit" disabled={verificando || !passwordInput} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                          {verificando ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Verificar
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          /* --- LISTA DE USUARIOS --- */
          <>
            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando datos...</div>
            ) : solicitantes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                    No hay usuarios solicitantes activos.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {solicitantes.map((user) => (
                    <div key={user.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold uppercase">
                                {user.nombre.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-slate-800 truncate">{user.nombre}</h3>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="p-4 flex-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Lotes Asignados ({user.lotes_asignados.length})
                            </p>
                            {user.lotes_asignados.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.lotes_asignados.slice(0, 6).map((item) => (
                                        <span key={item.lote.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100">
                                            {item.lote.codigo}
                                        </span>
                                    ))}
                                    {user.lotes_asignados.length > 6 && (
                                        <span className="px-2 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded border border-slate-100">
                                            +{user.lotes_asignados.length - 6}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Sin asignaciones</p>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                            <button onClick={() => abrirModalEdicion(user)} className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm group-hover:border-emerald-300 group-hover:text-emerald-700">
                                <Sprout size={16}/> Gestionar Asignación
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            )}
          </>
      )}

      {/* ================= MODAL DE EDICIÓN AGRUPADO ================= */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                
                {/* Header Modal */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Editar Asignación</h2>
                        <p className="text-sm text-slate-500">Usuario: <span className="font-bold text-emerald-700">{selectedUser.nombre}</span></p>
                    </div>
                    <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition"><X size={20} /></button>
                </div>

                {/* Buscador */}
                <div className="p-4 border-b border-slate-100 bg-white z-10 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Filtrar lotes..."
                            value={busquedaLote}
                            onChange={(e) => setBusquedaLote(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Lista Agrupada con Acordeones */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
                    {lotesFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No se encontraron lotes.</div>
                    ) : (
                        fincasOrdenadas.map(fincaNombre => {
                            const lotesDeFinca = lotesPorFinca[fincaNombre];
                            const activos = lotesDeFinca.filter(l => l.estado === 'ABIERTO');
                            const inactivos = lotesDeFinca.filter(l => l.estado !== 'ABIERTO');

                            return (
                                <FincaAssignmentCard 
                                    key={fincaNombre}
                                    fincaNombre={fincaNombre}
                                    activos={activos}
                                    inactivos={inactivos}
                                    seleccionados={lotesSeleccionadosTemp}
                                    onToggle={toggleLote}
                                />
                            );
                        })
                    )}
                </div>

                {/* Footer Botones */}
                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white z-10">
                    <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" disabled={saving}>
                        Cancelar
                    </button>
                    <button onClick={guardarCambios} disabled={saving} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                        {saving ? "Guardando..." : <><Save size={16}/> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// SUB-COMPONENTE: Tarjeta de Finca con Acordeones Internos 
// =================================================================
function FincaAssignmentCard({ fincaNombre, activos, inactivos, seleccionados, onToggle }: any) {
    // Por defecto: si hay activos, se muestra desplegado. Inactivos siempre colapsados al inicio.
    const [showActivos, setShowActivos] = useState(activos.length > 0);
    const [showInactivos, setShowInactivos] = useState(false);

    // Contadores para el badge
    const countActivosSelected = activos.filter((l: any) => seleccionados.includes(l.id)).length;
    const countInactivosSelected = inactivos.filter((l: any) => seleccionados.includes(l.id)).length;
    const totalSelected = countActivosSelected + countInactivosSelected;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            {/* Header Finca */}
            <div className="bg-slate-50/80 p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white border border-slate-200 p-1.5 rounded-lg text-slate-500 shadow-sm">
                        <MapPin size={16}/>
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{fincaNombre}</h3>
                </div>
                {totalSelected > 0 && (
                    <div className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold border border-emerald-200">
                        {totalSelected} seleccionados
                    </div>
                )}
            </div>

            <div className="p-3">
                {/* 1. SECCIÓN ACTIVOS */}
                {activos.length > 0 && (
                    <div className="mb-2">
                        <button 
                            onClick={() => setShowActivos(!showActivos)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-emerald-700 uppercase tracking-wider transition-colors mb-1"
                        >
                            <span className="flex items-center gap-2">
                                <Layers size={14}/> En Producción ({activos.length})
                            </span>
                            {showActivos ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                        </button>
                        
                        {showActivos && (
                            <div className="grid gap-2 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                {activos.map((lote: any) => (
                                    <LoteCheckbox 
                                        key={lote.id} 
                                        lote={lote} 
                                        checked={seleccionados.includes(lote.id)} 
                                        onChange={() => onToggle(lote.id)} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. SECCIÓN INACTIVOS (Historial) */}
                {inactivos.length > 0 && (
                    <div className={`mt-1 pt-2 ${activos.length > 0 ? 'border-t border-dashed border-slate-100' : ''}`}>
                        <button 
                            onClick={() => setShowInactivos(!showInactivos)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider transition-colors mb-1"
                        >
                            <span className="flex items-center gap-2">
                                <Archive size={14}/> Historial / Inactivos ({inactivos.length})
                            </span>
                            {showInactivos ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                        </button>

                        {showInactivos && (
                            <div className="grid gap-2 sm:grid-cols-2 p-2 bg-slate-50/50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                {inactivos.map((lote: any) => (
                                    <LoteCheckbox 
                                        key={lote.id} 
                                        lote={lote} 
                                        checked={seleccionados.includes(lote.id)} 
                                        onChange={() => onToggle(lote.id)} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// CORRECCIÓN: Ahora el Label contiene un INPUT oculto para que funcione el click
function LoteCheckbox({ lote, checked, onChange }: { lote: Lote, checked: boolean, onChange: () => void }) {
    const isActivo = lote.estado === 'ABIERTO';
    return (
        <label className={`
            flex items-center p-2.5 rounded-xl border cursor-pointer transition-all select-none group
            ${checked 
                ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
            }
            ${!isActivo && !checked ? 'opacity-60 grayscale-[0.5]' : ''}
        `}>
            {/* 👇 INPUT CHECKBOX REAL (Oculto pero funcional) */}
            <input 
                type="checkbox" 
                className="hidden" 
                checked={checked} 
                onChange={onChange} 
            />

            <div className={`
                w-5 h-5 rounded border flex items-center justify-center mr-3 transition-all shrink-0
                ${checked 
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                    : 'bg-white border-slate-300 group-hover:border-emerald-400'
                }
            `}>
                {checked && <Check size={12} strokeWidth={4} />}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate transition-colors ${checked ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {lote.codigo}
                </p>
            </div>
            
            {!isActivo && (
                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-slate-200 ml-2">
                    CERRADO
                </span>
            )}
        </label>
    );
}