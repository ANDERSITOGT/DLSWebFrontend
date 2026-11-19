import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type SuccessPanelProps = {
  solicitudId: string
  onNuevaSolicitud: () => void
  onVolver: () => void
}

export function SuccessPanel({ solicitudId, onNuevaSolicitud, onVolver }: SuccessPanelProps) {
  const codigo = solicitudId.toUpperCase()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-slate-800">¡Solicitud enviada!</h2>
      <p className="mb-6 text-sm text-slate-500">
        Tu solicitud ha sido registrada correctamente.
        <br />
        Código:{" "}
        <span className="mt-3 inline-block rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-lg font-bold text-slate-800">
          {codigo}
        </span>
      </p>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={onNuevaSolicitud}
          className="flex-1 border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
        >
          Crear otra
        </Button>
        <Button
          onClick={onVolver}
          className="flex-1 bg-emerald-600 font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
        >
          Ir a solicitudes
        </Button>
      </div>
    </div>
  )
}

