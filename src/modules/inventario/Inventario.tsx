// src/modules/inventario/Inventario.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { cn } from "../../utils/cn";

// -----------------------------
// Tipos de datos (sincronizados con el backend)
// -----------------------------
type EstadoStock = "Normal" | "Bajo" | "Crítico";
type EstadoProducto = "ACTIVO" | "INACTIVO";

type ProductoInventario = {
  id: string;
  nombre: string;
  codigo: string;
  detalle: string;
  categoria: string;
  unidad: string;
  stockTotal: string;
  estadoProducto: EstadoProducto;
  estadoStock: EstadoStock;
};

type MovimientoDetalle = {
  id: string;
  documentoId: string;
  tipo: string;
  cantidadConSigno: string;
  unidad: string;
  bodega: string;
  lote: string | null;
  fecha: string | null;
};

type DetalleProducto = {
  producto: {
    id: string;
    nombre: string;
    codigo: string;
    detalle: string;
    categoria: string;
    unidad: string;
    estadoProducto: EstadoProducto;
  };
  existenciaTotal: {
    cantidad: number;
    unidad: string;
    texto: string;
    estadoStock: EstadoStock;
  };
  movimientos: MovimientoDetalle[];
};

// Categorías para el filtro
type CategoriaFiltro = {
  id: string;
  nombre: string;
};

// -----------------------------
// Componente Inventario
// -----------------------------
export function Inventario() {
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detalle, setDetalle] = useState<DetalleProducto | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // --- NUEVO: estado para filtros de categoría ---
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(""); // nombre de la categoría
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/inventario");
        if (!res.ok) throw new Error("Error al cargar inventario");
        const json = await res.json();
        setProductos(json.productos ?? []);
      } catch (err: unknown) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
      } finally {
        setCargando(false);
      }
    };

    fetchInventario();
  }, []);

  // --- NUEVO: cargar categorías del backend ---
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/categorias");
        if (!res.ok) throw new Error("Error al cargar categorías");
        const json = (await res.json()) as { categorias: CategoriaFiltro[] };
        setCategorias(json.categorias ?? []);
      } catch (err) {
        console.error("Error cargando categorías:", err);
        // si falla, simplemente no habrá filtros de categoría
      }
    };

    fetchCategorias();
  }, []);

  // Búsqueda + filtro por categoría
  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase();

    const coincideTexto =
      term.length === 0 ||
      p.nombre.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term);

    const coincideCategoria =
      !categoriaFiltro || p.categoria === categoriaFiltro;




    return coincideTexto && coincideCategoria;
  });

  // Abre el modal al instante con datos provisionales y luego actualiza con el backend
  const handleClickProducto = async (producto: ProductoInventario) => {
    // 1) Detalle "esqueleto" para mostrar algo de inmediato
    const [cantidadTexto, unidadTexto] = producto.stockTotal.split(" ");
    const cantidadNum = Number(cantidadTexto.replace(",", ".")) || 0;
    const unidad = unidadTexto ?? producto.unidad;

    const detalleProvisional: DetalleProducto = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        detalle: producto.detalle,
        categoria: producto.categoria,
        unidad: producto.unidad,
        estadoProducto: producto.estadoProducto,
      },
      existenciaTotal: {
        cantidad: cantidadNum,
        unidad,
        texto: producto.stockTotal,
        estadoStock: producto.estadoStock,
      },
      movimientos: [],
    };

    // Abrimos el modal inmediatamente
    setDetalle(detalleProvisional);
    setCargandoDetalle(true);

    // 2) Pedimos el detalle real al backend
    try {
      const res = await fetch(
        `http://localhost:3001/api/inventario/${producto.id}`
      );
      if (!res.ok) throw new Error("Error al cargar detalle de producto");
      const json = (await res.json()) as DetalleProducto;

      // Reemplazamos el detalle provisional por el real
      setDetalle(json);
    } catch (err) {
      console.error(err);
      // Podrías mostrar un toast aquí si quieres
    } finally {
      setCargandoDetalle(false);
    }
  };

            // dentro de export function Inventario() {
            const handleExportPdf = () => {
            // Más adelante esto se puede leer de una env (VITE_API_URL),
            // pero por ahora usamos localhost directo:
            window.open("http://localhost:3001/api/inventario/pdf", "_blank");
            };


  const cerrarDetalle = () => setDetalle(null);

  const nombreCategoriaActual =
    categoriaFiltro || "Todas las categorías";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Inventario</h1>
        <p className="text-sm text-slate-500">
          Gestión de productos y existencias.
        </p>
      </header>

      {/* Barra de búsqueda + botones */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Buscador */}
          <div className="w-full md:max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 pl-10 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMostrandoFiltros((prev) => !prev)}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ⚙️ Filtros
            </button>
                    <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                    📄 Exportar PDF
                    </button>

          </div>
        </div>

        {/* Panel de filtros por categoría */}
        {mostrandoFiltros && (
          <div className="mt-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-sm">
            <p className="mb-2 font-medium">Filtrar por categoría</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoriaFiltro("")}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] hover:bg-slate-50",
                  !categoriaFiltro
                    ? "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-600"
                )}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaFiltro(cat.nombre)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] hover:bg-slate-50",
                    categoriaFiltro === cat.nombre
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Categoría actual:{" "}
              <span className="font-medium">{nombreCategoriaActual}</span>
            </p>
          </div>
        )}
      </section>

      {cargando && (
        <p className="text-sm text-slate-500">Cargando inventario…</p>
      )}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}

      {/* Grid de tarjetas */}
      <section className="space-y-3">
        <SectionTitle title="Productos" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productosFiltrados.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              onClick={() => handleClickProducto(producto)}
            />
          ))}

          {!cargando && productosFiltrados.length === 0 && (
            <p className="text-sm text-slate-500 col-span-full">
              No se encontraron productos para la búsqueda actual / filtros.
            </p>
          )}
        </div>
      </section>

      {/* Modal de detalle */}
      {detalle && (
        <DetalleProductoModal
          detalle={detalle}
          onClose={cerrarDetalle}
          loading={cargandoDetalle}
        />
      )}
    </div>
  );
}

