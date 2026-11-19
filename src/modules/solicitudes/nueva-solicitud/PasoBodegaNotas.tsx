import { AlertCircle } from "lucide-react"
import BuscadorSelect from "@/components/ui/BuscadorSelect"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Bodega } from "./types"

type PasoBodegaNotasProps = {
  bodegas: Bodega[]
  selectedBodega: string
  onSelectBodega: (id: string) => void
  obsGeneral: string
  onChangeObs: (value: string) => void
}

export function PasoBodegaNotas({
  bodegas,
  selectedBodega,
  onSelectBodega,
  obsGeneral,
  onChangeObs,
}: PasoBodegaNotasProps) {
  const bodegaSel = bodegas.find((b) => b.id === selectedBodega) ?? null

  return (
    <div className="space-y-5">
      <Alert variant="info">
        <AlertCircle size={18} />
        <AlertDescription>
          Selecciona la bodega de destino y añade notas generales si es necesario.
        </AlertDescription>
      </Alert>

      <div className="space-y-5">
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Bodega de destino *
          </Label>
          <BuscadorSelect<Bodega>
            value={bodegaSel ? { label: bodegaSel.nombre, value: bodegaSel.id, data: bodegaSel } : null}
            options={bodegas.map((b) => ({ label: b.nombre, value: b.id, data: b }))}
            onChange={(option) => onSelectBodega(option?.value ?? "")}
            placeholder="Selecciona una bodega..."
            noOptionsMessage="No se encontraron bodegas"
          />
        </div>

        <div>
          <Label
            htmlFor="obs-general"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Observaciones generales
          </Label>
          <Textarea
            id="obs-general"
            value={obsGeneral}
            onChange={(e) => onChangeObs(e.target.value)}
            placeholder="Ej: Urgente, entregar antes del viernes..."
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
