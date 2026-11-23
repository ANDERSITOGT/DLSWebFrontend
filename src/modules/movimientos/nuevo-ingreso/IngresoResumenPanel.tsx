import { useState } from "react"
import { ChevronDown, ListChecks, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { NuevoIngresoController } from "./useNuevoIngreso"

const money = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Panel de resumen. Sticky en desktop; en móvil se muestra como acordeón bajo
 * el paso activo. Las validaciones del checklist son informativas: el botón de
 * "Continuar" del wizard es la fuente de verdad.
 */
export function IngresoResumenPanel({ ctrl }: { ctrl: NuevoIngresoController }) {
  const {
    paso,
    setPaso,
    totalQ,
    totalUnidades,
    items,
    bodegaSeleccionada,
    proveedorSeleccionado,
    paso1Completo,
    paso2Completo,
    todoListo,
    tieneItemsSinVincular,
    enviando,
    enviarIngreso,
    tipoComprobante,
    factura,
    serie,
  } = ctrl

  const [abierto, setAbierto] = useState(false)

  const enviar = async () => {
    const resultado = await enviarIngreso()
    if (resultado) {
      // La página controla la vista de éxito usando ctrl.resultado; no navegamos aquí.
    }
  }

  const checklist = [
    { id: "bodega", label: "Bodega seleccionada", ok: !!bodegaSeleccionada, requerido: true },
    { id: "factura", label: "No. de comprobante", ok: factura.trim() !== "", requerido: true },
    { id: "items", label: "Al menos un ítem", ok: items.length > 0, requerido: true },
    {
      id: "vincular",
      label: tieneItemsSinVincular ? "Ítems OCR sin vincular" : "Ítems vinculados",
      ok: !tieneItemsSinVincular,
      requerido: true,
    },
  ]

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
        <span className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900">{money(totalQ)}</span>
          <ChevronDown
            size={18}
            className={cn("text-slate-400 transition-transform lg:hidden", abierto && "rotate-180")}
          />
        </span>
      </button>

      <div className={cn("px-4 pb-4 lg:block", abierto ? "block" : "hidden")}>
        <Separator className="mb-3" />

        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Bodega</dt>
            <dd className="truncate font-semibold text-slate-700">
              {bodegaSeleccionada?.nombre ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Comprobante</dt>
            <dd className="truncate font-semibold text-slate-700">
              {tipoComprobante === "FACTURA" ? "Factura" : "Recibo"}{" "}
              {serie || factura ? `${serie}${serie && factura ? "-" : ""}${factura}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Proveedor</dt>
            <dd className="truncate font-semibold text-slate-700">
              {proveedorSeleccionado?.nombre ?? "Sin proveedor"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Ítems</dt>
            <dd className="font-semibold text-slate-700">{items.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Unidades</dt>
            <dd className="font-semibold text-slate-700">{totalUnidades}</dd>
          </div>
        </dl>

        <Separator className="my-3" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total
          </span>
          <span className="text-lg font-extrabold text-slate-900">{money(totalQ)}</span>
        </div>

        <Separator className="my-3" />

        <ul className="space-y-1.5">
          {checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                  c.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                )}
              >
                {c.ok ? "✓" : "•"}
              </span>
              <span className={cn(c.ok ? "text-slate-600" : "text-slate-400")}>{c.label}</span>
            </li>
          ))}
        </ul>

        {paso === 2 ? (
          <Button
            type="button"
            onClick={enviar}
            disabled={!todoListo || enviando}
            className="mt-4 w-full gap-2 bg-emerald-600 py-6 text-sm font-bold hover:bg-emerald-700"
          >
            <Sparkles size={16} />
            {enviando ? "Registrando..." : "Registrar ingreso"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setPaso((p) => Math.min(2, p + 1))}
            disabled={!paso1Completo || (paso === 1 && !paso2Completo)}
            variant="outline"
            className="mt-4 w-full border-slate-300 py-6 text-sm font-bold text-slate-700"
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  )
}
