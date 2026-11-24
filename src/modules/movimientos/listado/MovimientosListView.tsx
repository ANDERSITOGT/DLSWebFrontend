import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { SearchX } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { canCreateIngreso } from "@/config/permissions"
import { Card, CardContent } from "@/components/ui/card"
import type { BuscadorSelectOption } from "@/components/ui/BuscadorSelect"
import { catalogosService } from "@/services/catalogosService"
import { toApiError } from "../services/movimientosListService"
import { exportMovimientosListado, exportMovimientoDetalle } from "../utils/descargas"
import type { MovimientoResumen } from "../types"
import { useMovimientos } from "./hooks/useMovimientos"
import { useMovimientosView } from "./hooks/useMovimientosView"
import { MovimientosHeader } from "./components/MovimientosHeader"
import { MovimientosToolbar } from "./components/MovimientosToolbar"
import { MovimientosTable } from "./components/MovimientosTable"
import { MovimientosCards } from "./components/MovimientosCards"
import { MovimientosPagination } from "./components/MovimientosPagination"
import { MovimientosSkeleton } from "./components/MovimientosSkeleton"
import { MovimientosError } from "../components/MovimientosError"
import { MovimientoDetailSheet } from "./components/MovimientoDetailSheet"

type Catalogo = { id: string; nombre: string }

/**
 * Pantalla principal de Movimientos (listado). Vista tabla (md+) / tarjetas
 * (< md, o md+ según preferencia), filtros contextuales, exportación autenticada
 * del PDF con los filtros activos y detalle en un Sheet lateral.
 */
export function MovimientosListView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ctrl = useMovimientos()
  const { view, toggle } = useMovimientosView()

  const puedeRegistrarIngreso = canCreateIngreso(user?.rol)
  const puedeVerLotes = ["ADMIN", "BODEGUERO", "VISOR", "SOLICITANTE"].includes(user?.rol || "")
  // El solicitante no filtra por otros solicitantes (el backend ya lo aísla).
  const canFilterSolicitante = user?.rol === "ADMIN" || user?.rol === "BODEGUERO"

  // --- Catálogos para filtros (no bloquean el listado) ---
  const [proveedores, setProveedores] = useState<Catalogo[]>([])
  const [bodegas, setBodegas] = useState<Catalogo[]>([])
  const [catalogsLoading, setCatalogsLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setCatalogsLoading(true)
    Promise.allSettled([catalogosService.getBodegas(), catalogosService.getProveedores()])
      .then(([bodegasRes, proveedoresRes]) => {
        if (cancelado) return
        if (bodegasRes.status === "fulfilled") {
          setBodegas((bodegasRes.value ?? []).map((b) => ({ id: b.id, nombre: b.nombre })))
        }
        if (proveedoresRes.status === "fulfilled") {
          setProveedores((proveedoresRes.value ?? []).map((p) => ({ id: p.id, nombre: p.nombre })))
        }
      })
      .finally(() => {
        if (!cancelado) setCatalogsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const proveedorOptions = useMemo<BuscadorSelectOption[]>(
    () => proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    [proveedores],
  )
  const bodegaOptions = useMemo<BuscadorSelectOption[]>(
    () => bodegas.map((b) => ({ value: b.id, label: b.nombre })),
    [bodegas],
  )
  // No existe catálogo de solicitantes; se deja vacío hasta que el backend lo exponga.
  const solicitanteOptions: BuscadorSelectOption[] = []

  // --- Detalle en Sheet lateral ---
  const [detalleId, setDetalleId] = useState<string | null>(null)

  // --- Export autenticado con los filtros activos ---
  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    try {
      setExporting(true)
      await exportMovimientosListado(ctrl.queryKey, "movimientos.pdf")
    } catch (err) {
      console.error("Error al exportar movimientos:", toApiError(err))
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async (m: MovimientoResumen) => {
    try {
      await exportMovimientoDetalle(m.id, `movimiento-${m.consecutivo}.pdf`)
    } catch (err) {
      console.error("Error al exportar movimiento:", toApiError(err))
    }
  }

  const sinResultados = !ctrl.isFirstLoad && !ctrl.error && ctrl.items.length === 0

  return (
    <div className="flex flex-col gap-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      <MovimientosHeader
        puedeVerLotes={puedeVerLotes}
        puedeRegistrarIngreso={puedeRegistrarIngreso}
        onNewIngreso={() => navigate("/bodega/movimientos/ingreso")}
        onExport={handleExport}
        exporting={exporting}
      />

      <MovimientosToolbar
        filtros={ctrl.filtros}
        onFilterChange={ctrl.setFilter}
        onReset={ctrl.resetFiltros}
        hayFiltros={ctrl.hayFiltrosActivos}
        fetching={ctrl.fetching && !ctrl.isFirstLoad}
        onRefresh={ctrl.refetch}
        view={view}
        onToggleView={toggle}
        proveedores={proveedorOptions}
        bodegas={bodegaOptions}
        solicitantes={solicitanteOptions}
        canFilterSolicitante={canFilterSolicitante}
        catalogsLoading={catalogsLoading}
      />

      {/* Contenido */}
      {ctrl.error ? (
        <MovimientosError error={ctrl.error} onRetry={ctrl.retry} />
      ) : ctrl.isFirstLoad ? (
        <MovimientosSkeleton />
      ) : sinResultados ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <SearchX size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {ctrl.hayFiltrosActivos ? "Sin resultados para los filtros aplicados" : "Aún no hay movimientos"}
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {ctrl.hayFiltrosActivos
                ? "Ajusta los filtros o limpia la búsqueda para ver más resultados."
                : "Registra un ingreso para empezar a ver el historial aquí."}
            </p>
            {ctrl.hayFiltrosActivos ? (
              <button
                onClick={ctrl.resetFiltros}
                className="mt-1 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Limpiar filtros
              </button>
            ) : puedeRegistrarIngreso ? (
              <Link
                to="/bodega/movimientos/ingreso"
                className="mt-1 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Registrar ingreso
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {view === "table" ? (
            <>
              <div className="hidden md:block">
                <MovimientosTable
                  movimientos={ctrl.items}
                  onSelect={(m) => setDetalleId(m.id)}
                  onExportPdf={handleExportPdf}
                />
              </div>
              {/* En móvil (< md) siempre tarjetas, sin importar la preferencia. */}
              <div className="md:hidden">
                <MovimientosCards movimientos={ctrl.items} onSelect={(m) => setDetalleId(m.id)} />
              </div>
            </>
          ) : (
            <MovimientosCards movimientos={ctrl.items} onSelect={(m) => setDetalleId(m.id)} />
          )}

          <MovimientosPagination
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

      <MovimientoDetailSheet movimientoId={detalleId} onClose={() => setDetalleId(null)} />
    </div>
  )
}
