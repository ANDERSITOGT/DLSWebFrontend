import { useState, useEffect } from "react";
import { 
  Sprout, 
  MapPin, 
  Plus, 
  Loader2, 
  ArrowLeft, 
  Search, 
  X,
  Tractor,
  Ruler,
  AlertOctagon 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS ---
type FincaStats = {
  totalLotes: number;
  activos: number;
  inactivos: number;
  areaActiva: string;
  metrosActivos: string;
};

type Finca = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  stats: FincaStats;
};

type Lote = {
  id: string;
  codigo: string;
  estado: "ABIERTO" | "CERRADO";
  areamanzanas: number;
  areametroslineales: number;
  areahectareas: number; // 👈 Agregado al tipo
  fechasiembra: string | null;
  fechacierre: string | null;
  descripcion: string | null;
  cultivo: { id: string; nombre: string; variedad?: string | null };
};

type Cultivo = {
    id: string;
    nombre: string;
    variedad?: string | null;
};

export default function FincasPage() {
  const { token, user } = useAuth();
  
  // PERMISOS
  const puedeEditar = ["ADMIN", "BODEGUERO", "VISOR"].includes(user?.rol || "");

  // VISTAS
  const [view, setView] = useState<'DASHBOARD' | 'DETALLE'>('DASHBOARD');
  const [selectedFinca, setSelectedFinca] = useState<Finca | null>(null);

  // DASHBOARD
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loadingFincas, setLoadingFincas] = useState(true);
  const [showCrearFinca, setShowCrearFinca] = useState(false);
  const [newFincaData, setNewFincaData] = useState({ nombre: "", ubicacion: "" });

  // DETALLE
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [filtroLote, setFiltroLote] = useState("");
  
  // MODAL CREAR LOTE
  const [showCrearLote, setShowCrearLote] = useState(false);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [errorCrearLote, setErrorCrearLote] = useState<string | null>(null);
  
  const [newLoteData, setNewLoteData] = useState({ 
      codigo: "", 
      cultivoid: "", 
      metrosLineales: "", 
      manzanas: 0,        
      hectareas: 0,       
      estado: "ABIERTO" 
  });

  // CARGA INICIAL
  useEffect(() => {
    cargarFincas();
    cargarCultivos(); 
  }, []);

  const cargarFincas = async () => {
    setLoadingFincas(true);
    try {
      const res = await fetch(`${API_BASE}/api/fincas`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setFincas(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoadingFincas(false); }
  };

  const cargarCultivos = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/catalogos/cultivos`, { headers: { "Authorization": `Bearer ${token}` } });
          if (res.ok) setCultivos(await res.json());
      } catch (e) { console.error(e); }
  }

  // CREAR FINCA
  const handleCrearFinca = async () => {
    if (!newFincaData.nombre.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/fincas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newFincaData)
      });
      if (res.ok) {
        setNewFincaData({ nombre: "", ubicacion: "" });
        setShowCrearFinca(false);
        cargarFincas();
      } else {
        alert("Error: Nombre duplicado o inválido");
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectFinca = (finca: Finca) => {
    setSelectedFinca(finca);
    setView('DETALLE');
    cargarLotes(finca.id);
  };

  const cargarLotes = async (fincaId: string) => {
    setLoadingLotes(true);
    try {
      const res = await fetch(`${API_BASE}/api/fincas/${fincaId}/lotes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setLotes(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoadingLotes(false); }
  };

  // CÁLCULO DE ÁREAS (MODAL)
  const handleMetrosChange = (val: string) => {
      const ml = parseFloat(val) || 0;
      setNewLoteData({
          ...newLoteData,
          metrosLineales: val,
          manzanas: ml / 7000,
          hectareas: ml / 10000
      });
  };

  // CREAR LOTE
  const handleCrearLote = async () => {
      setErrorCrearLote(null);
      if(!selectedFinca || !newLoteData.codigo || !newLoteData.cultivoid) return;
      
      const payload = {
          codigo: newLoteData.codigo,
          cultivoid: newLoteData.cultivoid,
          areametroslineales: parseFloat(newLoteData.metrosLineales) || 0,
          areamanzanas: newLoteData.manzanas,
          areahectareas: newLoteData.hectareas,
          estado: newLoteData.estado
      };

      try {
          const res = await fetch(`${API_BASE}/api/fincas/${selectedFinca.id}/lotes`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          const data = await res.json();

          if(res.ok) {
              setNewLoteData({ codigo: "", cultivoid: "", metrosLineales: "", manzanas: 0, hectareas: 0, estado: "ABIERTO" });
              setShowCrearLote(false);
              cargarLotes(selectedFinca.id);
          } else {
              setErrorCrearLote(data.message || "Error al crear el lote.");
          }
      } catch (error) { 
          setErrorCrearLote("Error de conexión con el servidor.");
      }
  };

  // ⚡ EDICIÓN TIPO EXCEL (CÁLCULO AUTOMÁTICO VISUAL)
  const handleUpdateLote = async (id: string, field: keyof Lote, value: any) => {
    if(!puedeEditar) return;

    // Actualización optimista en Frontend
    setLotes(prev => prev.map(l => {
        if(l.id === id) {
            const updatedLote = { ...l, [field]: value };
            
            // Si el usuario edita METROS LINEALES, recalculamos MZ y HA visualmente
            if (field === 'areametroslineales') {
                const ml = Number(value);
                updatedLote.areamanzanas = ml / 7000;
                updatedLote.areahectareas = ml / 10000;
            }
            return updatedLote;
        }
        return l;
    }));

    // Enviar al Backend (El backend también recalcula por seguridad)
    try {
      await fetch(`${API_BASE}/api/fincas/lotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) { console.error("Error guardando", e); }
  };

  const filteredLotes = lotes.filter(l => 
    l.codigo.toLowerCase().includes(filtroLote.toLowerCase()) ||
    l.cultivo.nombre.toLowerCase().includes(filtroLote.toLowerCase()) ||
    (l.cultivo.variedad && l.cultivo.variedad.toLowerCase().includes(filtroLote.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {view === 'DETALLE' && (
             <button onClick={() => { setView('DASHBOARD'); cargarFincas(); }} className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors mb-2 text-xs font-bold uppercase tracking-wider">
                <ArrowLeft size={14}/> Volver al Dashboard
             </button>
          )}
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
             <Tractor size={32} className="text-emerald-200" />
             {view === 'DASHBOARD' ? "Centros de Producción" : `Lotes: ${selectedFinca?.nombre}`}
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
             {view === 'DASHBOARD' 
                ? "Gestión centralizada de fincas y áreas de cultivo." 
                : <span className="flex items-center gap-2"><MapPin size={14}/> {selectedFinca?.ubicacion || "Sin ubicación"}</span>}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           {view === 'DETALLE' && (
              <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700" size={18}/>
                 <input 
                   type="text" placeholder="Buscar lote..." 
                   className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none bg-white/90 text-emerald-900 placeholder-emerald-700/50 focus:bg-white focus:ring-2 focus:ring-emerald-300 transition-all text-sm font-medium shadow-inner"
                   value={filtroLote} onChange={e => setFiltroLote(e.target.value)}
                 />
              </div>
           )}
           
           {puedeEditar && (
               <button 
                 onClick={() => {
                     setErrorCrearLote(null);
                     setNewLoteData({ codigo: "", cultivoid: "", metrosLineales: "", manzanas: 0, hectareas: 0, estado: "ABIERTO" });
                     view === 'DASHBOARD' ? setShowCrearFinca(true) : setShowCrearLote(true);
                 }} 
                 className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition shadow-lg active:scale-95"
               >
                  <Plus size={18}/> 
                  <span className="hidden sm:inline">{view === 'DASHBOARD' ? "Nueva Finca" : "Nuevo Lote"}</span>
               </button>
           )}
        </div>
      </div>

      {/* DASHBOARD */}
      {view === 'DASHBOARD' ? (
        loadingFincas ? (
           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={48}/></div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fincas.map(finca => (
                 <div 
                    key={finca.id} 
                    onClick={() => handleSelectFinca(finca)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden relative"
                 >
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                <Sprout size={28}/>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                                {finca.stats.totalLotes} Lotes
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">{finca.nombre}</h3>
                        <p className="text-sm text-slate-400 mb-6 flex items-center gap-1">
                            <MapPin size={12}/> {finca.ubicacion || "Ubicación no registrada"}
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">En Producción</p>
                                <p className="text-2xl font-extrabold text-emerald-600">{finca.stats.activos}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Metros Totales</p>
                                <p className="text-lg font-bold text-slate-700">{Number(finca.stats.metrosActivos).toLocaleString()} ml</p>
                                <p className="text-[10px] text-slate-400 font-medium">{finca.stats.areaActiva} Mz</p>
                            </div>
                        </div>
                    </div>
                 </div>
              ))}
           </div>
        )
      ) : (
        // TABLA EXCEL (LOTES)
        loadingLotes ? (
           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={48}/></div>
        ) : (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                       <tr>
                          <th className="px-4 py-3 w-28">Estado</th>
                          <th className="px-4 py-3 min-w-[120px]">Código</th>
                          <th className="px-4 py-3 min-w-[150px]">Cultivo</th>
                          {/* Columna Principal Editable */}
                          <th className="px-4 py-3 w-32 bg-emerald-50/50 text-emerald-700 border-x border-emerald-100 text-center">Metros (ML)</th>
                          {/* Columnas Calculadas */}
                          <th className="px-4 py-3 w-28 text-center text-slate-400">Manzanas</th>
                          <th className="px-4 py-3 w-28 text-center text-slate-400">Hectáreas</th>
                          
                          <th className="px-4 py-3 min-w-[140px]">Siembra</th>
                          <th className="px-4 py-3 min-w-[140px]">Cierre</th>
                          <th className="px-4 py-3 min-w-[200px]">Descripción</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredLotes.map(lote => (
                          <tr key={lote.id} className="hover:bg-slate-50/80 transition-colors group">
                             <td className="px-4 py-3">
                                <select 
                                   disabled={!puedeEditar}
                                   value={lote.estado}
                                   onChange={(e) => handleUpdateLote(lote.id, 'estado', e.target.value)}
                                   className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none cursor-pointer shadow-sm ${lote.estado === 'ABIERTO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                >
                                   <option value="ABIERTO">ACTIVO</option>
                                   <option value="CERRADO">INACTIVO</option>
                                </select>
                             </td>
                             <td className="px-4 py-3 font-bold text-slate-700">{lote.codigo}</td>
                             <td className="px-4 py-3 text-slate-600">
                                 <div className="flex items-center gap-1.5">
                                     <Sprout size={14} className="text-emerald-500"/>
                                     <span className="font-medium">{lote.cultivo.nombre}</span>
                                 </div>
                                 {lote.cultivo.variedad && (
                                     <span className="text-[10px] text-slate-400 block ml-5">{lote.cultivo.variedad}</span>
                                 )}
                             </td>
                             
                             {/* INPUT EDITABLE (ML) */}
                             <td className="px-4 py-3 bg-emerald-50/30 border-x border-emerald-50/50">
                                <input 
                                   disabled={!puedeEditar}
                                   type="number" className="w-full bg-transparent border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 outline-none transition-colors text-right font-bold text-emerald-700"
                                   value={lote.areametroslineales || ""}
                                   onChange={(e) => handleUpdateLote(lote.id, 'areametroslineales', e.target.value)}
                                   placeholder="0"
                                />
                             </td>

                             {/* CELDAS CALCULADAS AUTOMÁTICAS */}
                             <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                                {Number(lote.areamanzanas || 0).toFixed(2)}
                             </td>
                             <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                                {Number(lote.areahectareas || 0).toFixed(2)}
                             </td>

                             <td className="px-4 py-3">
                                <input 
                                   disabled={!puedeEditar}
                                   type="date" className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors text-xs text-slate-500"
                                   value={lote.fechasiembra ? lote.fechasiembra.split('T')[0] : ""}
                                   onChange={(e) => handleUpdateLote(lote.id, 'fechasiembra', e.target.value)}
                                />
                             </td>
                             <td className="px-4 py-3">
                                <input 
                                   type="date" className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors text-xs text-slate-500"
                                   value={lote.fechacierre ? lote.fechacierre.split('T')[0] : ""}
                                   onChange={(e) => handleUpdateLote(lote.id, 'fechacierre', e.target.value)}
                                   disabled={!puedeEditar || lote.estado === 'ABIERTO'} 
                                />
                             </td>
                             <td className="px-4 py-3">
                                <input 
                                   disabled={!puedeEditar}
                                   type="text" className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors truncate text-xs text-slate-600"
                                   value={lote.descripcion || ""}
                                   onChange={(e) => handleUpdateLote(lote.id, 'descripcion', e.target.value)}
                                   placeholder="..."
                                />
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )
      )}

      {/* MODAL CREAR FINCA */}
      {showCrearFinca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4 text-emerald-800">
                  <div className="bg-emerald-100 p-2 rounded-lg"><MapPin size={20}/></div>
                  <h3 className="font-bold text-lg">Nueva Finca</h3>
              </div>
              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                      <input 
                        autoFocus type="text" placeholder="Ej: Santa Barbara" 
                        className="w-full border rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newFincaData.nombre} onChange={e => setNewFincaData({...newFincaData, nombre: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Ubicación</label>
                      <input 
                        type="text" placeholder="Ej: Km 50, Chimaltenango" 
                        className="w-full border rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newFincaData.ubicacion} onChange={e => setNewFincaData({...newFincaData, ubicacion: e.target.value})}
                      />
                  </div>
              </div>
              <div className="flex gap-3 mt-6">
                 <button onClick={() => setShowCrearFinca(false)} className="flex-1 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                 <button onClick={handleCrearFinca} disabled={!newFincaData.nombre.trim()} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50">Guardar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CREAR LOTE */}
      {showCrearLote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 relative">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3 text-emerald-800">
                      <div className="bg-emerald-100 p-2 rounded-lg"><Sprout size={20}/></div>
                      <div>
                          <h3 className="font-bold text-lg">Nuevo Lote</h3>
                          <p className="text-xs text-slate-500">{selectedFinca?.nombre}</p>
                      </div>
                  </div>
                  <button onClick={() => setShowCrearLote(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              {/* NOTIFICACIÓN DE ERROR PERSONALIZADA */}
              {errorCrearLote && (
                  <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
                      <AlertOctagon size={16} className="shrink-0 mt-0.5"/>
                      <p className="font-medium">{errorCrearLote}</p>
                  </div>
              )}

              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Código Lote *</label>
                      <input autoFocus type="text" placeholder="Ej: LOTE-01" className="w-full border rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-emerald-500" value={newLoteData.codigo} onChange={e => setNewLoteData({...newLoteData, codigo: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Cultivo *</label>
                      <select className="w-full border rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={newLoteData.cultivoid} onChange={e => setNewLoteData({...newLoteData, cultivoid: e.target.value})}>
                          <option value="">Selecciona...</option>
                          {cultivos.map(c => (
                              <option key={c.id} value={c.id}>
                                  {c.nombre} {c.variedad ? `- ${c.variedad}` : ''}
                              </option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                      <div>
                          <label className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1"><Ruler size={12}/> Metros Lineales (Input)</label>
                          <input 
                            type="number" placeholder="0" 
                            className="w-full border border-emerald-200 rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800 text-lg" 
                            value={newLoteData.metrosLineales} 
                            onChange={e => handleMetrosChange(e.target.value)} 
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Manzanas</label>
                              <div className="text-sm font-bold text-slate-700 border-b border-slate-200 py-1">
                                  {newLoteData.manzanas.toFixed(2)}
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Hectáreas</label>
                              <div className="text-sm font-bold text-slate-700 border-b border-slate-200 py-1">
                                  {newLoteData.hectareas.toFixed(2)}
                              </div>
                          </div>
                      </div>
                      <p className="text-[10px] text-emerald-600 text-center italic mt-1">1 Mz = 7,000 ML | 1 Ha = 10,000 ML</p>
                  </div>
              </div>

              <div className="flex gap-3 mt-6">
                 <button onClick={() => setShowCrearLote(false)} className="flex-1 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                 <button onClick={handleCrearLote} disabled={!newLoteData.codigo || !newLoteData.cultivoid} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50">Crear Lote</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}