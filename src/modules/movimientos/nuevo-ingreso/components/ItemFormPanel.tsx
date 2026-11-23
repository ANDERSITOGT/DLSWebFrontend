import { useState } from "react"
import { AlertCircle, CheckCircle2, PencilLine, Plus, Save, Sparkles, X } from "lucide-react"
import BuscadorSelect from "@/components/ui/BuscadorSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { ItemIngreso, ProductoResult } from "../types"

type ItemFormPanelProps = {
  /** Ítem ya existente cuando se está editando (null = modo alta). */
  initialItem?: ItemIngreso | null
  buscarProductos: (termino: string) => Promise<ProductoResult[]>
  onAgregar: (item: ItemIngreso) => void
  onConfirmarEdicion?: (key: string, item: ItemIngreso) => void
  onCancel: () => void
  /** Abre el modal de creación de producto. */
  onCrearProducto: () => void
  /** Producto preseleccionado (p. ej. recién creado con CrearProductoModal). */
  preselectedProduct?: ProductoResult | null
}

function generarKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `ing-item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ItemFormPanel({
  initialItem = null,
  buscarProductos,
  onAgregar,
  onConfirmarEdicion,
  onCancel,
  onCrearProducto,
  preselectedProduct = null,
}: ItemFormPanelProps) {
  const isEdit = !!initialItem

  const [producto, setProducto] = useState<ProductoResult | null>(
    initialItem && initialItem.productoId
      ? {
          id: initialItem.productoId,
          nombre: initialItem.nombre,
          codigo: initialItem.codigo,
          unidad: { abreviatura: initialItem.unidad },
        }
      : preselectedProduct
  )
  const [cantidad, setCantidad] = useState<number>(initialItem?.cantidad ?? 1)
  const [costoTotal, setCostoTotal] = useState<number>(initialItem?.costoTotal ?? 0)
  const [intentoValidacion, setIntentoValidacion] = useState(false)

  const costoUnitario = cantidad > 0 ? costoTotal / cantidad : 0

  const camposIncompletos = !producto || cantidad <= 0
  const puedeConfirmar = !camposIncompletos
  const mostrarErrorCampos = intentoValidacion && camposIncompletos

  const buildItem = (): ItemIngreso => ({
    key: initialItem?.key ?? generarKey(),
    productoId: producto!.id,
    nombre: producto!.nombre,
    codigo: producto!.codigo,
    unidad: producto!.unidad?.abreviatura ?? "UND",
    cantidad,
    costoUnitario,
    costoTotal: Number.isFinite(costoTotal) ? costoTotal : 0,
    origen: "manual",
    requiereRevision: false,
  })

  const handleConfirmar = () => {
    setIntentoValidacion(true)
    if (!puedeConfirmar) return
    const item = buildItem()

    if (isEdit) {
      if (initialItem && onConfirmarEdicion) onConfirmarEdicion(initialItem.key, item)
      return
    }

    onAgregar(item)
    setProducto(null)
    setCantidad(1)
    setCostoTotal(0)
    setIntentoValidacion(false)
  }

  const handleCancelar = () => {
    if (isEdit) {
      onCancel()
      return
    }
    setProducto(null)
    setCantidad(1)
    setCostoTotal(0)
    setIntentoValidacion(false)
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border p-4 ring-4 transition-colors sm:p-5",
        isEdit
          ? "border-emerald-300 bg-emerald-50/60 ring-emerald-100"
          : "border-emerald-200 bg-emerald-50/40 ring-emerald-50"
      )}
    >
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          {isEdit ? <PencilLine size={16} /> : <Plus size={16} />}
          {isEdit ? "Editar ítem" : "Agregar ítem"}
        </h3>
        <button
          type="button"
          onClick={handleCancelar}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
          aria-label={isEdit ? "Cancelar edición" : "Limpiar formulario"}
        >
          <X size={18} />
        </button>
      </div>

      {/* Producto */}
      {!producto ? (
        <div className="space-y-2">
          <Label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Buscar producto
          </Label>
          <BuscadorSelect<ProductoResult>
            value={null}
            loadOptions={async (termino) => {
              const productos = await buscarProductos(termino)
              return productos.map((p) => ({
                label: `${p.nombre} (${p.codigo})`,
                value: p.id,
                data: p,
              }))
            }}
            onChange={(option) => {
              if (option?.data) setProducto(option.data)
            }}
            placeholder="Nombre o código..."
            isClearable={false}
            noOptionsMessage="No se encontraron productos"
          />
          <button
            type="button"
            onClick={onCrearProducto}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            <Sparkles size={13} /> ¿No existe? Crear producto nuevo
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900">{producto.nombre}</span>
              <span className="text-xs font-medium text-slate-500">
                {producto.codigo} · Unidad: {producto.unidad?.abreviatura ?? "UND"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProducto(null)}
            className="rounded-lg px-3 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-50 hover:text-rose-500"
          >
            Cambiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Cantidad */}
        <div>
          <Label
            htmlFor="ing-cantidad"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Cantidad
          </Label>
          <Input
            id="ing-cantidad"
            type="number"
            min={0.1}
            step="any"
            value={Number.isFinite(cantidad) ? cantidad : ""}
            onChange={(e) => setCantidad(parseFloat(e.target.value))}
            className="h-11 rounded-xl bg-white text-base sm:text-sm"
          />
        </div>

        {/* Costo total Q */}
        <div>
          <Label
            htmlFor="ing-costo"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Costo total (Q)
          </Label>
          <div className="relative">
            <Input
              id="ing-costo"
              type="number"
              min={0}
              step="any"
              value={Number.isFinite(costoTotal) ? costoTotal : ""}
              onChange={(e) => setCostoTotal(parseFloat(e.target.value))}
              className="h-11 rounded-xl bg-white pr-10 text-base sm:text-sm"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              Q
            </span>
          </div>
          {costoUnitario > 0 && (
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Unitario: Q{costoUnitario.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {mostrarErrorCampos && (
        <Alert variant="warning">
          <AlertCircle size={18} />
          <AlertDescription>
            Selecciona un producto y una cantidad mayor que cero para continuar.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleConfirmar}
          className="flex-1 gap-2 bg-slate-900 py-6 text-sm font-bold hover:bg-slate-800"
        >
          {isEdit ? <Save size={16} /> : <Plus size={16} />}
          {isEdit ? "Guardar cambios" : "Confirmar y agregar"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelar}
            className="gap-1 border-slate-300 py-6 font-bold text-slate-700"
          >
            <X size={16} /> Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
