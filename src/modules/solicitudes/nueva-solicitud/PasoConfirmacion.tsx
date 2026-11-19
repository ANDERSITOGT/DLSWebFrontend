import { CheckCircle2, MapPin, Package, StickyNote } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Bodega, ItemSolicitud } from "./types"

type PasoConfirmacionProps = {
  bodega: Bodega | null
  obsGeneral: string
  items: ItemSolicitud[]
  totalesPorProducto: Record<string, number>
  totalUnidades: number
}

export function PasoConfirmacion({
  bodega,
  obsGeneral,
  items,
  totalesPorProducto,
  totalUnidades,
}: PasoConfirmacionProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} /> Revisa antes de enviar
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Verifica la bodega, las observaciones y los productos. Una vez enviada, la
          solicitud pasará a revisión.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <MapPin size={12} /> Bodega destino
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">{bodega?.nombre ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Package size={12} /> Totales
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {items.length} ítems · {totalUnidades} unidades
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <StickyNote size={12} /> Observaciones
          </dt>
          <dd className={cn("mt-1 text-sm", obsGeneral ? "text-slate-700" : "italic text-slate-400")}>
            {obsGeneral || "Sin observaciones."}
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-700">Productos</p>
        <div className="space-y-2">
          {items.map((item) => {
            const total = totalesPorProducto[item.productoId] ?? item.cantidad
            const excede = total > item.stockMaximo
            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border bg-white p-3",
                  excede ? "border-rose-200" : "border-slate-200"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.nombre}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                      {item.cantidad} {item.unidad}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <MapPin size={10} /> {item.fincaNombre} · {item.loteCodigo}
                    </span>
                  </p>
                  {item.notas && (
                    <p className="mt-1 text-[10px] italic text-slate-400">"{item.notas}"</p>
                  )}
                </div>
                {excede && <Badge variant="danger">Stock insuficiente</Badge>}
              </div>
            )
          })}
        </div>
      </div>

      <Separator />
      <p className="text-center text-xs text-slate-400">
        Al enviar, se registrará la solicitud con tu usuario como solicitante.
      </p>
    </div>
  )
}
