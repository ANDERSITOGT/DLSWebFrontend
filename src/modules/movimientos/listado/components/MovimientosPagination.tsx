import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LIMITES_PAGINA, type LimitePagina } from "../../types"

type Props = {
  desde: number
  hasta: number
  total: number
  page: number
  totalPages: number
  limit: LimitePagina
  onChangeLimit: (value: LimitePagina) => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  disabled?: boolean
}

/** Barra de paginación en el pie del listado (servidor). */
export function MovimientosPagination({
  desde,
  hasta,
  total,
  page,
  totalPages,
  limit,
  onChangeLimit,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  disabled = false,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-500">
        {total === 0 ? (
          "Sin movimientos"
        ) : (
          <>
            Mostrando <span className="font-semibold text-slate-800">{desde}–{hasta}</span> de{" "}
            <span className="font-semibold text-slate-800">{total}</span> movimientos
          </>
        )}
      </p>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          Filas
          <select
            value={limit}
            onChange={(e) => onChangeLimit(Number(e.target.value) as LimitePagina)}
            aria-label="Movimientos por página"
            disabled={disabled}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 outline-none transition-colors focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200 disabled:opacity-50"
          >
            {LIMITES_PAGINA.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev || disabled}
            className="gap-1 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft size={16} /> Anterior
          </Button>
          <span className="px-1 text-xs text-slate-400">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNext || disabled}
            className="gap-1 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            Siguiente <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
