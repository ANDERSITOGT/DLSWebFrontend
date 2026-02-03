// src/modules/movimientos/AjusteInventarioModal.tsx
import { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Package
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

type ProductoBusqueda = {
  id: string;
  nombre: string;
  codigo: string;
  stockActual: number;
  unidad: { abreviatura: string };
};

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AjusteInventarioModal({ onClose, onSuccess }: Props) {
  const { token } = useAuth();
  
  // --- Estados del Formulario ---
  const [paso, setPaso] = useState<1 | 2>(1);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  
  // Datos del Ajuste
  const [productoSel, setProductoSel] = useState<ProductoBusqueda | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<"SOBRANTE" | "FALTANTE">("FALTANTE");
  const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  
  // Estado de envío
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Estado de Éxito ---
  const [showExito, setShowExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  // --- Lógica de Búsqueda ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (busqueda.length > 2) {
        setLoadingBusqueda(true);
        try {
          const res = await fetch(`${API_BASE}/api/catalogos/productos-busqueda?q=${busqueda}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setResultados(data);
          }
        } catch (error) {
          console.error("Error buscando productos", error);
        } finally {
          setLoadingBusqueda(false);
        }
      } else {
        setResultados([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busqueda, token]);

  // --- Manejo de Selección ---
  const seleccionarProducto = (prod: ProductoBusqueda) => {
    setProductoSel(prod);
    setPaso(2);
    setBusqueda(""); 
    setError(null);
    setCantidad("");
  };

  // --- Enviar Ajuste ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSel || !cantidad || !notas) return;

    const cantidadNum = Number(cantidad);

    // 🔒 DOBLE SEGURIDAD: Validación interna por si el usuario habilita el botón con trucos
    if (tipoAjuste === "FALTANTE" && cantidadNum > productoSel.stockActual) {
        setError(`Stock insuficiente. Tienes ${productoSel.stockActual}, intentas sacar ${cantidadNum}.`);
        return;
    }

    setEnviando(true);
    setError(null);

    try {
      const cantidadFinal = tipoAjuste === "FALTANTE" ? -cantidadNum : cantidadNum;

      const payload = {
        productoId: productoSel.id,
        cantidad: cantidadFinal,
        notas: notas,
        tipo: tipoAjuste 
      };

      const res = await fetch(`${API_BASE}/api/movimientos/ajuste`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar el ajuste");
      }

      // --- ÉXITO ---
      const accion = tipoAjuste === "SOBRANTE" ? "Ingresaron" : "Se descontaron";
      setMensajeExito(`${accion} ${cantidad} ${productoSel.unidad.abreviatura} de ${productoSel.nombre}.`);
      
      if (onSuccess) onSuccess();
      setShowExito(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL: ÉXITO ---
  if (showExito) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="text-emerald-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">¡Ajuste Registrado!</h3>
          <p className="text-sm text-slate-500 mb-6 px-2">
            El inventario ha sido actualizado correctamente. <br/>
            <span className="font-medium text-slate-700 block mt-2">{mensajeExito}</span>
          </p>
          <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg active:scale-95">
             Entendido
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO NORMAL: FORMULARIO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ajuste de Inventario</h2>
            <p className="text-xs text-slate-500">Corrección de stock (Mermas o Sobrantes)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          
          {paso === 1 ? (
            // --- PASO 1: BUSCADOR ---
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {loadingBusqueda && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="animate-spin text-amber-500" size={20} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {resultados.length === 0 && busqueda.length > 2 && !loadingBusqueda && (
                   <p className="text-center text-gray-400 text-sm py-4">No se encontraron productos.</p>
                )}
                {resultados.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => seleccionarProducto(prod)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                        <Package size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{prod.nombre}</p>
                        <p className="text-xs text-slate-400">{prod.codigo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs font-bold text-slate-500">Stock Actual</span>
                       <span className={`text-sm font-bold ${prod.stockActual > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {prod.stockActual} {prod.unidad.abreviatura}
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // --- PASO 2: DETALLE DEL AJUSTE ---
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Producto Seleccionado */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                      <Package size={20}/>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800">{productoSel?.nombre}</p>
                      <p className="text-xs text-slate-500">Stock: {productoSel?.stockActual} {productoSel?.unidad.abreviatura}</p>
                   </div>
                </div>
                <button type="button" onClick={() => setPaso(1)} className="text-xs font-bold text-blue-600 hover:underline">Cambiar</button>
              </div>

              {/* Selector de Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoAjuste("FALTANTE")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoAjuste === "FALTANTE" 
                      ? "border-rose-500 bg-rose-50 text-rose-700" 
                      : "border-gray-100 bg-white text-gray-400 hover:border-rose-200"
                  }`}
                >
                  <TrendingDown size={24} />
                  <span className="font-bold text-sm">Faltante / Merma</span>
                  <span className="text-[10px] opacity-70">Resta del inventario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoAjuste("SOBRANTE")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoAjuste === "SOBRANTE" 
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                      : "border-gray-100 bg-white text-gray-400 hover:border-emerald-200"
                  }`}
                >
                  <TrendingUp size={24} />
                  <span className="font-bold text-sm">Sobrante</span>
                  <span className="text-[10px] opacity-70">Suma al inventario</span>
                </button>
              </div>

              {/* Cantidad y Notas */}
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a Ajustar ({productoSel?.unidad.abreviatura}) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01" 
                      required
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 font-mono text-lg transition-all ${
                          (tipoAjuste === "FALTANTE" && productoSel && Number(cantidad) > productoSel.stockActual)
                          ? "border-rose-300 focus:ring-rose-200 bg-rose-50 text-rose-900"
                          : "border-gray-200 focus:ring-slate-800 focus:border-transparent"
                      }`}
                      placeholder="0.00"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Observaciones *</label>
                    <textarea 
                      required
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-800 focus:border-transparent text-sm"
                      placeholder="Ej: Producto dañado por lluvia, Vencimiento..."
                      rows={3}
                    />
                 </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg flex items-center gap-2 border border-rose-100 animate-in fade-in">
                   <AlertTriangle size={16}/> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                 <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   // 👇 ARREGLO DEL ERROR DE TYPESCRIPT: Forzamos la comparación a booleana pura
                   disabled={enviando || (tipoAjuste === "FALTANTE" && !!productoSel && Number(cantidad) > productoSel.stockActual)}
                   className={`flex-1 py-3 font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      tipoAjuste === "FALTANTE" 
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                   }`}
                 >
                    {enviando && <Loader2 className="animate-spin" size={18}/>}
                    Confirmar Ajuste
                 </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}