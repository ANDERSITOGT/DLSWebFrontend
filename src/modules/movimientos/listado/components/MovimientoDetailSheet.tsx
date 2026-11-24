import { useEffect, useState } from "react"
import {
  Calendar,
  FileDown,
  Hash,
  Loader2,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { MovimientoDetalle } from "../../types"
import {
  ESTADO_STYLES,
  TIPO_STYLES,
  formatCantidad,
  formatFechaCorta,
  formatHoraCorta,
  formatMonto,
} from "../../utils/format"
import { getMovimiento, toApiError } from "../../services/movimientosListService"
import { exportMovimientoDetalle } from "../../utils/descargas"
import { TIPO_ICONS } from "../../components/tipoIcons"
import { formatComprobante } from "../utils/movimientoDisplay"

type Props = {
  movimientoId: string | null
  onClose: () => void
}

/**
 * Detalle del movimiento en un Sheet lateral derecho. Carga el detalle por id
 * (acepta id o consecutivo), muestra metadatos en grid y la tabla de productos
 * con costo/subtotal cuando el rol tiene permiso (el backend los omite como
 * `null`). El PDF se descarga autenticado (apiFetch + Blob).
 */
export function MovimientoDetailSheet({ movimientoId, onClose }: Props) {
  const [detalle, setDetalle] = useState<MovimientoDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!movimientoId) {
      setDetalle(null)
      return
    }
    let cancelado = false
    setLoading(true)
    setError(null)
    setDetalle(null)
    getMovimiento(movimientoId)
      .then((d) => {
        if (!cancelado) setDetalle(d)
      })
      .catch((err) => {
        if (!cancelado) setError(toApiError(err).message || "No se pudo cargar el movimiento.")
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [movimientoId])

  const handleExport = async () => {
    if (!movimientoId) return
    try {
      setExporting(true)
      const id = detalle?.id ?? movimientoId
      await exportMovimientoDetalle(id, `movimiento-${detalle?.consecutivo ?? id}.pdf`)
    } catch (err) {
      setError(toApiError(err).message || "No se pudo generar el PDF.")
    } finally {
      setExporting(false)
    }
  }

  const d = detalle
  const tipo = d ? TIPO_STYLES[d.tipo] : null
  const Icon = d ? TIPO_ICONS[d.tipo] : null
  const verCostos = d?.productos.some((p) => p.costounit !== null || p.subtotal !== null) ?? false
  const comprobante = d ? formatComprobante(d.comprobante) : null

  return (
    <Sheet open={Boolean(movimientoId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Cabecera */}
        <SheetHeader className="bg-slate-50/60">
          <div className="flex items-center gap-2">
            {tipo && Icon && (
              <>
                <span className={cn("flex size-7 items-center justify-center rounded-lg", tipo.icon)}>
                  <Icon size={15} />
                </span>
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", tipo.badge)}>
                  {tipo.label}
                </Badge>
              </>
            )}
            {d && (
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", ESTADO_STYLES[d.estado])}>
                {d.estado}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="truncate text-lg font-bold uppercase text-slate-900">
              {d?.consecutivo ?? "Movimiento"}
            </SheetTitle>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting || !d}
              className="shrink-0 gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
            </Button>
          </div>
          <SheetDescription className="sr-only">Detalle del movimiento {d?.consecutivo ?? ""}</SheetDescription>
        </SheetHeader>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-4" aria-busy="true" aria-label="Cargando detalle">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <Skeleton className="mb-1.5 h-2.5 w-16 bg-slate-200" />
                    <Skeleton className="h-4 w-3/4 bg-slate-200" />
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200">
                <div className="flex gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-3 flex-1 bg-slate-200" />
                  ))}
                </div>
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-4 flex-1 bg-slate-200" />
                      <Skeleton className="h-4 w-12 bg-slate-200" />
                      <Skeleton className="h-4 w-10 bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && error && !d && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-center text-sm text-rose-600">
              {error}
            </div>
          )}

          {d && (
            <div className="space-y-4">
              {/* Metadatos en grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Meta
                  label="Fecha"
                  icon={<Calendar size={13} />}
                  value={formatFechaCorta(d.fecha)}
                  extra={formatHoraCorta(d.fecha) || undefined}
                />
                <Meta label="Registrado por" icon={<User size={13} />} value={d.creador?.nombre ?? "—"} />
                {d.bodegaOrigen && (
                  <Meta label="Bodega origen" icon={<MapPin size={13} />} value={d.bodegaOrigen.nombre} />
                )}
                {d.bodegaDestino && (
                  <Meta label="Bodega destino" icon={<MapPin size={13} />} value={d.bodegaDestino.nombre} />
                )}
                {d.proveedor && (
                  <Meta
                    label="Proveedor"
                    icon={<Truck size={13} />}
                    value={`${d.proveedor.nombre}${d.proveedor.nit ? ` · ${d.proveedor.nit}` : ""}`}
                  />
                )}
                {d.solicitante && (
                  <Meta label="Solicitante" icon={<User size={13} />} value={d.solicitante.nombre} />
                )}
                {comprobante && (
                  <Meta
                    label="Comprobante fiscal"
                    icon={<Hash size={13} />}
                    value={comprobante}
                    extra={
                      d.comprobante?.serie || d.comprobante?.numero
                        ? [d.comprobante?.serie && `Serie ${d.comprobante.serie}`, d.comprobante?.numero && `No. ${d.comprobante.numero}`]
                            .filter(Boolean)
                            .join(" · ")
                        : undefined
                    }
                  />
                )}
              </div>

              {d.observacion && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                  <span className="mb-1 block font-bold text-amber-600">Observaciones</span>
                  {d.observacion}
                </div>
              )}

              {error && <p className="text-[11px] text-rose-500">{error}</p>}

              {/* Productos */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Package size={15} className="text-slate-400" /> Productos ({d.productos.length})
                </h3>

                {d.productos.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-400">
                    Sin productos.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                          {verCostos && <TableHead className="text-right">Costo Unit.</TableHead>}
                          {verCostos && <TableHead className="text-right">Subtotal</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {d.productos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <p className="font-semibold text-slate-700">{p.productoNombre}</p>
                              <p className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                                <span>{p.productoCodigo}</span>
                                {p.loteCodigo && (
                                  <span className="rounded bg-slate-100 px-1.5 font-medium text-slate-500">
                                    Lote {p.loteCodigo}
                                  </span>
                                )}
                                {p.fincaNombre && (
                                  <span className="rounded bg-emerald-50 px-1.5 font-medium text-emerald-600">
                                    {p.fincaNombre}
                                  </span>
                                )}
                              </p>
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-slate-700">
                              {formatCantidad(p.cantidad)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{p.unidad}</TableCell>
                            {verCostos && (
                              <TableCell className="text-right tabular-nums text-slate-600">
                                {p.costounit !== null ? formatMonto(p.costounit) : "—"}
                              </TableCell>
                            )}
                            {verCostos && (
                              <TableCell className="text-right font-bold tabular-nums text-slate-700">
                                {p.subtotal !== null ? formatMonto(p.subtotal) : "—"}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                      {d.montoTotal !== null && verCostos && (
                        <TableFooter>
                          <TableRow className="hover:bg-slate-50">
                            <TableCell colSpan={4} className="text-right font-bold uppercase text-slate-500">
                              Total
                            </TableCell>
                            <TableCell className="text-right text-base font-extrabold tabular-nums text-emerald-600">
                              {formatMonto(d.montoTotal)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                )}

                {d.montoTotal !== null && !verCostos && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total</span>
                    <span className="text-lg font-extrabold tabular-nums text-emerald-700">
                      {formatMonto(d.montoTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Meta({
  label,
  icon,
  value,
  extra,
}: {
  label: string
  icon: React.ReactNode
  value: string
  extra?: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
      <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-700">{value}</p>
      {extra && <p className="truncate text-[10px] text-slate-400">{extra}</p>}
    </div>
  )
}
