import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  puedeCrear: boolean
  onNuevaSolicitud: () => void
}

/** Cabecera del módulo Solicitudes: título + CTA "Nueva solicitud". */
export function SolicitudesHeader({ puedeCrear, onNuevaSolicitud }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Solicitudes</h1>
        <p className="text-sm text-slate-500">Gestión de pedidos y devoluciones de bodega.</p>
      </div>

      {puedeCrear && (
        <Button
          onClick={onNuevaSolicitud}
          aria-label="Nueva solicitud"
          className="gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva solicitud</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      )}
    </header>
  )
}
