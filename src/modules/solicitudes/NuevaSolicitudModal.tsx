import { useState, useEffect } from "react";
import { 
  X, ChevronLeft, Loader2, Trash2, Search, Save, MapPin, CheckCircle2, AlertCircle 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface NuevaSolicitudModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// --- TIPOS DE DATOS ---

type Bodega = { id: string; nombre: string };

type Finca = { 
  id: string; 
  nombre: string; 
  lote: { id: string; codigo: string; cultivo: { nombre: string } }[] 
};

type ProductoResult = { 
    id: string; 
    nombre: string; 
    codigo: string; 
    stockActual: number; 
    // 👇 NECESITAMOS EL ID DE LA UNIDAD
    unidad: { id: string; abreviatura: string } 
};

type ItemSolicitud = {
  productoId: string;
  nombre: string;
  unidadId: string; // 👇 ID real para la base de datos
  unidad: string;   // Nombre para mostrar (ej: "Lb")
  cantidad: number;
  stockMaximo: number;
  fincaId: string;     
  fincaNombre: string;
  loteId: string;      
  loteCodigo: string;
  notas: string;
};

export function NuevaSolicitudModal({ onClose, onSuccess }: NuevaSolicitudModalProps) {
  const { token, user } = useAuth();
    
  // --- ESTADOS ---
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);

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
  // 1. CARGA DE DATOS (Bodegas y Fincas)
  // ============================================================
  useEffect(() => {
    async function loadData() {
      console.log("🟢 [MODAL] Iniciando carga de catálogos...");
      setLoading(true);
      
      const myHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
      };

      try {
        // 1. Bodegas (Pública)
        const resBodegas = await fetch(`${API_URL}/api/catalogos/bodegas`);
        if (resBodegas.ok) {
            const dataBodegas = await resBodegas.json();
            setBodegas(dataBodegas);
        } else {
            console.error("❌ Error Bodegas:", resBodegas.status);
        }

        // 2. Fincas (Privada - Requiere Token)
        const resFincas = await fetch(`${API_URL}/api/catalogos/fincas-lotes`, {
            headers: myHeaders
        });
        
        if (resFincas.ok) {
            const dataFincas = await resFincas.json();
            setFincas(dataFincas);
        } else {
            console.error("❌ Error Fincas:", resFincas.status);
        }

      } catch (error) {
        console.error("💥 Error de red:", error);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadData();
  }, [token]); 

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
  // 3. AGREGAR ITEM A LA LISTA
  // ============================================================
  const handleAgregarItem = () => {
    if (!prodSeleccionado || tempCant <= 0 || !tempFinca || !tempLote) return;

    const fincaObj = fincas.find(f => f.id === tempFinca);
    const loteObj = fincaObj?.lote.find(l => l.id === tempLote);

    const nuevoItem: ItemSolicitud = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      // 👇 AQUÍ GUARDAMOS EL ID Y EL NOMBRE DE LA UNIDAD
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
      
    // Limpiar formulario
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
  // 4. GUARDAR SOLICITUD (CORREGIDO)
  // ============================================================
  const handleFinalizar = async () => {
    setGuardando(true);
    try {
      if (!user?.id) {
        alert("Error: No se ha identificado el usuario.");
        setGuardando(false);
        return;
      }

      // Validar Stock
      const hayErrores = items.some(i => i.cantidad > i.stockMaximo);
      if (hayErrores) {
          alert("Error: Hay cantidades que exceden el stock disponible.");
          setGuardando(false);
          return;
      }

      // 👇 CONSTRUCCIÓN DEL PAYLOAD CORRECTO
      const payload = {
        solicitanteid: user.id, // Minúsculas para asegurar compatibilidad
        bodegaid: selectedBodega, // Minúsculas
        // ⚠️ CAMBIO CRÍTICO: Renombramos 'items' a 'productos'
        productos: items.map(i => ({
          productoid: i.productoId,
          unidadid: i.unidadId,   // Enviamos el ID real de la unidad
          cantidad: i.cantidad,
          loteid: i.loteId, 
          notas: i.notas
        })),
        observaciones: obsGeneral 
      };

      console.log("📤 Enviando Payload:", payload); // Para depuración

      const res = await fetch(`${API_URL}/api/solicitudes`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al guardar la solicitud");
      
      setSuccessData({ id: data.solicitud.id }); 

    } catch (error: any) {
      console.error("Error Guardar:", error);
      alert("Error: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Lógica de UI
  const lotesDisponibles = tempFinca ? fincas.find(f => f.id === tempFinca)?.lote || [] : [];
  const existeErrorStock = items.some(i => i.cantidad > i.stockMaximo);

  // --- RENDER: VISTA DE ÉXITO ---
  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600 w-10 h-10 animate-bounce" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-slate-500 mb-6">
            Tu solicitud ha sido registrada correctamente con el código:
            <br/>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
              {successData.id}
            </span>
          </p>
          <button 
            onClick={() => { onSuccess(); onClose(); }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition transform active:scale-95"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: FORMULARIO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">Nueva Solicitud</h2>
            <p className="text-emerald-100 text-xs">Paso {step} de 2</p>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={40}/>
                <p className="text-sm text-slate-500">Cargando catálogos...</p>
             </div>
          ) : (
            <>
              {/* PASO 1: CABECERA */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800">
                      Completa la información básica de la solicitud.
                   </div>
                   <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                     <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Bodega *</label>
                       <select 
                         value={selectedBodega}
                         onChange={(e) => setSelectedBodega(e.target.value)}
                         className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                       >
                         <option value="">Seleccione una bodega...</option>
                         {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                       </select>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                         <textarea 
                           value={obsGeneral}
                           onChange={(e) => setObsGeneral(e.target.value)}
                           placeholder="Notas opcionales..."
                           rows={3}
                           className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* PASO 2: PRODUCTOS */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  
                  {/* Lista Vacía */}
                  {!showAddForm && items.length === 0 && (
                     <div className="text-center py-10">
                        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                           <MapPin size={32} />
                        </div>
                        <h3 className="text-slate-800 font-medium">Lista vacía</h3>
                        <p className="text-slate-500 text-sm mb-4">Agrega los productos necesarios.</p>
                        <button onClick={() => setShowAddForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                           + Agregar producto
                        </button>
                     </div>
                  )}

                  {/* Formulario de Agregar */}
                  {showAddForm && (
                    <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm animate-in zoom-in-95 space-y-4 relative">
                       <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18}/></button>
                       <h3 className="font-bold text-slate-700 text-sm">Nuevo Producto</h3>
                       
                       {/* Buscador */}
                       {!prodSeleccionado ? (
                         <div>
                           <label className="text-xs font-bold text-slate-500">Producto *</label>
                           <div className="flex gap-2 mt-1">
                             <input 
                               type="text" value={busqueda}
                               onChange={(e) => setBusqueda(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                               placeholder="Buscar nombre o código..."
                               className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                             />
                             <button onClick={handleBuscar} className="bg-slate-100 p-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition">
                               {buscandoProd ? <Loader2 className="animate-spin"/> : <Search size={20}/>}
                             </button>
                           </div>
                           
                           {resultados.length > 0 && (
                             <div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg">
                               {resultados.map(p => (
                                 <button key={p.id} onClick={() => setProdSeleccionado(p)} className="w-full flex justify-between items-center p-2 hover:bg-emerald-50 text-sm border-b border-slate-100">
                                   <span>{p.nombre}</span>
                                   <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.stockActual > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                       Stock: {p.stockActual} {p.unidad?.abreviatura}
                                   </span>
                                 </button>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : (
                          <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                             <div>
                                 <span className="font-medium text-emerald-800 text-sm block">{prodSeleccionado.nombre}</span>
                                 <span className="text-xs text-emerald-600">Stock disponible: {prodSeleccionado.stockActual} {prodSeleccionado.unidad.abreviatura}</span>
                             </div>
                             <button onClick={() => setProdSeleccionado(null)} className="text-emerald-600 text-xs font-bold hover:underline">Cambiar</button>
                          </div>
                       )}

                       {/* Cantidad */}
                       <div>
                          <label className="text-xs font-bold text-slate-500">Cantidad ({prodSeleccionado?.unidad.abreviatura}) *</label>
                          <input 
                            type="number" min="0.1" value={tempCant} 
                            onChange={(e) => setTempCant(parseFloat(e.target.value))} 
                            className={`w-full mt-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 ${
                                prodSeleccionado && tempCant > prodSeleccionado.stockActual 
                                ? 'border-rose-500 focus:ring-rose-500 text-rose-600 bg-rose-50' 
                                : 'border-slate-300 focus:ring-emerald-500'
                            }`}
                          />
                          {prodSeleccionado && tempCant > prodSeleccionado.stockActual && (
                              <p className="text-rose-600 text-xs mt-1 font-bold flex items-center gap-1">
                                  <AlertCircle size={12}/> La cantidad supera el stock disponible.
                              </p>
                          )}
                       </div>

                       {/* Finca y Lote */}
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-xs font-bold text-slate-500">Finca *</label>
                             <select value={tempFinca} onChange={(e) => { setTempFinca(e.target.value); setTempLote(""); }} className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="">Selecciona...</option>
                                {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="text-xs font-bold text-slate-500">Lote *</label>
                             <select value={tempLote} onChange={(e) => setTempLote(e.target.value)} disabled={!tempFinca} className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100">
                                <option value="">{tempFinca ? "Selecciona..." : "-"}</option>
                                {lotesDisponibles.map(l => <option key={l.id} value={l.id}>{l.codigo} - {l.cultivo.nombre}</option>)}
                             </select>
                          </div>
                       </div>
                       
                       {/* Notas */}
                        <div>
                          <label className="text-xs font-bold text-slate-500">Notas</label>
                          <input 
                            type="text" 
                            value={tempNotas}
                            onChange={(e) => setTempNotas(e.target.value)}
                            placeholder="Información adicional (opcional)"
                            className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                          />
                       </div>

                       <button 
                         onClick={handleAgregarItem} 
                         disabled={prodSeleccionado ? tempCant > prodSeleccionado.stockActual : false}
                         className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium text-sm transition"
                        >
                           + Agregar
                       </button>
                    </div>
                  )}

                  {/* Lista de Items Agregados */}
                  {!showAddForm && items.length > 0 && (
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 text-sm">Productos ({items.length})</h3>
                          <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-xs font-bold hover:underline">+ Agregar otro</button>
                       </div>
                       <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          {items.map((item, idx) => {
                             const excedeStock = item.cantidad > item.stockMaximo;
                             return (
                                <div key={idx} className={`p-3 border-b border-slate-100 last:border-0 flex justify-between items-center ${excedeStock ? 'bg-rose-50' : ''}`}>
                                   <div>
                                      <p className={`font-bold text-sm ${excedeStock ? 'text-rose-700' : 'text-slate-800'}`}>{item.nombre}</p>
                                      <p className="text-xs text-slate-500">
                                         {item.cantidad} {item.unidad} · <span className="text-emerald-600 font-medium">{item.fincaNombre} - {item.loteCodigo}</span>
                                      </p>
                                      {excedeStock && <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><AlertCircle size={10}/> Excede stock ({item.stockMaximo})</p>}
                                   </div>
                                   <button onClick={() => handleEliminarItem(idx)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16}/></button>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between shrink-0">
           {step === 2 ? <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium"><ChevronLeft size={16} className="inline mr-1"/>Atrás</button> : <span></span>}
           
           {step === 1 ? (
             <button onClick={() => setStep(2)} disabled={!selectedBodega} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Siguiente</button>
           ) : (
             <button 
               onClick={handleFinalizar} 
               disabled={items.length === 0 || guardando || existeErrorStock} 
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
             >
                 {guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Enviar
             </button>
           )}
        </div>
      </div>
    </div>
  );
}