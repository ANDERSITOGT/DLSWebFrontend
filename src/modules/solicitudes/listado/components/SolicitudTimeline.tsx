import { Ban, CheckCircle2, FilePlus2, History, PackageCheck, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SolicitudHistorialItem } from "../types"
import { formatFechaHora } from "../utils/format"

type Props = {
  historial: SolicitudHistorialItem[]
}

/** Config de estilo/ícono por acción del historial. */
function accionConfig(accion: string) {
  const a = accion.toUpperCase()
  if (a.includes("CREAR"))
    return {
      label: "Solicitud creada",
      icon: FilePlus2,
      dot: "bg-slate-100 text-slate-600 ring-slate-100",
      tone: "text-slate-700",
    }
  if (a.includes("APROBAR"))
    return {
      label: "Aprobada",
      icon: CheckCircle2,
      dot: "bg-emerald-100 text-emerald-600 ring-emerald-100",
      tone: "text-emerald-700",
    }
  if (a.includes("RECHAZAR"))
    return {
      label: "Rechazada",
      icon: Ban,
      dot: "bg-rose-100 text-rose-600 ring-rose-100",
      tone: "text-rose-700",
    }
  if (a.includes("ENTREGAR"))
    return {
      label: "Entregada",
      icon: PackageCheck,
      dot: "bg-blue-100 text-blue-600 ring-blue-100",
      tone: "text-blue-700",
    }
  return {
    label: accion || "Evento",
    icon: History,
    dot: "bg-slate-100 text-slate-600 ring-slate-100",
    tone: "text-slate-700",
  }
}

/** Extrae `payload.motivo` si existe y no está vacío. */
function motivoDe(payload: SolicitudHistorialItem["payload"]): string | null {
  if (!payload) return null
  const m = payload.motivo
  return typeof m === "string" && m.trim() ? m.trim() : null
}

/**
 * Línea de tiempo de auditoría: quién creó, aprobó, rechazó (con motivo) o
 * entregó la solicitud, con fecha y hora. Se muestra más reciente arriba.
 */
export function SolicitudTimeline({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-400">
        Sin eventos de auditoría.
      </p>
    )
  }

  // Más reciente primero (sin mutar el array original).
  const eventos = [...historial].sort((a, b) => {
    const ta = a.fecha ? new Date(a.fecha).getTime() : 0
    const tb = b.fecha ? new Date(b.fecha).getTime() : 0
    return tb - ta
  })

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-6">
      {eventos.map((ev, idx) => {
        const cfg = accionConfig(ev.accion)
        const Icon = cfg.icon
        const motivo = motivoDe(ev.payload)
        return (
          <li key={`${ev.accion}-${ev.fecha ?? idx}`} className="relative">
            <span
              className={cn(
                "absolute -left-[2.15rem] flex size-7 items-center justify-center rounded-full ring-4",
                cfg.dot,
              )}
            >
              <Icon size={14} />
            </span>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className={cn("text-sm font-bold", cfg.tone)}>{cfg.label}</p>
                <p className="text-[11px] text-slate-400">{formatFechaHora(ev.fecha)}</p>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                <User size={11} className="text-slate-400" />
                {ev.usuario?.nombre ?? "Sistema"}
              </p>
              {motivo && (
                <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                  <span className="font-bold">Motivo:</span> {motivo}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
