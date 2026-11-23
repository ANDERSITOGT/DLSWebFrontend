import { Building2, Pencil, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Proveedor } from "../types"

type ProveedoresTableProps = {
  items: Proveedor[]
  canManage: boolean
  onEdit: (proveedor: Proveedor) => void
  onContacts: (proveedor: Proveedor) => void
}

/** Vista de escritorio (md+): tabla de solo lectura con acciones explícitas. */
export function ProveedoresTable({
  items,
  canManage,
  onEdit,
  onContacts,
}: ProveedoresTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-50">
            <TableHead className="w-[28%]">Empresa</TableHead>
            <TableHead className="w-[20%]">NIT</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-28 text-center">Contactos</TableHead>
            <TableHead className="w-32 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => {
            const contactos = p.proveedor_contacto?.length ?? 0
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Building2 size={16} />
                    </span>
                    <span className="truncate font-semibold text-slate-800">{p.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {p.nit || <span className="italic text-slate-300">—</span>}
                </TableCell>
                <TableCell className="max-w-0">
                  <p className="truncate text-slate-500" title={p.notas ?? undefined}>
                    {p.notas || <span className="italic text-slate-300">Sin notas</span>}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    type="button"
                    onClick={() => onContacts(p)}
                    aria-label={`Ver ${contactos} contactos de ${p.nombre}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Users size={13} />
                    {contactos}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(p)}
                        className="gap-1 border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={14} /> Editar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContacts(p)}
                      aria-label={`Abrir contactos de ${p.nombre}`}
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Users size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

