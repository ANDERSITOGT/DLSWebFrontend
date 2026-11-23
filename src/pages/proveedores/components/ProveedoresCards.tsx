import { Building2, CreditCard, Pencil, StickyNote, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/Badge"
import type { Proveedor } from "../types"

type ProveedoresCardsProps = {
  items: Proveedor[]
  canManage: boolean
  onEdit: (proveedor: Proveedor) => void
  onContacts: (proveedor: Proveedor) => void
}

/** Vista móvil (< md): tarjetas sin scroll horizontal y botones táctiles. */
export function ProveedoresCards({
  items,
  canManage,
  onEdit,
  onContacts,
}: ProveedoresCardsProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {items.map((p) => {
        const contactos = p.proveedor_contacto?.length ?? 0
        return (
          <article
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Building2 size={18} />
                </span>
                <h3 className="truncate text-base font-bold leading-tight text-slate-900">
                  {p.nombre}
                </h3>
              </div>
              <Badge variant={contactos > 0 ? "success" : "outline"} className="shrink-0 gap-1">
                <Users size={11} /> {contactos}
              </Badge>
            </div>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CreditCard size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="font-mono text-xs text-slate-600">
                  {p.nit || <span className="italic text-slate-300">Sin NIT</span>}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <StickyNote size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="line-clamp-2 text-slate-500">
                  {p.notas || <span className="italic text-slate-300">Sin notas</span>}
                </span>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(p)}
                  className="h-10 flex-1 gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={16} /> Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onContacts(p)}
                className="h-10 flex-1 gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Users size={16} /> Contactos
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

