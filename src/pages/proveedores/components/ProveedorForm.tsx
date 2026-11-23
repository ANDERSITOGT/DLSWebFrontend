import { useState, type FormEvent } from "react"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ApiError } from "@/services/apiError"
import type { Proveedor, ProveedorPayload } from "../types"

type ProveedorFormProps = {
  proveedor: Proveedor | null
  onSubmit: (payload: ProveedorPayload) => Promise<void>
  onCancel: () => void
  /** Permite ocultar el botón Cancelar (p. ej. cuando es la única acción). */
  showCancel?: boolean
}

type FormState = {
  nombre: string
  nit: string
  notas: string
}

/** Tab "Datos generales": crea (proveedor === null) o edita un proveedor. */
export function ProveedorForm({ proveedor, onSubmit, onCancel, showCancel = true }: ProveedorFormProps) {
  const isEdit = !!proveedor
  const [form, setForm] = useState<FormState>({
    nombre: proveedor?.nombre ?? "",
    nit: proveedor?.nit ?? "",
    notas: proveedor?.notas ?? "",
  })
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const nombreInvalido = !form.nombre.trim()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (nombreInvalido || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        notas: form.notas.trim(),
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? (err as ApiError)
          : ({ message: "Error inesperado." } as ApiError),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <div>
            <AlertTitle>{error.status === 409 ? "Proveedor duplicado" : "No se pudo guardar"}</AlertTitle>
            <AlertDescription>
              {error.message || "Revisa los datos e intenta de nuevo."}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="prov-nombre" className="text-slate-700">
          Nombre <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="prov-nombre"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          onBlur={() => setTouched(true)}
          placeholder="Ej: Distribuidora Agrícola, S.A."
          aria-invalid={touched && nombreInvalido}
          autoFocus
          className="h-9 border-slate-200 bg-white text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
        />
        {touched && nombreInvalido && (
          <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
            <AlertCircle size={12} /> El nombre es obligatorio.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prov-nit" className="text-slate-700">
          NIT
        </Label>
        <Input
          id="prov-nit"
          value={form.nit}
          onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))}
          placeholder="Opcional"
          className="h-9 border-slate-200 bg-white font-mono text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prov-notas" className="text-slate-700">
          Notas
        </Label>
        <Textarea
          id="prov-notas"
          value={form.notas}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          placeholder="Información interna, condiciones de pago, etc."
          className="min-h-24"
        />
      </div>

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || (touched && nombreInvalido)}
          className="gap-1.5 border border-[#172554] bg-gradient-to-b from-[#1e3a8a] to-[#172554] font-semibold text-white hover:from-[#1d4ed8] hover:to-[#1e3a8a]"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isEdit ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  )
}
