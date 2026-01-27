// src/modules/movimientos/IngresoModal.tsx
import { useState, useEffect } from "react";
import { 
  X, ChevronLeft, Loader2, Plus, Trash2, Search, Save, 
  FileText, Receipt, CheckCircle2, Package, Calendar, User, Building2, Calculator, PlusCircle
} from "lucide-react";
import { catalogosService } from "../../services/catalogosService";
import { useAuth } from "../../context/AuthContext";

// 👇 IMPORTANTE: Importamos el modal de crear producto
// Asegúrate que la ruta sea correcta según tu estructura de carpetas
import CrearProductoModal from "../inventario/components/CrearProductoModal";

interface IngresoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Bodega = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string; nit: string };

type ProductoResult = { 
    id: string; 
    nombre: string; 
    codigo: string; 
    precioref?: number; 
    unidad: { abreviatura: string } 
};

type ItemIngreso = {
  productoId: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number; 
  costoTotal: number;    
};

export function IngresoModal({ onClose, onSuccess }: IngresoModalProps) {
  const { token } = useAuth();
  
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [successData, setSuccessData] = useState<{ codigo: string } | null>(null);

  // Datos de Catálogos
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Paso 1: Encabezado
  const [selectedBodega, setSelectedBodega] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState("");

  // Datos Comprobante
  const [tipoComprobante, setTipoComprobante] = useState<"FACTURA" | "RECIBO">("FACTURA");
  const [factura, setFactura] = useState("");
  const [serie, setSerie] = useState("");
  const [uuid, setUuid] = useState("");

  // Paso 2: Items
  const [items, setItems] = useState<ItemIngreso[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 👇 ESTADO PARA EL MODAL DE CREAR PRODUCTO
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Formulario Producto
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoResult[]>([]);
  const [buscandoProd, setBuscandoProd] = useState(false);
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoResult | null>(null);
  
  const [tempCant, setTempCant] = useState<number | string>(1);
  const [tempCostoTotal, setTempCostoTotal] = useState<number | string>(0);

  // Carga inicial
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [listaBodegas, listaProveedores] = await Promise.all([
          catalogosService.getBodegas(),
          catalogosService.getProveedores()
        ]);
        setBodegas(listaBodegas);
        setProveedores(listaProveedores);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Buscar productos
  const handleBuscar = async () => {
    setBuscandoProd(true);
    try {
      const res = await catalogosService.buscarProductos(busqueda);
      setResultados(res);
    } catch (error) { console.error(error); } 
    finally { setBuscandoProd(false); }
  };

  // Agregar Item
  const handleAgregarItem = () => {
    const cantNum = Number(tempCant);
    const costoTotalNum = Number(tempCostoTotal);

    if (!prodSeleccionado || isNaN(cantNum) || cantNum < 0.0001 || isNaN(costoTotalNum) || costoTotalNum < 0) {
        return; 
    }

    const costoUnitarioCalc = costoTotalNum > 0 ? (costoTotalNum / cantNum) : 0;

    const nuevo: ItemIngreso = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      unidad: prodSeleccionado.unidad.abreviatura,
      cantidad: cantNum,
      costoUnitario: costoUnitarioCalc, 
      costoTotal: costoTotalNum         
    };

    setItems([...items, nuevo]);
    
    // Reset y cerrar formulario
    setProdSeleccionado(null);
    setTempCant(1);
    setTempCostoTotal(0);
    setBusqueda("");
    setResultados([]);
    setShowAddForm(false);
  };

  const handleEliminarItem = (index: number) => {
    const nueva = [...items];
    nueva.splice(index, 1);
    setItems(nueva);
  };

  // Finalizar
  const handleFinalizar = async () => {
    if (showAddForm) return;

    setGuardando(true);
    try {
      const payload = {
        bodegaId: selectedBodega,
        proveedorId: selectedProveedor || null,
        fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
        tipoComprobante,
        factura,
        serie: tipoComprobante === "FACTURA" ? serie : "",
        uuid: tipoComprobante === "FACTURA" ? uuid : "",
        observaciones: obs,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          costo: i.costoUnitario 
        }))
      };

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movimientos/ingreso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      setSuccessData({ 
          codigo: data.documento.consecutivo || "INGRESO REGISTRADO" 
      });

    } catch (error) {
      alert("Error al guardar: " + error);
    } finally {
      setGuardando(false);
    }
  };

  const totalIngreso = items.reduce((acc, item) => acc + item.costoTotal, 0);
  const unitarioPreview = (Number(tempCostoTotal) > 0 && Number(tempCant) > 0) 
      ? (Number(tempCostoTotal) / Number(tempCant)) 
      : 0;

  if (successData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="text-slate-700 w-10 h-10" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Ingreso Exitoso!</h2>
          <p className="text-slate-500 mb-6 text-sm">
            El inventario ha sido actualizado.
            <br/>
            Referencia: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded mt-2 inline-block border border-slate-200">{successData.codigo}</span>
          </p>
          <button 
            onClick={() => { onSuccess(); onClose(); }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-300"
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-slate-50 w-full h-full sm:h-[85vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:px-6 flex justify-between items-center text-white shrink-0 shadow-md z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Nuevo Ingreso</h2>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
               <span className={`px-2 py-0.5 rounded-full ${step === 1 ? 'bg-white/20 text-white' : ''}`}>Paso 1</span>
               <ChevronLeft size={12}/>
               <span className={`px-2 py-0.5 rounded-full ${step === 2 ? 'bg-white/20 text-white' : ''}`}>Paso 2</span>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth bg-slate-50">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                <Loader2 className="animate-spin text-slate-600" size={48}/>
                <p className="text-sm font-medium text-slate-500">Cargando catálogos...</p>
             </div>
          ) : (
            <>
              {/* === PASO 1: GENERAL === */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                   
                   {/* Sección Bodega y Fecha */}
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <h3 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <Building2 size={16}/> Destino y Fecha
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bodega Destino *</label>
                           <select 
                             value={selectedBodega}
                             onChange={(e) => setSelectedBodega(e.target.value)}
                             className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 focus:bg-white transition-all"
                           >
                             <option value="">-- Seleccione --</option>
                             {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha de Ingreso</label>
                           <div className="relative">
                               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                               <input 
                                 type="date" 
                                 value={fecha}
                                 onChange={(e) => setFecha(e.target.value)}
                                 className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 focus:bg-white transition-all"
                               />
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Sección Proveedor y Documento */}
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <h3 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <User size={16}/> Proveedor y Documentación
                      </h3>
                      
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Proveedor *</label>
                         <select 
                           value={selectedProveedor}
                           onChange={(e) => setSelectedProveedor(e.target.value)}
                           className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 focus:bg-white transition-all"
                         >
                           <option value="">-- Seleccione Proveedor --</option>
                           {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} (NIT: {p.nit || "C/F"})</option>)}
                         </select>
                      </div>

                      <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-200">
                          <button 
                            onClick={() => setTipoComprobante("FACTURA")}
                            className={`flex-1 p-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                tipoComprobante === "FACTURA" 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                             <FileText size={16} /> Factura
                          </button>
                          <button 
                            onClick={() => setTipoComprobante("RECIBO")}
                            className={`flex-1 p-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                tipoComprobante === "RECIBO" 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                             <Receipt size={16} /> Recibo / Otro
                          </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {tipoComprobante === "FACTURA" && (
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Serie</label>
                                <input 
                                  type="text" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ej. A"
                                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                             </div>
                          )}
                          <div className={tipoComprobante === "RECIBO" ? "sm:col-span-3" : "sm:col-span-2"}>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                  {tipoComprobante === "FACTURA" ? "Número *" : "No. Documento *"}
                              </label>
                              <input 
                                type="text" value={factura} onChange={(e) => setFactura(e.target.value)} placeholder="Ej. 12345678"
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                              />
                          </div>
                          {tipoComprobante === "FACTURA" && (
                             <div className="sm:col-span-3">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UUID (SAT)</label>
                                <input 
                                  type="text" value={uuid} onChange={(e) => setUuid(e.target.value)} placeholder="Código de autorización..."
                                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-mono"
                                />
                             </div>
                          )}
                      </div>

                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Observaciones</label>
                         <textarea 
                           value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Notas opcionales..."
                           className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* === PASO 2: ITEMS === */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300 h-full flex flex-col">
                  
                  {/* Lista Vacía */}
                  {!showAddForm && items.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                           <Package className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg">Sin productos</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Registra los productos según el total de la factura.</p>
                        <button onClick={() => setShowAddForm(true)} className="bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-200 flex items-center gap-2">
                           <Plus size={18}/> Agregar Item
                        </button>
                      </div>
                  )}

                  {/* Formulario Agregar */}
                  {showAddForm && (
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 space-y-4 relative ring-4 ring-slate-100">
                       <button onClick={() => setShowAddForm(false)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>
                       <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 mb-4">Detalle del Producto</h3>

                       {/* Buscador */}
                       {!prodSeleccionado ? (
                         <div>
                            {/* 🆕 AQUÍ ESTÁ EL ACCESO DIRECTO PARA CREAR PRODUCTO */}
                            <div className="flex justify-between items-end mb-1">
                               <label className="text-xs font-bold text-slate-500 uppercase block">Buscar Producto</label>
                               <button 
                                 onClick={() => setShowCreateProduct(true)}
                                 className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 hover:bg-indigo-50 px-2 py-0.5 rounded transition"
                               >
                                 <PlusCircle size={14}/> Crear Nuevo
                               </button>
                            </div>

                            <div className="flex gap-2">
                               <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                  <input 
                                    type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                                    placeholder="Nombre o código..."
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                    autoFocus
                                  />
                               </div>
                               <button onClick={handleBuscar} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 transition">
                                 {buscandoProd ? <Loader2 className="animate-spin" size={20}/> : "Buscar"}
                               </button>
                            </div>
                            
                            {resultados.length > 0 && (
                              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl shadow-lg bg-white divide-y divide-slate-100 absolute w-full z-20 left-0">
                                {resultados.map(p => (
                                  <button key={p.id} onClick={() => {
                                      setProdSeleccionado(p);
                                      setTempCostoTotal(0); 
                                  }} className="w-full text-left p-3 hover:bg-slate-50 transition flex justify-between items-center group">
                                     <div>
                                        <span className="font-medium text-slate-700 text-sm block group-hover:text-slate-900">{p.nombre}</span>
                                        <span className="text-xs text-slate-400">{p.codigo}</span>
                                     </div>
                                  </button>
                                ))}
                              </div>
                            )}
                         </div>
                       ) : (
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                             <div className="flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-full text-slate-600 shadow-sm"><CheckCircle2 size={20}/></div>
                                 <div>
                                     <span className="font-bold text-slate-900 text-sm block">{prodSeleccionado.nombre}</span>
                                     <span className="text-xs text-slate-500 font-medium">{prodSeleccionado.codigo}</span>
                                 </div>
                             </div>
                             <button onClick={() => setProdSeleccionado(null)} className="text-slate-400 hover:text-red-500 text-xs font-bold px-3 py-1 hover:bg-white rounded-lg transition">Cambiar</button>
                          </div>
                       )}

                       {/* Inputs Cantidad y Costo */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad ({prodSeleccionado?.unidad.abreviatura})</label>
                              <input 
                                type="number" min="0.1" value={tempCant} onChange={(e) => setTempCant(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-bold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Costo Total (Q)</label>
                              <div className="relative">
                                <input 
                                    type="number" min="0" value={tempCostoTotal} onChange={(e) => setTempCostoTotal(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-bold text-slate-800 pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Calculator size={16}/></span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-medium mt-1 text-right">
                                Unitario calc: Q{unitarioPreview.toFixed(4)}
                              </p>
                           </div>
                       </div>
                       
                       <div className="pt-2">
                           <button 
                             onClick={handleAgregarItem} 
                             disabled={!prodSeleccionado || Number(tempCant) < 0.0001} 
                             className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-slate-200"
                           >
                              Confirmar Item
                           </button>
                       </div>
                    </div>
                  )}

                  {/* Lista de Items Agregados */}
                  {!showAddForm && items.length > 0 && (
                    <div className="space-y-3 pb-20 sm:pb-0">
                       <div className="flex justify-between items-center px-1">
                          <h3 className="font-bold text-slate-700 text-sm">Productos ({items.length})</h3>
                          <button onClick={() => setShowAddForm(true)} className="text-slate-600 text-xs font-bold hover:bg-white px-2 py-1 rounded transition flex items-center gap-1 border border-transparent hover:border-slate-200">
                             <Plus size={14}/> Agregar otro
                          </button>
                       </div>

                       <div className="grid gap-3">
                          {items.map((item, idx) => (
                             <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                       <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium mr-2">{item.cantidad} {item.unidad}</span>
                                       <span className="text-slate-400 text-[10px]">(Unit: Q{item.costoUnitario.toFixed(2)})</span>
                                    </p>
                                 </div>
                                 <div className="text-right flex items-center gap-3">
                                     <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Línea</p>
                                        <p className="font-bold text-slate-800 text-base">Q{item.costoTotal.toFixed(2)}</p>
                                     </div>
                                     <button onClick={() => handleEliminarItem(idx)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition ml-2">
                                        <Trash2 size={18}/>
                                     </button>
                                 </div>
                             </div>
                          ))}
                          
                          <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg mt-4">
                              <span className="text-sm font-medium text-slate-300">Total Factura</span>
                              <span className="text-xl font-bold">Q{totalIngreso.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Fijo */}
        <div className="p-4 sm:px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 z-20">
           {step === 2 ? (
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition">
                 <ChevronLeft size={18}/> Atrás
              </button>
           ) : <div/>}
           
           {step === 1 ? (
             <button 
               onClick={() => setStep(2)} 
               disabled={!selectedBodega || !selectedProveedor || !factura} 
               className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-300 transition-all active:scale-95 ml-auto"
             >
               Siguiente
             </button>
           ) : (
             <button 
               onClick={handleFinalizar} 
               disabled={items.length === 0 || guardando || showAddForm} 
               className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 shadow-lg shadow-slate-300 transition-all active:scale-95 ml-auto"
             >
                 {guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                 {showAddForm ? "Termina de agregar..." : "Finalizar Ingreso"}
             </button>
           )}
        </div>
      </div>

      {/* 🟢 RENDERIZADO DEL MODAL SECUNDARIO: CREAR PRODUCTO */}
      {showCreateProduct && (
        <CrearProductoModal
          isOpen={showCreateProduct}
          onClose={() => setShowCreateProduct(false)}
          onSuccess={() => {
             // Al tener éxito, solo cerramos. El usuario puede buscar su nuevo producto.
             setShowCreateProduct(false);
          }}
        />
      )}

    </div>
  );
}