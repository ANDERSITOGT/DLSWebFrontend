import { Loader2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ProveedoresToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  onClear: () => void
  /** Indica que hay una petición de búsqueda en curso. */
  fetching?: boolean
  /** Sólo se muestra el botón "Nuevo" si el rol puede gestionar. */
  canManage: boolean
  onNew: () => void
}

/** Búsqueda con debounce (controla el hook) + acción "Nuevo proveedor". */
export function ProveedoresToolbar({
  query,
  onQueryChange,
  onClear,
  fetching = false,
  canManage,
  onNew,
}: ProveedoresToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <div className="relative w-full sm:w-72">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar proveedores por nombre o NIT"
          className="h-9 border-slate-200 bg-white pl-9 pr-9 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-200"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {fetching ? (
            <Loader2 size={15} className="animate-spin text-slate-400" />
          ) : query ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpiar búsqueda"
              className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          ) : null}
        </span>
      </div>

      {canManage && (
        <Button
          onClick={onNew}
          className="h-9 shrink-0 gap-1.5 border border-[#172554] bg-gradient-to-b from-[#1e3a8a] to-[#172554] font-semibold text-white shadow-[0_2px_6px_rgba(23,37,84,0.35)] transition-colors hover:from-[#1d4ed8] hover:to-[#1e3a8a]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nuevo proveedor
        </Button>
      )}
    </div>
  )
}
