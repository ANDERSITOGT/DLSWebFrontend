// src/modules/movimientos/IngresoModal.tsx
import { useState, useEffect } from "react";
import { 
  X, ChevronRight, ChevronLeft, Loader2, Plus, Trash2, Search, Save 
} from "lucide-react";
import { catalogosService } from "../../services/catalogosService";
import { useAuth } from "../../context/AuthContext";

interface IngresoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Bodega = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string };
type ProductoResult = { id: string; nombre: string; codigo: string; unidad: { abreviatura: string } };

// Estructura de un item en la lista de compra
type ItemIngreso = {
  productoId: string;
  nombre: string;
  codigo: string;
  unidad: string;
  cantidad: number;
  costo: number;
};

export function IngresoModal({ onClose, onSuccess }: IngresoModalProps) {
  const { token } = useAuth(); // Necesitamos el token para guardar
  
  // --- ESTADOS GLOBALES ---
  const [step, setStep] = useState(1); // 1: General, 2: Productos, 3: Resumen
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // --- PASO 1: DATOS GENERALES ---
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  const [selectedBodega, setSelectedBodega] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [factura, setFactura] = useState("");
  const [obs, setObs] = useState("");

  // --- PASO 2: PRODUCTOS ---
  const [items, setItems] = useState<ItemIngreso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoResult[]>([]);
  const [buscandoProd, setBuscandoProd] = useState(false);

  // Estados temporales para agregar un producto
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoResult | null>(null);
  const [tempCant, setTempCant] = useState<number>(1);
  const [tempCosto, setTempCosto] = useState<number>(0);

  // Cargar catálogos iniciales
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [listaBodegas, listaProv] = await Promise.all([
          catalogosService.getBodegas(),
          catalogosService.getProveedores()
        ]);
        setBodegas(listaBodegas);
        setProveedores(listaProv);
      } catch (error) {
        console.error("Error cargando catálogos", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- FUNCIONES DE LÓGICA ---

  // Buscar productos en el backend
  const handleBuscar = async () => {
    if (!busqueda.trim()) return;
    setBuscandoProd(true);
    try {
      const res = await catalogosService.buscarProductos(busqueda);
      setResultados(res);
    } catch (error) {
      console.error(error);
    } finally {
      setBuscandoProd(false);
    }
  };

  // Agregar producto a la lista temporal
  const handleAgregarItem = () => {
    if (!prodSeleccionado || tempCant <= 0) return;

    const nuevoItem: ItemIngreso = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      codigo: prodSeleccionado.codigo,
      unidad: prodSeleccionado.unidad.abreviatura,
      cantidad: tempCant,
      costo: tempCosto
    };

    setItems([...items, nuevoItem]);
    
    // Resetear formulario de producto
    setProdSeleccionado(null);
    setTempCant(1);
    setTempCosto(0);
    setResultados([]);
    setBusqueda("");
  };

  // Eliminar producto de la lista
  const handleEliminarItem = (index: number) => {
    const nuevaLista = [...items];
    nuevaLista.splice(index, 1);
    setItems(nuevaLista);
  };

  // GUARDAR TODO EN EL BACKEND
  const handleFinalizar = async () => {
    setGuardando(true);
    try {
      const payload = {
        bodegaId: selectedBodega,
        proveedorId: selectedProveedor || null,
        fecha,
        factura,
        observaciones: obs,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          costo: i.costo
        }))
      };

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movimientos/ingreso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Importante: Enviamos el token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al guardar");

      // Todo salió bien
      onSuccess(); // Avisamos al padre que recargue
      onClose();   // Cerramos el modal

    } catch (error) {
      alert("Error al guardar: " + error);
    } finally {
      setGuardando(false);
    }
  };

  // Cálculos de totales
  const totalItems = items.length;
  const totalDinero = items.reduce((acc, item) => acc + (item.cantidad * item.costo), 0);

  // --- RENDERIZADO ---

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* HEADER AZUL */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">Registrar Ingreso</h2>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span className={step === 1 ? "font-bold text-white" : ""}>1. Datos</span>
              <ChevronRight size={12} />
              <span className={step === 2 ? "font-bold text-white" : ""}>2. Productos</span>
              <ChevronRight size={12} />
              <span className={step === 3 ? "font-bold text-white" : ""}>3. Confirmar</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO VARIABLE SEGÚN EL PASO */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          
          {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40}/>
             </div>
          ) : (
            <>
              {/* === PASO 1: DATOS GENERALES === */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Bodega Destino *</label>
                          <select 
                            value={selectedBodega}
                            onChange={(e) => setSelectedBodega(e.target.value)}
                            className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          >
                            <option value="">Seleccione una bodega...</option>
                            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Fecha *</label>
                          <input 
                            type="date" 
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Proveedor</label>
                        <select 
                           value={selectedProveedor}
                           onChange={(e) => setSelectedProveedor(e.target.value)}
                           className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="">Seleccione un proveedor (opcional)</option>
                          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                      </div>

                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Factura / Referencia</label>
                         <input 
                            type="text" 
                            value={factura}
                            onChange={(e) => setFactura(e.target.value)}
                            placeholder="Ej: FAC-001"
                            className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                      </div>
                      
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                         <textarea 
                            value={obs}
                            onChange={(e) => setObs(e.target.value)}
                            rows={3}
                            className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* === PASO 2: AGREGAR PRODUCTOS === */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  
                  {/* Buscador */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Buscar Producto</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        placeholder="Escribe nombre o código..."
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={handleBuscar}
                        disabled={buscandoProd}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition border border-slate-300"
                      >
                        {buscandoProd ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                      </button>
                    </div>

                    {/* Resultados de Búsqueda */}
                    {resultados.length > 0 && !prodSeleccionado && (
                      <div className="mt-3 max-h-40 overflow-y-auto border border-slate-100 rounded-lg">
                        {resultados.map(prod => (
                          <button 
                            key={prod.id}
                            onClick={() => setProdSeleccionado(prod)}
                            className="w-full text-left p-2 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0 flex justify-between"
                          >
                            <span>{prod.nombre}</span>
                            <span className="text-slate-400 text-xs">{prod.codigo}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Formulario de Cantidad (Se muestra al seleccionar producto) */}
                    {prodSeleccionado && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-blue-900">{prodSeleccionado.nombre}</h4>
                          <button onClick={() => setProdSeleccionado(null)} className="text-blue-400 hover:text-blue-600"><X size={16}/></button>
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="text-xs text-blue-700 font-semibold">Cantidad ({prodSeleccionado.unidad.abreviatura})</label>
                            <input type="number" min="0.01" value={tempCant} onChange={e => setTempCant(parseFloat(e.target.value))} className="w-full mt-1 border border-blue-200 rounded p-2 text-sm"/>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-blue-700 font-semibold">Costo Unitario (Q)</label>
                            <input type="number" min="0" value={tempCosto} onChange={e => setTempCosto(parseFloat(e.target.value))} className="w-full mt-1 border border-blue-200 rounded p-2 text-sm"/>
                          </div>
                          <button 
                            onClick={handleAgregarItem}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                          >
                            <Plus size={18} /> Agregar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabla de Items Agregados */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-700">Productos en la lista ({items.length})</h3>
                      <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">Total: Q{totalDinero.toFixed(2)}</span>
                    </div>
                    
                    {items.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No hay productos agregados aún.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2">Producto</th>
                              <th className="px-4 py-2">Cant.</th>
                              <th className="px-4 py-2">Costo</th>
                              <th className="px-4 py-2">Subtotal</th>
                              <th className="px-4 py-2 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium">{item.nombre}</td>
                                <td className="px-4 py-2">{item.cantidad} {item.unidad}</td>
                                <td className="px-4 py-2">Q{item.costo}</td>
                                <td className="px-4 py-2 font-bold">Q{(item.cantidad * item.costo).toFixed(2)}</td>
                                <td className="px-4 py-2 text-center">
                                  <button onClick={() => handleEliminarItem(idx)} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === PASO 3: RESUMEN FINAL === */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <Save size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">¿Listo para guardar?</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Se registrará un ingreso de <strong>{totalItems} productos</strong> en la bodega <strong>{bodegas.find(b => b.id === selectedBodega)?.nombre}</strong> por un valor total de <strong>Q{totalDinero.toFixed(2)}</strong>.
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg text-left text-sm space-y-2 border border-slate-100">
                      <p><span className="font-bold text-slate-700">Factura:</span> {factura || "Sin factura"}</p>
                      <p><span className="font-bold text-slate-700">Proveedor:</span> {proveedores.find(p => p.id === selectedProveedor)?.nombre || "N/A"}</p>
                      <p><span className="font-bold text-slate-700">Fecha:</span> {fecha}</p>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* FOOTER DE ACCIONES */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between shrink-0">
          
          {/* Botón Atrás */}
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition font-medium text-sm"
              disabled={guardando}
            >
              <ChevronLeft size={18} /> Atrás
            </button>
          ) : (
            <div /> // Espaciador
          )}

          {/* Botón Siguiente / Guardar */}
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !selectedBodega : items.length === 0} // Validaciones
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleFinalizar}
              disabled={guardando}
              className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition font-bold text-sm shadow-md disabled:opacity-70"
            >
              {guardando ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Guardando...
                </>
              ) : (
                <>
                  Confirmar Ingreso <Save size={18} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}