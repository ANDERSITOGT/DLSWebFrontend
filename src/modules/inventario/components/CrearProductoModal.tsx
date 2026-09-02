import { useState, useEffect, type FormEvent } from "react";
import { X, Save, AlertCircle, FlaskConical, Check } from "lucide-react"; 
import { apiFetch } from "../../../services/api";
import BuscadorSelect from "../../../components/ui/BuscadorSelect";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemCatalogo {
  id: string;
  nombre: string;
  abreviatura?: string;
}

export default function CrearProductoModal({ isOpen, onClose, onSuccess }: Props) {
  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [ingredienteActivo, setIngredienteActivo] = useState(""); 
  const [dosis200Lt, setDosis200Lt] = useState("");
  const [comentarioDosis, setComentarioDosis] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la confirmación de éxito
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Listas
  const [unidades, setUnidades] = useState<ItemCatalogo[]>([]);
  const [categorias, setCategorias] = useState<ItemCatalogo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false); 
      limpiarFormulario();   
      cargarCatalogos();
    }
  }, [isOpen]);

  const cargarCatalogos = async () => {
    try {
      const [resUnidades, resCats] = await Promise.all([
        apiFetch("/api/catalogos/unidades"),
        apiFetch("/api/catalogos/categorias")
      ]);

      if (resUnidades.ok) setUnidades(await resUnidades.json());
      if (resCats.ok) setCategorias(await resCats.json());
    } catch (err) {
      console.error("Error cargando catálogos", err);
      setError("No se pudieron cargar las listas de selección.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        nombre,
        ingredienteactivo: ingredienteActivo || null,
        unidadid: unidadId,
        categoriaid: categoriaId,
      };

      if (dosis200Lt.trim() !== "") {
        payload.dosis_200lt = Number(dosis200Lt);
      }

      if (comentarioDosis.trim() !== "") {
        payload.comentarioDosis = comentarioDosis.trim();
      }

      const res = await apiFetch("/api/productos", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al crear producto");
      }

      // ⚠️ CORRECCIÓN CLAVE AQUÍ:
      // No llamamos a onSuccess() ni onClose() todavía.
      // Solo activamos la vista de éxito para que el usuario la vea.
      setShowSuccess(true); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Esta función se ejecuta cuando el usuario da clic en "Aceptar" en la pantalla verde
  const handleFinalize = () => {
    onSuccess(); // Ahora sí avisamos al padre para que cierre/refresque
    onClose();
  };

  const limpiarFormulario = () => {
    setNombre("");
    setIngredienteActivo("");
    setDosis200Lt("");
    setComentarioDosis("");
    setUnidadId("");
    setCategoriaId("");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {showSuccess ? (
        /* --- VISTA DE ÉXITO --- */
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Check className="text-green-600 w-8 h-8" strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Producto Creado!</h3>
            <p className="text-sm text-gray-500 mb-6">
                El producto <span className="font-semibold text-gray-700">"{nombre}"</span> se ha agregado correctamente.
            </p>
            <button 
                onClick={handleFinalize} // 👈 Llama a la función de cierre final
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95"
            >
                Aceptar
            </button>
        </div>
      ) : (
        
        /* --- FORMULARIO NORMAL --- */
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Nuevo Producto</h3>
              <p className="text-xs text-gray-500">El código se generará automáticamente</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* NOMBRE */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Nombre Comercial</label>
              <input 
                type="text" 
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Glifosato 35.6 SL"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* INGREDIENTE ACTIVO */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                 <FlaskConical size={14} /> Ingrediente Activo
              </label>
              <input 
                type="text" 
                value={ingredienteActivo}
                onChange={(e) => setIngredienteActivo(e.target.value)}
                placeholder="Ej: Sal Isopropilamina"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Dosis</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={dosis200Lt}
                  onChange={(e) => setDosis200Lt(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Comentario</label>
                <input
                  type="text"
                  value={comentarioDosis}
                  onChange={(e) => setComentarioDosis(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CATEGORÍA */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Categoría</label>
                <BuscadorSelect<ItemCatalogo>
                  options={categorias.map((categoria) => ({ label: categoria.nombre, value: categoria.id, data: categoria }))}
                  value={categorias.find((categoria) => categoria.id === categoriaId) ? { label: categorias.find((categoria) => categoria.id === categoriaId)!.nombre, value: categoriaId } : null}
                  onChange={(option) => setCategoriaId(option?.value ?? "")}
                  placeholder="Seleccionar..."
                  isClearable
                  noOptionsMessage="No se encontraron categorías"
                />
                <p className="text-[10px] text-gray-400">Determina el prefijo (Ej: FUN001)</p>
              </div>

              {/* UNIDAD */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Unidad</label>
                <BuscadorSelect<ItemCatalogo>
                  options={unidades.map((unidad) => ({ label: `${unidad.nombre} (${unidad.abreviatura || ""})`, value: unidad.id, data: unidad }))}
                  value={unidades.find((unidad) => unidad.id === unidadId) ? { label: `${unidades.find((unidad) => unidad.id === unidadId)!.nombre} (${unidades.find((unidad) => unidad.id === unidadId)!.abreviatura || ""})`, value: unidadId } : null}
                  onChange={(option) => setUnidadId(option?.value ?? "")}
                  placeholder="Seleccionar..."
                  isClearable
                  noOptionsMessage="No se encontraron unidades"
                />
              </div>
            </div>

          </form>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Producto</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}