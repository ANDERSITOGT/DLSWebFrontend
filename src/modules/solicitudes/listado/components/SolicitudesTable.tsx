import { ChevronRight } from "lucide-react"
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
import type { SolicitudResumen } from "../types"
import { ESTADO_STYLES, TIPO_STYLES, estadoLabel, formatFechaCorta } from "../utils/format"

type Props = {
  solicitudes: SolicitudResumen[]
  onSelect: (sol: SolicitudResumen) => void
}

/** Vista de tabla del listado (md+). */
export function SolicitudesTable({ solicitudes, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-50">
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Bodega</TableHead>
            <TableHead className="text-right">Ítems</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitudes.map((s) => {
            const tipo = TIPO_STYLES[s.tipo]
            return (
              <TableRow
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(s)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(s))}
                className="cursor-pointer"
              >
                <TableCell className="font-bold uppercase tracking-tight text-slate-800">{s.codigo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", tipo.badge)}>
                    {tipo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", ESTADO_STYLES[s.estado])}>
                    {estadoLabel(s.estado)}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">{s.solicitanteNombre || "—"}</TableCell>
                <TableCell className="text-slate-600">{s.bodegaNombre || "Sin asignar"}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-slate-700">
                  {s.totalProductos}
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-500">{formatFechaCorta(s.fecha)}</TableCell>
                <TableCell className="text-right">
                  <ChevronRight size={16} className="text-slate-300" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
