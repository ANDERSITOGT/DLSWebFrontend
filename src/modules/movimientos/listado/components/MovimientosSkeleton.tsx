import { Skeleton } from "@/components/ui/skeleton"

/** Esqueleto de carga que respeta ambos modos de vista. */
export function MovimientosSkeleton() {
  return (
    <>
      {/* Tabla (md+) */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="h-8 w-1/6" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas (< md) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-12 w-full rounded-lg" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
