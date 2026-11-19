import { CheckCircle2, CircleDashed, MapPin, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/Badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Bodega, ItemSolicitud } from "./types"

type SolicitudResumenPanelProps = {
  bodega: Bodega | null
  items: ItemSolicitud[]
  totalUnidades: number
  todoListo: boolean
}

/**
 * Panel lateral de resumen en vivo. Pensado para ser sticky en desktop.
 */
export function SolicitudResumenPanel({
  bodega,
  items,
  totalUnidades,
  todoListo,
}: SolicitudResumenPanelProps) {
  return (
    <Card className={cn("app-card lg:sticky lg:top-6")}>
      <CardHeader className="border-b border-slate-200 pb-3">
        <CardTitle className="flex items-center justify-between text-sm text-slate-900">
          Resumen de la solicitud
          <Badge variant={todoListo ? "success" : "warning"} className="shrink-0">
            {todoListo ? "Listo para enviar" : "Pendiente"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Bodega */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Bodega destino
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <MapPin size={14} className="text-emerald-600" />
            {bodega?.nombre ?? <span className="italic font-normal text-slate-400">Sin seleccionar</span>}
          </p>
        </div>

        <Separator />

        {/* Totales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-2.5 text-center">
            <p className="text-lg font-bold text-slate-900">{items.length}</p>
            <p className="text-[11px] font-medium text-slate-500">Productos</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 text-center">
            <p className="text-lg font-bold text-slate-900">{totalUnidades}</p>
            <p className="text-[11px] font-medium text-slate-500">Unidades</p>
          </div>
        </div>

        {/* Lista de ítems */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ítems agregados
          </p>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-6 text-center">
              <Package size={22} className="text-slate-300" />
              <p className="text-xs text-slate-400">Aún no hay productos</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-700">
                      {item.nombre}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">
                      {item.fincaNombre} · {item.loteCodigo}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {item.cantidad} {item.unidad}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {/* Estado por criterios */}
        <ul className="space-y-1.5 text-xs">
          <Criterio ok={!!bodega} label="Bodega seleccionada" />
          <Criterio ok={items.length > 0} label="Al menos un producto" />
          <Criterio ok={todoListo} label="Sin conflictos de stock" />
        </ul>
      </CardContent>
    </Card>
  )
}

function Criterio({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
      ) : (
        <CircleDashed size={14} className="shrink-0 text-slate-300" />
      )}
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </li>
  )
}
