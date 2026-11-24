import { Link } from "react-router-dom"
import { FileText, Loader2, Plus, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"

type Props = {
  puedeVerLotes: boolean
  puedeRegistrarIngreso: boolean
  onNewIngreso: () => void
  onExport: () => void
  exporting: boolean
}

/**
 * Cabecera del módulo Movimientos: breadcrumbs, título, navegación entre
 * Movimientos / Lotes Agrícolas (según rol) y acciones de exportación y alta
 * de ingreso.
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
      <Breadcrumbs className="mb-0" />

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
            className="gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Exportar listado
          </Button>
          {puedeRegistrarIngreso && (
            <Button
              onClick={onNewIngreso}
              className="gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={16} strokeWidth={2.5} /> Registrar ingreso
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