// -----------------------------
// Tarjeta de producto
// -----------------------------
type ProductoCardProps = {
  producto: ProductoInventario;
  onClick: () => void;
};

function ProductoCard({ producto, onClick }: ProductoCardProps) {
  const estadoProductoColor =
    producto.estadoProducto === "ACTIVO"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-slate-100 text-slate-500 border-slate-200";

  const estadoStockColor: string = {
    Normal: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Bajo: "bg-amber-50 text-amber-600 border-amber-100",
    Crítico: "bg-rose-50 text-rose-600 border-rose-100",
  }[producto.estadoStock];

  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Título + estado ACTIVO/INACTIVO */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm font-semibold">
              {producto.nombre}
            </CardTitle>
            <CardDescription className="text-xs">
              Código: {producto.codigo}
            </CardDescription>
            <CardDescription className="text-xs text-sky-700">
              {producto.detalle}
            </CardDescription>
            <CardDescription className="mt-1 text-xs text-slate-500">
              {producto.categoria}
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
              estadoProductoColor
            )}
          >
            {producto.estadoProducto}
          </Badge>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Stock total + estado de stock */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">Stock Total</span>
            <span className="text-base font-semibold">
              {producto.stockTotal}
            </span>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
              estadoStockColor
            )}
          >
            {producto.estadoStock}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Modal de detalle de producto
// -----------------------------
type DetalleProductoModalProps = {
  detalle: DetalleProducto;
  loading: boolean;
  onClose: () => void;
};

function DetalleProductoModal({
  detalle,
  loading,
  onClose,
}: DetalleProductoModalProps) {
  const { producto, existenciaTotal, movimientos } = detalle;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-2 md:px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              {producto.nombre}
            </h2>
            <p className="text-[11px] text-slate-500">
              Código: {producto.codigo}
            </p>
            {producto.detalle && (
              <p className="text-[11px] text-sky-700">
                {producto.detalle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          {/* Información general */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Información General
            </p>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-0.5">
                <p className="text-slate-500">Estado del producto</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                    producto.estadoProducto === "ACTIVO"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  )}
                >
                  {producto.estadoProducto}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500">Categoría</p>
                <p className="text-slate-800">{producto.categoria}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-500">Unidad</p>
                <p className="text-slate-800">{producto.unidad}</p>
              </div>
            </div>
          </section>

          {/* Existencia total */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Existencia Total
            </p>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 py-6">
              <p className="text-3xl font-semibold text-slate-900 leading-none">
                {existenciaTotal.cantidad}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {existenciaTotal.unidad}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-3 text-[10px] px-2 py-0.5 uppercase tracking-wide border",
                  existenciaTotal.estadoStock === "Normal"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : existenciaTotal.estadoStock === "Bajo"
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                )}
              >
                {existenciaTotal.estadoStock}
              </Badge>
            </div>
          </section>

          {/* Movimientos recientes */}
          <section className="space-y-2">
            <p className="font-semibold text-slate-800">
              Movimientos Recientes
            </p>

            {loading && (
              <p className="text-[11px] text-slate-500">
                Cargando movimientos…
              </p>
            )}

            {!loading && movimientos.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No hay movimientos registrados para este producto.
              </p>
            )}

            <div className="space-y-2">
              {movimientos.map((m) => {
                const esIngreso =
                  m.tipo === "INGRESO" || m.tipo === "DEVOLUCION";
                const colorPunto = esIngreso
                  ? "bg-emerald-500"
                  : m.tipo === "SALIDA"
                  ? "bg-rose-500"
                  : "bg-slate-400";

                const etiquetaTipo = m.tipo;

                const fechaCorta = m.fecha
                  ? new Date(m.fecha).toLocaleString()
                  : "";

                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full",
                        colorPunto
                      )}
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-800">
                          {m.documentoId}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-2 py-0.5 uppercase tracking-wide"
                        >
                          {etiquetaTipo}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Cantidad: {m.cantidadConSigno} {m.unidad}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Bodega: {m.bodega}
                        {m.lote && ` · Lote: ${m.lote}`}
                      </p>
                      {fechaCorta && (
                        <p className="text-[10px] text-slate-400">
                          {fechaCorta}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
