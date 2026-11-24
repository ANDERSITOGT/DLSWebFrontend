import { useState } from "react"
import { CheckCircle2, FileDown, ListOrdered, Loader2, PlusCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/Badge"
import { exportMovimientoDetalle } from "../utils/descargas"
import type { IngresoCreado } from "./services/movimientosService"

type SuccessPanelProps = {
  resultado: IngresoCreado
  onCrearOtro: () => void
}

/**
 * Pantalla de éxito tras crear el ingreso.
 * - Muestra el consecutivo con optional chaining (fallback seguro).
 * - Botón para abrir/descargar el comprobante PDF.
 * - Botones "Crear otro" e "Ir a movimientos".
 */
export function SuccessPanel({ resultado, onCrearOtro }: SuccessPanelProps) {
  const codigo = resultado?.consecutivo ?? resultado?.documentoId ?? "Registrado"
  const documentoId = resultado?.documentoId ?? null
  const [descargando, setDescargando] = useState(false)

  const handleDescargar = async () => {
    if (!documentoId) return
    try {
      setDescargando(true)
      await exportMovimientoDetalle(documentoId, `ingreso-${codigo}.pdf`)
    } catch (err) {
      console.error("No se pudo descargar el comprobante:", err)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={44} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">¡Ingreso registrado!</h1>
        <p className="mt-1 text-sm text-slate-500">
          El documento de ingreso se generó correctamente y el stock fue actualizado.
        </p>
        <Badge variant="success" className="mt-4 px-4 py-1 text-sm font-bold">
          {codigo}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {documentoId && (
          <Button
            type="button"
            onClick={handleDescargar}
            disabled={descargando}
            className="gap-2 bg-slate-900 py-6 text-sm font-bold hover:bg-slate-800 sm:col-span-2"
          >
            {descargando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            Ver / descargar comprobante PDF
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onCrearOtro}
          className="gap-2 border-slate-300 py-6 text-sm font-bold text-slate-700"
        >
          <PlusCircle size={16} /> Crear otro
        </Button>
        <Button
          asChild
          variant="outline"
          className="gap-2 border-slate-300 py-6 text-sm font-bold text-slate-700"
        >
          <Link to="/bodega/movimientos">
            <ListOrdered size={16} /> Ir a movimientos
          </Link>
        </Button>
      </div>
    </div>
  )
}
