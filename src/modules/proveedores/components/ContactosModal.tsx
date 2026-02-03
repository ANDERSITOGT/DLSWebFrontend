import { useState } from "react";
import { X, User, Phone, Mail, Trash2, Plus, Briefcase } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Contacto {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  puesto: string | null;
}

interface Props {
  proveedor: { id: string; nombre: string; proveedor_contacto: Contacto[] };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Para recargar la lista principal al cerrar o cambiar algo
}

export function ContactosModal({ proveedor, isOpen, onClose, onUpdate }: Props) {
  const { token } = useAuth();
  const [newContact, setNewContact] = useState({ nombre: "", telefono: "", email: "", puesto: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newContact.nombre) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/proveedores/${proveedor.id}/contactos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newContact)
      });
      setNewContact({ nombre: "", telefono: "", email: "", puesto: "" });
      onUpdate(); // Recargar datos
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar contacto?")) return;
    try {
      await fetch(`${API_URL}/api/proveedores/contactos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      onUpdate();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-800">Contactos de {proveedor.nombre}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* Formulario rápido */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
             <p className="text-xs font-bold text-slate-400 uppercase">Nuevo Contacto</p>
             <div className="grid grid-cols-2 gap-2">
                <input placeholder="Nombre *" value={newContact.nombre} onChange={e=>setNewContact({...newContact, nombre:e.target.value})} className="border rounded p-1.5 text-sm"/>
                <input placeholder="Puesto" value={newContact.puesto} onChange={e=>setNewContact({...newContact, puesto:e.target.value})} className="border rounded p-1.5 text-sm"/>
                <input placeholder="Teléfono" value={newContact.telefono} onChange={e=>setNewContact({...newContact, telefono:e.target.value})} className="border rounded p-1.5 text-sm"/>
                <input placeholder="Email" value={newContact.email} onChange={e=>setNewContact({...newContact, email:e.target.value})} className="border rounded p-1.5 text-sm"/>
             </div>
             <button onClick={handleAdd} disabled={loading || !newContact.nombre} className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-700 flex justify-center gap-2">
               <Plus size={14}/> Agregar
             </button>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {proveedor.proveedor_contacto.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Sin contactos registrados.</p>}
            {proveedor.proveedor_contacto.map(c => (
              <div key={c.id} className="flex justify-between items-start p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition">
                 <div>
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-blue-500"/>
                       <span className="font-bold text-sm text-slate-700">{c.nombre}</span>
                       {c.puesto && <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-500 flex items-center gap-1"><Briefcase size={10}/> {c.puesto}</span>}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 ml-5">
                       {c.telefono && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10}/> {c.telefono}</span>}
                       {c.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {c.email}</span>}
                    </div>
                 </div>
                 <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}