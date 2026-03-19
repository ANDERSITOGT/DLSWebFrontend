import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Lock, ShieldAlert, Search, X, Save, 
  Loader2, AlertTriangle, FileEdit, Trash2, Plus, AlertOctagon,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

// ==============================================================
// COMPONENTE: BUSCADOR INTELIGENTE DE PRODUCTOS (AUTOCOMPLETADO)
// ==============================================================
function ProductSearchInput({ token, value, initialName, onChange }: any) {
    const [query, setQuery] = useState(initialName || "");
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setQuery(initialName || "");
    }, [initialName]);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/catalogos/productos/buscar?q=${query}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOptions(data);
                }
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        }, 400); 
        return () => clearTimeout(timer);
    }, [query, isOpen, token]);

    return (
        <div className="relative w-full">
            <div className="flex items-center border border-rose-200 bg-rose-50/30 rounded focus-within:ring-2 focus-within:ring-rose-500 focus-within:bg-white transition-all">
                <Search size={14} className="ml-2 text-rose-400 shrink-0" />
                <input
                    type="text"
                    className="w-full p-2 text-xs bg-transparent outline-none text-slate-800 font-bold placeholder-slate-400"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        if (value) onChange("", "");
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder="Buscar producto..."
                />
            </div>
            {isOpen && (
                <div className="absolute z-[70] w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-lg max-h-56 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 flex justify-center text-rose-500"><Loader2 className="animate-spin" size={16}/></div>
                    ) : options.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">Sin resultados</div>
                    ) : (
                        options.map(p => (
                            <div
                                key={p.id}
                                className="p-2 hover:bg-rose-50 cursor-pointer border-b border-slate-50 last:border-0"
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    setQuery(`${p.codigo} - ${p.nombre}`);
                                    setIsOpen(false);
                                    onChange(p.id, p.unidad?.id || "");
                                }}
                            >
                                <p className="text-xs font-bold text-slate-800">{p.nombre}</p>
                                <p className="text-[10px] text-slate-500">{p.codigo} • {p.unidad?.abreviatura}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ==============================================================
// PÁGINA PRINCIPAL
// ==============================================================
export function EdicionCriticaPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [accesoConcedido, setAccesoConcedido] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [catalogos, setCatalogos] = useState<{productos: any[], fincas: any[]}>({ productos: [], fincas: [] });

  const [filtros, setFiltros] = useState({ documentoId: "", productoId: "", tipo: "", fincaId: "" });
  const [menuFiltroActivo, setMenuFiltroActivo] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState<any>(null);
  const [justificacion, setJustificacion] = useState("");
  const [saving, setSaving] = useState(false);

  const handleVerificarAcceso = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerificando(true);
      setErrorAuth(null);
      try {
          const res = await fetch(`${API_BASE}/api/edicion-critica/verificar-acceso`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ password: passwordInput })
          });
          if (res.ok) {
              setAccesoConcedido(true);
              cargarCatalogos();
              cargarDocumentos(1);
          } else {
              setErrorAuth("Contraseña incorrecta. Intento registrado.");
          }
      } catch (err) { setErrorAuth("Error de conexión."); } 
      finally { setVerificando(false); }
  };

  const cargarCatalogos = async () => {
      try {
          const headers = { Authorization: `Bearer ${token}` };
          const [resProd, resFincas] = await Promise.all([
              fetch(`${API_BASE}/api/catalogos/productos/buscar`, { headers }), 
              fetch(`${API_BASE}/api/catalogos/fincas-lotes`, { headers })
          ]);
          setCatalogos({
              productos: resProd.ok ? await resProd.json() : [],
              fincas: resFincas.ok ? await resFincas.json() : []
          });
      } catch (e) { console.error("Error cargando catálogos", e); }
  };

  const cargarDocumentos = async (numPagina: number) => {
      setLoading(true);
      try {
          const params = new URLSearchParams({ page: numPagina.toString(), limit: "20" });
          if (filtros.documentoId) params.append("documentoId", filtros.documentoId);
          if (filtros.productoId) params.append("productoId", filtros.productoId);
          if (filtros.tipo) params.append("tipo", filtros.tipo);
          if (filtros.fincaId) params.append("fincaId", filtros.fincaId);

          const res = await fetch(`${API_BASE}/api/edicion-critica/documentos?${params.toString()}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          const json = await res.json();
          setDocumentos(json.data || []);
          setTotalPages(json.meta?.totalPages || 1);
          setPage(numPagina);
      } catch (e) { console.error(e); } 
      finally { 
          setLoading(false); 
          setMenuFiltroActivo(null); 
      }
  };

  const abrirModal = (doc: any) => {
      const copiaDoc = JSON.parse(JSON.stringify(doc));
      if (copiaDoc.fecha) copiaDoc.fecha = new Date(copiaDoc.fecha).toISOString().split('T')[0];
      
      const prodsActuales = [...catalogos.productos];
      
      copiaDoc.documento_item.forEach((item: any) => {
          if (item.producto && !prodsActuales.find(p => p.id === item.producto.id)) {
              prodsActuales.push(item.producto);
          }
          
          const fincaCat = catalogos.fincas.find(f => f.nombre === item.lote?.finca?.nombre);
          item.fincaid = fincaCat ? fincaCat.id : "";
          item.unidadid = item.unidad?.id || item.unidadid || ""; 
      });
      
      setCatalogos(prev => ({ ...prev, productos: prodsActuales }));
      setDocSeleccionado(copiaDoc);
      setJustificacion("");
      setModalOpen(true);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
      const nuevosItems = [...docSeleccionado.documento_item];
      nuevosItems[index][field] = value;
      
      if (field === 'fincaid') {
          nuevosItems[index].loteid = "";
      }
      
      setDocSeleccionado({ ...docSeleccionado, documento_item: nuevosItems });
  };

  const agregarFilaItem = () => {
      const nuevaFila = { id: null, productoid: "", unidadid: "", fincaid: "", loteid: "", cantidad: 1, notas: "" };
      setDocSeleccionado({ ...docSeleccionado, documento_item: [...docSeleccionado.documento_item, nuevaFila] });
  };

  const guardarEdicionCritica = async () => {
      if (justificacion.length < 10) return alert("La justificación debe ser más detallada.");
      
      const itemSinProd = docSeleccionado.documento_item.find((i: any) => !i.productoid);
      if (itemSinProd) return alert("Hay filas sin producto seleccionado.");

      setSaving(true);
      try {
          // 👇 LA MAGIA DE LA ZONA HORARIA ESTÁ AQUÍ
          // Forzamos la fecha a las 12:00 UTC. Así, sin importar tu zona horaria local, 
          // la resta de horas no te enviará al día anterior.
          const fechaAjustada = new Date(`${docSeleccionado.fecha}T12:00:00.000Z`).toISOString();

          const payload = {
              justificacion,
              cambios: {
                  documento: { 
                      observacion: docSeleccionado.observacion,
                      fecha: fechaAjustada, // Usamos la fecha corregida
                      estado: docSeleccionado.estado
                  },
                  itemsModificados: docSeleccionado.documento_item.map((i: any) => ({
                      id: i.id, 
                      productoid: i.productoid,
                      unidadid: i.unidadid,
                      loteid: i.loteid || null, 
                      cantidad: parseFloat(i.cantidad) || 0,
                      notas: i.notas
                  }))
              }
          };

          const res = await fetch(`${API_BASE}/api/edicion-critica/documentos/${docSeleccionado.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              setModalOpen(false);
              cargarDocumentos(page); 
          } else {
              const err = await res.json();
              alert(err.message);
          }
      } catch (e) { console.error(e); alert("Error de conexión"); } 
      finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      <div>
        <button onClick={() => navigate("/configuracion")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium text-sm">
          <ArrowLeft size={18} /> Volver a Configuración
        </button>
        <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><AlertTriangle size={24}/></div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edición Crítica de Registros</h1>
                <p className="text-sm text-slate-500">Alteración histórica. Todo movimiento quedará auditado con el usuario actual.</p>
            </div>
        </div>
      </div>

      {!accesoConcedido ? (
          <div className="flex justify-center mt-10">
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><ShieldAlert size={32} /></div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Zona Restringida</h2>
                  <p className="text-sm text-slate-500 mb-6">Ingresa tu credencial de administrador para desbloquear.</p>
                  <form onSubmit={handleVerificarAcceso} className="space-y-4">
                      <input type="password" placeholder="Contraseña..." className="w-full text-center border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
                      {errorAuth && <p className="text-xs text-rose-500 font-bold">{errorAuth}</p>}
                      <button type="submit" disabled={verificando || !passwordInput} className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition flex items-center justify-center gap-2">
                          {verificando ? <Loader2 className="animate-spin" size={20}/> : <Lock size={20}/>} Desbloquear Sistema
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="relative w-full sm:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="text" placeholder="Buscar por Código de Documento (Ej: ING-2026...)" value={filtros.documentoId} onChange={e => setFiltros({...filtros, documentoId: e.target.value})} onKeyDown={e => e.key === 'Enter' && cargarDocumentos(1)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                     <button onClick={() => { setFiltros({ documentoId: "", productoId: "", tipo: "", fincaId: "" }); cargarDocumentos(1); }} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition">Limpiar Filtros</button>
                     <button onClick={() => cargarDocumentos(1)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition flex-1 sm:flex-none">Aplicar Búsqueda</button>
                  </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                  {loading && <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-rose-600" size={40}/></div>}
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[1000px]">
                          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                              <tr>
                                  <th className="px-4 py-3 w-32 relative">
                                      <div className="flex items-center justify-between cursor-pointer hover:text-slate-800" onClick={() => setMenuFiltroActivo(menuFiltroActivo === 'tipo' ? null : 'tipo')}>
                                          TIPO <Filter size={14} className={filtros.tipo ? 'text-rose-500' : ''}/>
                                      </div>
                                      {menuFiltroActivo === 'tipo' && (
                                          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-20 w-40 flex flex-col gap-1">
                                              <select value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})} className="border p-2 rounded text-xs outline-none">
                                                  <option value="">Todos</option>
                                                  <option value="INGRESO">INGRESO</option>
                                                  <option value="SALIDA">SALIDA</option>
                                                  <option value="AJUSTE">AJUSTE</option>
                                                  <option value="DEVOLUCION">DEVOLUCION</option>
                                              </select>
                                          </div>
                                      )}
                                  </th>
                                  <th className="px-4 py-3">DOCUMENTO</th>
                                  <th className="px-4 py-3 w-32">FECHA</th>
                                  <th className="px-4 py-3 relative min-w-[200px]">
                                      <div className="flex items-center justify-between cursor-pointer hover:text-slate-800" onClick={() => setMenuFiltroActivo(menuFiltroActivo === 'producto' ? null : 'producto')}>
                                          PRODUCTO <Filter size={14} className={filtros.productoId ? 'text-rose-500' : ''}/>
                                      </div>
                                      {menuFiltroActivo === 'producto' && (
                                          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-20 w-64">
                                              <select value={filtros.productoId} onChange={e => setFiltros({...filtros, productoId: e.target.value})} className="w-full border p-2 rounded text-xs outline-none">
                                                  <option value="">Cualquier Producto</option>
                                                  {catalogos.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                              </select>
                                          </div>
                                      )}
                                  </th>
                                  <th className="px-4 py-3 text-right">CANTIDAD</th>
                                  <th className="px-4 py-3 relative">
                                       <div className="flex items-center justify-between cursor-pointer hover:text-slate-800" onClick={() => setMenuFiltroActivo(menuFiltroActivo === 'finca' ? null : 'finca')}>
                                          FINCA / LOTE <Filter size={14} className={filtros.fincaId ? 'text-rose-500' : ''}/>
                                      </div>
                                      {menuFiltroActivo === 'finca' && (
                                          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-20 w-48">
                                              <select value={filtros.fincaId} onChange={e => setFiltros({...filtros, fincaId: e.target.value})} className="w-full border p-2 rounded text-xs outline-none">
                                                  <option value="">Todas las Fincas</option>
                                                  {catalogos.fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                              </select>
                                          </div>
                                      )}
                                  </th>
                                  <th className="px-4 py-3">CREADOR</th>
                                  <th className="px-4 py-3 text-center">ACCIONES</th>
                              </tr>
                          </thead>
                          <tbody>
                              {documentos.length === 0 && !loading && (
                                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">Sin resultados.</td></tr>
                              )}
                              {documentos.map((doc) => (
                                  <Fragment key={doc.id}>
                                      <tr className="bg-slate-100/80 border-t-2 border-slate-200 group">
                                          <td className="px-4 py-3 font-bold text-slate-800">
                                              <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${doc.estado === 'ANULADO' ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                                                  {doc.tipo}
                                              </span>
                                          </td>
                                          <td className="px-4 py-3 font-bold text-rose-700">{doc.consecutivo || doc.id.substring(0,8)}</td>
                                          <td className="px-4 py-3 text-slate-600">{new Date(doc.fecha).toLocaleDateString()}</td>
                                          <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[200px]" colSpan={2}>{doc.observacion || "Sin observaciones"}</td>
                                          <td className="px-4 py-3"></td>
                                          <td className="px-4 py-3 text-xs text-slate-500">{doc.usuario_documento_creadoridTousuario?.nombre}</td>
                                          <td className="px-4 py-3 text-center">
                                              <button onClick={() => abrirModal(doc)} className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 mx-auto transition shadow-sm">
                                                  <FileEdit size={14}/> Editar
                                              </button>
                                          </td>
                                      </tr>
                                      {doc.documento_item.map((item: any) => (
                                          <tr key={item.id} className="border-b border-slate-50 hover:bg-rose-50/20 transition-colors">
                                              <td colSpan={3}></td>
                                              <td className="px-4 py-2 pl-6 border-l-2 border-slate-200 text-slate-700 font-medium">
                                                  {item.producto?.nombre} <span className="text-[10px] text-slate-400 ml-2">{item.producto?.codigo}</span>
                                              </td>
                                              <td className="px-4 py-2 font-bold text-slate-800 text-right">
                                                  {Number(item.cantidad)} <span className="text-[10px] text-slate-500 font-normal">{item.unidad?.abreviatura}</span>
                                              </td>
                                              <td className="px-4 py-2 text-xs text-slate-600">
                                                  {item.lote ? `${item.lote.finca?.nombre} - ${item.lote.codigo}` : 'Bodega General'}
                                              </td>
                                              <td className="px-4 py-2 text-[10px] text-slate-400 truncate max-w-[150px]" colSpan={2}>
                                                  {item.notas}
                                              </td>
                                          </tr>
                                      ))}
                                  </Fragment>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                      <p className="text-sm text-slate-500">Página <span className="font-bold text-slate-700">{page}</span> de <span className="font-bold text-slate-700">{totalPages}</span></p>
                      <div className="flex gap-2">
                          <button onClick={() => cargarDocumentos(page - 1)} disabled={page <= 1} className="p-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-slate-100 transition"><ChevronLeft size={18}/></button>
                          <button onClick={() => cargarDocumentos(page + 1)} disabled={page >= totalPages} className="p-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-slate-100 transition"><ChevronRight size={18}/></button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {modalOpen && docSeleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden ring-4 ring-rose-500/20">
               
               <div className="bg-rose-600 p-4 sm:p-5 flex justify-between items-center text-white shrink-0">
                   <div>
                       <h2 className="text-lg font-bold flex items-center gap-2"><AlertOctagon size={20}/> Edición Crítica de Registro</h2>
                       <p className="text-rose-100 text-sm mt-0.5">{docSeleccionado.consecutivo || docSeleccionado.id}</p>
                   </div>
                   <button onClick={() => setModalOpen(false)} className="hover:bg-rose-700 p-2 rounded-full transition"><X size={20}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
                   
                   {/* CABECERA */}
                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Fecha del Registro</label>
                           <input type="date" className="w-full mt-1 border border-rose-200 bg-rose-50/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" value={docSeleccionado.fecha} onChange={(e) => setDocSeleccionado({...docSeleccionado, fecha: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Estado Documento</label>
                           <select className="w-full mt-1 border border-rose-200 bg-rose-50/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" value={docSeleccionado.estado} onChange={(e) => setDocSeleccionado({...docSeleccionado, estado: e.target.value})}>
                               <option value="APROBADO">APROBADO</option>
                               <option value="ANULADO">ANULADO</option>
                               <option value="BORRADOR">BORRADOR</option>
                           </select>
                       </div>
                       <div className="sm:col-span-3">
                           <label className="text-xs font-bold text-slate-500 uppercase">Observación General</label>
                           <input type="text" className="w-full mt-1 border border-rose-200 bg-rose-50/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" value={docSeleccionado.observacion || ""} onChange={(e) => setDocSeleccionado({...docSeleccionado, observacion: e.target.value})} />
                       </div>
                   </div>

                   {/* ITEMS */}
                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[50vh]">
                       <div className="bg-slate-100 p-3 border-b flex justify-between items-center shrink-0">
                           <h3 className="font-bold text-slate-700 text-sm">Items del Documento</h3>
                           <button onClick={agregarFilaItem} className="bg-white text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-50 hover:border-rose-300 flex items-center gap-1 shadow-sm transition-all"><Plus size={14}/> Agregar Fila</button>
                       </div>
                       
                       <div className="overflow-auto flex-1 relative">
                           <table className="w-full text-left text-sm min-w-[800px]">
                               <thead className="bg-slate-100/90 backdrop-blur-sm text-xs text-slate-600 uppercase font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                   <tr>
                                       <th className="p-3 w-[30%]">Producto (Buscador)</th>
                                       <th className="p-3 w-24">Cant.</th>
                                       <th className="p-3 w-[20%]">Finca</th>
                                       <th className="p-3 w-[20%]">Lote</th>
                                       <th className="p-3">Notas</th>
                                       <th className="p-3 w-12 text-center">Acc.</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {docSeleccionado.documento_item.map((item: any, idx: number) => {
                                       const fincaSeleccionada = catalogos.fincas.find(f => f.id === item.fincaid);
                                       const lotesDisponibles = fincaSeleccionada ? fincaSeleccionada.lote : [];
                                       
                                       const nombreInicial = item.producto ? `${item.producto.codigo || ''} - ${item.producto.nombre || ''}` : "";

                                       return (
                                           <tr key={idx} className="hover:bg-rose-50/40 even:bg-slate-50/50 transition-colors">
                                               <td className="p-2">
                                                   <ProductSearchInput 
                                                       token={token}
                                                       value={item.productoid}
                                                       initialName={nombreInicial}
                                                       onChange={(prodId: string, unId: string) => {
                                                           handleItemChange(idx, 'productoid', prodId);
                                                           handleItemChange(idx, 'unidadid', unId);
                                                       }}
                                                   />
                                               </td>
                                               <td className="p-2">
                                                   <input type="number" className="w-full border border-rose-200 bg-rose-50/30 rounded p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none text-right font-bold text-slate-800 transition-all" value={item.cantidad} onChange={e => handleItemChange(idx, 'cantidad', e.target.value)} />
                                               </td>
                                               <td className="p-2">
                                                   <select value={item.fincaid} onChange={e => handleItemChange(idx, 'fincaid', e.target.value)} className="w-full border border-rose-200 bg-rose-50/30 rounded p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all">
                                                       <option value="">Bodega Gen.</option>
                                                       {catalogos.fincas.map((f:any) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                                   </select>
                                               </td>
                                               <td className="p-2">
                                                   <select value={item.loteid || ""} onChange={e => handleItemChange(idx, 'loteid', e.target.value)} disabled={!item.fincaid} className="w-full border border-rose-200 bg-rose-50/30 rounded p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all">
                                                       <option value="">{item.fincaid ? "Seleccione Lote..." : "-"}</option>
                                                       {lotesDisponibles.map((l:any) => <option key={l.id} value={l.id}>{l.codigo} {l.cultivo?.nombre ? `(${l.cultivo.nombre})` : ''}</option>)}
                                                   </select>
                                               </td>
                                               <td className="p-2">
                                                   <input type="text" className="w-full border border-rose-200 bg-rose-50/30 rounded p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" value={item.notas || ""} onChange={e => handleItemChange(idx, 'notas', e.target.value)} placeholder="Razón del cambio..." />
                                               </td>
                                               <td className="p-2 text-center">
                                                   <button onClick={() => {handleItemChange(idx, 'cantidad', 0); handleItemChange(idx, 'notas', 'ANULADO');}} className="text-slate-400 hover:text-white hover:bg-rose-500 transition-colors bg-white p-1.5 border border-slate-200 rounded shadow-sm" title="Anular (Cantidad 0)">
                                                       <Trash2 size={16}/>
                                                   </button>
                                               </td>
                                           </tr>
                                       );
                                   })}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>

               {/* Footer Obligatorio */}
               <div className="bg-white p-4 sm:p-6 border-t border-slate-200 shrink-0">
                   <div className="mb-4">
                       <label className="text-xs font-bold text-rose-600 uppercase flex items-center gap-1 mb-2"><AlertTriangle size={14}/> Justificación de Auditoría (Obligatorio)</label>
                       <textarea 
                           className="w-full border border-rose-200 bg-rose-50/30 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 resize-none shadow-inner" 
                           rows={2} 
                           placeholder="Explique detalladamente la razón de esta modificación a la base de datos (Mínimo 10 caracteres)..."
                           value={justificacion}
                           onChange={e => setJustificacion(e.target.value)}
                       />
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                       <button onClick={() => setModalOpen(false)} className="py-3 px-6 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Cancelar</button>
                       <button 
                           onClick={guardarEdicionCritica} 
                           disabled={saving || justificacion.length < 10} 
                           className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                       >
                           {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                           Aplicar Cambios Definitivos
                       </button>
                   </div>
               </div>

           </div>
        </div>
      )}
    </div>
  );
}