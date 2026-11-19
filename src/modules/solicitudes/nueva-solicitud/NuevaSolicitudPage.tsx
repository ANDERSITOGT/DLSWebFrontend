import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/Badge"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { useRefresh } from "@/context/RefreshContext"
import { Stepper } from "./SolicitudStepper"
import { PasoBodegaNotas } from "./PasoBodegaNotas"
import { PasoProductos } from "./PasoProductos"
import { PasoConfirmacion } from "./PasoConfirmacion"
import { SolicitudResumenPanel } from "./SolicitudResumenPanel"
import { SuccessPanel } from "./SuccessPanel"
import { useNuevaSolicitud } from "./useNuevaSolicitud"

const PASOS = [
  { label: "Bodega y notas", shortLabel: "Bodega", description: "Destino y observaciones" },
  { label: "Productos", shortLabel: "Productos", description: "Agrega los ítems" },
  { label: "Confirmación", shortLabel: "Confirmar", description: "Revisa y envía" },
] as const

const SOLICITUDES_PATH = "/bodega/solicitudes"

export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const { triggerRefreshSolicitudes } = useRefresh()
  const ctrl = useNuevaSolicitud()

  const paso = ctrl.paso
  const setPaso = ctrl.setPaso
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false)
  const [resumenAbierto, setResumenAbierto] = useState(false)

  const progreso = useMemo(() => ((paso + 1) / PASOS.length) * 100, [paso])

  // --- Vista de éxito ---
  if (ctrl.solicitudCreadaId) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <SuccessPanel
          solicitudId={ctrl.solicitudCreadaId}
          onVolver={() => {
            triggerRefreshSolicitudes()
            navigate(SOLICITUDES_PATH)
          }}
          onNuevaSolicitud={() => {
            triggerRefreshSolicitudes()
            ctrl.resetearFormulario()
          }}
        />
      </div>
    )
  }

  const handleDescartarConfirmado = () => {
    ctrl.descartarBorrador()
    navigate(SOLICITUDES_PATH)
  }

  const puedeContinuar =
    paso === 0 ? ctrl.paso1Completo : paso === 1 ? ctrl.paso2Completo : false

  const handleContinuar = () => {
    if (paso < PASOS.length - 1) setPaso(paso + 1)
  }

  const handleAtras = () => {
    if (paso > 0) setPaso(paso - 1)
  }

  const handleEnviar = async () => {
    const id = await ctrl.enviarSolicitud()
    if (id) triggerRefreshSolicitudes()
  }

  return (
    <div className="flex flex-col gap-5 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Header de página */}
      <header className="space-y-3">
        <Link
          to={SOLICITUDES_PATH}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Volver a solicitudes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Nueva solicitud</h1>
            <p className="text-sm text-slate-500">
              Describe qué productos necesitas de bodega y confirma tu pedido.
            </p>
          </div>
          {ctrl.borradorRecuperado && (
            <Badge variant="warning" className="gap-1.5 text-[11px]">
              <Save size={12} /> Borrador recuperado
            </Badge>
          )}
        </div>
      </header>

      {/* Stepper + progreso */}
      <div className="space-y-3">
        <Stepper steps={[...PASOS]} current={paso} onStepClick={(i) => setPaso(i)} />
        <Progress value={progreso} className="h-1.5 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-emerald-600" />
      </div>

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Columna principal */}
        <Card className="app-card">
          <CardHeader className="border-b border-slate-200 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Paso {paso + 1}: {PASOS[paso].label}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-1">
            {ctrl.loadingCatalogos ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 opacity-60">
                <Loader2 className="animate-spin text-emerald-600" size={44} />
                <p className="text-sm font-medium text-slate-500">Cargando catálogos...</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {paso === 0 && (
                  <PasoBodegaNotas
                    bodegas={ctrl.bodegas}
                    selectedBodega={ctrl.selectedBodega}
                    onSelectBodega={ctrl.setSelectedBodega}
                    obsGeneral={ctrl.obsGeneral}
                    onChangeObs={ctrl.setObsGeneral}
                  />
                )}

                {paso === 1 && (
                  <PasoProductos
                    fincas={ctrl.fincas}
                    items={ctrl.items}
                    totalesPorProducto={ctrl.totalesPorProducto}
                    buscarProductos={ctrl.buscarProductos}
                    cantidadEnLista={ctrl.cantidadEnListaPorProducto}
                    onAgregar={ctrl.agregarItem}
                    onEditar={ctrl.actualizarItem}
                    onEliminar={ctrl.eliminarItem}
                    onCambiarCantidad={ctrl.actualizarCantidadItem}
                  />
                )}

                {paso === 2 && (
                  <div className="space-y-4">
                    {ctrl.errorEnvio && (
                      <Alert variant="destructive">
                        <AlertDescription>{ctrl.errorEnvio}</AlertDescription>
                      </Alert>
                    )}
                    <PasoConfirmacion
                      bodega={ctrl.bodegaSeleccionada}
                      obsGeneral={ctrl.obsGeneral}
                      items={ctrl.items}
                      totalesPorProducto={ctrl.totalesPorProducto}
                      totalUnidades={ctrl.totalUnidades}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Botón principal: arriba y full-width en móvil, a la derecha en ≥ sm */}
            <div className="order-1 flex w-full items-center gap-2 sm:order-2 sm:w-auto">
              {paso > 0 && (
                <Button
                  variant="outline"
                  onClick={handleAtras}
                  disabled={ctrl.guardando}
                  className="hidden shrink-0 gap-1 border-slate-300 font-bold text-slate-700 sm:inline-flex"
                >
                  <ArrowLeft size={16} /> Atrás
                </Button>
              )}

              {paso < PASOS.length - 1 ? (
                <Button
                  onClick={handleContinuar}
                  disabled={!puedeContinuar}
                  className="w-full shrink-0 gap-1 bg-emerald-600 font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 sm:w-auto"
                >
                  Continuar <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleEnviar}
                  disabled={!ctrl.todoListo || ctrl.guardando}
                  className="w-full shrink-0 gap-2 bg-emerald-600 font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 sm:w-auto"
                >
                  {ctrl.guardando ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {ctrl.guardando ? "Enviando..." : "Enviar solicitud"}
                </Button>
              )}
            </div>

            {/* Fila secundaria: Descartar (izq) + Atrás (der) en móvil */}
            <div className="order-2 flex w-full items-center justify-between gap-2 sm:order-1 sm:w-auto sm:justify-start">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDiscard(true)}
                disabled={ctrl.guardando}
                aria-label="Descartar solicitud"
                className="shrink-0 gap-1 whitespace-nowrap border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 sm:px-4 sm:text-sm"
              >
                <Trash2 size={16} /> Descartar
              </Button>

              {paso > 0 && (
                <Button
                  variant="outline"
                  onClick={handleAtras}
                  disabled={ctrl.guardando}
                  className="shrink-0 gap-1 border-slate-300 font-bold text-slate-700 sm:hidden"
                >
                  <ArrowLeft size={16} /> Atrás
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Aside de resumen en vivo: debajo en móvil, columna sticky en ≥ lg */}
        <aside className="order-last lg:order-none">
          {/* Toggle compacto solo en móvil */}
          <button
            type="button"
            onClick={() => setResumenAbierto((abierto) => !abierto)}
            aria-expanded={resumenAbierto}
            aria-controls="resumen-solicitud"
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <span>
              Ver resumen ({ctrl.items.length} {ctrl.items.length === 1 ? "ítem" : "ítems"})
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition-transform ${resumenAbierto ? "rotate-180" : ""}`}
            />
          </button>

          <div
            id="resumen-solicitud"
            className={`mt-3 lg:mt-0 ${resumenAbierto ? "block" : "hidden"} lg:block`}
          >
            <SolicitudResumenPanel
              bodega={ctrl.bodegaSeleccionada}
              items={ctrl.items}
              totalUnidades={ctrl.totalUnidades}
              todoListo={ctrl.todoListo}
            />
          </div>
        </aside>
      </div>

      <ConfirmModal
        isOpen={showConfirmDiscard}
        onClose={() => setShowConfirmDiscard(false)}
        onConfirm={handleDescartarConfirmado}
        title="¿Descartar solicitud?"
        message="Se eliminará todo el borrador de esta solicitud (bodega, productos y notas). Esta acción no se puede deshacer."
        confirmText="Sí, descartar"
        cancelText="Continuar editando"
        isDestructive
      />
    </div>
  )
}
