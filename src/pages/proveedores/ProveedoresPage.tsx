import { useState } from "react"
import { Building2, SearchX } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { canManageProveedores } from "@/config/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { ProveedoresToolbar } from "./components/ProveedoresToolbar"
import { ProveedoresTable } from "./components/ProveedoresTable"
import { ProveedoresCards } from "./components/ProveedoresCards"
import { ProveedoresPagination } from "./components/ProveedoresPagination"
import { ProveedoresSkeleton } from "./components/ProveedoresSkeleton"
import { ProveedoresError } from "./components/ProveedoresError"
import { ProveedorSheet, type ProveedorSheetTab } from "./components/ProveedorSheet"
import { useProveedores } from "./useProveedores"
import type { ContactoPayload, Proveedor, ProveedorPayload } from "./types"

type SheetState =
  | { open: false }
  | { open: true; mode: "create"; tab: ProveedorSheetTab }
  | { open: true; mode: "edit"; selectedId: string; tab: ProveedorSheetTab }

const SHEET_CLOSED: SheetState = { open: false }

export default function ProveedoresPage() {
  const { user } = useAuth()
  const canManage = canManageProveedores(user?.rol)
  const ctrl = useProveedores()

  /**
   * Sólo guardamos el id del proveedor seleccionado; el objeto se deriva de
   * `items`, así el refetch() tras guardar/actualizar contactos refresca al
   * instante el panel abierto y el badge de la tabla.
   */
  const [sheet, setSheet] = useState<SheetState>(SHEET_CLOSED)

  const selectedId = sheet.open && sheet.mode === "edit" ? sheet.selectedId : null
  const proveedorActivo = ctrl.findById(selectedId)

  // --- Handlers del Sheet ---
  const openCreate = () => setSheet({ open: true, mode: "create", tab: "datos" })
  const openEdit = (p: Proveedor) =>
    setSheet({ open: true, mode: "edit", selectedId: p.id, tab: "datos" })
  const openContacts = (p: Proveedor) =>
    setSheet({ open: true, mode: "edit", selectedId: p.id, tab: "contactos" })
  const closeSheet = () => setSheet(SHEET_CLOSED)
  const changeTab = (tab: ProveedorSheetTab) =>
    setSheet((s) => (s.open && s.mode === "edit" ? { ...s, tab } : s))

  const handleCreate = async (payload: ProveedorPayload) => {
    await ctrl.crear(payload)
    closeSheet()
  }

  const handleUpdate = async (payload: ProveedorPayload) => {
    if (!selectedId) return
    await ctrl.editar(selectedId, payload)
  }

  const handleAddContacto = async (payload: ContactoPayload) => {
    if (!selectedId) return
    await ctrl.agregarContacto(selectedId, payload)
  }

  const handleDeleteContacto = async (contactoId: string) => {
    await ctrl.eliminarContacto(contactoId)
  }

  const sinResultados = !ctrl.isFirstLoad && !ctrl.error && ctrl.items.length === 0

  return (
    <div className="flex flex-col gap-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Cabecera */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
              <Building2 size={22} className="text-pink-500" /> Proveedores
            </h1>
            <p className="text-sm text-slate-500">Gestión de socios comerciales y contactos.</p>
          </div>
        </div>

        <ProveedoresToolbar
          query={ctrl.query}
          onQueryChange={ctrl.setQuery}
          onClear={ctrl.clearQuery}
          fetching={ctrl.fetching && !ctrl.isFirstLoad}
          canManage={canManage}
          onNew={openCreate}
        />
      </header>

      {/* Contenido */}
      {ctrl.error ? (
        <ProveedoresError error={ctrl.error} onRetry={ctrl.retry} />
      ) : ctrl.isFirstLoad ? (
        <ProveedoresSkeleton />
      ) : sinResultados ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <SearchX size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {ctrl.query ? "Sin resultados para tu búsqueda" : "Aún no hay proveedores"}
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {ctrl.query
                ? "Prueba con otro nombre o NIT."
                : "Crea el primer proveedor para empezar a registrarlo en tus movimientos."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ProveedoresTable
            items={ctrl.items}
            canManage={canManage}
            onEdit={openEdit}
            onContacts={openContacts}
          />
          <ProveedoresCards
            items={ctrl.items}
            canManage={canManage}
            onEdit={openEdit}
            onContacts={openContacts}
          />

          <ProveedoresPagination
            desde={ctrl.desde}
            hasta={ctrl.hasta}
            total={ctrl.meta.total}
            limit={ctrl.limit}
            onChangeLimit={ctrl.setLimit}
            onPrev={ctrl.goToPrev}
            onNext={ctrl.goToNext}
            hasPrev={ctrl.hasPrev}
            hasNext={ctrl.hasNext}
            disabled={ctrl.fetching}
          />
        </>
      )}

      {/* Panel lateral */}
      <ProveedorSheet
        open={sheet.open}
        onOpenChange={(open) => !open && closeSheet()}
        proveedor={sheet.open && sheet.mode === "edit" ? proveedorActivo : null}
        mode={sheet.open ? sheet.mode : "create"}
        tab={sheet.open && sheet.mode === "edit" ? sheet.tab : "datos"}
        onTabChange={changeTab}
        canManage={canManage}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onAddContacto={handleAddContacto}
        onDeleteContacto={handleDeleteContacto}
      />
    </div>
  )
}
