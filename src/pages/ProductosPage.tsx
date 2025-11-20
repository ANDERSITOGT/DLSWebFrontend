import { useEffect, useState } from "react";
import { getProductos, crearProducto } from "../services/api";

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    const data = await getProductos();
    setProductos(data);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="p-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-6">Productos</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full text-left border border-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Código</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p: any) => (
              <tr key={p.id} className="border border-slate-700">
                <td className="p-2">{p.id}</td>
                <td className="p-2">{p.codigo}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
