import { AlertCircle, BadgeCheck, Link2, Pencil, Sparkles, Trash2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import type { CandidatoProducto, ItemIngreso } from "../types"

type ItemListProps = {
  items: ItemIngreso[]
  onEditar: (item: ItemIngreso) => void
  onEliminar: (key: string) => void
  onCambiarCantidad: (key: string, nuevaCantidad: number) => void
  onCambiarCosto: (key: string, nuevoCostoTotal: number) => void
  onVincular: (item: ItemIngreso) => void
  /** Vincula el ítem a un candidato sugerido por el OCR en 1 clic. */
  onVincularCandidato: (key: string, candidato: CandidatoProducto) => void
  editandoKey?: string | null
}

const money = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function ItemList({
  items,
  onEditar,
  onEliminar,
  onCambiarCantidad,
  onCambiarCosto,
  onVincular,
  onVincularCandidato,
  editandoKey = null,
}: ItemListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const enEdicion = editandoKey === item.key
        const sinVincular = item.productoId === null || item.requiereRevision

        return (
          <div
            key={item.key}
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm transition",
              sinVincular
                ? "border-amber-200 ring-1 ring-amber-100"
                : enEdicion
                  ? "border-emerald-300 ring-1 ring-emerald-100"
                  : "border-slate-200"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-slate-800">{item.nombre}</p>
                {item.origen === "ocr" && (
                  <Badge variant="outline" className="shrink-0 text-[9px]">
                    OCR
                  </Badge>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                {!sinVincular && (
                  <CantidadInline
                    item={item}
                    onChange={(nueva) => onCambiarCantidad(item.key, nueva)}
                  />
                )}
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <Package size={11} className="text-slate-400" />
                  {item.codigo || "—"}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-xs">
                {!sinVincular ? (
                  <CostoInline
                    item={item}
                    onChange={(nuevo) => onCambiarCosto(item.key, nuevo)}
                  />
                ) : (
                  <span className="font-bold text-slate-800">{money(item.costoTotal)}</span>
                )}
                {item.cantidad > 0 && (
                  <span className="text-slate-400">
                    ({money(item.costoUnitario)} c/u)
                  </span>
                )}
              </div>

              {sinVincular && (
                <div className="mt-2 space-y-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-bold text-amber-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertCircle size={12} />
                    {item.productoId
                      ? "Ítem del OCR que requiere confirmación del producto."
                      : "Ítem del OCR sin producto vinculado."}
                    <button
                      type="button"
                      onClick={() => onVincular(item)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-0.5 text-white transition hover:bg-amber-700"
                    >
                      <Link2 size={11} /> {item.productoId ? "Cambiar" : "Buscar"}
                    </button>
                  </div>

                  {/* Sugerencias del OCR: vincular en 1 clic */}
                  {item.candidatos && item.candidatos.length > 0 && (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                        <Sparkles size={10} /> Sugerencias del OCR
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.candidatos.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onVincularCandidato(item.key, c)}
                            title={
                              c.score !== undefined
                                ? `Coincidencia ${(c.score <= 1 ? c.score * 100 : c.score).toFixed(0)}%`
                                : undefined
                            }
                            className="inline-flex max-w-full items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-left text-[10px] font-bold text-amber-800 transition hover:border-amber-500 hover:bg-amber-100"
                          >
                            <Link2 size={10} className="shrink-0" />
                            <span className="truncate">{c.nombre}</span>
                            {c.codigo && (
                              <span className="shrink-0 font-mono text-[9px] text-amber-500">
                                {c.codigo}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {!sinVincular && (
                <button
                  type="button"
                  onClick={() => onEditar(item)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label={`Editar ${item.nombre}`}
                >
                  <Pencil size={16} />
                </button>
              )}
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

/** Ítem ya vinculado (no editable inline por cantidad cuando es OCR sin vincular). */

function CantidadInline({
  item,
  onChange,
}: {
  item: ItemIngreso
  onChange: (nuevaCantidad: number) => void
}) {
  return (
    <span className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <span className="px-2 text-[11px] font-bold text-slate-500">Cant.</span>
      <input
        type="number"
        min={0.1}
        step="any"
        value={Number.isFinite(item.cantidad) ? item.cantidad : ""}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value)
          onChange(Number.isFinite(parsed) ? parsed : 0.1)
        }}
        className="h-8 w-16 border-x border-slate-200 bg-transparent text-center text-base font-bold text-slate-700 outline-none focus:bg-white sm:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label={`Cantidad de ${item.nombre}`}
      />
      <span className="px-1.5 text-[10px] font-bold text-slate-400">{item.unidad}</span>
    </span>
  )
}

/** Costo total (Q) editable inline; recalcula el costo unitario en el hook. */
function CostoInline({
  item,
  onChange,
}: {
  item: ItemIngreso
  onChange: (nuevoCostoTotal: number) => void
}) {
  return (
    <span className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <span className="px-2 text-[11px] font-bold text-slate-500">Q</span>
      <input
        type="number"
        min={0}
        step="any"
        value={Number.isFinite(item.costoTotal) ? item.costoTotal : ""}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value)
          onChange(Number.isFinite(parsed) ? parsed : 0)
        }}
        className="h-8 w-24 border-x border-slate-200 bg-transparent px-1 text-right text-base font-bold text-slate-700 outline-none focus:bg-white sm:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label={`Costo total de ${item.nombre}`}
      />
    </span>
  )
}

/** Ícono reutilizable para marcar ítem vinculado (exportado por si se necesita). */
export const IconoVinculado = BadgeCheck
