import { useMemo, useState } from "react"
import { Filter, LayoutGrid, Loader2, RefreshCw, Search, SlidersHorizontal, TableProperties, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BuscadorSelect, type BuscadorSelectOption } from "@/components/ui/BuscadorSelect"
import { cn } from "@/lib/utils"
import type { SolicitudEstado, SolicitudTipo, SolicitudesFiltros } from "../types"
import type { SolicitudViewMode } from "../hooks/useSolicitudesView"

type Props = {
  filtros: SolicitudesFiltros
  onFilterChange: <K extends keyof SolicitudesFiltros>(key: K, value: SolicitudesFiltros[K]) => void
  onReset: () => void
  hayFiltros: boolean
  fetching: boolean
  onRefresh: () => void
  view: SolicitudViewMode
  onToggleView: () => void
  bodegas: BuscadorSelectOption[]
  catalogsLoading?: boolean
}

type EstadoTab = { value: SolicitudEstado | ""; label: string }

const ESTADO_TABS: EstadoTab[] = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADA", label: "Aprobadas" },
  { value: "ENTREGADA", label: "Entregadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
]

const TIPOS: { value: SolicitudTipo | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "DESPACHO", label: "Despachos" },
  { value: "DEVOLUCION", label: "Devoluciones" },
]

const SELECT_CLASS =
  "h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20"

type FiltroChip = { key: keyof SolicitudesFiltros; label: string }

/**
 * Barra de filtros con patrón Progressive Disclosure (igual que Movimientos):
 * fila principal con tabs por estado + buscador + botón "Filtros" (badge de
 * filtros avanzados activos) + toggle Tabla/Tarjetas + Actualizar, y un panel
 * colapsable con tipo y bodega.
 */
export function SolicitudesToolbar({
  filtros,
  onFilterChange,
  onReset,
  hayFiltros,
  fetching,
  onRefresh,
  view,
  onToggleView,
  bodegas,
  catalogsLoading = false,
}: Props) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const nombreBodega = (id: string) => bodegas.find((o) => o.value === id)?.label ?? id

  // Chips de filtros avanzados (tipo + bodega); estado y q viven en la fila principal.
  const chips = useMemo<FiltroChip[]>(() => {
    const lista: FiltroChip[] = []
    if (filtros.tipo) {
      lista.push({
        key: "tipo",
        label: `Tipo: ${filtros.tipo === "DESPACHO" ? "Despachos" : "Devoluciones"}`,
      })
    }
    if (filtros.bodegaId) lista.push({ key: "bodegaId", label: `Bodega: ${nombreBodega(filtros.bodegaId)}` })
    return lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.tipo, filtros.bodegaId, bodegas])

  return (
    <div className="space-y-2.5">
      {/* Fila principal */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tabs rápidos por estado */}
        <div className="flex min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ESTADO_TABS.map((tab) => {
            const activo = filtros.estado === tab.value
            return (
              <button
                key={tab.value || "todas"}
                type="button"
                onClick={() => onFilterChange("estado", tab.value)}
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
            placeholder="Buscar código o producto..."
            aria-label="Buscar solicitudes"
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

        {/* Filtros avanzados */}
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

        {/* Toggle Tabla / Tarjetas */}
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

      {/* Panel de filtros avanzados */}
      {filtrosAbiertos && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
          <span className="flex items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Filter size={13} /> Filtros avanzados
          </span>

          <select
            value={filtros.tipo}
            onChange={(e) => onFilterChange("tipo", e.target.value as SolicitudTipo | "")}
            aria-label="Filtrar por tipo"
            className={SELECT_CLASS}
          >
            {TIPOS.map((t) => (
              <option key={t.value || "todos"} value={t.value}>
                {t.value ? t.label : "Todos los tipos"}
              </option>
            ))}
          </select>

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

      {/* Chips removibles */}
      {!filtrosAbiertos && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange(chip.key, "")}
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
