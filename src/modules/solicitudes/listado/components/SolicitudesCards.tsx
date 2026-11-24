import { Calendar, ChevronRight, MapPin, Package, RotateCcw, Truck, User } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import type { SolicitudResumen } from "../types"
import { ESTADO_STYLES, TIPO_STYLES, estadoLabel, formatFechaHora } from "../utils/format"

type Props = {
  solicitudes: SolicitudResumen[]
  onSelect: (sol: SolicitudResumen) => void
}

/** Tarjetas del listado. En < md es la única vista; en md+ depende del toggle. */
export function SolicitudesCards({ solicitudes, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {solicitudes.map((s) => (
        <SolicitudCard key={s.id} sol={s} onSelect={() => onSelect(s)} />
      ))}
    </div>
  )
}

function SolicitudCard({ sol: s, onSelect }: { sol: SolicitudResumen; onSelect: () => void }) {
  const tipo = TIPO_STYLES[s.tipo]
  const Icon = s.tipo === "DEVOLUCION" ? RotateCcw : Truck

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className="flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tipo.icon)}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold uppercase tracking-tight text-slate-800">{s.codigo}</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{tipo.label}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wide", ESTADO_STYLES[s.estado])}
        >
          {estadoLabel(s.estado)}
        </Badge>
      </div>

      <dl className="mt-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
        <Row icon={<MapPin size={12} />} label="Bodega" value={s.bodegaNombre || "Sin asignar"} />
        <Row icon={<User size={12} />} label="Solicitante" value={s.solicitanteNombre || "—"} />
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatFechaHora(s.fecha)}
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Package size={12} /> {s.totalProductos}
          </span>
          <ChevronRight size={16} className="text-slate-300" />
        </span>
      </div>
    </article>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">
        {label}: <span className="font-semibold text-slate-700">{value}</span>
      </span>
    </div>
  )
}
