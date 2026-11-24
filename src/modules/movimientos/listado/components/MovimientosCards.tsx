import {
  ArrowRight,
  Calendar,
  ChevronRight,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import type { MovimientoResumen } from "../../types"
import { ESTADO_STYLES, TIPO_STYLES, formatFechaHora, formatMonto } from "../../utils/format"
import { TIPO_ICONS } from "../../components/tipoIcons"
import { formatComprobante } from "../utils/movimientoDisplay"

type Props = {
  movimientos: MovimientoResumen[]
  onSelect: (mov: MovimientoResumen) => void
}

/** Tarjetas para el listado. En < md es la única vista; en md+ depende del toggle. */
export function MovimientosCards({ movimientos, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {movimientos.map((m) => (
        <MovimientoCard key={m.id} mov={m} onSelect={() => onSelect(m)} />
      ))}
    </div>
  )
}

function MovimientoCard({ mov: m, onSelect }: { mov: MovimientoResumen; onSelect: () => void }) {
  const tipo = TIPO_STYLES[m.tipo]
  const Icon = TIPO_ICONS[m.tipo]
  const comprobante = formatComprobante(m.comprobante)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className="flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      {/* Cabecera: icono + consecutivo + estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tipo.icon)}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold uppercase tracking-tight text-slate-800">{m.consecutivo}</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{tipo.label}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wide", ESTADO_STYLES[m.estado])}
        >
          {m.estado}
        </Badge>
      </div>

      {/* Datos clave por contexto */}
      <dl className="mt-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
        <Bodegas m={m} />
        {(m.tipo === "INGRESO" || m.tipo === "DEVOLUCION") && m.proveedor && (
          <Row icon={<Truck size={12} />} label="Proveedor" value={m.proveedor.nombre} />
        )}
        {m.tipo === "SALIDA" && m.solicitante && (
          <Row icon={<User size={12} />} label="Solicitante" value={m.solicitante.nombre} />
        )}
        {m.tipo === "INGRESO" && comprobante && (
          <Row icon={<Package size={12} />} label="Comprobante" value={comprobante} />
        )}
        {(m.tipo === "AJUSTE" || m.tipo === "TRANSFERENCIA") && m.observacion && (
          <Row icon={<Package size={12} />} label="Motivo" value={m.observacion} />
        )}
      </dl>

      {/* Resumen productos */}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Package size={12} className="shrink-0 text-slate-400" />
        <span className="truncate">
          {m.totalProductos} {m.totalProductos === 1 ? "ítem" : "ítems"}
          {m.resumenProductos ? ` · ${m.resumenProductos}` : ""}
        </span>
      </div>

      {/* Pie: fecha + monto */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatFechaHora(m.fecha)}
        </span>
        <span className="flex items-center gap-2">
          {m.montoTotal !== null && (
            <span className="font-bold tabular-nums text-emerald-600">{formatMonto(m.montoTotal)}</span>
          )}
          <ChevronRight size={16} className="text-slate-300" />
        </span>
      </div>
    </article>
  )
}

function Bodegas({ m }: { m: MovimientoResumen }) {
  // Transferencia: origen → destino
  if (m.bodegaOrigen && m.bodegaDestino) {
    return (
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="shrink-0 text-slate-400" />
        <span className="flex min-w-0 flex-wrap items-center gap-1">
          <span className="truncate font-semibold text-slate-700">{m.bodegaOrigen.nombre}</span>
          <ArrowRight size={11} className="shrink-0 text-slate-400" />
          <span className="truncate font-semibold text-slate-700">{m.bodegaDestino.nombre}</span>
        </span>
      </div>
    )
  }
  const bodega = m.bodegaDestino ?? m.bodegaOrigen
  if (!bodega) return null
  const esDestino = Boolean(m.bodegaDestino)
  return (
    <Row
      icon={<MapPin size={12} />}
      label={esDestino ? "Bodega destino" : "Bodega origen"}
      value={bodega.nombre}
    />
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
