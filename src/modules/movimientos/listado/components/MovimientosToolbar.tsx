import { Loader2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react"
import { LayoutGrid, TableProperties } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BuscadorSelect, type BuscadorSelectOption } from "@/components/ui/BuscadorSelect"
import { cn } from "@/lib/utils"
import type { MovimientoEstado, MovimientoTipo, MovimientosFiltros } from "../../types"
import type { MovimientoViewMode } from "../../listado/hooks/useMovimientosView"

type Props = {
  filtros: MovimientosFiltros
  onFilterChange: <K extends keyof MovimientosFiltros>(key: K, value: MovimientosFiltros[K]) => void
  onReset: () => void
  hayFiltros: boolean
  fetching: boolean
  onRefresh: () => void
  view: MovimientoViewMode
  onToggleView: () => void
  /** Catálogos para los selects de contexto. */
  proveedores: BuscadorSelectOption[]
  bodegas: BuscadorSelectOption[]
  solicitantes: BuscadorSelectOption[]
  canFilterSolicitante: boolean
  catalogsLoading?: boolean
}

type QuickTab = { value: MovimientoTipo | ""; label: string }

const QUICK_TABS: QuickTab[] = [
  { value: "", label: "Todos" },
  { value: "INGRESO", label: "Ingresos" },
  { value: "SALIDA", label: "Salidas" },
  { value: "AJUSTE", label: "Ajustes" },
  { value: "DEVOLUCION", label: "Devoluciones" },
]

const ESTADOS: { value: MovimientoEstado | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "ANULADO", label: "Anulado" },
]

const DATE_CLASS =
  "h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20"

/**
 * Barra de filtros del listado: tabs rápidos por tipo, buscador con debounce
 * (400 ms en el hook), filtros contextuales (proveedor / solicitante según el
 * tipo), estado, bodega y rango de fechas, además del toggle de vista y el
 * refresco manual.
 */
export function MovimientosToolbar({
  filtros,
  onFilterChange,
  onReset,
  hayFiltros,
  fetching,
  onRefresh,
  view,
  onToggleView,
  proveedores,
  bodegas,
  solicitantes,
  canFilterSolicitante,
  catalogsLoading = false,
}: Props) {
  const mostrarProveedor = !filtros.tipo || filtros.tipo === "INGRESO" || filtros.tipo === "DEVOLUCION"
  const mostrarSolicitante = (canFilterSolicitante && (!filtros.tipo || filtros.tipo === "SALIDA"))

  return (
    <div className="space-y-3">
      {/* Tabs rápidos + acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {QUICK_TABS.map((tab) => {
            const activo = filtros.tipo === tab.value
            return (
              <button
                key={tab.value || "todos"}
                type="button"
                onClick={() => onFilterChange("tipo", tab.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  activo
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle vista (solo md+) */}
          <div className="hidden rounded-xl border border-slate-200 bg-white p-0.5 md:flex">
            <button
              type="button"
              onClick={() => view !== "cards" && onToggleView()}
              aria-label="Vista de tarjetas"
              aria-pressed={view === "cards"}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                view === "cards" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => view !== "table" && onToggleView()}
              aria-label="Vista de tabla"
              aria-pressed={view === "table"}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                view === "table" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <TableProperties size={16} />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={fetching}
            className="gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} className={cn(fetching && "animate-spin")} /> Actualizar
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          type="text"
          value={filtros.q}
          onChange={(e) => onFilterChange("q", e.target.value)}
          placeholder="Buscar por consecutivo (ING-…), número de factura o producto..."
          aria-label="Buscar movimientos"
          className="h-10 border-slate-300 bg-white pl-9 pr-9 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {filtros.q ? (
            <button
              type="button"
              onClick={() => onFilterChange("q", "")}
              aria-label="Limpiar búsqueda"
              className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          ) : fetching ? (
            <Loader2 size={15} className="animate-spin text-slate-400" />
          ) : null}
        </span>
      </div>

      {/* Filtros avanzados */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <span className="flex items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <SlidersHorizontal size={13} /> Filtros
        </span>

        {mostrarProveedor && (
          <div className="w-full sm:w-52">
            <BuscadorSelect
              placeholder="Proveedor"
              value={filtros.proveedorId}
              options={proveedores}
              onChange={(value) => onFilterChange("proveedorId", value)}
              loading={catalogsLoading}
              emptyMessage="Sin proveedores"
            />
          </div>
        )}

        {mostrarSolicitante && (
          <div className="w-full sm:w-52">
            <BuscadorSelect
              placeholder="Solicitante"
              value={filtros.solicitanteId}
              options={solicitantes}
              onChange={(value) => onFilterChange("solicitanteId", value)}
              loading={catalogsLoading}
              emptyMessage="Sin solicitantes"
            />
          </div>
        )}

        <div className="w-full sm:w-52">
          <BuscadorSelect
            placeholder="Bodega"
            value={filtros.bodegaId}
            options={bodegas}
            onChange={(value) => onFilterChange("bodegaId", value)}
            loading={catalogsLoading}
            emptyMessage="Sin bodegas"
          />
        </div>

        <select
          value={filtros.estado}
          onChange={(e) => onFilterChange("estado", e.target.value as MovimientoEstado | "")}
          aria-label="Filtrar por estado"
          className={cn(DATE_CLASS, "h-9")}
        >
          {ESTADOS.map((e) => (
            <option key={e.value || "todos"} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filtros.fechaInicio}
            max={filtros.fechaFin || undefined}
            onChange={(e) => onFilterChange("fechaInicio", e.target.value)}
            aria-label="Desde"
            className={DATE_CLASS}
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={filtros.fechaFin}
            min={filtros.fechaInicio || undefined}
            onChange={(e) => onFilterChange("fechaFin", e.target.value)}
            aria-label="Hasta"
            className={DATE_CLASS}
          />
        </div>

        {hayFiltros && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="ml-auto gap-1.5 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={15} /> Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
