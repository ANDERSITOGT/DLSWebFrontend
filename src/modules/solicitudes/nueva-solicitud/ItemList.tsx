import { useState } from "react"
import { AlertCircle, MapPin, Minus, Pencil, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ItemSolicitud } from "./types"

const CANTIDAD_MINIMA = 0.1

type ItemListProps = {
  items: ItemSolicitud[]
  totalesPorProducto: Record<string, number>
  onEditar: (item: ItemSolicitud) => void
  onEliminar: (key: string) => void
  /** Edición rápida de cantidad inline. */
  onCambiarCantidad: (key: string, nuevaCantidad: number) => void
  /** Key del ítem que se está editando actualmente (se marca visualmente). */
  editandoKey?: string | null
}

export function ItemList({
  items,
  totalesPorProducto,
  onEditar,
  onEliminar,
  onCambiarCantidad,
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
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="basis-full sm:basis-auto">
                  <CantidadInline
                    item={item}
                    excedeStock={excedeStock}
                    onChange={(nueva) => onCambiarCantidad(item.key, nueva)}
                  />
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

type CantidadInlineProps = {
  item: ItemSolicitud
  excedeStock: boolean
  onChange: (nuevaCantidad: number) => void
}

/**
 * Control compacto [ - ] [ input ] [ + ] {unidad} con edición inmediata.
 * Nunca permite valores <= 0.
 */
function CantidadInline({ item, excedeStock, onChange }: CantidadInlineProps) {
  // null = sin edición local; se muestra la cantidad real del ítem.
  const [editorTexto, setEditorTexto] = useState<string | null>(null)
  const texto = editorTexto ?? String(item.cantidad)

  const aplicar = (valor: number) => {
    if (!Number.isFinite(valor)) return
    const cantidad = Math.max(CANTIDAD_MINIMA, valor)
    onChange(cantidad)
    setEditorTexto(null)
  }

  const decrementar = () => aplicar(Number((item.cantidad - 1).toFixed(2)))
  const incrementar = () => aplicar(Number((item.cantidad + 1).toFixed(2)))

  return (
    <span
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border bg-white",
        excedeStock ? "border-rose-300" : "border-slate-200"
      )}
    >
      <button
        type="button"
        onClick={decrementar}
        className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200"
        aria-label={`Reducir cantidad de ${item.nombre}`}
      >
        <Minus size={14} strokeWidth={3} />
      </button>
      <input
        type="number"
        min={CANTIDAD_MINIMA}
        step="any"
        value={texto}
        onChange={(e) => setEditorTexto(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(texto)
          if (!Number.isFinite(parsed) || parsed <= 0) {
            setEditorTexto(null)
          } else {
            aplicar(parsed)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        className={cn(
          "h-9 min-w-[3rem] border-x border-slate-200 bg-transparent text-center text-base font-bold outline-none focus:bg-white sm:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          excedeStock ? "text-rose-700" : "text-slate-700"
        )}
        aria-label={`Cantidad de ${item.nombre}`}
      />
      <button
        type="button"
        onClick={incrementar}
        className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200"
        aria-label={`Aumentar cantidad de ${item.nombre}`}
      >
        <Plus size={14} strokeWidth={3} />
      </button>
      <span className="px-1.5 text-[10px] font-bold text-slate-400">{item.unidad}</span>
    </span>
  )
}
