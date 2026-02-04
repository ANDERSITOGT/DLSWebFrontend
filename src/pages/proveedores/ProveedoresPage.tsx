import { useState, useEffect } from "react";
import { Search, Plus, Users, Loader2, CreditCard, StickyNote, Building2 } from "lucide-react";

// 👇 CORRECCIÓN DE RUTAS: 
// Como estamos en 'src/pages/proveedores/', subimos 2 niveles para llegar a 'src/'
import { useAuth } from "../../context/AuthContext";

// Estos están en la misma carpeta o subcarpeta, se mantienen igual
import { EditableCell } from "./components/EditableCell";
import { ContactosModal } from "./components/ContactosModal";

const API_URL = import.meta.env.VITE_API_URL;

// ... (El resto del código de la página se mantiene IDÉNTICO al anterior, 
//      solo cambiamos el import del AuthContext arriba) ...

type Proveedor = {
  id: string;
  nombre: string;
  nit: string | null;
  notas: string | null;
  proveedor_contacto: any[];
};

export default function ProveedoresPage() {
  const { token } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  
  const [modalContactos, setModalContactos] = useState<Proveedor | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProvName, setNewProvName] = useState("");

  const cargarProveedores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/proveedores`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setProveedores(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { cargarProveedores(); }, []);

  const handleUpdate = async (id: string, field: "nit" | "notas", value: string) => {
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    try {
      await fetch(`${API_URL}/api/proveedores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error("Error guardando celda", e);
      alert("Error al guardar cambio.");
    }
  };

  const handleCreate = async () => {
    if (!newProvName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ nombre: newProvName, nit: "", notas: "" })
      });
      if (res.ok) {
        setNewProvName("");
        setShowCreate(false);
        cargarProveedores();
      } else {
        alert("Error: Nombre duplicado o inválido");
      }
    } catch (e) { console.error(e); }
  };

  const filtrados = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    (p.nit && p.nit.includes(filtro))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Building2 className="text-pink-500" size={28}/> Proveedores
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de socios comerciales y contactos.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="text" placeholder="Buscar por nombre o NIT..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm"
                value={filtro} onChange={e => setFiltro(e.target.value)}
              />
           </div>
           <button 
             onClick={() => setShowCreate(true)} 
             className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95"
           >
              <Plus size={18}/> <span className="hidden sm:inline">Nuevo Proveedor</span>
           </button>
        </div>
      </div>

      {loading ? (
         <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-pink-500" size={40}/></div>
      ) : filtrados.length === 0 ? (
         <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-500">No se encontraron proveedores.</p>
         </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-1/3">Nombre de la Empresa</th>
                    <th className="px-6 py-4 w-1/4">NIT / ID Fiscal</th>
                    <th className="px-6 py-4 w-1/3">Notas Internas</th>
                    <th className="px-6 py-4 text-center w-24">Agenda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700">
                         {p.nombre}
                      </td>
                      <td className="px-6 py-4">
                         <div className="bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-white group-hover:border-slate-300 transition-colors">
                            <EditableCell value={p.nit} onSave={(val) => handleUpdate(p.id, "nit", val)} placeholder="---"/>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-white group-hover:border-slate-300 transition-colors">
                            <EditableCell value={p.notas} onSave={(val) => handleUpdate(p.id, "notas", val)} placeholder="..." type="textarea"/>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <button 
                           onClick={() => setModalContactos(p)}
                           className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-100 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm relative group/btn"
                           title="Ver Contactos"
                         >
                            <Users size={18}/>
                            {p.proveedor_contacto.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm border border-white">
                                {p.proveedor_contacto.length}
                              </span>
                            )}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden grid gap-4">
             {filtrados.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-lg">{p.nombre}</h3>
                      <button 
                         onClick={() => setModalContactos(p)}
                         className="p-2 rounded-lg bg-blue-50 text-blue-600 relative"
                      >
                         <Users size={20}/>
                         {p.proveedor_contacto.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                              {p.proveedor_contacto.length}
                            </span>
                         )}
                      </button>
                   </div>

                   <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <CreditCard size={14}/> NIT
                         </div>
                         <EditableCell value={p.nit} onSave={(val) => handleUpdate(p.id, "nit", val)} placeholder="Sin NIT"/>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <StickyNote size={14}/> Notas
                         </div>
                         <EditableCell value={p.notas} onSave={(val) => handleUpdate(p.id, "notas", val)} placeholder="Agregar nota..." type="textarea"/>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-5 text-slate-800">
                 <div className="bg-slate-100 p-2 rounded-lg"><Building2 size={24}/></div>
                 <h3 className="font-bold text-lg">Nuevo Proveedor</h3>
              </div>
              <input 
                autoFocus
                type="text" placeholder="Nombre de la empresa *" 
                className="w-full border border-slate-300 rounded-xl p-3.5 mb-5 outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-sm"
                value={newProvName} onChange={e => setNewProvName(e.target.value)}
              />
              <div className="flex gap-3">
                 <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm">Cancelar</button>
                 <button onClick={handleCreate} disabled={!newProvName.trim()} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 text-sm shadow-lg">Guardar</button>
              </div>
           </div>
        </div>
      )}

      {modalContactos && (
        <ContactosModal 
          isOpen={!!modalContactos} 
          proveedor={modalContactos} 
          onClose={() => setModalContactos(null)}
          onUpdate={cargarProveedores}
        />
      )}
    </div>
  );
}