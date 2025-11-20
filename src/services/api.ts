const API_URL = "http://localhost:4000";

export async function getProductos() {
  const res = await fetch(`${API_URL}/api/productos`);
  if (!res.ok) throw new Error("Error obteniendo productos");
  return res.json();
}

export async function crearProducto(data: {
  codigo: string;
  nombre: string;
  unidad: string;
}) {
  const res = await fetch(`${API_URL}/api/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error creando producto");
  return res.json();
}
