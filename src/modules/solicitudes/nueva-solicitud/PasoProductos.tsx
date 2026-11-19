import { useCallback, useState } from "react"
import { MapPin } from "lucide-react"
import { ItemFormPanel } from "./ItemFormPanel"
import { ItemList } from "./ItemList"
import type { Finca, ItemSolicitud, ProductoResult } from "./types"

type PasoProductosProps = {
  fincas: Finca[]
  items: ItemSolicitud[]
  totalesPorProducto: Record<string, number>
  buscarProductos: (termino: string) => Promise<ProductoResult[]>
  cantidadEnLista: (productoId: string) => number
  onAgregar: (item: ItemSolicitud) => void
  onEditar: (key: string, item: ItemSolicitud) => void
  onEliminar: (key: string) => void
  /** Edición rápida de cantidad desde la lista. */
  onCambiarCantidad: (key: string, nuevaCantidad: number) => void
}

/**
 * Wrapper para reconstruir un ProductoResult desde un ItemSolicitud en edición.
 * El stock "actual" que conocemos es el snapshot guardado en el ítem.
 */
function productoDesdeItem(item: ItemSolicitud): ProductoResult {
  return {
    id: item.productoId,
    nombre: item.nombre,
    codigo: item.codigo,
    stockActual: item.stockMaximo,
    unidad: { id: item.unidadId, abreviatura: item.unidad },
  }
}

export function PasoProductos({
  fincas,
  items,
  totalesPorProducto,
  buscarProductos,
  cantidadEnLista,
  onAgregar,
  onEditar,
  onEliminar,
  onCambiarCantidad,
}: PasoProductosProps) {
  /** Ítem cargado en el formulario superior para edición (null = modo alta). */
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemSolicitud | null>(null)

  /**
   * Defaults pegajosos: finca y lote se mantienen tras agregar un ítem,
   * para poder cargar varios productos al mismo lote rápidamente.
   */
  const [fincaSticky, setFincaSticky] = useState<string>("")
  const [loteSticky, setLoteSticky] = useState<string>("")

  const handleAgregar = useCallback(
    (item: ItemSolicitud) => {
    onAgregar(item)
      setFincaSticky(item.fincaId)
      setLoteSticky(item.loteId)
    },
    [onAgregar]
  )

  const handleConfirmarEdicion = useCallback(
    (key: string, item: ItemSolicitud) => {
    onEditar(key, item)
      setItemEnEdicion(null)
    },
    [onEditar]
  )

  const handleEditarDesdeLista = (item: ItemSolicitud) => {
    setItemEnEdicion(item)
  }

  const handleCancelarEdicion = () => {
    setItemEnEdicion(null)
  }

  // Cantidad en lista que excluye el ítem en edición para no contar doble.
  const cantidadEnListaParaFormulario = (productoId: string) => {
    const base = cantidadEnLista(productoId)
    if (itemEnEdicion && itemEnEdicion.productoId === productoId) {
      return base - itemEnEdicion.cantidad
    }
    return base
  }

  const initialProducto = itemEnEdicion ? productoDesdeItem(itemEnEdicion) : null

  return (
    <div className="space-y-4">
      {/* Formulario siempre visible (sticky en desktop) */}
      <div className="lg:sticky lg:top-4 lg:z-10">
        <ItemFormPanel
          fincas={fincas}
          initialItem={itemEnEdicion}
          initialProducto={initialProducto}
          cantidadEnLista={cantidadEnListaParaFormulario}
          buscarProductos={buscarProductos}
          onAgregar={handleAgregar}
          onConfirmarEdicion={handleConfirmarEdicion}
          onCancel={handleCancelarEdicion}
          defaultsFincaId={fincaSticky}
          defaultsLoteId={loteSticky}
          onDefaultsChange={(fincaId, loteId) => {
            setFincaSticky(fincaId)
            setLoteSticky(loteId)
          }}
        />
      </div>

      {/* Lista justo debajo */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
          <div className="mb-2 rounded-full bg-white p-3 shadow-sm">
            <MapPin className="text-emerald-500" size={22} />
      </div>
          <h3 className="text-sm font-bold text-slate-800">Tu lista está vacía</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Agrega los productos químicos o fertilizantes que necesitas solicitar.
          </p>
    </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-700">
              Ítems en la lista ({items.length})
            </h3>
          </div>
          <ItemList
            items={items}
            totalesPorProducto={totalesPorProducto}
            onEditar={handleEditarDesdeLista}
            onEliminar={onEliminar}
            onCambiarCantidad={onCambiarCantidad}
            editandoKey={itemEnEdicion?.key ?? null}
          />
        </div>
      )}
    </div>
  )
}

