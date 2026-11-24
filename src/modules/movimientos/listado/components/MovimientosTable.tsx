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
import { ESTADO_STYLES, TIPO_STYLES, formatFechaHora, formatMonto } from "../../utils/format"
import { TIPO_ICONS } from "../../components/tipoIcons"
import { contraparte, formatComprobante } from "../utils/movimientoDisplay"

type Props = {
  movimientos: MovimientoResumen[]
  onSelect: (mov: MovimientoResumen) => void
  onExportPdf: (mov: MovimientoResumen) => void
}

/**
 * Vista de tabla de escritorio (md+). La columna Monto se oculta cuando ningún
 * registro trae importe (roles sin permiso de costo).
 */
export function MovimientosTable({ movimientos, onSelect, onExportPdf }: Props) {
  const mostrarMonto = movimientos.some((m) => m.montoTotal !== null)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-50">
            <TableHead className="w-[15%]">Consecutivo · Fecha</TableHead>
            <TableHead className="w-[13%]">Tipo · Estado</TableHead>
            <TableHead className="w-[20%]">Origen / Destino</TableHead>
            <TableHead className="w-[18%]">Contraparte</TableHead>
            <TableHead>Productos</TableHead>
            {mostrarMonto && <TableHead className="w-28 text-right">Monto</TableHead>}
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((m) => {
            const tipo = TIPO_STYLES[m.tipo]
            const Icon = TIPO_ICONS[m.tipo]
            const counter = contraparte(m)
            const comprobante = formatComprobante(m.comprobante)
            return (
              <TableRow key={m.id} className="hover:bg-slate-50/80">
                <TableCell>
                  <p className="text-sm font-bold uppercase text-slate-800">{m.consecutivo}</p>
                  <p className="text-[11px] text-slate-400">{formatFechaHora(m.fecha)}</p>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge
                      variant="outline"
                      className={cn("gap-1 text-[10px] font-bold uppercase tracking-wide", tipo.badge)}
                    >
                      <Icon size={11} /> {tipo.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] font-bold uppercase tracking-wide", ESTADO_STYLES[m.estado])}
                    >
                      {m.estado}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5 text-xs text-slate-600">
                    {m.bodegaOrigen && (
                      <p className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">
                          <span className="text-slate-400">De </span>
                          {m.bodegaOrigen.nombre}
                        </span>
                      </p>
                    )}
                    {m.bodegaDestino && (
                      <p className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">
                          <span className="text-slate-400">A </span>
                          {m.bodegaDestino.nombre}
                        </span>
                      </p>
                    )}
                    {!m.bodegaOrigen && !m.bodegaDestino && <span className="italic text-slate-300">—</span>}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5 text-xs">
                    <p className="truncate font-semibold text-slate-700">{counter.nombre}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{counter.rol}</p>
                    {comprobante && <p className="truncate text-[10px] text-slate-400">{comprobante}</p>}
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-sm font-semibold text-slate-700">
                    {m.totalProductos} {m.totalProductos === 1 ? "ítem" : "ítems"}
                  </p>
                  {m.resumenProductos && (
                    <p className="truncate text-[11px] text-slate-400" title={m.resumenProductos}>
                      {m.resumenProductos}
                    </p>
                  )}
                </TableCell>

                {mostrarMonto && (
                  <TableCell className="text-right">
                    {m.montoTotal !== null ? (
                      <span className="font-bold tabular-nums text-emerald-600">{formatMonto(m.montoTotal)}</span>
                    ) : (
                      <span className="italic text-slate-300">—</span>
                    )}
                  </TableCell>
                )}

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
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
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
