import { useState, useEffect } from "react";
import { Plus, Search, Package, AlertCircle } from "lucide-react";
import { apiFetch } from "../services/api"; // 👈 Usamos solo apiFetch
import CrearProductoModal from "../modules/inventario/components/CrearProductoModal";

// Interfaz para los productos que vienen del backend
interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  unidad: {
    abreviatura: string;
  };
  stockActual?: number;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Función para cargar datos usando apiFetch directamente
  const cargarProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Usamos apiFetch en lugar de getProductos()
      // Nota: Usamos el endpoint de búsqueda porque trae el stock calculado
      const res = await apiFetch("/api/catalogos/productos/buscar?q="); 
      
      if (!res.ok) {
        throw new Error("Error al cargar el inventario");
      }
      
      const data = await res.json();
      setProductos(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local (opcional, ya que el backend busca, pero esto es rápido para listas pequeñas)
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">Gestión de productos y existencias.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
      </div>

      {/* LISTADO DE PRODUCTOS */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando inventario...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex justify-between items-start relative overflow-hidden group">
              {/* Decoración lateral */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                (prod.stockActual || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
              }`} />

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                  <p className="text-xs text-gray-500 mb-2">{prod.codigo} • {prod.unidad.abreviatura}</p>
                  
                  <div className="mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Existencia</span>
                    <p className={`text-lg font-bold ${
                      (prod.stockActual || 0) > 0 ? 'text-gray-800' : 'text-red-500'
                    }`}>
                      {prod.stockActual || 0} {prod.unidad.abreviatura}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                 <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    (prod.stockActual || 0) > 0 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                 }`}>
                    {(prod.stockActual || 0) > 0 ? 'ACT' : 'Crítico'}
                 </span>
              </div>
            </div>
          ))}

          {productosFiltrados.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No se encontraron productos.
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      <CrearProductoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Recargar la lista cuando se crea uno nuevo exitosamente
          cargarProductos();
          // NO cerramos el modal aquí, eso lo hace el propio modal después de la confirmación
        }}
      />
    </div>
  );
}