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


import { apiFetch } from "@/services/api";
import { esProductoSinCosto, mensajeDeApiError } from "@/services/apiErrorMessage";

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

/**
 * Tipo de ajuste EXPLICITO que espera el backend:
 * - ENTRADA: suma al inventario (sobrante).
 * - SALIDA:  resta del inventario (faltante / merma) y requiere precio ref.
 */
type TipoAjuste = "ENTRADA" | "SALIDA";

export function AjusteInventarioModal({ onClose, onSuccess }: Props) {
  
  
  // --- Estados del Formulario ---
  const [paso, setPaso] = useState<1 | 2>(1);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  
  // Datos del Ajuste
  const [productoSel, setProductoSel] = useState<ProductoBusqueda | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>("SALIDA");
    const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alerta amigable de negocio (p. ej. PRODUCTO_SIN_COSTO en una salida).
  const [alerta, setAlerta] = useState<{ titulo: string; msg: string } | null>(null);

  // --- EXITO ---
  const [showExito, setShowExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  // --- Logica de Busqueda ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {


            if (busqueda.length > 2) {
        setLoadingBusqueda(true);
        try {
          const res = await apiFetch(
            `/api/productos/productos-busqueda?q=${encodeURIComponent(busqueda)}`
          );
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
  }, [busqueda]);

  // --- Manejo de Seleccion ---
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

    // El backend recibe la cantidad SIEMPRE positiva; el signo lo pone el tipo.
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
        setError("La cantidad a ajustar debe ser mayor que 0.");
        return;
    }

    // 🔒 DOBLE SEGURIDAD: Validacion interna por si el usuario habilita el boton con trucos
    if (tipoAjuste === "SALIDA" && cantidadNum > productoSel.stockActual) {
        setError(`Stock insuficiente. Tienes ${productoSel.stockActual}, intentas sacar ${cantidadNum}.`);
        return;
    }

    setEnviando(true);
    setError(null);

    try {
      // El backend espera el tipo explicito (ENTRADA/SALIDA) y la cantidad
      // siempre positiva; el signo lo determina el tipo.
      const payload = {
        productoId: productoSel.id,
        cantidad: cantidadNum,
        notas: notas,
        tipo: tipoAjuste,
      };

      const res = await apiFetch("/api/movimientos/ajuste", {
        method: "POST",
        body: JSON.stringify(payload),
      });

            const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // PRODUCTO_SIN_COSTO (400): alerta amigable con instrucciones accionables.
        if (esProductoSinCosto(null, data)) {
          setAlerta({
            titulo: "Producto sin costo configurado",
            msg: mensajeDeApiError(null, data),
          });
          return;
        }
        // Otros codigos de negocio -> mensaje claro en el banner inline.
        setError(mensajeDeApiError(null, data, "Error al registrar el ajuste"));
        return;
      }

      // --- EXITO ---
      const accion = tipoAjuste === "ENTRADA" ? "Ingresaron" : "Se descontaron";
      setMensajeExito(`${accion} ${cantidad} ${productoSel.unidad.abreviatura} de ${productoSel.nombre}.`);
      
      if (onSuccess) onSuccess();
      setShowExito(true);






        } catch (err) {
      // PRODUCTO_SIN_COSTO tambien puede llegar como ApiError tipado.
      if (esProductoSinCosto(err)) {
        setAlerta({
          titulo: "Producto sin costo configurado",
          msg: mensajeDeApiError(err, null),
        });
      } else {
        setError(mensajeDeApiError(err, null, "Error de conexion al registrar el ajuste."));
      }
    } finally {
      setEnviando(false);
    }
  };

  // --- EXITO ---
  if (showExito) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="text-emerald-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ajuste Registrado!</h3>
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

      {/* Alerta amigable de negocio (p. ej. PRODUCTO_SIN_COSTO en una salida) */}
      {alerta && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle size={30} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-800">{alerta.titulo}</h3>
            <p className="mb-5 px-2 text-sm text-slate-500">{alerta.msg}</p>
            <button
              onClick={() => setAlerta(null)}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-600 active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ajuste de Inventario</h2>
            <p className="text-xs text-slate-500">Correccion de stock (Mermas o Sobrantes)</p>
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
                  placeholder="Buscar producto por nombre o codigo..."
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
                  onClick={() => setTipoAjuste("SALIDA")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoAjuste === "SALIDA" 
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
                  onClick={() => setTipoAjuste("ENTRADA")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoAjuste === "ENTRADA"
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
                          (tipoAjuste === "SALIDA" && productoSel && Number(cantidad) > productoSel.stockActual)
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
                      placeholder="Ej: producto danado por lluvia, Vencimiento..."
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
                   disabled={enviando || (tipoAjuste === "SALIDA" && !!productoSel && Number(cantidad) > productoSel.stockActual)}
                   className={`flex-1 py-3 font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      tipoAjuste === "SALIDA" 
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