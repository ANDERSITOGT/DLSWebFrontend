import { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Truck,     
  Calendar,
  Package,
  ArrowRight,
  Trash2,
  Sprout // Icono para Lote/Cultivo
} from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // 👈 Importamos Auth

const API_BASE = import.meta.env.VITE_API_URL;

// Tipos
type SolicitudHistorial = {
  id: string;
  codigo: string;
  fecha: string;
  bodegaNombre: string;
  totalProductos: number;
};

type ItemDevolucion = {
  productoId: string;
  nombre: string;
  codigo: string;
  unidad: string;
  cantidadOriginal: number;
  cantidadDevolver: number;
  loteId?: string | null;
  loteInfo?: string; 
  notas?: string;
};

type Proveedor = { id: string; nombre: string; };
type Bodega = { id: string; nombre: string; };

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function SolicitudDevolucionModal({ onClose, onSuccess }: Props) {
  // 👇 Obtenemos token y usuario
  const { token, user } = useAuth();
  const esBodeguero = user?.rol === "ADMIN" || user?.rol === "BODEGUERO";

  const [activeTab, setActiveTab] = useState<"INTERNA" | "PROVEEDOR">("INTERNA");
  const [showExito, setShowExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados Interna
  const [stepInterna, setStepInterna] = useState<1 | 2>(1);
  const [historial, setHistorial] = useState<SolicitudHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [solicitudSel, setSolicitudSel] = useState<SolicitudHistorial | null>(null);
  const [itemsInternos, setItemsInternos] = useState<ItemDevolucion[]>([]);
  const [motivoInterno, setMotivoInterno] = useState("");

  // Estados Proveedor
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [provSel, setProvSel] = useState("");
  const [bodegaSel, setBodegaSel] = useState("");
  const [itemsProveedor, setItemsProveedor] = useState<ItemDevolucion[]>([]);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [resBusqueda, setResBusqueda] = useState<any[]>([]); 

  useEffect(() => {
    if (activeTab === "INTERNA" && stepInterna === 1) cargarHistorial();
  }, [activeTab, stepInterna]);

  useEffect(() => {
    if (activeTab === "PROVEEDOR" && esBodeguero) cargarCatalogos();
  }, [activeTab]);

  useEffect(() => {
      const timer = setTimeout(async () => {
          if (activeTab === "PROVEEDOR" && busquedaProd.length > 2) {
              try {
                  // 👇 Token agregado
                  const res = await fetch(`${API_BASE}/api/catalogos/productos-busqueda?q=${busquedaProd}`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  if(res.ok) setResBusqueda(await res.json());
              } catch(e) { console.error(e); }
          } else {
              setResBusqueda([]);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [busquedaProd, activeTab]);

  // --- LÓGICA INTERNA ---
  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const mis = user?.rol === "SOLICITANTE" ? "true" : "false"; 
      
      // 👇 Token agregado
      // Además filtramos tipo=DESPACHO para evitar devolver devoluciones (tu corrección anterior)
      const res = await fetch(`${API_BASE}/api/solicitudes?estado=ENTREGADA&mis=${mis}&tipo=DESPACHO`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
          const data = await res.json();
          // El backend devuelve { solicitudes: [...] } o array directo
          const lista = data.solicitudes || (Array.isArray(data) ? data : []);
          
          // Filtramos las que ya han sido devueltas
          const filtradas = lista.filter((s: any) => !s.yaDevuelta); 
          setHistorial(filtradas);
      }
    } catch (err) { console.error(err); } 
    finally { setLoadingHistorial(false); }
  };

  const seleccionarSolicitud = async (sol: SolicitudHistorial) => {
    setEnviando(true); 
    setError(null);
    try {
        // 👇 Token agregado
        const res = await fetch(`${API_BASE}/api/solicitudes/${sol.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al cargar detalle");
        
        const detalle = await res.json();
        
        const itemsEditables: ItemDevolucion[] = detalle.productos.map((p: any) => ({
            productoId: p.productoObjId || p.productoId,
            nombre: p.nombre,
            codigo: p.codigo,
            unidad: p.unidad,
            cantidadOriginal: Number(p.cantidad),
            cantidadDevolver: 0, 
            loteId: p.loteId, 
            loteInfo: p.loteCodigo !== "Sin Lote" ? `${p.loteCodigo} (${p.cultivo})` : "General",
            notas: ""
        }));

        setItemsInternos(itemsEditables);
        setSolicitudSel(sol);
        setStepInterna(2);
    } catch (error: any) {
        setError(error.message);
    } finally {
        setEnviando(false);
    }
  };

  // 👇 LÓGICA DE ENVÍO CON ID ORIGEN 👇
  const enviarDevolucionInterna = async () => {
      const itemsAEnviar = itemsInternos
        .filter(i => i.cantidadDevolver > 0)
        .map(i => ({
            productoId: i.productoId,
            cantidad: i.cantidadDevolver,
            notas: i.notas || motivoInterno,
            loteId: i.loteId
        }));

      if (itemsAEnviar.length === 0) {
          setError("Debes devolver al menos una cantidad mayor a 0.");
          return;
      }

      setEnviando(true);
      setError(null);

      try {
          let finalBodegaId = "";
          if (bodegas.length > 0) finalBodegaId = bodegas[0].id;
          else {
              // 👇 Token agregado
              const resB = await fetch(`${API_BASE}/api/catalogos/bodegas`, { headers: { Authorization: `Bearer ${token}` } });
              if (resB.ok) {
                  const bData = await resB.json();
                  if (bData.length > 0) finalBodegaId = bData[0].id;
              }
          }
          if (!finalBodegaId) throw new Error("No se encontró una bodega destino válida.");

          const payload = {
              bodegaId: finalBodegaId,
              items: itemsAEnviar,
              tipo: "DEVOLUCION",
              solicitudOrigenId: solicitudSel?.id // 👈 CLAVE: ID PADRE
          };

          // 👇 Token agregado
          const res = await fetch(`${API_BASE}/api/solicitudes`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.message || "Error al enviar devolución");
          }
          
          setMensajeExito("Tu solicitud de devolución ha sido enviada.");
          setShowExito(true);
          if(onSuccess) onSuccess();

      } catch (err: any) { 
          setError(err.message); 
      } 
      finally { setEnviando(false); }
  };

  // --- LÓGICA PROVEEDOR ---
  const cargarCatalogos = async () => {
      try {
          // 👇 Token agregado
          const [pRes, bRes] = await Promise.all([
              fetch(`${API_BASE}/api/catalogos/proveedores`, { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`${API_BASE}/api/catalogos/bodegas`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          if(pRes.ok) setProveedores(await pRes.json());
          if(bRes.ok) setBodegas(await bRes.json());
      } catch(e) { console.error(e); }
  };

  const agregarItemProv = (prod: any) => {
      setItemsProveedor(prev => [
          ...prev, 
          { 
              productoId: prod.id, 
              nombre: prod.nombre, 
              codigo: prod.codigo, 
              unidad: prod.unidad.abreviatura, 
              cantidadOriginal: 0, 
              cantidadDevolver: 1, 
              notas: "" 
          }
      ]);
      setBusquedaProd("");
      setResBusqueda([]);
  };

  const enviarDevolucionProveedor = async () => {
      if (!provSel || !bodegaSel || itemsProveedor.length === 0) {
          setError("Faltan datos (Proveedor, Bodega o Productos)");
          return;
      }
      setEnviando(true);
      try {
          const payload = {
              proveedorId: provSel,
              bodegaId: bodegaSel,
              items: itemsProveedor.map(i => ({
                  productoId: i.productoId,
                  cantidad: i.cantidadDevolver,
                  notas: i.notas
              })),
              notas: "Devolución directa a proveedor"
          };
          // 👇 Token agregado
          const res = await fetch(`${API_BASE}/api/movimientos/devolucion-proveedor`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          if(!res.ok) {
              const d = await res.json();
              throw new Error(d.message || "Error al registrar salida");
          }
          setMensajeExito("Devolución a proveedor registrada.");
          setShowExito(true);
          if(onSuccess) onSuccess();
      } catch (err: any) { setError(err.message); } 
      finally { setEnviando(false); }
  };

  if (showExito) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="text-emerald-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">¡Operación Exitosa!</h3>
          <p className="text-sm text-slate-500 mb-6">{mensajeExito}</p>
          <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg">Entendido</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-gray-50 border-b border-gray-100">
           <div className="flex justify-between items-center p-4 pb-0">
              <h2 className="text-lg font-bold text-slate-800">Registrar Devolución</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"><X size={20} /></button>
           </div>
           
           {esBodeguero ? (
               <div className="flex px-4 mt-4 gap-4">
                   <button 
                     onClick={() => setActiveTab("INTERNA")}
                     className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "INTERNA" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                   >
                     <RotateCcw size={18}/> Devolución Interna
                   </button>
                   <button 
                     onClick={() => setActiveTab("PROVEEDOR")}
                     className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "PROVEEDOR" ? "border-rose-500 text-rose-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                   >
                     <Truck size={18}/> A Proveedor
                   </button>
               </div>
           ) : (
               <div className="px-4 py-2 text-xs text-gray-400 font-medium">Devolución de productos sobrantes a bodega</div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-lg flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}

            {activeTab === "INTERNA" && (
                <>
                   {stepInterna === 1 ? (
                       <div className="space-y-4">
                           <div className="flex items-center justify-between">
                               <h3 className="text-sm font-bold text-slate-700">Selecciona una solicitud anterior:</h3>
                               {loadingHistorial && <Loader2 className="animate-spin text-emerald-500" size={16}/>}
                           </div>
                           
                           {historial.length === 0 && !loadingHistorial ? (
                               <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                                   <Package className="w-12 h-12 text-gray-200 mx-auto mb-2"/>
                                   <p className="text-gray-400 text-sm">No tienes solicitudes entregadas para devolver.</p>
                               </div>
                           ) : (
                               <div className="grid gap-2">
                                   {historial.map(sol => (
                                       <button 
                                          key={sol.id} 
                                          onClick={() => seleccionarSolicitud(sol)}
                                          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
                                       >
                                           <div className="flex items-center gap-3">
                                               <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">SOL</div>
                                               <div>
                                                   <p className="font-bold text-slate-700">{sol.codigo}</p>
                                                   <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(sol.fecha).toLocaleDateString()}</p>
                                               </div>
                                           </div>
                                           <ArrowRight size={18} className="text-gray-300 group-hover:text-emerald-500"/>
                                       </button>
                                   ))}
                               </div>
                           )}
                       </div>
                   ) : (
                       <div className="space-y-6">
                           <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <div>
                                   <p className="text-xs text-slate-500">Devolviendo sobre:</p>
                                   <p className="text-sm font-bold text-slate-800">{solicitudSel?.codigo}</p>
                               </div>
                               <button onClick={() => setStepInterna(1)} className="text-xs text-blue-600 font-bold hover:underline">Cambiar</button>
                           </div>

                           <div className="space-y-3">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos disponibles para devolver</p>
                               {itemsInternos.map((item, idx) => (
                                   <div key={idx} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-xl hover:bg-slate-50 transition-colors">
                                           <div className="flex justify-between items-start">
                                               <div>
                                                   <p className="text-sm font-bold text-slate-700">{item.nombre}</p>
                                                   <div className="flex items-center gap-2 mt-1">
                                                       <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                           <Package size={10}/> {item.cantidadOriginal} {item.unidad} pedidos
                                                       </span>
                                                       <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                           <Sprout size={10}/> {item.loteInfo}
                                                       </span>
                                                   </div>
                                               </div>
                                               <div className="w-24 text-right">
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">A Devolver</label>
                                                    <input 
                                                        type="number" min="0" max={item.cantidadOriginal}
                                                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        value={item.cantidadDevolver}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const itemsCopy = [...itemsInternos];
                                                            itemsCopy[idx].cantidadDevolver = val > item.cantidadOriginal ? item.cantidadOriginal : val;
                                                            setItemsInternos(itemsCopy);
                                                        }}
                                                    />
                                               </div>
                                           </div>
                                   </div>
                               ))}
                           </div>
                           
                           <div>
                               <label className="text-xs font-bold text-slate-700 mb-1 block">Motivo General (Opcional)</label>
                               <textarea 
                                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                  rows={2} placeholder="Ej: Sobró material del lote..."
                                  value={motivoInterno} onChange={e => setMotivoInterno(e.target.value)}
                               />
                           </div>

                           <button 
                             onClick={enviarDevolucionInterna}
                             disabled={enviando}
                             className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition active:scale-95 flex items-center justify-center gap-2"
                           >
                              {enviando && <Loader2 className="animate-spin" size={18}/>}
                              Confirmar Devolución
                           </button>
                       </div>
                   )}
                </>
            )}

            {/* --- TAB: PROVEEDOR --- */}
            {activeTab === "PROVEEDOR" && (
                <div className="space-y-5">
                    {/* ... (El contenido de proveedor es idéntico, solo con fetch seguro arriba) ... */}
                    {/* Copio el JSX de proveedor para que lo tengas completo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700">Proveedor Destino</label>
                            <select 
                               className="w-full border border-gray-200 rounded-lg p-2 text-sm mt-1"
                               value={provSel} onChange={e => setProvSel(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700">Desde Bodega</label>
                            <select 
                               className="w-full border border-gray-200 rounded-lg p-2 text-sm mt-1"
                               value={bodegaSel} onChange={e => setBodegaSel(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="relative z-20">
                        <input 
                           type="text" placeholder="Buscar producto para devolver..." 
                           className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                           value={busquedaProd} onChange={e => setBusquedaProd(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                        {resBusqueda.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl border border-gray-100 mt-1 max-h-48 overflow-y-auto">
                                {resBusqueda.map(r => (
                                    <button 
                                      key={r.id} onClick={() => agregarItemProv(r)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-bold text-slate-700">{r.nombre}</div>
                                        <div className="text-xs text-slate-400">{r.codigo} • Stock: {r.stockActual}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {itemsProveedor.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700">{item.nombre}</p>
                                    <input 
                                       type="text" placeholder="Motivo (ej. Vencido)" 
                                       className="w-full text-xs border-b border-gray-200 outline-none mt-1 pb-0.5 text-slate-500"
                                       value={item.notas}
                                       onChange={e => {
                                           const copy = [...itemsProveedor];
                                           copy[idx].notas = e.target.value;
                                           setItemsProveedor(copy);
                                       }}
                                    />
                                </div>
                                <div className="w-20">
                                    <input 
                                       type="number" 
                                       className="w-full border border-gray-200 rounded-lg p-1 text-center font-bold text-sm"
                                       value={item.cantidadDevolver}
                                       onChange={e => {
                                           const copy = [...itemsProveedor];
                                           copy[idx].cantidadDevolver = Number(e.target.value);
                                           setItemsProveedor(copy);
                                       }}
                                    />
                                </div>
                                <button onClick={() => setItemsProveedor(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={enviarDevolucionProveedor}
                        disabled={enviando}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        {enviando && <Loader2 className="animate-spin" size={18}/>}
                        Registrar Salida a Proveedor
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}