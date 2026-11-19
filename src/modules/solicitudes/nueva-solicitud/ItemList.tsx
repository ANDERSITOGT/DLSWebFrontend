import { AlertCircle, MapPin, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ItemSolicitud } from "./types"

type ItemListProps = {
  items: ItemSolicitud[]
  totalesPorProducto: Record<string, number>
  onEditar: (item: ItemSolicitud) => void
  onEliminar: (key: string) => void
  /** Key del ítem que se está editando actualmente (se marca visualmente). */
  editandoKey?: string | null
}

export function ItemList({
  items,
  totalesPorProducto,
  onEditar,
  onEliminar,
  editandoKey = null,
}: ItemListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const totalProducto = totalesPorProducto[item.productoId] ?? item.cantidad
        const excedeStock = totalProducto > item.stockMaximo
        const enEdicion = editandoKey === item.key

        return (
          <div
            key={item.key}
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm transition",
              excedeStock
                ? "border-rose-200 ring-1 ring-rose-100"
                : enEdicion
                  ? "border-emerald-300 ring-1 ring-emerald-100"
                  : "border-slate-200"
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {item.cantidad} {item.unidad}
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <MapPin size={10} /> {item.fincaNombre} · {item.loteCodigo}
                </span>
              </div>
              {item.notas && (
                <p className="mt-1 text-[10px] italic text-slate-400">"{item.notas}"</p>
              )}
              {excedeStock && (
                <p className="mt-1 flex w-fit items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  <AlertCircle size={10} /> Stock insuficiente (máx. {item.stockMaximo})
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEditar(item)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                aria-label={`Editar ${item.nombre}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(item.key)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label={`Eliminar ${item.nombre}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
