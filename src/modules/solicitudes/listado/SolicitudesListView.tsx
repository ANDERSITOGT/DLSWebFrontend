import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SearchX } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRefresh } from "@/context/RefreshContext"
import { canCreateSolicitud } from "@/config/permissions"
import { Card, CardContent } from "@/components/ui/card"
import type { BuscadorSelectOption } from "@/components/ui/BuscadorSelect"
import { catalogosService } from "@/services/catalogosService"
import { useSolicitudes } from "./hooks/useSolicitudes"
import { useSolicitudesView } from "./hooks/useSolicitudesView"
import { SolicitudesHeader } from "./components/SolicitudesHeader"
import { SolicitudesToolbar } from "./components/SolicitudesToolbar"
import { SolicitudesTable } from "./components/SolicitudesTable"
import { SolicitudesCards } from "./components/SolicitudesCards"
import { SolicitudesPagination } from "./components/SolicitudesPagination"
import { SolicitudesSkeleton } from "./components/SolicitudesSkeleton"
import { SolicitudesError } from "./components/SolicitudesError"
import { SolicitudDetailSheet } from "./components/SolicitudDetailSheet"

/**
 * Pantalla principal de Solicitudes.
 *
 * Listado paginado con filtros (estado/tipo/bodega + búsqueda debounced),
 * vista tabla/tarjetas, refresco manual + refresco tras mutaciones y detalle en
 * Sheet lateral con timeline de auditoría y acciones de aprobar/entregar.
 */
export function SolicitudesListView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refreshSolicitudes } = useRefresh()
  const ctrl = useSolicitudes()
  const { view, toggle } = useSolicitudesView()

  const puedeCrear = canCreateSolicitud(user?.rol)

  // Catálogo de bodegas para el filtro (no bloquea el listado).
  const [bodegas, setBodegas] = useState<{ id: string; nombre: string }[]>([])
  const [catalogsLoading, setCatalogsLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setCatalogsLoading(true)
    catalogosService
      .getBodegas()
      .then((res) => {
        if (!cancelado) setBodegas((res ?? []).map((b) => ({ id: b.id, nombre: b.nombre })))
      })
      .catch(() => {
        if (!cancelado) setBodegas([])
      })
      .finally(() => {
        if (!cancelado) setCatalogsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const bodegaOptions = useMemo<BuscadorSelectOption[]>(
    () => bodegas.map((b) => ({ value: b.id, label: b.nombre })),
    [bodegas],
  )

  // Refresco externo (crear solicitud, devolución, etc.) → recargar listado.
  useEffect(() => {
    if (refreshSolicitudes > 0) ctrl.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSolicitudes])

  const [detalleId, setDetalleId] = useState<string | null>(null)

  const sinResultados = !ctrl.isFirstLoad && !ctrl.error && ctrl.items.length === 0

  return (
    <div className="flex flex-col gap-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      <SolicitudesHeader
        puedeCrear={puedeCrear}
        onNuevaSolicitud={() => navigate("/bodega/solicitudes/nueva")}
      />

      <SolicitudesToolbar
        filtros={ctrl.filtros}
        onFilterChange={ctrl.setFilter}
        onReset={ctrl.resetFiltros}
        hayFiltros={ctrl.hayFiltrosActivos}
        fetching={ctrl.fetching && !ctrl.isFirstLoad}
        onRefresh={ctrl.refetch}
        view={view}
        onToggleView={toggle}
        bodegas={bodegaOptions}
        catalogsLoading={catalogsLoading}
      />

      {ctrl.error ? (
        <SolicitudesError error={ctrl.error} onRetry={ctrl.retry} />
      ) : ctrl.isFirstLoad ? (
        <SolicitudesSkeleton />
      ) : sinResultados ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <SearchX size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {ctrl.hayFiltrosActivos ? "Sin resultados para los filtros aplicados" : "Aún no hay solicitudes"}
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {ctrl.hayFiltrosActivos
                ? "Ajusta los filtros o limpia la búsqueda para ver más resultados."
                : "Crea una nueva solicitud para empezar a verlas aquí."}
            </p>
            {ctrl.hayFiltrosActivos ? (
              <button
                onClick={ctrl.resetFiltros}
                className="mt-1 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Limpiar filtros
              </button>
            ) : puedeCrear ? (
              <button
                onClick={() => navigate("/bodega/solicitudes/nueva")}
                className="mt-1 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Nueva solicitud
              </button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {view === "table" ? (
            <SolicitudesTable solicitudes={ctrl.items} onSelect={(s) => setDetalleId(s.id)} />
          ) : (
            <SolicitudesCards solicitudes={ctrl.items} onSelect={(s) => setDetalleId(s.id)} />
          )}

          <SolicitudesPagination
            desde={ctrl.desde}
            hasta={ctrl.hasta}
            total={ctrl.meta.total}
            page={ctrl.page}
            totalPages={ctrl.meta.totalPages}
            limit={ctrl.limit}
            onChangeLimit={ctrl.setLimit}
            onPrev={ctrl.goToPrev}
            onNext={ctrl.goToNext}
            hasPrev={ctrl.hasPrev}
            hasNext={ctrl.hasNext}
            disabled={ctrl.fetching}
          />
        </>
      )}

      <SolicitudDetailSheet
        solicitudId={detalleId}
        onClose={() => setDetalleId(null)}
        onMutated={ctrl.refetch}
      />
    </div>
  )
}
