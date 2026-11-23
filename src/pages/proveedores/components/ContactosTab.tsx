import { useState, type FormEvent } from "react"
import {
  AlertCircle,
  Briefcase,
  Loader2,
  Mail,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import type { ApiError } from "@/services/apiError"
import type { ContactoPayload, Proveedor } from "../types"

type ContactosTabProps = {
  proveedor: Proveedor
  canManage: boolean
  onAdd: (payload: ContactoPayload) => Promise<void>
  onDelete: (contactoId: string) => Promise<void>
}

const EMPTY_FORM: ContactoPayload = {
  nombre: "",
  telefono: "",
  email: "",
  puesto: "",
  notas: "",
}

/** Tab "Contactos (N)": lista, alta con notas y baja con ConfirmModal. */
export function ContactosTab({ proveedor, canManage, onAdd, onDelete }: ContactosTabProps) {
  const [form, setForm] = useState<ContactoPayload>(EMPTY_FORM)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [contactoAEliminar, setContactoAEliminar] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const contactos = proveedor.proveedor_contacto ?? []
  const nombreInvalido = !form.nombre.trim()

  const update = (patch: Partial<ContactoPayload>) => setForm((f) => ({ ...f, ...patch }))

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (nombreInvalido || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await onAdd({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        puesto: form.puesto.trim(),
        notas: form.notas.trim(),
      })
      setForm(EMPTY_FORM)
      setTouched(false)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!contactoAEliminar) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete(contactoAEliminar)
      setContactoAEliminar(null)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertDescription>{error.message || "No se pudo completar la operación."}</AlertDescription>
        </Alert>
      )}

      {canManage && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
          noValidate
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Nuevo contacto
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="c-nombre" className="text-xs font-semibold text-slate-600">
                Nombre <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="c-nombre"
                value={form.nombre}
                onChange={(e) => update({ nombre: e.target.value })}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && nombreInvalido}
                placeholder="Nombre del contacto"
                className="h-9 border-slate-200 bg-white text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-puesto" className="text-xs font-semibold text-slate-600">
                Puesto
              </Label>
              <Input
                id="c-puesto"
                value={form.puesto}
                onChange={(e) => update({ puesto: e.target.value })}
                placeholder="Ej: Ventas"
                className="h-9 border-slate-200 bg-white text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-telefono" className="text-xs font-semibold text-slate-600">
                Teléfono
              </Label>
              <Input
                id="c-telefono"
                value={form.telefono}
                onChange={(e) => update({ telefono: e.target.value })}
                inputMode="tel"
                placeholder="Opcional"
                className="h-9 border-slate-200 bg-white text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-email" className="text-xs font-semibold text-slate-600">
                Email
              </Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="Opcional"
                className="h-9 border-slate-200 bg-white text-slate-900 focus-visible:border-slate-300 focus-visible:ring-slate-200"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-notas" className="text-xs font-semibold text-slate-600">
              Notas
            </Label>
            <Textarea
              id="c-notas"
              value={form.notas}
              onChange={(e) => update({ notas: e.target.value })}
              placeholder="Notas del contacto (opcional)"
              className="min-h-16"
            />
          </div>
          {touched && nombreInvalido && (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle size={12} /> El nombre es obligatorio.
            </p>
          )}
          <Button
            type="submit"
            disabled={submitting || (touched && nombreInvalido)}
            className="w-full gap-1.5 border border-[#172554] bg-gradient-to-b from-[#1e3a8a] to-[#172554] font-semibold text-white hover:from-[#1d4ed8] hover:to-[#1e3a8a]"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Agregar contacto
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {contactos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
            Sin contactos registrados.
          </p>
        ) : (
          contactos.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <User size={14} className="text-blue-500" />
                  <span className="font-bold text-sm text-slate-800">{c.nombre}</span>
                  {c.puesto && (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      <Briefcase size={10} /> {c.puesto}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-0.5 pl-5 text-xs text-slate-500">
                  {c.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {c.telefono}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={10} /> {c.email}
                    </span>
                  )}
                  {c.notas && (
                    <span className="flex items-start gap-1 italic text-slate-400">
                      <StickyNote size={10} className="mt-0.5 shrink-0" /> {c.notas}
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setContactoAEliminar(c.id)}
                  aria-label={`Eliminar contacto ${c.nombre}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!contactoAEliminar}
        onClose={() => !deleting && setContactoAEliminar(null)}
        onConfirm={handleDelete}
        title="¿Eliminar contacto?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar a este contacto?"
        confirmText={deleting ? "Eliminando..." : "Sí, eliminar"}
        isDestructive
      />
    </div>
  )
}
