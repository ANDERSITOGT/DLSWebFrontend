import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Loader2, Save, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  { label: "Bodega y notas", description: "Destino y observaciones" },
  { label: "Productos", description: "Agrega los ítems" },
  { label: "Confirmación", description: "Revisa y envía" },
] as const

const SOLICITUDES_PATH = "/bodega/solicitudes"

export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const { triggerRefreshSolicitudes } = useRefresh()
  const ctrl = useNuevaSolicitud()

  const [paso, setPaso] = useState(0)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

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
          onNuevaSolicitud={() => window.location.reload()}
        />
      </div>
    )
  }

  const handleCancelar = () => {
    if (ctrl.hayCambios) setShowConfirmClose(true)
    else navigate(SOLICITUDES_PATH)
  }

  const puedeContinuar =
    paso === 0 ? ctrl.paso1Completo : paso === 1 ? ctrl.paso2Completo : false

  const handleContinuar = () => {
    if (paso < PASOS.length - 1) setPaso((p) => p + 1)
  }

  const handleAtras = () => {
    if (paso > 0) setPaso((p) => p - 1)
  }

  const handleEnviar = async () => {
    const id = await ctrl.enviarSolicitud()
    if (id) triggerRefreshSolicitudes()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header de página */}
      <header className="space-y-3">
        <Link
          to={SOLICITUDES_PATH}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Volver a solicitudes
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Nueva solicitud</h1>
          <p className="text-sm text-slate-500">
            Describe qué productos necesitas de bodega y confirma tu pedido.
          </p>
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

          <CardFooter className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={handleCancelar}
              className="gap-1 text-slate-500 hover:text-rose-600"
            >
              <X size={16} /> Cancelar
            </Button>

            <div className="flex items-center gap-2">
              {paso > 0 && (
                <Button
                  variant="outline"
                  onClick={handleAtras}
                  disabled={ctrl.guardando}
                  className="gap-1 border-slate-300 font-bold text-slate-700"
                >
                  <ArrowLeft size={16} /> Atrás
                </Button>
              )}

              {paso < PASOS.length - 1 ? (
                <Button
                  onClick={handleContinuar}
                  disabled={!puedeContinuar}
                  className="gap-1 bg-emerald-600 font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                >
                  Continuar <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleEnviar}
                  disabled={!ctrl.todoListo || ctrl.guardando}
                  className="gap-2 bg-emerald-600 font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
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
          </CardFooter>
        </Card>

        {/* Aside de resumen en vivo */}
        <aside className="order-first lg:order-none">
          <SolicitudResumenPanel
            bodega={ctrl.bodegaSeleccionada}
            items={ctrl.items}
            totalUnidades={ctrl.totalUnidades}
            todoListo={ctrl.todoListo}
          />
        </aside>
      </div>

      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={() => navigate(SOLICITUDES_PATH)}
        title="¿Cancelar solicitud?"
        message="Tienes cambios sin guardar. Si sales ahora, perderás el progreso de tu solicitud."
        confirmText="Sí, salir"
        cancelText="Continuar editando"
        isDestructive
      />
    </div>
  )
}
