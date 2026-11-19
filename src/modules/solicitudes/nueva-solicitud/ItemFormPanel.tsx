import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, PencilLine, Plus, Save, X } from "lucide-react"
import BuscadorSelect from "@/components/ui/BuscadorSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { Finca, ItemSolicitud, ProductoResult } from "./types"

type ItemFormPanelProps = {
  fincas: Finca[]
  /** Producto ya elegido (para edición) o null. */
  initialItem?: ItemSolicitud | null
  /** ProductoResult reconstruido desde initialItem cuando se está editando. */
  initialProducto?: ProductoResult | null
  /** Devuelve cuántas unidades del producto ya hay en la lista (excluyendo el ítem en edición). */
  cantidadEnLista: (productoId: string) => number
  buscarProductos: (termino: string) => Promise<ProductoResult[]>
  onAgregar: (item: ItemSolicitud) => void
  onConfirmarEdicion?: (key: string, item: ItemSolicitud) => void
  onCancel: () => void
  /** Finca pegajosa por defecto al agregar nuevos ítems. */
  defaultsFincaId?: string
  /** Lote pegajoso por defecto al agregar nuevos ítems. */
  defaultsLoteId?: string
  /** Notifica cambios de finca/lote para persistir los defaults pegajosos. */
  onDefaultsChange?: (fincaId: string, loteId: string) => void
}

function generarKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ItemFormPanel({
  fincas,
  initialItem = null,
  initialProducto = null,
  cantidadEnLista,
  buscarProductos,
  onAgregar,
  onConfirmarEdicion,
  onCancel,
  defaultsFincaId = "",
  defaultsLoteId = "",
  onDefaultsChange,
}: ItemFormPanelProps) {
  const isEdit = !!initialItem

  const [producto, setProducto] = useState<ProductoResult | null>(initialProducto)
  const [cantidad, setCantidad] = useState<number>(initialItem?.cantidad ?? 1)
  const [fincaId, setFincaId] = useState(initialItem?.fincaId || defaultsFincaId)
  const [loteId, setLoteId] = useState(initialItem?.loteId || defaultsLoteId)
  const [notas, setNotas] = useState(initialItem?.notas ?? "")
  const [intentoValidacion, setIntentoValidacion] = useState(false)

  const cantidadYaEnLista = producto ? cantidadEnLista(producto.id) : 0
  const stockDisponibleReal = producto ? producto.stockActual - cantidadYaEnLista : 0
  const excedeStock = producto ? cantidad > stockDisponibleReal : false

  const lotesDisponibles = useMemo(() => {
    const finca = fincaId ? fincas.find((f) => f.id === fincaId) : null
    return (finca?.lote ?? [])
      .slice()
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
  }, [fincas, fincaId])

  const fincaSel = fincas.find((f) => f.id === fincaId) ?? null
  const loteSel = lotesDisponibles.find((l) => l.id === loteId) ?? null

  const camposIncompletos = !producto || cantidad <= 0 || !fincaId || !loteId
  const puedeConfirmar = !camposIncompletos && !excedeStock
  const mostrarErrorCampos = intentoValidacion && camposIncompletos

  const buildItem = (): ItemSolicitud => {
    const base: ItemSolicitud = {
      key: initialItem?.key ?? generarKey(),
      productoId: producto!.id,
      nombre: producto!.nombre,
      codigo: producto!.codigo,
      unidadId: producto!.unidad.id,
      unidad: producto!.unidad.abreviatura,
      cantidad,
      stockMaximo: producto!.stockActual,
      fincaId,
      fincaNombre: fincaSel?.nombre ?? "—",
      loteId,
      loteCodigo: loteSel?.codigo ?? "—",
      notas: notas.trim(),
    }
    return base
  }

  const handleConfirmar = () => {
    setIntentoValidacion(true)
    if (!puedeConfirmar) return
    const item = buildItem()

    if (isEdit) {
      if (initialItem && onConfirmarEdicion) {
        onConfirmarEdicion(initialItem.key, item)
      }
      return
    }

    onAgregar(item)
    // Sticky defaults: se conserva finca y lote para cargar varios productos
    // al mismo lote con rapidez. Solo se limpia producto, cantidad y notas.
    if (onDefaultsChange) onDefaultsChange(fincaId, loteId)
    setProducto(null)
    setCantidad(1)
    setNotas("")
    setIntentoValidacion(false)
  }

  const handleCancelar = () => {
    if (isEdit) {
      onCancel()
      return
    }
    // En modo alta, cerrar solo limpia el formulario (sigue visible).
    setProducto(null)
    setCantidad(1)
    setNotas("")
    setFincaId(defaultsFincaId)
    setLoteId(defaultsLoteId)
    setIntentoValidacion(false)
  }

  const handleCambiarFinca = (nuevaFinca: string) => {
    setFincaId(nuevaFinca)
    setLoteId("")
    if (!isEdit && onDefaultsChange) onDefaultsChange(nuevaFinca, "")
  }

  const handleCambiarLote = (nuevoLote: string) => {
    setLoteId(nuevoLote)
    if (!isEdit && onDefaultsChange) onDefaultsChange(fincaId, nuevoLote)
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
          {isEdit ? "Editar ítem" : "Agregar nuevo ítem"}
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
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
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
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900">{producto.nombre}</span>
              <span className="text-xs font-medium text-emerald-700">
                Stock disponible: {stockDisponibleReal} {producto.unidad.abreviatura}
                {cantidadYaEnLista > 0 && (
                  <span className="ml-1 text-emerald-600">
                    ({cantidadYaEnLista} ya en la lista)
                  </span>
                )}
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
            htmlFor="item-cantidad"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Cantidad
          </Label>
          <div className="relative">
            <Input
              id="item-cantidad"
              type="number"
              min={0.1}
              step="any"
              value={Number.isFinite(cantidad) ? cantidad : ""}
              onChange={(e) => setCantidad(parseFloat(e.target.value))}
              aria-invalid={excedeStock || undefined}
              className={cn(
                "h-11 rounded-xl pr-12 text-base sm:text-sm",
                excedeStock
                  ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20"
                  : "bg-white"
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {producto?.unidad.abreviatura ?? "—"}
            </span>
          </div>
          {excedeStock && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600">
              <AlertCircle size={12} /> Supera el disponible real ({stockDisponibleReal})
            </p>
          )}
        </div>

        {/* Finca */}
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Finca
          </Label>
          <BuscadorSelect<Finca>
            value={fincaSel ? { label: fincaSel.nombre, value: fincaSel.id } : null}
            options={fincas.map((f) => ({ label: f.nombre, value: f.id, data: f }))}
            onChange={(option) => handleCambiarFinca(option?.value ?? "")}
            placeholder="Selecciona..."
            noOptionsMessage="No se encontraron fincas"
          />
        </div>

        {/* Lote */}
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Lote
          </Label>
          <BuscadorSelect
            value={loteSel ? { label: `${loteSel.codigo} - ${loteSel.cultivo.nombre}`, value: loteSel.id } : null}
            options={lotesDisponibles.map((l) => ({
              label: `${l.codigo} - ${l.cultivo.nombre}`,
              value: l.id,
              data: l,
            }))}
            onChange={(option) => handleCambiarLote(option?.value ?? "")}
            placeholder={fincaId ? "Selecciona..." : "Elige una finca"}
            isDisabled={!fincaId}
            noOptionsMessage="No se encontraron lotes"
          />
        </div>

        {/* Notas */}
        <div className="sm:col-span-2">
          <Label
            htmlFor="item-notas"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Notas (opcional)
          </Label>
          <Input
            id="item-notas"
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Detalles adicionales..."
            className="h-11 rounded-xl bg-white text-base sm:text-sm"
          />
        </div>
      </div>

      {mostrarErrorCampos && (
        <Alert variant="warning">
          <AlertCircle size={18} />
          <AlertDescription>
            Completa producto, cantidad, finca y lote para continuar.
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
