import { Skeleton } from "@/components/ui/skeleton"

/** Cargadores para tabla (md+) y tarjetas (< md). */
export function ProveedoresTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProveedoresCardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:hidden">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-2 h-3 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProveedoresSkeleton() {
  return (
    <>
      <ProveedoresTableSkeleton />
      <ProveedoresCardsSkeleton />
    </>
  )
}
