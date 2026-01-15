// src/modules/solicitudes/NuevaSolicitudModal.tsx
import { useState, useEffect } from "react";
import { 
  X, ChevronLeft, Loader2, Plus, Trash2, Search, Save, MapPin, CheckCircle2 
} from "lucide-react";
import { catalogosService } from "../../services/catalogosService";
import { useAuth } from "../../context/AuthContext";

interface NuevaSolicitudModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Tipos
type Bodega = { id: string; nombre: string };
type Finca = { 
  id: string; 
  nombre: string; 
  lote: { id: string; codigo: string; cultivo: { nombre: string } }[] 
};
type ProductoResult = { id: string; nombre: string; codigo: string; unidad: { abreviatura: string } };

// Item de la lista
type ItemSolicitud = {
  productoId: string;
  nombre: string;
  unidad: string;
  cantidad: number;
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
  
  // Estado para el ÉXITO
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);

  // Datos
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);

  // Paso 1
  const [selectedBodega, setSelectedBodega] = useState("");
  const [obsGeneral, setObsGeneral] = useState("");

  // Paso 2
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [listaBodegas, listaFincas] = await Promise.all([
          catalogosService.getBodegas(),
          catalogosService.getFincasLotes()
        ]);
        setBodegas(listaBodegas);
        setFincas(listaFincas);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- LÓGICA PRODUCTOS ---
  const handleBuscar = async () => {
    // CAMBIO: Permitimos búsqueda vacía
    setBuscandoProd(true);
    try {
      const res = await catalogosService.buscarProductos(busqueda);
      setResultados(res);
    } catch (error) { console.error(error); } 
    finally { setBuscandoProd(false); }
  };

  const handleAgregarItem = () => {
    if (!prodSeleccionado || tempCant <= 0 || !tempFinca || !tempLote) return;

    const fincaObj = fincas.find(f => f.id === tempFinca);
    const loteObj = fincaObj?.lote.find(l => l.id === tempLote);

    const nuevoItem: ItemSolicitud = {
      productoId: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      unidad: prodSeleccionado.unidad.abreviatura,
      cantidad: tempCant,
      fincaId: tempFinca,
      fincaNombre: fincaObj?.nombre || "Desc",
      loteId: tempLote,
      loteCodigo: loteObj?.codigo || "Desc",
      notas: tempNotas
    };

    setItems([...items, nuevoItem]);
    
    // --- RESETEAR FORMULARIO (LOGICA "STICKY") ---
    // Solo reseteamos producto, cantidad y notas.
    // MANTENEMOS Finca y Lote para agilizar la carga masiva.
    setProdSeleccionado(null);
    setTempCant(1);
    setTempNotas("");
    
    // Limpiar búsqueda y cerrar
    setBusqueda("");
    setResultados([]);
    setShowAddForm(false); 
  };

  const handleEliminarItem = (index: number) => {
    const nueva = [...items];
    nueva.splice(index, 1);
    setItems(nueva);
  };

  // --- GUARDAR ---
  const handleFinalizar = async () => {
    setGuardando(true);
    try {
      if (!user?.id) {
        alert("Error: No se ha identificado el usuario logueado.");
        setGuardando(false);
        return;
      }

      const payload = {
        solicitanteId: user.id,
        bodegaId: selectedBodega,
        observaciones: obsGeneral,
        items: items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          loteId: i.loteId, 
          notas: i.notas
        }))
      };

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movimientos/ingreso", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al guardar");
      
      setSuccessData({ id: data.solicitud.id }); 

    } catch (error) {
      alert("Error: " + error);
    } finally {
      setGuardando(false);
    }
  };

  // Filtro cascada
  const lotesDisponibles = tempFinca ? fincas.find(f => f.id === tempFinca)?.lote || [] : [];

  // --- VISTA DE ÉXITO (ANIMACIÓN) ---
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
            onClick={() => {
              onSuccess();
              onClose(); 
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition transform active:scale-95"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA NORMAL (FORMULARIO) ---
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

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>
          ) : (
            <>
              {/* PASO 1 */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800">
                      Completa la información básica.
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

              {/* PASO 2 */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
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
                                // CAMBIO: Placeholder descriptivo
                                placeholder="Buscar nombre o código (vacío para ver todo)..."
                                className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button onClick={handleBuscar} className="bg-slate-100 p-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition" title="Buscar">
                                {buscandoProd ? <Loader2 className="animate-spin"/> : <Search size={20}/>}
                              </button>
                            </div>
                            
                            {/* CAMBIO: Texto de ayuda */}
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">
                              💡 Tip: Dale a la lupa sin escribir nada para ver el catálogo rápido.
                            </p>

                            {resultados.length > 0 && (
                              <div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg">
                                {resultados.map(p => (
                                  <button key={p.id} onClick={() => setProdSeleccionado(p)} className="w-full text-left p-2 hover:bg-emerald-50 text-sm border-b border-slate-100">
                                    {p.nombre}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                       ) : (
                          <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                             <span className="font-medium text-emerald-800 text-sm">{prodSeleccionado.nombre}</span>
                             <button onClick={() => setProdSeleccionado(null)} className="text-emerald-600 text-xs font-bold hover:underline">Cambiar</button>
                          </div>
                       )}

                       {/* Cantidad */}
                       <div>
                          <label className="text-xs font-bold text-slate-500">Cantidad ({prodSeleccionado?.unidad.abreviatura}) *</label>
                          <input type="number" min="0.1" value={tempCant} onChange={(e) => setTempCant(parseFloat(e.target.value))} className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/>
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

                       <button onClick={handleAgregarItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium text-sm transition">+ Agregar</button>
                    </div>
                  )}

                  {!showAddForm && items.length > 0 && (
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 text-sm">Productos ({items.length})</h3>
                          <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-xs font-bold hover:underline">+ Agregar otro</button>
                       </div>
                       <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          {items.map((item, idx) => (
                             <div key={idx} className="p-3 border-b border-slate-100 last:border-0 flex justify-between items-center">
                                <div>
                                   <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                   <p className="text-xs text-slate-500">
                                      {item.cantidad} {item.unidad} · <span className="text-emerald-600 font-medium">{item.fincaNombre} - {item.loteCodigo}</span>
                                   </p>
                                </div>
                                <button onClick={() => handleEliminarItem(idx)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16}/></button>
                             </div>
                          ))}
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
              <button onClick={handleFinalizar} disabled={items.length === 0 || guardando} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                 {guardando ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Enviar
              </button>
           )}
        </div>
      </div>
    </div>
  );
}