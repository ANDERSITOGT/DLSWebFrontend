import { Link } from "react-router-dom"
import { Download, Loader2, Plus, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  puedeVerLotes: boolean
  puedeRegistrarIngreso: boolean
  onNewIngreso: () => void
  onExport: () => void
  exporting: boolean
}

/**
 * Cabecera del módulo Movimientos: título, navegación entre Movimientos /
 * Lotes Agrícolas (según rol) y acciones de exportación y alta de ingreso.
 * Las migas de pan las renderiza `MainLayout`, por eso aquí no se repiten.
 */
export function MovimientosHeader({
  puedeVerLotes,
  puedeRegistrarIngreso,
  onNewIngreso,
  onExport,
  exporting,
}: Props) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Movimientos</h1>
          <p className="text-sm text-slate-500">
            Historial de ingresos, salidas, ajustes, devoluciones y transferencias.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={onExport}
            disabled={exporting}
            aria-label="Exportar listado"
            className="gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {/* Solo icono en < sm; texto desde sm en adelante. */}
            <span className="hidden sm:inline">Exportar listado</span>
          </Button>
          {puedeRegistrarIngreso && (
            <Button
              onClick={onNewIngreso}
              aria-label="Registrar ingreso"
              className="gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Registrar ingreso</span>
              <span className="sm:hidden">Ingreso</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Movimientos / Lotes Agrícolas */}
      <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
        <span className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-slate-800 shadow-sm">
          Movimientos
        </span>
        {puedeVerLotes && (
          <Link
            to="/bodega/movimientos/lotes"
            className="flex items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <Sprout size={13} /> Lotes Agrícolas
          </Link>
        )}
      </div>
    </header>
  )
}

