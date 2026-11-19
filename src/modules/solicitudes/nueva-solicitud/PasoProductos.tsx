import { useState } from "react"
import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}

type Modo = { tipo: "lista" } | { tipo: "agregar" } | { tipo: "editar"; item: ItemSolicitud }

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
}: PasoProductosProps) {
  const [modo, setModo] = useState<Modo>({ tipo: "lista" })

  const volverALista = () => setModo({ tipo: "lista" })

  const handleAgregar = (item: ItemSolicitud) => {
    onAgregar(item)
    volverALista()
  }

  const handleConfirmarEdicion = (key: string, item: ItemSolicitud) => {
    onEditar(key, item)
    volverALista()
  }

  // Cantidad en lista que excluye el ítem en edición para no contar doble.
  const cantidadEnListaParaFormulario = (productoId: string) => {
    const base = cantidadEnLista(productoId)
    if (modo.tipo === "editar" && modo.item.productoId === productoId) {
      return base - modo.item.cantidad
    }
    return base
  }

  if (modo.tipo === "agregar" || modo.tipo === "editar") {
    const itemEnEdicion = modo.tipo === "editar" ? modo.item : null
    return (
      <ItemFormPanel
        fincas={fincas}
        initialItem={itemEnEdicion}
        initialProducto={itemEnEdicion ? productoDesdeItem(itemEnEdicion) : null}
        cantidadEnLista={cantidadEnListaParaFormulario}
        buscarProductos={buscarProductos}
        onAgregar={handleAgregar}
        onConfirmarEdicion={handleConfirmarEdicion}
        onCancel={volverALista}
      />
    )
  }

  // Vista de lista
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 py-12 text-center">
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          <MapPin className="text-emerald-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Tu lista está vacía</h3>
        <p className="mb-6 mt-1 max-w-xs text-sm text-slate-400">
          Agrega los productos químicos o fertilizantes que necesitas solicitar.
        </p>
        <Button
          onClick={() => setModo({ tipo: "agregar" })}
          className="gap-2 bg-emerald-600 font-bold hover:bg-emerald-700"
        >
          <Plus size={18} /> Agregar producto
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-700">
          Ítems en la lista ({items.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModo({ tipo: "agregar" })}
          className="gap-1 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Plus size={14} /> Agregar otro
        </Button>
      </div>
      <ItemList
        items={items}
        totalesPorProducto={totalesPorProducto}
        onEditar={(item) => setModo({ tipo: "editar", item })}
        onEliminar={onEliminar}
      />
    </div>
  )
}
