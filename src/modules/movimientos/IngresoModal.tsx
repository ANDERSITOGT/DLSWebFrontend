// src/modules/movimientos/IngresoModal.tsx
import { useState, useEffect } from "react";
import { X, ChevronLeft, Loader2, Plus, Trash2, Search, Save, FileText, Receipt, CheckCircle2 } from "lucide-react";
import { catalogosService } from "../../services/catalogosService";
import { useAuth } from "../../context/AuthContext";

interface IngresoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Bodega = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string; nit: string };

// 👇 ACTUALIZADO: Agregamos 'precioref' (puede ser opcional)
type ProductoResult = { 
    id: string; 
    nombre: string; 
    codigo: string; 
    precioref?: number; // <--- DATO NUEVO
    unidad: { abreviatura: string } 
};

type ItemIngreso = {
  productoId: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  costo: number;
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
  
  // Formulario Producto
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoResult[]>([]);
  const [buscandoProd, setBuscandoProd] = useState(false);
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoResult | null>(null);
  
  const [tempCant, setTempCant] = useState<number | string>(1);
  const [tempCosto, setTempCosto] = useState<number | string>(0);

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

  const handleBuscar = async () => {
    setBuscandoProd(true);
    try {
      const res = await catalogosService.buscarProductos(busqueda);
      setResultados(res);
    } catch (error) { console.error(error); } 
    finally { setBuscandoProd(false); }
  };

  const handleAgregarItem = () => {
    const cantNum = Number(tempCant);
    const costoNum = Number(tempCosto);

    if (!prodSeleccionado || isNaN(cantNum) || cantNum < 0.1 || isNaN(costoNum) || costoNum < 0.1) {
        return; 
    }

    const nuevo: ItemIngreso = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      unidad: prodSeleccionado.unidad.abreviatura,
      cantidad: cantNum,
      costo: costoNum
    };

    setItems([...items, nuevo]);
    setProdSeleccionado(null);
    setTempCant(1);
    setTempCosto(0);
    setBusqueda("");
    setResultados([]);
    setShowAddForm(false);
  };

  const handleEliminarItem = (index: number) => {
    const nueva = [...items];
    nueva.splice(index, 1);
    setItems(nueva);
  };

  const handleFinalizar = async () => {
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
          costo: i.costo
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
      setGuardando(false);
    }
  };

  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600 w-10 h-10 animate-bounce" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Ingreso Exitoso!</h2>
          <p className="text-slate-500 mb-6">
            El inventario ha sido actualizado correctamente.
            <br/>
            Referencia: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded mt-2 inline-block">{successData.codigo}</span>
          </p>
          <button 
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition transform active:scale-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">Nuevo Ingreso</h2>
            <p className="text-slate-400 text-xs">Paso {step} de 2</p>
          </div>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-600" size={40}/></div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                     <h3 className="font-bold text-slate-700 text-sm border-b pb-2 mb-2">Información General</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Bodega Destino *</label>
                           <select 
                             value={selectedBodega}
                             onChange={(e) => setSelectedBodega(e.target.value)}
                             className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                           >
                             <option value="">Seleccione...</option>
                             {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Fecha Ingreso</label>
                           <input 
                             type="date" 
                             value={fecha}
                             onChange={(e) => setFecha(e.target.value)}
                             className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Proveedor *</label>
                        <select 
                           value={selectedProveedor}
                           onChange={(e) => setSelectedProveedor(e.target.value)}
                           className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                           <option value="">Seleccione...</option>
                           {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} (NIT: {p.nit || "C/F"})</option>)}
                        </select>
                     </div>
                   </div>

                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-700 text-sm border-b pb-2 mb-2">Datos del Documento</h3>
                      
                      <div className="flex gap-4 mb-4">
                          <button 
                            onClick={() => setTipoComprobante("FACTURA")}
                            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition ${
                                tipoComprobante === "FACTURA" 
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" 
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                             <FileText size={18} /> Factura (FEL)
                          </button>
                          <button 
                            onClick={() => setTipoComprobante("RECIBO")}
                            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition ${
                                tipoComprobante === "RECIBO" 
                                ? "bg-amber-50 border-amber-500 text-amber-700 font-bold" 
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                             <Receipt size={18} /> Recibo / Otro
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                          {tipoComprobante === "FACTURA" && (
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Serie</label>
                                  <input 
                                      type="text" 
                                      value={serie}
                                      onChange={(e) => setSerie(e.target.value)}
                                      placeholder="Ej. A"
                                      className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                              </div>
                          )}

                          <div className={tipoComprobante === "RECIBO" ? "md:col-span-3" : ""}>
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                  {tipoComprobante === "FACTURA" ? "Número de Factura *" : "Número de Recibo *"}
                              </label>
                              <input 
                                  type="text" 
                                  value={factura}
                                  onChange={(e) => setFactura(e.target.value)}
                                  placeholder="Ej. 12345678"
                                  className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                          </div>

                          {tipoComprobante === "FACTURA" && (
                              <div className="md:col-span-1">
                                  <label className="text-xs font-bold text-slate-500 uppercase">UUID (Autorización)</label>
                                  <input 
                                      type="text" 
                                      value={uuid}
                                      onChange={(e) => setUuid(e.target.value)}
                                      placeholder="Código largo SAT..."
                                      className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                              </div>
                          )}
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                      <textarea 
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                        rows={2}
                        placeholder="Notas adicionales..."
                        className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  {!showAddForm && (
                     <button onClick={() => setShowAddForm(true)} className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition flex items-center justify-center gap-2 font-medium">
                        <Plus size={20}/> Agregar Producto
                     </button>
                  )}

                  {showAddForm && (
                    <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm animate-in zoom-in-95 space-y-4 relative">
                       <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18}/></button>
                       <h3 className="font-bold text-slate-700 text-sm">Nuevo Item</h3>

                       {!prodSeleccionado ? (
                          <div className="flex gap-2">
                             <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/>
                             <button onClick={handleBuscar} className="bg-slate-100 p-2 rounded-lg border hover:bg-slate-200">
                                {buscandoProd ? <Loader2 className="animate-spin"/> : <Search size={20}/>}
                             </button>
                          </div>
                       ) : (
                          <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center border border-emerald-100">
                             <span className="font-bold text-emerald-800">{prodSeleccionado.nombre}</span>
                             <button onClick={() => setProdSeleccionado(null)} className="text-xs text-emerald-600 font-bold hover:underline">Cambiar</button>
                          </div>
                       )}

                       {!prodSeleccionado && resultados.length > 0 && (
                          <div className="max-h-32 overflow-y-auto border rounded-lg">
                             {resultados.map(p => (
                                // 🪄 AQUÍ ESTÁ LA MAGIA DEL AUTOLLENADO
                                <button key={p.id} onClick={() => {
                                    setProdSeleccionado(p);
                                    // Si trae precio, lo ponemos. Si no, 0.
                                    if (p.precioref) {
                                        setTempCosto(Number(p.precioref));
                                    } else {
                                        setTempCosto(0);
                                    }
                                }} className="w-full text-left p-2 hover:bg-slate-50 text-sm border-b last:border-0 block">
                                   {p.nombre} ({p.codigo})
                                </button>
                             ))}
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-xs font-bold text-slate-500">Cantidad ({prodSeleccionado?.unidad.abreviatura})</label>
                             <input 
                                type="number" 
                                min="0.1" 
                                value={tempCant} 
                                onChange={(e) => setTempCant(e.target.value)} 
                                className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                             />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-slate-500">Costo Unitario (Q)</label>
                             <input 
                                type="number" 
                                min="0.1" 
                                value={tempCosto} 
                                onChange={(e) => setTempCosto(e.target.value)} 
                                className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                             />
                          </div>
                       </div>
                       
                       <button 
                          onClick={handleAgregarItem} 
                          disabled={!prodSeleccionado || Number(tempCant) < 0.1 || Number(tempCosto) < 0.1} 
                          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                       >
                           Confirmar
                       </button>
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold">
                             <tr>
                                <th className="p-3">Producto</th>
                                <th className="p-3">Cant.</th>
                                <th className="p-3">Costo</th>
                                <th className="p-3">Total</th>
                                <th className="p-3"></th>
                             </tr>
                          </thead>
                          <tbody>
                             {items.map((item, idx) => (
                                <tr key={idx} className="border-t border-slate-100">
                                   <td className="p-3 font-medium text-slate-700">{item.nombre}</td>
                                   <td className="p-3">{item.cantidad} {item.unidad}</td>
                                   <td className="p-3">Q{item.costo}</td>
                                   <td className="p-3 font-bold">Q{(item.cantidad * item.costo).toFixed(2)}</td>
                                   <td className="p-3 text-right">
                                      <button onClick={() => handleEliminarItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between shrink-0">
           {step === 2 ? (
             <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1">
                <ChevronLeft size={16}/> Atrás
             </button>
           ) : <span></span>}
           
           {step === 1 ? (
              <button 
                onClick={() => setStep(2)} 
                disabled={!selectedBodega || !selectedProveedor || !factura} 
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition"
              >
                Siguiente
              </button>
           ) : (
              <button 
                onClick={handleFinalizar} 
                disabled={items.length === 0 || guardando} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition shadow-lg shadow-emerald-200"
              >
                 {guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Finalizar Ingreso
              </button>
           )}
        </div>

      </div>
    </div>
  );
}