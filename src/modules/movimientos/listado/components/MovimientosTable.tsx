import { Eye, FileDown, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { MovimientoResumen } from "../../types"
import {
  ESTADO_STYLES,
  TIPO_ACCENT,
  TIPO_STYLES,
  formatFecha,
  formatMonto,
  montoStyle,
} from "../../utils/format"
import { TIPO_ICONS } from "../../components/tipoIcons"
import { contraparte, formatComprobante } from "../utils/movimientoDisplay"

type Props = {
  movimientos: MovimientoResumen[]
  onSelect: (mov: MovimientoResumen) => void
  onExportPdf: (mov: MovimientoResumen) => void
}

/**
 * Vista de tabla del listado, responsiva nativa.
 *
 * - En `md+` muestra 6 columnas limpias (Documento · Tipo/Estado · Bodega +
 *   Contraparte · Productos · Monto · Acciones).
 * - En `< md` muestra 3 columnas (Documento/Tipo · Contraparte/Bodega ·
 *   Monto/Ver) ocultando las secundarias con `hidden md:table-cell`, de modo
 *   que nunca hay scroll horizontal roto.
 *
 * Cada fila lleva identidad cromática por tipo: borde izquierdo de acento,
 * ícono circular coloreado y monto destacado (verde en ingresos).
 */
export function MovimientosTable({ movimientos, onSelect, onExportPdf }: Props) {
  const mostrarMonto = movimientos.some((m) => m.montoTotal !== null)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-50">
            <TableHead className="pl-5">Documento</TableHead>
            <TableHead className="hidden w-[15%] md:table-cell">Tipo · Estado</TableHead>
            <TableHead className="hidden w-[24%] lg:table-cell">Bodega · Contraparte</TableHead>
            <TableHead className="hidden w-[16%] xl:table-cell">Productos</TableHead>
            {mostrarMonto && <TableHead className="w-28 text-right">Monto</TableHead>}
            <TableHead className="w-20 pr-5 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((m) => {
            const tipo = TIPO_STYLES[m.tipo]
            const Icon = TIPO_ICONS[m.tipo]
            const counter = contraparte(m)
            const comprobante = formatComprobante(m.comprobante)
            const bodega = m.bodegaDestino ?? m.bodegaOrigen
            const bodegaLabel = m.bodegaDestino ? "Destino" : "Origen"
            const monto = montoStyle(m.tipo)

            return (
              <TableRow key={m.id} className="hover:bg-slate-50/90">
                {/* Col 1: ícono circular + consecutivo + fecha corta (+ tipo/contraparte en móvil) */}
                <TableCell className={cn("pl-3 md:pl-4", TIPO_ACCENT[m.tipo])}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        tipo.icon,
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase tracking-tight text-slate-800">
                        {m.consecutivo}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatFecha(m.fecha)}</p>
                      {/* En móvil (< md) las cols 2–3 se ocultan: mostramos tipo + contraparte + bodega aquí. */}
                      <div className="mt-1 flex items-center gap-1.5 md:hidden">
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                            tipo.badge,
                          )}
                        >
                          {tipo.label}
                        </span>
                        <span className="min-w-0 truncate text-[11px] text-slate-500">
                          {counter.nombre}
                          {bodega && <span className="text-slate-400"> · {bodega.nombre}</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Col 2: badges tipo + estado (solo md+) */}
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col items-start gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[10px] font-bold uppercase tracking-wide",
                        tipo.badge,
                      )}
                    >
                      <Icon size={11} /> {tipo.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wide",
                        ESTADO_STYLES[m.estado],
                      )}
                    >
                      {m.estado}
                    </Badge>
                  </div>
                </TableCell>

                {/* Col 3: bodega + contraparte/factura en una línea truncada (lg+) */}
                <TableCell className="hidden lg:table-cell">
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex items-center gap-1 truncate text-xs font-semibold text-slate-700">
                      <MapPin size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        <span className="text-slate-400">{bodegaLabel} </span>
                        {bodega?.nombre ?? "—"}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      <span className="uppercase tracking-wide text-slate-400">{counter.rol}: </span>
                      {counter.nombre}
                      {comprobante && <span className="text-slate-400"> · {comprobante}</span>}
                    </p>
                  </div>
                </TableCell>

                {/* Col 4: productos (xl+) */}
                <TableCell className="hidden xl:table-cell">
                  <p className="text-xs font-semibold text-slate-700">
                    {m.totalProductos} {m.totalProductos === 1 ? "ítem" : "ítems"}
                  </p>
                  {m.resumenProductos && (
                    <p className="truncate text-[11px] text-slate-400" title={m.resumenProductos}>
                      {m.resumenProductos}
                    </p>
                  )}
                </TableCell>

                {/* Col 5: monto destacado */}
                {mostrarMonto && (
                  <TableCell className={cn("text-right", monto.bg)}>
                    {m.montoTotal !== null ? (
                      <span className={cn("font-bold tabular-nums", monto.text)}>
                        {formatMonto(m.montoTotal)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300">—</span>
                    )}
                  </TableCell>
                )}

                {/* Col 6: acciones */}
                <TableCell className="pr-3 text-right md:pr-4">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSelect(m)}
                      aria-label={`Ver detalle de ${m.consecutivo}`}
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onExportPdf(m)}
                      aria-label={`Descargar PDF de ${m.consecutivo}`}
                      className="hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
                    >
                      <FileDown size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
