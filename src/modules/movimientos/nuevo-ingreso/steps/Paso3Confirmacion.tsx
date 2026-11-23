import { CheckCircle2, FileText, CalendarDays, Receipt, Store, Truck } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { NuevoIngresoController } from "../useNuevoIngreso"

const money = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Metadato compacto del comprobante: etiqueta suave + valor. */
function Meta({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="truncate text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

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

  const comprobanteTexto = tipoComprobante === "FACTURA" ? "Factura" : "Recibo"
  const comprobanteDetalle =
    serie || factura ? `${serie}${serie && factura ? "-" : ""}${factura}` : null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} /> Revisa antes de registrar
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Al confirmar se creará el documento de ingreso y se sumará el stock a la
          bodega seleccionada.
        </p>
      </div>

      {/* Metadatos del comprobante */}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <Meta
          icon={<Truck size={12} />}
          label="Bodega destino"
          value={bodegaSeleccionada?.nombre ?? "—"}
        />
        <Meta
          icon={<Store size={12} />}
          label="Proveedor"
          value={proveedorSeleccionado?.nombre ?? "Sin proveedor"}
          className={cn(!proveedorSeleccionado && "[&_dd]:italic [&_dd]:text-slate-400")}
        />
        <Meta
          icon={<Receipt size={12} />}
          label="Comprobante / Serie"
          value={
            comprobanteDetalle
              ? `${comprobanteTexto} · ${comprobanteDetalle}`
              : comprobanteTexto
          }
        />
        <Meta icon={<CalendarDays size={12} />} label="Fecha" value={fecha || "—"} />
        {uuid && (
          <Meta
            label="UUID"
            value={<span className="break-all font-mono text-xs">{uuid}</span>}
            className="sm:col-span-2"
          />
        )}
        {observaciones && (
          <Meta
            label="Observaciones"
            value={<span className="whitespace-normal text-slate-700">{observaciones}</span>}
            className="sm:col-span-2"
          />
        )}
      </dl>

      {/* Tabla de líneas */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="font-medium text-slate-900">
                  <span className="block truncate">{item.nombre}</span>
                  {item.codigo && (
                    <span className="text-[11px] font-normal text-slate-400">
                      {item.codigo}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {item.cantidad} {item.unidad}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {money(item.costoUnitario)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                  {money(item.costoTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot>
            <tr className="border-t border-emerald-100 bg-emerald-50/60">
              <td colSpan={3} className="px-4 py-3 text-xs font-medium text-emerald-800">
                Total del ingreso · {items.length} {items.length === 1 ? "ítem" : "ítems"} ·{" "}
                {totalUnidades} unidades
              </td>
              <td className="px-4 py-3 text-right text-lg font-bold tabular-nums text-emerald-900">
                {money(totalQ)}
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>

      <div className="flex justify-center">
        <Badge variant="outline" className="text-[10px]">
          <FileText size={10} className="mr-1" /> Documento tipo INGRESO
        </Badge>
      </div>
    </div>
  )
}
