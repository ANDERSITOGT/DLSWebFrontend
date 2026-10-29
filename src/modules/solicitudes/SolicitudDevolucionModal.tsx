import { useState, useEffect } from "react";
import { 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Truck, 
  Calendar, 
  Package, 
  ArrowRight, 
  Trash2, 
  Sprout, 
  ChevronLeft, 
  FileText // 👈 ¡Icono agregado!
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BuscadorSelect, { type BuscadorOption } from "../../components/ui/BuscadorSelect";

const API_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS ---
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

  // Efectos de Carga
  useEffect(() => {
    if (activeTab === "INTERNA" && stepInterna === 1) cargarHistorial();
  }, [activeTab, stepInterna]);

  useEffect(() => {
    if (activeTab === "PROVEEDOR" && esBodeguero) cargarCatalogos();
  }, [activeTab]);

  // --- LÓGICA INTERNA ---
  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const mis = user?.rol === "SOLICITANTE" ? "true" : "false"; 
      const res = await fetch(`${API_BASE}/api/solicitudes?estado=ENTREGADA&mis=${mis}&tipo=DESPACHO`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
          const data = await res.json();
          const lista = data.solicitudes || (Array.isArray(data) ? data : []);
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
              solicitudOrigenId: solicitudSel?.id 
          };

          const res = await fetch(`${API_BASE}/api/solicitudes`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.message || "Error al enviar devolución");
          
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
  };

    const buscarOpcionesProducto = async (termino: string): Promise<BuscadorOption[]> => {
      try {
          const res = await fetch(`${API_BASE}/api/catalogos/productos-busqueda?q=${encodeURIComponent(termino)}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) return [];
          const productos = await res.json();
          return productos.map((producto: any) => ({
              label: `${producto.nombre} (${producto.codigo})`,
              value: producto.id,
              data: producto
          }));
      } catch (e) {
          console.error(e);
          return [];
      }
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <CheckCircle2 className="text-emerald-600 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">¡Operación Exitosa!</h3>
          <p className="text-sm text-slate-500 mb-6">{mensajeExito}</p>
          <button onClick={() => { onClose(); onSuccess && onSuccess(); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg">Entendido</button>
        </div>
      </div>
    );
  }

  return (
    // 🎨 Layout Responsive
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* 🎨 Contenedor Responsive */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-4 sm:px-6 shrink-0 flex items-center justify-between z-10">
           <div>
              <h2 className="text-lg font-bold text-slate-800">Devoluciones</h2>
              <p className="text-xs text-slate-400">Registrar retorno de mercadería</p>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        {esBodeguero && stepInterna === 1 && (
            <div className="flex p-2 gap-2 bg-gray-50 shrink-0">
                <button 
                  onClick={() => setActiveTab("INTERNA")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                      activeTab === "INTERNA" 
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100" 
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <RotateCcw size={16}/> Interna
                </button>
                <button 
                  onClick={() => setActiveTab("PROVEEDOR")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                      activeTab === "PROVEEDOR" 
                      ? "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100" 
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <Truck size={16}/> A Proveedor
                </button>
            </div>
        )}

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
            {error && <div className="mb-4 p-4 bg-rose-50 text-rose-700 text-sm rounded-xl flex items-center gap-2 border border-rose-100 animate-in fade-in"><AlertTriangle size={18}/> {error}</div>}

            {activeTab === "INTERNA" && (
                <>
                    {stepInterna === 1 ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selecciona la solicitud original</h3>
                            
                            {loadingHistorial && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>}
                            
                            {!loadingHistorial && historial.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                                    <p className="text-gray-500 font-medium">No hay entregas pendientes de devolución.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {historial.map(sol => (
                                        <button 
                                            key={sol.id} 
                                            onClick={() => seleccionarSolicitud(sol)}
                                            className="bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex justify-between items-center group w-full"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center border border-emerald-100">
                                                    <span className="text-[10px] font-bold uppercase">SOL</span>
                                                    <FileText size={16}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base">{sol.codigo}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={12}/> {new Date(sol.fecha).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-slate-400 block mb-1">Bodega</span>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{sol.bodegaNombre}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-8">
                            {/* Header del detalle */}
                            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Devolviendo Items de:</p>
                                    <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        {solicitudSel?.codigo}
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Activa</span>
                                    </p>
                                </div>
                                <button onClick={() => setStepInterna(1)} className="text-sm text-slate-500 hover:text-slate-800 font-medium underline">Cambiar</button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Lista de Productos</p>
                                {itemsInternos.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Package size={10}/> Pedido: {item.cantidadOriginal} {item.unidad}
                                                    </span>
                                                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Sprout size={10}/> {item.loteInfo}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                                            <label className="text-xs font-bold text-slate-500 whitespace-nowrap pl-1">Cantidad a devolver:</label>
                                            
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={item.cantidadOriginal}
                                                placeholder="0"
                                                // 🟢 INPUT ARREGLADO
                                                value={item.cantidadDevolver > 0 ? item.cantidadDevolver : ""}
                                                onChange={(e) => {
                                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                    const itemsCopy = [...itemsInternos];
                                                    // Validación para no devolver más de lo original
                                                    itemsCopy[idx].cantidadDevolver = val > item.cantidadOriginal ? item.cantidadOriginal : val;
                                                    setItemsInternos(itemsCopy);
                                                }}
                                                className="flex-1 bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <span className="text-xs font-bold text-slate-400 w-8">{item.unidad}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Motivo General (Opcional)</label>
                                <textarea 
                                   className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
                                   rows={2} placeholder="Ej: Sobró material, producto dañado..."
                                   value={motivoInterno} onChange={e => setMotivoInterno(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === "PROVEEDOR" && (
                <div className="space-y-6 animate-in slide-in-from-right-8">
                    <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-rose-700 font-bold border-b border-rose-50 pb-2 mb-2">
                            <Truck size={18}/> Datos de Salida
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Proveedor Destino</label>
                                          <BuscadorSelect<Proveedor>
                                              options={proveedores.map((proveedor) => ({ label: proveedor.nombre, value: proveedor.id, data: proveedor }))}
                                              value={proveedores.find((proveedor) => proveedor.id === provSel) ? { label: proveedores.find((proveedor) => proveedor.id === provSel)!.nombre, value: provSel } : null}
                                              onChange={(option) => setProvSel(option?.value ?? "")}
                                              placeholder="Seleccionar proveedor..."
                                              noOptionsMessage="No se encontraron proveedores"
                                          />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Desde Bodega</label>
                                          <BuscadorSelect<Bodega>
                                              options={bodegas.map((bodega) => ({ label: bodega.nombre, value: bodega.id, data: bodega }))}
                                              value={bodegas.find((bodega) => bodega.id === bodegaSel) ? { label: bodegas.find((bodega) => bodega.id === bodegaSel)!.nombre, value: bodegaSel } : null}
                                              onChange={(option) => setBodegaSel(option?.value ?? "")}
                                              placeholder="Seleccionar bodega..."
                                              noOptionsMessage="No se encontraron bodegas"
                                          />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Agregar Productos</label>
                        <div className="relative z-20">
                            <BuscadorSelect
                              loadOptions={buscarOpcionesProducto}
                              value={null}
                              onChange={(option) => { if (option?.data) agregarItemProv(option.data); }}
                              placeholder="Buscar producto..."
                              isClearable={false}
                              noOptionsMessage="No se encontraron productos"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {itemsProveedor.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-slate-700 text-sm">{item.nombre}</p>
                                    <button onClick={() => setItemsProveedor(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition"><Trash2 size={18}/></button>
                                </div>
                                
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <input 
                                            type="text" placeholder="Motivo (ej. Caducado)" 
                                            className="w-full text-sm border-b border-gray-200 outline-none py-1 text-slate-600 placeholder:text-slate-300 focus:border-rose-400 transition-colors"
                                            value={item.notas}
                                            onChange={e => {
                                                const copy = [...itemsProveedor];
                                                copy[idx].notas = e.target.value;
                                                setItemsProveedor(copy);
                                            }}
                                        />
                                    </div>
                                    <div className="w-24 relative">
                                        <input 
                                            type="number" 
                                            className="w-full border border-gray-200 rounded-lg py-1 px-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500"
                                            placeholder="0"
                                            // 🟢 INPUT ARREGLADO
                                            value={item.cantidadDevolver > 0 ? item.cantidadDevolver : ""}
                                            onChange={e => {
                                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                const copy = [...itemsProveedor];
                                                copy[idx].cantidadDevolver = val;
                                                setItemsProveedor(copy);
                                            }}
                                        />
                                        <span className="absolute right-8 top-1.5 text-[10px] text-gray-400 pointer-events-none">{item.unidad}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {itemsProveedor.length === 0 && <p className="text-center text-xs text-slate-300 italic py-4">No has agregado productos</p>}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Fijo */}
        <div className="bg-white border-t border-gray-100 p-4 sm:px-6 shrink-0 z-20 flex justify-between items-center">
            {activeTab === "INTERNA" && stepInterna === 2 ? (
                <button onClick={() => setStepInterna(1)} className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <ChevronLeft size={18}/> Atrás
                </button>
            ) : <div></div>}

            <button 
                onClick={activeTab === "INTERNA" ? (stepInterna === 1 ? () => {} : enviarDevolucionInterna) : enviarDevolucionProveedor}
                disabled={enviando || (activeTab === "INTERNA" && stepInterna === 1)}
                className={`
                    px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition active:scale-95 flex items-center gap-2
                    ${activeTab === "INTERNA" && stepInterna === 1 ? "hidden" : ""}
                    ${activeTab === "INTERNA" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"}
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                `}
            >
                {enviando ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                {activeTab === "INTERNA" ? "Confirmar Devolución" : "Registrar Salida"}
            </button>
        </div>

      </div>
    </div>
  );
}