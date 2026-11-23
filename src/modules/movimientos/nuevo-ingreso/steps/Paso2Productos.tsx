import { useState } from "react"
import { Link2, PackageSearch, X } from "lucide-react"
import BuscadorSelect from "@/components/ui/BuscadorSelect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ItemFormPanel } from "../components/ItemFormPanel"
import { ItemList } from "../components/ItemList"
import CrearProductoModal from "@/modules/inventario/components/CrearProductoModal"
import type { NuevoIngresoController } from "../useNuevoIngreso"
import type { ItemIngreso, ProductoResult } from "../types"

/** Paso 2: agregar/editar ítems, vincular OCR y resolver pendientes. */
export function Paso2Productos({ ctrl }: { ctrl: NuevoIngresoController }) {
  const {
    items,
    buscarProductos,
    agregarItem,
    actualizarItem,
    eliminarItem,
    actualizarCantidadItem,
    actualizarCostoItem,
    vincularItem,
    vincularCandidato,
    tieneItemsSinVincular,
  } = ctrl

  const [itemEnEdicion, setItemEnEdicion] = useState<ItemIngreso | null>(null)
  const [itemAVincular, setItemAVincular] = useState<ItemIngreso | null>(null)
  const [mostrarCrearProducto, setMostrarCrearProducto] = useState(false)
  /** Producto recién creado para autoseleccionar en el form (via key remount). */
  const [productoCreado, setProductoCreado] = useState<ProductoResult | null>(null)

  const handleAgregar = (item: ItemIngreso) => {
    agregarItem(item)
  }

  const handleConfirmarEdicion = (key: string, item: ItemIngreso) => {
    actualizarItem(key, item)
    setItemEnEdicion(null)
  }

  return (
    <div className="space-y-4">
      <div className="lg:sticky lg:top-4 lg:z-10">
        <ItemFormPanel
          key={productoCreado?.id ?? "nuevo"}
          initialItem={itemEnEdicion}
          buscarProductos={buscarProductos}
          onAgregar={handleAgregar}
          onConfirmarEdicion={handleConfirmarEdicion}
          onCancel={() => setItemEnEdicion(null)}
          onCrearProducto={() => setMostrarCrearProducto(true)}
          preselectedProduct={productoCreado}
        />
      </div>

      {tieneItemsSinVincular && (
        <Alert variant="warning">
          <Link2 size={18} />
          <AlertDescription>
            Hay ítems detectados por OCR que no están vinculados a un producto del
            catálogo. Vincúlalos antes de continuar al siguiente paso.
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
          <div className="mb-2 rounded-full bg-white p-3 shadow-sm">
            <PackageSearch className="text-emerald-500" size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Aún no hay ítems</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Busca un producto arriba para agregarlo al ingreso.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="px-1 text-sm font-bold text-slate-700">
            Ítems del ingreso ({items.length})
          </h3>
          <ItemList
            items={items}
            onEditar={(item) => setItemEnEdicion(item)}
            onEliminar={eliminarItem}
            onCambiarCantidad={actualizarCantidadItem}
            onCambiarCosto={actualizarCostoItem}
            onVincular={(item) => setItemAVincular(item)}
            onVincularCandidato={vincularCandidato}
            editandoKey={itemEnEdicion?.key ?? null}
          />
        </div>
      )}

      {/* Modal para vincular un ítem OCR sin producto */}
      {itemAVincular && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Vincular producto</h3>
              <button
                type="button"
                onClick={() => setItemAVincular(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Ítem detectado: <span className="font-bold text-slate-700">{itemAVincular.nombre}</span>
            </p>
            <BuscadorSelect<ProductoResult>
              value={null}
              loadOptions={async (termino) => {
                const productos = await buscarProductos(termino)
                return productos.map((p) => ({
                  label: `${p.nombre} (${p.codigo})`,
                  value: p.id,
                  data: p,
                }))
              }}
              onChange={(option) => {
                if (option?.data) {
                  vincularItem(itemAVincular.key, option.data)
                  setItemAVincular(null)
                }
              }}
              placeholder="Buscar producto del catálogo..."
              isClearable={false}
              noOptionsMessage="No se encontraron productos"
            />
          </div>
        </div>
      )}

      {/* Crear producto con autoselección */}
      {mostrarCrearProducto && (
        <CrearProductoModal
          isOpen={mostrarCrearProducto}
          onClose={() => setMostrarCrearProducto(false)}
          onSuccess={(producto) => {
            setMostrarCrearProducto(false)
            if (producto) {
              // Fuerza remount del form con el producto ya seleccionado.
              setProductoCreado(producto)
            } else {
              // Sin producto completo: solo refrescamos el form vacío.
              setProductoCreado(null)
            }
          }}
        />
      )}
    </div>
  )
}
