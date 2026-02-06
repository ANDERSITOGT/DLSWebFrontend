import { useState, useEffect } from "react";
import { 
  X, ChevronLeft, Loader2, Trash2, Search, Save, MapPin, CheckCircle2, AlertCircle, Plus 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// 👇 1. IMPORTAMOS EL NUEVO COMPONENTE (Asegúrate de la ruta)
import { ConfirmModal } from "../../components/ui/ConfirmModal"; 

const API_URL = import.meta.env.VITE_API_URL;

interface NuevaSolicitudModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// --- TIPOS DE DATOS ---
type Bodega = { id: string; nombre: string };
type Finca = { id: string; nombre: string; lote: { id: string; codigo: string; cultivo: { nombre: string } }[] };
type ProductoResult = { id: string; nombre: string; codigo: string; stockActual: number; unidad: { id: string; abreviatura: string } };
type ItemSolicitud = { productoId: string; nombre: string; unidadId: string; unidad: string; cantidad: number; stockMaximo: number; fincaId: string; fincaNombre: string; loteId: string; loteCodigo: string; notas: string; };

export function NuevaSolicitudModal({ onClose, onSuccess }: NuevaSolicitudModalProps) {
  const { token, user } = useAuth();
    
  // --- ESTADOS ---
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);

  // 👇 2. NUEVO ESTADO PARA CONTROLAR EL MODAL DE CONFIRMACIÓN
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Datos de Catálogos
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);

  // Paso 1: Encabezado
  const [selectedBodega, setSelectedBodega] = useState("");
  const [obsGeneral, setObsGeneral] = useState("");

  // Paso 2: Detalles
  const [items, setItems] = useState<ItemSolicitud[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoResult[]>([]);
  const [buscandoProd, setBuscandoProd] = useState(false);
    
  // Formulario temporal
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoResult | null>(null);
  const [tempCant, setTempCant] = useState<number>(1);
  const [tempFinca, setTempFinca] = useState("");
  const [tempLote, setTempLote] = useState("");
  const [tempNotas, setTempNotas] = useState("");

  // ============================================================
  // 1. CARGA DE DATOS
  // ============================================================
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const myHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
      };

      try {
        const [resBodegas, resFincas] = await Promise.all([
             fetch(`${API_URL}/api/catalogos/bodegas`),
             fetch(`${API_URL}/api/catalogos/fincas-lotes`, { headers: myHeaders })
        ]);

        if (resBodegas.ok) setBodegas(await resBodegas.json());
        if (resFincas.ok) setFincas(await resFincas.json());

      } catch (error) {
        console.error("💥 Error de red:", error);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadData();
  }, [token]); 

  // ============================================================
  // 🆕 LÓGICA DE CIERRE MODIFICADA
  // ============================================================
  const handleCloseRequest = () => {
    // Si hay datos "en riesgo"
    const hayDatos = items.length > 0 || selectedBodega !== "";
    
    if (hayDatos && !successData) {
        // 👇 EN LUGAR DE window.confirm, ACTIVAMOS NUESTRO MODAL
        setShowConfirmClose(true);
    } else {
        onClose();
    }
  };

  // ============================================================
  // 2. BUSCAR PRODUCTOS
  // ============================================================
  const handleBuscar = async () => {
    setBuscandoProd(true);
    try {
      const res = await fetch(`${API_URL}/api/catalogos/productos-busqueda?q=${busqueda}`);
      if (!res.ok) throw new Error("Error buscando");
      const data = await res.json();
      setResultados(data);
    } catch (error) { console.error(error); } 
    finally { setBuscandoProd(false); }
  };

  // ============================================================
  // CÁLCULOS DE STOCK REAL
  // ============================================================
  const cantidadYaEnLista = prodSeleccionado 
    ? items
        .filter(i => i.productoId === prodSeleccionado.id)
        .reduce((acc, item) => acc + item.cantidad, 0)
    : 0;

  const stockDisponibleReal = prodSeleccionado 
    ? prodSeleccionado.stockActual - cantidadYaEnLista 
    : 0;

  const excedeStockReal = prodSeleccionado 
    ? tempCant > stockDisponibleReal 
    : false;

  // ============================================================
  // 3. AGREGAR ITEM A LA LISTA
  // ============================================================
  const handleAgregarItem = () => {
    if (!prodSeleccionado || tempCant <= 0 || !tempFinca || !tempLote) return;

    if (excedeStockReal) {
        // Aquí usamos un alert simple porque es un error de validación, pero también podrías usar un modal si quisieras.
        alert(`No puedes agregar más. Solo quedan ${stockDisponibleReal} disponibles.`);
        return;
    }

    const fincaObj = fincas.find(f => f.id === tempFinca);
    const loteObj = fincaObj?.lote.find(l => l.id === tempLote);

    const nuevoItem: ItemSolicitud = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      unidadId: prodSeleccionado.unidad.id, 
      unidad: prodSeleccionado.unidad.abreviatura,
      cantidad: tempCant,
      stockMaximo: prodSeleccionado.stockActual,
      fincaId: tempFinca,
      fincaNombre: fincaObj?.nombre || "Desc",
      loteId: tempLote,
      loteCodigo: loteObj?.codigo || "Desc",
      notas: tempNotas
    };

    setItems([...items, nuevoItem]);
    setProdSeleccionado(null);
    setTempCant(1);
    setTempNotas("");
    setBusqueda("");
    setResultados([]);
    setShowAddForm(false); 
  };

  const handleEliminarItem = (index: number) => {
    const nueva = [...items];
    nueva.splice(index, 1);
    setItems(nueva);
  };

  // ============================================================
  // 4. GUARDAR SOLICITUD
  // ============================================================
  const handleFinalizar = async () => {
    if (showAddForm) return;

    setGuardando(true);
    try {
      if (!user?.id) throw new Error("No se ha identificado el usuario.");

      const mapaTotales: Record<string, number> = {};
      items.forEach(i => {
          mapaTotales[i.productoId] = (mapaTotales[i.productoId] || 0) + i.cantidad;
      });

      const hayErrores = items.some(i => mapaTotales[i.productoId] > i.stockMaximo);
      
      if (hayErrores) throw new Error("La suma de cantidades supera el stock disponible en bodega.");

      const payload = {
        solicitanteid: user.id,
        bodegaid: selectedBodega,
        productos: items.map(i => ({
          productoid: i.productoId,
          unidadid: i.unidadId,
          cantidad: i.cantidad,
          loteid: i.loteId, 
          notas: i.notas
        })),
        observaciones: obsGeneral 
      };

      const res = await fetch(`${API_URL}/api/solicitudes`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");
      
      setSuccessData({ id: data.solicitud.id }); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

//  CORRECCIÓN: Ordenamos los lotes alfabéticamente por código antes de usarlos

const lotesDisponibles = (tempFinca ? fincas.find(f => f.id === tempFinca)?.lote || [] : [])
    .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  const existeErrorStock = items.some(i => i.cantidad > i.stockMaximo);

  // --- RENDER: VISTA DE ÉXITO ---
  if (successData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="text-emerald-600 w-10 h-10" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Tu solicitud ha sido registrada correctamente.
            <br/>
            Código: <span className="font-mono font-bold text-lg text-slate-800 bg-slate-100 px-3 py-1 rounded-lg mt-3 inline-block border border-slate-200">{successData.id.slice(0, 8).toUpperCase()}...</span>
          </p>
          <button onClick={() => { onSuccess(); onClose(); }} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: FORMULARIO PRINCIPAL ---
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Fondo clickeable para cerrar con confirmación */}
      <div className="absolute inset-0" onClick={handleCloseRequest}></div>

      <div className="bg-white w-full h-full sm:h-[85vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all relative z-10">
        {/* Header */}
        <div className="bg-emerald-600 p-4 sm:px-6 flex justify-between items-center text-white shrink-0 shadow-md z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Nueva Solicitud</h2>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium">
               <span className={`px-2 py-0.5 rounded-full ${step === 1 ? 'bg-white/20 text-white' : ''}`}>Paso 1</span>
               <ChevronLeft size={12}/>
               <span className={`px-2 py-0.5 rounded-full ${step === 2 ? 'bg-white/20 text-white' : ''}`}>Paso 2</span>
            </div>
          </div>
          <button onClick={handleCloseRequest} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 scroll-smooth">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                <Loader2 className="animate-spin text-emerald-600" size={48}/>
                <p className="text-sm font-medium text-slate-500">Cargando catálogos...</p>
             </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                   <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="text-blue-500 shrink-0" size={20}/>
                      <p className="text-sm text-blue-800">Selecciona la bodega de destino y añade notas generales si es necesario.</p>
                   </div>
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bodega de Destino *</label>
                        <select value={selectedBodega} onChange={(e) => setSelectedBodega(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white">
                          <option value="">-- Selecciona una bodega --</option>
                          {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Observaciones Generales</label>
                          <textarea value={obsGeneral} onChange={(e) => setObsGeneral(e.target.value)} placeholder="Ej: Urgente..." rows={4} className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none bg-slate-50 focus:bg-white"/>
                       </div>
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300 h-full flex flex-col">
                  {!showAddForm && items.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4"><MapPin className="text-emerald-500" size={32} /></div>
                        <h3 className="text-slate-800 font-bold text-lg">Tu lista está vacía</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Agrega los productos químicos o fertilizantes.</p>
                        <button onClick={() => setShowAddForm(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center gap-2"><Plus size={18}/> Agregar Producto</button>
                      </div>
                  )}

                  {showAddForm && (
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-100 shadow-xl animate-in zoom-in-95 space-y-4 relative ring-4 ring-emerald-50/50">
                       <button onClick={() => setShowAddForm(false)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>
                       <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 mb-4">Agregar Nuevo Item</h3>
                       {!prodSeleccionado ? (
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar Producto</label>
                           <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuscar()} placeholder="Nombre o código..." className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" autoFocus />
                             </div>
                             <button onClick={handleBuscar} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 transition">{buscandoProd ? <Loader2 className="animate-spin" size={20}/> : "Buscar"}</button>
                           </div>
                           {resultados.length > 0 && (
                             <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl shadow-lg bg-white divide-y divide-slate-100 absolute w-full z-20 left-0">
                               {resultados.map(p => (
                                 <button key={p.id} onClick={() => setProdSeleccionado(p)} className="w-full text-left p-3 hover:bg-emerald-50 transition flex justify-between items-center group">
                                   <div><span className="font-medium text-slate-700 text-sm block group-hover:text-emerald-700">{p.nombre}</span><span className="text-xs text-slate-400">{p.codigo}</span></div>
                                   <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${p.stockActual > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Stock: {p.stockActual} {p.unidad?.abreviatura}</span>
                                 </button>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : (
                          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                             <div className="flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-full text-emerald-600 shadow-sm"><CheckCircle2 size={20}/></div>
                                 <div>
                                     <span className="font-bold text-emerald-900 text-sm block">{prodSeleccionado.nombre}</span>
                                     <span className="text-xs text-emerald-600 font-medium">Disponible real: {stockDisponibleReal} {prodSeleccionado.unidad.abreviatura} {cantidadYaEnLista > 0 && <span className="ml-1 text-emerald-500">(Tienes {cantidadYaEnLista} en lista)</span>}</span>
                                 </div>
                             </div>
                             <button onClick={() => setProdSeleccionado(null)} className="text-slate-400 hover:text-rose-500 text-xs font-bold px-3 py-1 hover:bg-white rounded-lg transition">Cambiar</button>
                          </div>
                       )}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad</label>
                              <div className="relative">
                                  <input type="number" min="0.1" value={tempCant} onChange={(e) => setTempCant(parseFloat(e.target.value))} className={`w-full border rounded-xl p-2.5 text-base sm:text-sm outline-none focus:ring-2 ${excedeStockReal ? 'border-rose-300 focus:ring-rose-200 bg-rose-50 text-rose-900' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'}`} />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{prodSeleccionado?.unidad.abreviatura}</span>
                              </div>
                              {excedeStockReal && <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12}/> Supera disponible real ({stockDisponibleReal})</p>}
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Finca</label>
                              <select value={tempFinca} onChange={(e) => { setTempFinca(e.target.value); setTempLote(""); }} className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white">
                                 <option value="">Selecciona...</option>{fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Lote</label>
                              <select value={tempLote} onChange={(e) => setTempLote(e.target.value)} disabled={!tempFinca} className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white disabled:bg-slate-100 disabled:text-slate-400">
                                 <option value="">{tempFinca ? "Selecciona..." : "-"}</option>{lotesDisponibles.map(l => <option key={l.id} value={l.id}>{l.codigo} - {l.cultivo.nombre}</option>)}
                              </select>
                           </div>
                           <div className="sm:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notas (Opcional)</label>
                             <input type="text" value={tempNotas} onChange={(e) => setTempNotas(e.target.value)} placeholder="Detalles adicionales..." className="w-full border border-slate-300 rounded-xl p-2.5 text-base sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                           </div>
                       </div>
                       <div className="pt-2">
                           <button onClick={handleAgregarItem} disabled={prodSeleccionado ? excedeStockReal : true} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-slate-200">Confirmar Agregar</button>
                       </div>
                    </div>
                  )}

                  {!showAddForm && items.length > 0 && (
                    <div className="space-y-3 pb-20 sm:pb-0">
                       <div className="flex justify-between items-center px-1">
                          <h3 className="font-bold text-slate-700 text-sm">Items en la lista ({items.length})</h3>
                          <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-xs font-bold hover:bg-emerald-50 px-2 py-1 rounded transition flex items-center gap-1"><Plus size={14}/> Agregar otro</button>
                       </div>
                       <div className="grid gap-3">
                          {items.map((item, idx) => {
                             const excedeStock = item.cantidad > item.stockMaximo;
                             return (
                                <div key={idx} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-start ${excedeStock ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200'}`}>
                                   <div>
                                      <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{item.cantidad} {item.unidad}</span><span className="flex items-center gap-1 text-emerald-600"><MapPin size={10}/> {item.fincaNombre} · {item.loteCodigo}</span></p>
                                      {item.notas && <p className="text-[10px] text-slate-400 mt-1 italic">"{item.notas}"</p>}
                                      {excedeStock && <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded w-fit"><AlertCircle size={10}/> Stock insuficiente ({item.stockMaximo})</p>}
                                   </div>
                                   <button onClick={() => handleEliminarItem(idx)} className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition"><Trash2 size={18}/></button>
                                </div>
                             );
                          })}
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
           {step === 2 ? (<button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition"><ChevronLeft size={18}/> Atrás</button>) : (<div/>)}
           {step === 1 ? (<button onClick={() => setStep(2)} disabled={!selectedBodega} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95">Siguiente</button>) : (<button onClick={handleFinalizar} disabled={items.length === 0 || guardando || existeErrorStock || showAddForm} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95 ml-auto">{guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {showAddForm ? "Termina de agregar..." : "Enviar Solicitud"}</button>)}
        </div>
      </div>

      {/* 3. AQUÍ RENDERIZAMOS EL MODAL BONITO */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={onClose} // Al confirmar, cerramos el modal principal de verdad
        title="¿Cancelar solicitud?"
        message="Tienes cambios sin guardar. Si sales ahora, perderás el progreso de tu solicitud."
        confirmText="Sí, salir"
        cancelText="Continuar editando"
        isDestructive={true}
      />
    </div>
  );
}