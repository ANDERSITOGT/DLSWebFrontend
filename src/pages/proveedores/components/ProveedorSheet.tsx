import { Building2, Pencil, Users } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/Badge"
import type { ContactoPayload, Proveedor, ProveedorPayload } from "../types"
import { ProveedorForm } from "./ProveedorForm"
import { ContactosTab } from "./ContactosTab"

export type ProveedorSheetTab = "datos" | "contactos"

type ProveedorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null => modo creación. */
  proveedor: Proveedor | null
  mode: "create" | "edit"
  /** Pestaña inicial al abrir (controlada por la vista). */
  tab: ProveedorSheetTab
  onTabChange: (tab: ProveedorSheetTab) => void
  canManage: boolean
  onCreate: (payload: ProveedorPayload) => Promise<void>
  onUpdate: (payload: ProveedorPayload) => Promise<void>
  onAddContacto: (payload: ContactoPayload) => Promise<void>
  onDeleteContacto: (contactoId: string) => Promise<void>
}

/**
 * Panel lateral derecho (Sheet) único para crear, editar datos generales y
 * gestionar contactos. En modo edición expone dos pestañas; en modo creación
 * solo el formulario de datos generales.
 */
export function ProveedorSheet({
  open,
  onOpenChange,
  proveedor,
  mode,
  tab,
  onTabChange,
  canManage,
  onCreate,
  onUpdate,
  onAddContacto,
  onDeleteContacto,
}: ProveedorSheetProps) {
  const isEdit = mode === "edit" && !!proveedor
  const contactoCount = proveedor?.proveedor_contacto?.length ?? 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              {isEdit ? <Pencil size={16} /> : <Building2 size={16} />}
            </span>
            <SheetTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</SheetTitle>
          </div>
          <SheetDescription>
            {isEdit ? proveedor!.nombre : "Registra un nuevo socio comercial."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          {isEdit ? (
            <Tabs
              value={tab}
              onValueChange={(v) => onTabChange(v as ProveedorSheetTab)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="w-full">
                <TabsTrigger value="datos">Datos generales</TabsTrigger>
                <TabsTrigger value="contactos">
                  <Users size={14} /> Contactos
                  <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
                    {contactoCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="pt-2">
                <ProveedorForm
                  key={proveedor!.id}
                  proveedor={proveedor}
                  onSubmit={onUpdate}
                  onCancel={() => onOpenChange(false)}
                  showCancel={false}
                />
              </TabsContent>

              <TabsContent value="contactos" className="pt-2">
                <ContactosTab
                  proveedor={proveedor!}
                  canManage={canManage}
                  onAdd={onAddContacto}
                  onDelete={onDeleteContacto}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <ProveedorForm
              key="create"
              proveedor={null}
              onSubmit={onCreate}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
