import { useMemo, useState } from "react"
import { Filter, LayoutGrid, Loader2, RefreshCw, Search, SlidersHorizontal, TableProperties, X } from "lucide-react"
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

/** Chip removible de un filtro avanzado activo. */
type FiltroChip = { key: keyof MovimientosFiltros; label: string }

/**
 * Barra de filtros del listado con patrón Progressive Disclosure:
 *
 * - Fila principal única: tabs por tipo + buscador + botón "Filtros" (con badge
 *   del número de filtros avanzados activos que despliega/colapsa el panel) +
 *   toggle Tabla/Tarjetas + Actualizar.
 * - Panel de filtros avanzados (proveedor / solicitante contextual, bodega,
 *   estado y fechas) colapsable.
 * - Cuando hay filtros avanzados activos con el panel cerrado, se muestran
 *   chips removibles debajo de la barra para quitarlos en 1 clic.
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const mostrarProveedor = !filtros.tipo || filtros.tipo === "INGRESO" || filtros.tipo === "DEVOLUCION"
  const mostrarSolicitante = canFilterSolicitante && (!filtros.tipo || filtros.tipo === "SALIDA")

  const nombrePorId = (opciones: BuscadorSelectOption[], id: string) =>
    opciones.find((o) => o.value === id)?.label ?? id

  // Chips de filtros avanzados (sin tipo ni q, que viven en la fila principal).
  const chips = useMemo<FiltroChip[]>(() => {
    const lista: FiltroChip[] = []
    if (filtros.proveedorId) {
      lista.push({ key: "proveedorId", label: `Proveedor: ${nombrePorId(proveedores, filtros.proveedorId)}` })
    }
    if (filtros.solicitanteId) {
      lista.push({
        key: "solicitanteId",
        label: `Solicitante: ${nombrePorId(solicitantes, filtros.solicitanteId)}`,
      })
    }
    if (filtros.bodegaId) {
      lista.push({ key: "bodegaId", label: `Bodega: ${nombrePorId(bodegas, filtros.bodegaId)}` })
    }
    if (filtros.estado) lista.push({ key: "estado", label: `Estado: ${filtros.estado}` })
    if (filtros.fechaInicio) lista.push({ key: "fechaInicio", label: `Desde: ${filtros.fechaInicio}` })
    if (filtros.fechaFin) lista.push({ key: "fechaFin", label: `Hasta: ${filtros.fechaFin}` })
    return lista
  }, [filtros, proveedores, solicitantes, bodegas])

  const quitarChip = (key: keyof MovimientosFiltros) => onFilterChange(key, "")

  return (
    <div className="space-y-2.5">
      {/* Fila principal única */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tabs rápidos por tipo (scroll horizontal en móvil muy angosto) */}
        <div className="flex min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_TABS.map((tab) => {
            const activo = filtros.tipo === tab.value
            return (
              <button
                key={tab.value || "todos"}
                type="button"
                onClick={() => onFilterChange("tipo", tab.value)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  activo ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-60">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            value={filtros.q}
            onChange={(e) => onFilterChange("q", e.target.value)}
            placeholder="Buscar consecutivo, factura o producto..."
            aria-label="Buscar movimientos"
            className="h-9 border-slate-300 bg-white pl-9 pr-9 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
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

        {/* Filtros (con badge de activos) */}
        <Button
          variant="outline"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          className={cn(
            "gap-1.5 border-slate-200 bg-white font-semibold hover:bg-slate-50",
            chips.length > 0 ? "text-emerald-700" : "text-slate-700",
          )}
        >
          <SlidersHorizontal size={15} /> Filtros
          {chips.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
              {chips.length}
            </span>
          )}
        </Button>

        {/* Toggle Tabla / Tarjetas (disponible en todos los tamaños) */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
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

        {/* Actualizar */}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={fetching}
          aria-label="Actualizar"
          className="gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={15} className={cn(fetching && "animate-spin")} />
          <span className="hidden lg:inline">Actualizar</span>
        </Button>
      </div>

      {/* Panel de filtros avanzados (colapsable) */}
      {filtrosAbiertos && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
          <span className="flex items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Filter size={13} /> Filtros avanzados
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
      )}

      {/* Chips removibles cuando el panel está cerrado y hay filtros activos */}
      {!filtrosAbiertos && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => quitarChip(chip.key)}
              className="group flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2.5 pr-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              {chip.label}
              <X size={12} className="text-slate-400 group-hover:text-rose-500" />
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}
