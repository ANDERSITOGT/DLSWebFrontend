import { Link } from "react-router-dom"
import { ArrowLeft, Info, X } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stepper, type StepperStep } from "@/components/ui/Stepper"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { useState } from "react"
import { useNuevoIngreso } from "./useNuevoIngreso"
import { Paso1Documento } from "./steps/Paso1Documento"
import { Paso2Productos } from "./steps/Paso2Productos"
import { Paso3Confirmacion } from "./steps/Paso3Confirmacion"
import { IngresoResumenPanel } from "./IngresoResumenPanel"
import { SuccessPanel } from "./SuccessPanel"

const STEPS: StepperStep[] = [
  { label: "Documento", shortLabel: "Doc", description: "Comprobante y proveedor" },
  { label: "Productos", shortLabel: "Prod", description: "Ítems y cantidades" },
  { label: "Confirmar", shortLabel: "Conf", description: "Revisar y registrar" },
]

export function NuevoIngresoPage() {
  const ctrl = useNuevoIngreso()
  const {
    paso,
    setPaso,
    resultado,
    resetearFormulario,
    borradorRecuperado,
    descartarBorrador,
    enviando,
    errorEnvio,
    todoListo,
    paso1Completo,
    paso2Completo,
    enviarIngreso,
  } = ctrl

  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)

  // Vista de éxito
  if (resultado) {
    return (
      <div className="pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        <SuccessPanel resultado={resultado} onCrearOtro={resetearFormulario} />
      </div>
    )
  }

  const puedeContinuar = paso === 0 ? paso1Completo : paso === 1 ? paso2Completo : todoListo

  const handleContinuar = async () => {
    if (paso < 2) {
      setPaso(paso + 1)
      return
    }
    await enviarIngreso()
  }

  return (
    <div className="space-y-5 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/bodega/movimientos"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={14} /> Volver a movimientos
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Nuevo ingreso</h1>
          <p className="text-sm text-slate-500">
            Registra la entrada de mercadería a bodega en tres pasos.
          </p>
        </div>
        {borradorRecuperado && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Borrador recuperado
          </span>
        )}
      </header>

      {/* Borrador recuperado */}
      {borradorRecuperado && (
        <Alert variant="warning">
          <Info size={18} />
          <div className="flex-1">
            <AlertDescription>
              Recuperamos un ingreso que dejaste a medias. Puedes continuar donde lo
              dejaste o descartarlo para empezar de cero.
            </AlertDescription>
          </div>
          <button
            type="button"
            onClick={() => setConfirmandoDescarte(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
          >
            <X size={13} /> Descartar
          </button>
        </Alert>
      )}

      {/* Stepper + progreso */}
      <div className="space-y-2">
        <Stepper
          steps={STEPS}
          current={paso}
          onStepClick={(index) => {
            // Retroceder solo a pasos ya completados.
            if (index < paso) setPaso(index)
          }}
        />
        <Progress value={((paso + 1) / STEPS.length) * 100} className="h-1" />
      </div>

      {/* Layout 2 columnas */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <Card className="overflow-visible py-0">
          <CardContent className="p-4 sm:p-5">
            {paso === 0 && <Paso1Documento ctrl={ctrl} />}
            {paso === 1 && <Paso2Productos ctrl={ctrl} />}
            {paso === 2 && <Paso3Confirmacion ctrl={ctrl} />}
          </CardContent>

          <CardFooter className="flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaso(Math.max(0, paso - 1))}
              disabled={paso === 0 || enviando}
              className="w-full border-slate-300 font-bold text-slate-700 sm:w-auto"
            >
              Atrás
            </Button>
            <Button
              type="button"
              onClick={handleContinuar}
              disabled={!puedeContinuar || enviando}
              className="w-full gap-2 bg-emerald-600 font-bold hover:bg-emerald-700 sm:w-auto"
            >
              {enviando ? "Registrando..." : paso === 2 ? "Registrar ingreso" : "Continuar"}
            </Button>
          </CardFooter>
        </Card>

        <aside className="lg:sticky lg:top-4">
          <IngresoResumenPanel ctrl={ctrl} />
        </aside>
      </div>

      {errorEnvio && (
        <Alert variant="destructive">
          <AlertDescription>{errorEnvio}</AlertDescription>
        </Alert>
      )}

      <ConfirmModal
        isOpen={confirmandoDescarte}
        onClose={() => setConfirmandoDescarte(false)}
        onConfirm={() => {
          descartarBorrador()
          setConfirmandoDescarte(false)
        }}
        title="¿Descartar borrador?"
        message="Se eliminará el ingreso en progreso y no se podrá recuperar."
        confirmText="Descartar"
        cancelText="Cerrar"
        isDestructive
      />
    </div>
  )
}
