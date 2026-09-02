import { useState, useEffect } from "react";
import { X, Search, Loader2, Edit2, Save, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

interface Props {
  isOpen: boolean;
  initialSearch?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InfoProductoModal({ isOpen, initialSearch, onClose, onSuccess }: Props) {
  const { token } = useAuth();
  
  // Estados de flujo: 'search' | 'view' | 'edit'
  const [step, setStep] = useState<'search' | 'view' | 'edit'>('search');
  
  // Estados de busqueda
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados de datos
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [catalogos, setCatalogos] = useState({ categorias: [], unidades: [] });
  
  // Estados de red
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reiniciar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setQuery(initialSearch ?? "");
      setSearchResults([]);
      setSelectedProduct(null);
      setError(null);
    }
  }, [isOpen, initialSearch]);

  // Logica de busqueda con debounce
  useEffect(() => {
    if (step !== 'search' || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/catalogos/productos/buscar?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const productos = Array.isArray(data) ? data : data.productos ?? [];
          setSearchResults(productos);
          if (initialSearch) {
            const productoInicial = productos.find((producto: any) => producto.codigo === initialSearch) ?? productos[0];
            if (productoInicial) handleSelectProduct(productoInicial);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, step, token]);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      nombre: product.nombre,
      codigo: product.codigo,
      categoriaid: product.categoriaid,
      unidadid: product.unidadid,
      ingredienteactivo: product.ingredienteactivo || "",
      precioref: product.precioref || "",
      dosis_200lt: product.dosis_200lt ?? "",
      comentarioDosis: product.comentarioDosis || "",
      activo: product.activo
    });
    setStep('view');
  };

  const enterEditMode = async () => {
    setLoading(true);
    try {
      // Cargamos categorias y unidades solo si entramos a edicion
      const [resCat, resUni] = await Promise.all([
        fetch(`${API_BASE}/api/catalogos/categorias`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/catalogos/unidades`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setCatalogos({
        categorias: resCat.ok ? await resCat.json() : [],
        unidades: resUni.ok ? await resUni.json() : []
      });
      
      setStep('edit');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/productos/${selectedProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess(); // Refresca tablas si es necesario
        onClose();   // Cerramos el modal tras guardar exitosamente
      } else {
        const errData = await res.json();
        setError(errData.message || "Error al actualizar el producto");
      }
    } catch (e) {
      setError("Error de conexion al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Cabecera dinámica según el estado */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            {step !== 'search' && (
              <button onClick={() => setStep(step === 'edit' ? 'view' : 'search')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {step === 'search' ? 'Buscar Producto' : step === 'view' ? 'Detalles del Producto' : 'Editar Producto'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[75vh]">
          
          {/* ESTADO 1: BUSQUEDA */}
          {step === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Escribe el nombre o codigo..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              <div className="mt-4 space-y-2">
                {isSearching ? (
                  <div className="py-8 flex justify-center text-blue-500"><Loader2 className="animate-spin" size={24} /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => handleSelectProduct(prod)}
                      className="p-3 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-700">{prod.nombre}</p>
                        <p className="text-xs text-slate-500">{prod.codigo}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${prod.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {prod.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                  ))
                ) : query.length > 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No se encontraron productos.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ESTADO 2: VISTA DE SOLO LECTURA */}
          {step === 'view' && selectedProduct && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedProduct.nombre}</h3>
                  <p className="text-sm font-mono text-slate-500 mt-1">{selectedProduct.codigo}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${selectedProduct.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {selectedProduct.activo ? 'PRODUCTO ACTIVO' : 'INACTIVO'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.categoria?.nombre || "No asignada"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Unidad Base</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.unidad?.nombre || "No asignada"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ingrediente Activo</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.ingredienteactivo || "Ninguno"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Precio Ref.</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.precioref ? `Q ${selectedProduct.precioref}` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Dosis</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.dosis_200lt ?? "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Comentario de Dosis</p>
                  <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{selectedProduct.comentarioDosis || "Ninguno"}</p>
                </div>
              </div>

              <button onClick={enterEditMode} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <Edit2 size={18} /> Editar Informacion
              </button>
            </div>
          )}

          {/* ESTADO 3: MODO EDICION */}
          {step === 'edit' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Producto</label>
                <input type="text" className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Codigo</label>
                  <input type="text" className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Precio Ref. (Q)</label>
                  <input type="number" className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.precioref} onChange={e => setFormData({...formData, precioref: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Ingrediente Activo</label>
                <input type="text" className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.ingredienteactivo} onChange={e => setFormData({...formData, ingredienteactivo: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Dosis</label>
                  <input type="number" step="any" className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.dosis_200lt} onChange={e => setFormData({...formData, dosis_200lt: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Comentario de Dosis</label>
                  <textarea className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y" rows={2} value={formData.comentarioDosis} onChange={e => setFormData({...formData, comentarioDosis: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                  <select className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.categoriaid} onChange={e => setFormData({...formData, categoriaid: e.target.value})}>
                    {catalogos.categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Unidad Base</label>
                  <select className="w-full mt-1 p-2.5 border border-amber-300 bg-amber-50/30 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" value={formData.unidadid} onChange={e => setFormData({...formData, unidadid: e.target.value})}>
                    {catalogos.unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                  <p className="text-[10px] text-amber-600 mt-1 font-medium leading-tight">Cambiar la unidad altera la lectura del historial.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Estado del Producto</p>
                  <p className="text-xs text-slate-500">Si lo inactivas, no se podra usar en nuevos documentos.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep('view')} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}