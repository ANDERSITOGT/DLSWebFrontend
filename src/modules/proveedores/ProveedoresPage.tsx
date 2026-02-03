import { useState, useEffect } from "react";
import { Search, Plus, Users, Loader2, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { EditableCell } from "./components/EditableCell";
import { ContactosModal } from "./components/ContactosModal";

const API_URL = import.meta.env.VITE_API_URL;

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
  
  // Modales
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

  // Actualizar Celda (Excel style)
  const handleUpdate = async (id: string, field: "nit" | "notas", value: string) => {
    // 1. Optimistic Update (Actualizar visualmente ya)
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

    // 2. Enviar al backend
    try {
      await fetch(`${API_URL}/api/proveedores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });
      // Podríamos poner un toast de éxito aquí si quieres
    } catch (e) {
      console.error("Error guardando celda", e);
      alert("Error al guardar cambio. Recarga la página.");
    }
  };

  // Crear Proveedor
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm">Gestión de proveedores y contactos (Edición directa)</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="text" placeholder="Buscar proveedor..." 
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-slate-800"
                value={filtro} onChange={e => setFiltro(e.target.value)}
              />
           </div>
           <button onClick={() => setShowCreate(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
              <Plus size={18}/> Nuevo
           </button>
        </div>
      </div>

      {/* Tabla Estilo Excel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-1/3">Nombre (Fijo)</th>
                <th className="px-6 py-4 w-1/4">NIT (Editable)</th>
                <th className="px-6 py-4 w-1/3">Notas (Editable)</th>
                <th className="px-6 py-4 text-center w-24">Contactos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400"/></td></tr>
              ) : filtrados.length === 0 ? (
                 <tr><td colSpan={4} className="p-10 text-center text-slate-400">No hay proveedores registrados.</td></tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3 font-bold text-slate-700">
                       {p.nombre}
                    </td>
                    <td className="px-6 py-3">
                       <EditableCell value={p.nit} onSave={(val) => handleUpdate(p.id, "nit", val)} placeholder="Sin NIT"/>
                    </td>
                    <td className="px-6 py-3">
                       <EditableCell value={p.notas} onSave={(val) => handleUpdate(p.id, "notas", val)} placeholder="..." type="textarea"/>
                    </td>
                    <td className="px-6 py-3 text-center">
                       <button 
                         onClick={() => setModalContactos(p)}
                         className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition relative group/btn"
                         title="Ver Contactos"
                       >
                          <Users size={18}/>
                          {p.proveedor_contacto.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {p.proveedor_contacto.length}
                            </span>
                          )}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rápido para Crear */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
              <h3 className="font-bold text-lg mb-4">Nuevo Proveedor</h3>
              <input 
                autoFocus
                type="text" placeholder="Nombre de la empresa *" 
                className="w-full border border-gray-300 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-slate-800"
                value={newProvName} onChange={e => setNewProvName(e.target.value)}
              />
              <div className="flex gap-2">
                 <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                 <button onClick={handleCreate} disabled={!newProvName.trim()} className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50">Guardar</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Contactos */}
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