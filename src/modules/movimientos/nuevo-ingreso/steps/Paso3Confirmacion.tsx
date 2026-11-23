import { CheckCircle2, FileText, Package, Receipt, Truck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import type { NuevoIngresoController } from "../useNuevoIngreso"

const money = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Paso 3: resumen read-only antes de enviar. */
export function Paso3Confirmacion({ ctrl }: { ctrl: NuevoIngresoController }) {
  const {
    bodegaSeleccionada,
    proveedorSeleccionado,
    items,
    fecha,
    tipoComprobante,
    serie,
    factura,
    uuid,
    observaciones,
    totalQ,
    totalUnidades,
  } = ctrl

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} /> Revisa antes de registrar
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Al confirmar se creará el documento de ingreso y se sumará el stock a la
          bodega seleccionada.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Truck size={12} /> Bodega destino
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {bodegaSeleccionada?.nombre ?? "—"}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Receipt size={12} /> Comprobante
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {tipoComprobante === "FACTURA" ? "Factura" : "Recibo"}
            {serie || factura ? ` · ${serie}${serie && factura ? "-" : ""}${factura}` : ""}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Proveedor
          </dt>
          <dd className={cn("mt-1 font-semibold", proveedorSeleccionado ? "text-slate-800" : "italic text-slate-400")}>
            {proveedorSeleccionado?.nombre ?? "Sin proveedor"}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fecha
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">{fecha || "—"}</dd>
        </div>
        {uuid && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">UUID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">{uuid}</dd>
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Observaciones
          </dt>
          <dd className={cn("mt-1 text-sm", observaciones ? "text-slate-700" : "italic text-slate-400")}>
            {observaciones || "Sin observaciones."}
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Package size={15} /> Ítems ({items.length})
        </p>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{item.nombre}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                    {item.cantidad} {item.unidad}
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-slate-800">{money(item.costoTotal)}</p>
                <p className="text-[10px] text-slate-400">{money(item.costoUnitario)} c/u</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {items.length} ítems · {totalUnidades} unidades
          </p>
          <p className="text-sm font-semibold">Total del ingreso</p>
        </div>
        <span className="text-lg font-extrabold">{money(totalQ)}</span>
      </div>

      <div className="flex justify-center">
        <Badge variant="outline" className="text-[10px]">
          <FileText size={10} className="mr-1" /> Documento tipo INGRESO
        </Badge>
      </div>
    </div>
  )
}
