import { Receipt, FileText, CalendarDays, Building2, Truck, Hash } from "lucide-react"
import BuscadorSelect from "@/components/ui/BuscadorSelect"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OcrScannerZone } from "../components/OcrScannerZone"
import type { NuevoIngresoController } from "../useNuevoIngreso"
import type { Bodega, Proveedor } from "../types"
import { cn } from "@/lib/utils"

/** Paso 1: cabecera del documento de ingreso + escaneo OCR opcional. */
export function Paso1Documento({ ctrl }: { ctrl: NuevoIngresoController }) {
  const {
    bodegas,
    proveedores,
    bodegaSeleccionada,
    proveedorSeleccionado,
    setBodegaId,
    fecha,
    setFecha,
    tipoComprobante,
    setTipoComprobante,
    esFactura,
    setProveedorId,
    serie,
    setSerie,
    factura,
    setFactura,
    uuid,
    setUuid,
    observaciones,
    setObservaciones,
    scanning,
    escanearDocumento,
    descartarOcrMensaje,
    ocrInformacion,
    ocrError,
    ocrAplicado,
  } = ctrl

  const labelCls =
    "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"

  return (
    <div className="space-y-5">
      {/* Tipo comprobante */}
      <div>
        <Label className={labelCls}>Tipo de comprobante</Label>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(["FACTURA", "RECIBO"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setTipoComprobante(opcion)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all",
                tipoComprobante === opcion
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {opcion === "FACTURA" ? <FileText size={14} /> : <Receipt size={14} />}
              {opcion === "FACTURA" ? "Factura" : "Recibo"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Bodega */}
        <div>
          <Label className={labelCls}>Bodega destino *</Label>
          <BuscadorSelect<Bodega>
            value={
              bodegaSeleccionada
                ? { label: bodegaSeleccionada.nombre, value: bodegaSeleccionada.id, data: bodegaSeleccionada }
                : null
            }
            options={bodegas.map((b) => ({ label: b.nombre, value: b.id, data: b }))}
            onChange={(option) => setBodegaId(option?.value ?? "")}
            placeholder="Selecciona una bodega..."
            noOptionsMessage="No se encontraron bodegas"
          />
        </div>

        {/* Fecha */}
        <div>
          <Label htmlFor="ing-fecha" className={labelCls}>
            Fecha *
          </Label>
          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              id="ing-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-11 rounded-xl bg-white pl-9 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Proveedor (obligatorio solo factura) */}
        <div className="sm:col-span-2">
          <Label className={labelCls}>
            Proveedor {esFactura && "*"}
          </Label>
          <BuscadorSelect<Proveedor>
            value={
              proveedorSeleccionado
                ? { label: proveedorSeleccionado.nombre, value: proveedorSeleccionado.id, data: proveedorSeleccionado }
                : null
            }
            options={proveedores.map((p) => ({
              label: `${p.nombre} — ${p.nit}`,
              value: p.id,
              data: p,
            }))}
            onChange={(option) => setProveedorId(option?.value ?? "")}
            placeholder={esFactura ? "Selecciona proveedor..." : "Opcional"}
            noOptionsMessage="No se encontraron proveedores"
          />
        </div>

        {/* Serie */}
        <div>
          <Label htmlFor="ing-serie" className={labelCls}>
            Serie
          </Label>
          <div className="relative">
            <Truck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="ing-serie"
              type="text"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              placeholder="Ej: A"
              className="h-11 rounded-xl bg-white pl-9 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Factura # */}
        <div>
          <Label htmlFor="ing-factura" className={labelCls}>
            {esFactura ? "No. Factura *" : "No. Recibo *"}
          </Label>
          <div className="relative">
            <Hash size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="ing-factura"
              type="text"
              value={factura}
              onChange={(e) => setFactura(e.target.value)}
              placeholder="Ej: 001-002-0000123"
              className="h-11 rounded-xl bg-white pl-9 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* UUID (factura) */}
        {esFactura && (
          <div className="sm:col-span-2">
            <Label htmlFor="ing-uuid" className={labelCls}>
              UUID / Código de generación
            </Label>
            <div className="relative">
              <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="ing-uuid"
                type="text"
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                placeholder="Opcional"
                className="h-11 rounded-xl bg-white pl-9 text-base sm:text-sm"
              />
            </div>
          </div>
        )}

        {/* Observaciones */}
        <div className="sm:col-span-2">
          <Label htmlFor="ing-obs" className={labelCls}>
            Observaciones
          </Label>
          <Textarea
            id="ing-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas sobre la recepción de la mercadería..."
            rows={3}
          />
        </div>
      </div>

      {/* OCR */}
      <OcrScannerZone
        scanning={scanning}
        info={ocrInformacion}
        error={ocrError}
        onEscanear={escanearDocumento}
        onDescartarMensaje={descartarOcrMensaje}
        aplicado={ocrAplicado}
      />
    </div>
  )
}
