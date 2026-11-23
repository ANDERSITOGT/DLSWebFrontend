import { useState } from "react"
import { ChevronDown, ListChecks } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { NuevoIngresoController } from "./useNuevoIngreso"

const money = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Fila etiqueta/valor limpia del resumen. */
function FilaResumen({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-xs font-medium text-slate-900">
        {value}
      </dd>
    </div>
  )
}

/**
 * Panel de resumen. Sticky en desktop; en móvil se muestra como acordeón bajo
 * el paso activo. Solo lectura: la navegación vive en el pie de la tarjeta
 * principal, por lo que aquí no hay botones ni checklist.
 */
export function IngresoResumenPanel({ ctrl }: { ctrl: NuevoIngresoController }) {
  const {
    totalQ,
    totalUnidades,
    items,
    bodegaSeleccionada,
    proveedorSeleccionado,
    tieneItemsSinVincular,
    tipoComprobante,
    factura,
    serie,
  } = ctrl

  const [abierto, setAbierto] = useState(false)

  const comprobanteTexto = tipoComprobante === "FACTURA" ? "Factura" : "Recibo"
  const comprobanteDetalle =
    serie || factura ? `${serie}${serie && factura ? "-" : ""}${factura}` : null

  // Mensaje único y discreto sobre lo que falta para avanzar (si aplica).
  const falta = (() => {
    if (!bodegaSeleccionada) return "Selecciona una bodega en el Paso 1."
    if (factura.trim() === "") return "Falta el número de comprobante."
    if (items.length === 0) return "Agrega al menos un ítem en el Paso 2."
    if (tieneItemsSinVincular) return "Hay ítems OCR sin vincular a un producto."
    return null
  })()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Toggle móvil */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 lg:cursor-default"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <ListChecks size={16} className="text-emerald-600" /> Resumen del ingreso
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-slate-400 transition-transform lg:hidden",
            abierto && "rotate-180"
          )}
        />
      </button>

      <div className={cn("px-4 pb-4 lg:block", abierto ? "block" : "hidden")}>
        <Separator className="mb-3" />

        {/* Datos esenciales */}
        <dl className="space-y-2.5">
          <FilaResumen label="Bodega" value={bodegaSeleccionada?.nombre ?? "—"} />
          <FilaResumen
            label="Comprobante"
            value={
              comprobanteDetalle
                ? `${comprobanteTexto} · ${comprobanteDetalle}`
                : comprobanteTexto
            }
          />
          <FilaResumen
            label="Proveedor"
            value={proveedorSeleccionado?.nombre ?? "Sin proveedor"}
          />
        </dl>

        {/* Caja de totales única */}
        <div className="mt-3 space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Productos</span>
            <span className="font-medium text-slate-900">
              {items.length} {items.length === 1 ? "línea" : "líneas"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Unidades totales</span>
            <span className="font-medium text-slate-900">{totalUnidades}</span>
          </div>
          <Separator className="my-1.5 bg-slate-200/80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Total a registrar
            </span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {money(totalQ)}
            </span>
          </div>
        </div>

        {falta && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{falta}</p>
        )}
      </div>
    </div>
  )
}

