import { useState, useEffect } from "react";
import { X, Loader2, Edit2, Save, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "@/services/api";
import BuscadorSelect, { type BuscadorOption } from "../../../components/ui/BuscadorSelect";

interface Props {
  isOpen: boolean;
  initialSearch?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/** Roles que pueden ver y editar el Precio de referencia / CPP. */
const ROLES_PRECIO = ["ADMIN", "BODEGUERO"];

export default function InfoProductoModal({ isOpen, initialSearch, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  // Solo ADMIN y BODEGUERO pueden ver/editar el precio de referencia (CPP).
  const puedeEditarPrecio = ROLES_PRECIO.includes(user?.rol ?? "");
  
  // Estados de flujo: 'search' | 'view' | 'edit'
  const [step, setStep] = useState<'search' | 'view' | 'edit'>('search');
  
  // Estados de busqueda

  // Estados de datos
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [catalogos, setCatalogos] = useState<{ categorias: any[]; unidades: any[] }>({ categorias: [], unidades: [] });
  
  // Estados de red
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriaSeleccionada = catalogos.categorias.find((categoria: any) => categoria.id === formData.categoriaid);
  const unidadSeleccionada = catalogos.unidades.find((unidad: any) => unidad.id === formData.unidadid);

  // Reiniciar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSelectedProduct(null);
      setError(null);
    }
  }, [isOpen, initialSearch]);

  const buscarOpcionesProducto = async (termino: string): Promise<BuscadorOption[]> => {
    try {
      const res = await apiFetch(`/api/productos/productos/buscar?q=${encodeURIComponent(termino)}`);
      if (!res.ok) return [];
      const data = await res.json();
      const productos = Array.isArray(data) ? data : data.productos ?? [];
      return productos.map((producto: any) => ({
        label: `${producto.codigo} - ${producto.nombre}`,
        value: producto.id,
        data: producto
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      nombre: product.nombre,
      codigo: product.codigo,
      categoriaid: product.categoriaid,
      unidadid: product.unidadid,
      ingredienteactivo: product.ingredienteactivo || "",
      precioref: product.precioref ?? "",
      dosis_200lt: product.dosis_200lt ?? "",
      comentarioDosis: product.comentarioDosis || "",
      activo: product.activo
    });
    setStep('view');
  };

  const enterEditMode = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargamos categorias y unidades solo si entramos a edicion.
      // Rutas vigentes: las /api/catalogos/* fueron eliminadas.
      const [resCat, resUni] = await Promise.all([
        apiFetch("/api/productos/categorias"),
        apiFetch("/api/productos/unidades")
      ]);
      
      setCatalogos({
        categorias: resCat.ok ? await resCat.json() : [],
        unidades: resUni.ok ? await resUni.json() : []
      });
      
      setStep('edit');
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los catálogos para edición.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    // Validación del precio de referencia (CPP): si se ingresa, debe ser >= 0.
    let preciorefFinal: number | null = null;
    if (puedeEditarPrecio) {
      const raw = String(formData.precioref ?? "").trim();
      if (raw !== "") {
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) {
          setError("El Precio de referencia debe ser un número mayor o igual a 0.");
          return;
        }
        preciorefFinal = num;
      }
    }

    setLoading(true);
    try {
      // Se envía el formulario; `precioref` solo si el rol puede editarlo.
      const payload: Record<string, unknown> = { ...formData };
      if (puedeEditarPrecio) {
        payload.precioref = preciorefFinal;
      } else {
        delete payload.precioref;
      }

      const res = await apiFetch(`/api/productos/${selectedProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess(); // Refresca tablas si es necesario
        onClose();   // Cerramos el modal tras guardar exitosamente
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Error al actualizar el producto");
      }
    } catch {
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
              <BuscadorSelect
                loadOptions={buscarOpcionesProducto}
                value={null}
                onChange={(option) => {
                  if (option?.data) handleSelectProduct(option.data);
                }}
                placeholder="Escribe el nombre o código..."
                isClearable={false}
                noOptionsMessage="No se encontraron productos"
              />
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
                {/* El precio de referencia (CPP) solo es visible para ADMIN/BODEGUERO. */}
                {puedeEditarPrecio && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Precio Ref. (CPP)</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedProduct.precioref != null && Number(selectedProduct.precioref) > 0
                        ? `Q ${Number(selectedProduct.precioref).toFixed(2)}`
                        : "No configurado"}
                    </p>
                  </div>
                )}
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
                {/* Campo Precio de referencia / CPP: editable solo para ADMIN/BODEGUERO. */}
                {puedeEditarPrecio && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Precio de referencia / CPP (Q)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.precioref}
                      onChange={e => setFormData({...formData, precioref: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Requerido para valuar salidas y ajustes. Debe ser ≥ 0.
                    </p>
                  </div>
                )}
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
                  <BuscadorSelect
                    options={catalogos.categorias.map((categoria: any) => ({ label: categoria.nombre, value: categoria.id, data: categoria }))}
                    value={categoriaSeleccionada ? { label: categoriaSeleccionada.nombre, value: formData.categoriaid } : null}
                    onChange={(option) => setFormData({...formData, categoriaid: option?.value ?? ""})}
                    placeholder="Seleccionar categoría..."
                    noOptionsMessage="No se encontraron categorías"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Unidad Base</label>
                  <BuscadorSelect
                    options={catalogos.unidades.map((unidad: any) => ({ label: unidad.nombre, value: unidad.id, data: unidad }))}
                    value={unidadSeleccionada ? { label: unidadSeleccionada.nombre, value: formData.unidadid } : null}
                    onChange={(option) => setFormData({...formData, unidadid: option?.value ?? ""})}
                    placeholder="Seleccionar unidad..."
                    noOptionsMessage="No se encontraron unidades"
                  />
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