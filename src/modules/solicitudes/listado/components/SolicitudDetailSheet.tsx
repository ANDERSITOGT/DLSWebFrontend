import { useEffect, useState, type ReactNode } from "react"
import {
  Calendar,
  CheckCircle2,
  FileDown,
  History,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  User,
  UserCheck,
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import type { ApiError } from "@/services/apiError"
import {
  cambiarEstadoSolicitud,
  entregarSolicitud,
  getSolicitud,
  toApiError,
} from "../services/solicitudesListService"
import { exportSolicitudDetalle } from "../utils/descargas"
import {
  ESTADO_STYLES,
  TIPO_STYLES,
  estadoLabel,
  formatCantidad,
  formatFechaHora,
  formatMonto,
} from "../utils/format"
import type { CambioEstadoPayload, SolicitudDetalle } from "../types"
import { SolicitudTimeline } from "./SolicitudTimeline"

type Props = {
  solicitudId: string | null
  onClose: () => void
  /** Se invoca tras aprobar, rechazar o entregar con éxito. */
  onMutated: () => void
}

type ConfirmAccion = "APROBAR" | "RECHAZAR" | "ENTREGAR"

/**
 * Detalle de la solicitud en un Sheet lateral derecho.
 *
 * - Cabecera: badges de estado/tipo, solicitante, aprobador (si existe), bodega,
 *   fecha y documento generado.
 * - Tabla de productos con costo unitario/subtotal cuando el backend los envía
 *   (`costounit !== null`) y `montoTotal` al pie.
 * - Timeline de auditoría (`historial`).
 * - Acciones (solo ADMIN|BODEGUERO): aprobar, rechazar (con motivo) y entregar.
 * - PDF autenticado (apiFetch + Blob).
 */
export function SolicitudDetailSheet({ solicitudId, onClose, onMutated }: Props) {
  const { user } = useAuth()
  const esAdminBodega = user?.rol === "ADMIN" || user?.rol === "BODEGUERO"

  const [detalle, setDetalle] = useState<SolicitudDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [exporting, setExporting] = useState(false)

  const [confirmar, setConfirmar] = useState<ConfirmAccion | null>(null)
  const [motivo, setMotivo] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [exito, setExito] = useState<{ titulo: string; msg: string } | null>(null)

  // Carga del detalle al abrir / cambiar de solicitud.
  useEffect(() => {
    if (!solicitudId) {
      setDetalle(null)
      setError(null)
      setExito(null)
      setConfirmar(null)
      setMotivo("")
      return
    }
    let cancelado = false
    setLoading(true)
    setError(null)
    setDetalle(null)
    setExito(null)
    setConfirmar(null)
    setMotivo("")
    getSolicitud(solicitudId)
      .then((d) => {
        if (!cancelado) setDetalle(d)
      })
      .catch((err) => {
        if (!cancelado) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [solicitudId])

  const handleExport = async () => {
    if (!solicitudId) return
    try {
      setExporting(true)
      await exportSolicitudDetalle(solicitudId, `solicitud-${detalle?.codigo ?? solicitudId}.pdf`)
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setExporting(false)
    }
  }

  const ejecutarCambioEstado = async (payload: CambioEstadoPayload) => {
    if (!solicitudId) return
    setProcesando(true)
    setError(null)
    try {
      const actualizado = await cambiarEstadoSolicitud(solicitudId, payload)
      setDetalle(actualizado)
      setConfirmar(null)
      setMotivo("")
      setExito({
        titulo: payload.estado === "APROBADA" ? "¡Solicitud aprobada!" : "Solicitud rechazada",
        msg:
          payload.estado === "APROBADA"
            ? "La solicitud quedó lista para entrega."
            : "La solicitud ha sido rechazada.",
      })
      onMutated()
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setProcesando(false)
    }
  }

  const ejecutarEntrega = async () => {
    if (!solicitudId) return
    setProcesando(true)
    setError(null)
    try {
      const result = await entregarSolicitud(solicitudId)
      // Refrescamos el detalle para reflejar estado ENTREGADA y el documento.
      try {
        const actualizado = await getSolicitud(solicitudId)
        setDetalle(actualizado)
      } catch {
        // Si el refetch falla, mantenemos lo que había; el listado se refresca igual.
      }
      setConfirmar(null)
      setExito({
        titulo: "¡Entrega exitosa!",
        msg: result.codigoDoc
          ? `Documento generado: ${result.codigoDoc}. Inventario actualizado.`
          : "Inventario actualizado.",
      })
      onMutated()
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setProcesando(false)
    }
  }

  const d = detalle
  const isDevolucion = d?.tipo === "DEVOLUCION"
  const IconHeader = isDevolucion ? RotateCcw : Truck
  const estadoStyle = d ? ESTADO_STYLES[d.estado] : ""
  const tipoStyle = d ? TIPO_STYLES[d.tipo] : null

  const puedeAprobar = esAdminBodega && d?.estado === "PENDIENTE"
  const puedeEntregar = esAdminBodega && d?.estado === "APROBADA"
  const verCostos = d?.productos.some((p) => p.costounit !== null || p.subtotal !== null) ?? false

  return (
    <Sheet open={Boolean(solicitudId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Cabecera */}
        <SheetHeader className="bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            {tipoStyle && (
              <Badge variant="outline" className={cn("gap-1 text-[10px] font-bold uppercase", tipoStyle.badge)}>
                <IconHeader size={12} /> {tipoStyle.label}
              </Badge>
            )}
            {d && (
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", estadoStyle)}>
                {estadoLabel(d.estado)}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="truncate text-lg font-bold uppercase text-slate-900">
              {d?.codigo ?? "Solicitud"}
            </SheetTitle>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting || !d}
              className="shrink-0 gap-1.5 border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
            </Button>
          </div>
          <SheetDescription className="sr-only">Detalle de la solicitud {d?.codigo ?? ""}</SheetDescription>
        </SheetHeader>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <DetalleSkeleton />}

          {!loading && error && !d && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-center text-sm text-rose-600">
              {error.message || "No se pudo cargar la solicitud."}
            </div>
          )}

          {d && (
            <div className="space-y-4">
              {/* Metadatos */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Meta
                  label="Fecha"
                  icon={<Calendar size={13} />}
                  value={formatFechaHora(d.fecha)}
                />
                <Meta
                  label="Solicitante"
                  icon={<User size={13} />}
                  value={d.solicitante?.nombre ?? "—"}
                />
                {d.aprobador && (
                  <Meta
                    label="Aprobado por"
                    icon={<UserCheck size={13} />}
                    value={d.aprobador.nombre}
                  />
                )}
                <Meta
                  label={isDevolucion ? "Bodega destino" : "Bodega origen"}
                  icon={<MapPin size={13} />}
                  value={d.bodega?.nombre ?? "—"}
                />
                {d.documentoSalidaConsecutivo && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 sm:col-span-2">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Documento generado
                    </p>
                    <p className="font-mono text-sm font-bold text-emerald-800">
                      {d.documentoSalidaConsecutivo}
                    </p>
                  </div>
                )}
              </div>

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
                              <p className="font-semibold text-slate-700">{p.nombre}</p>
                              <p className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                                <span>{p.codigo}</span>
                                {p.loteCodigo && (
                                  <span className="rounded bg-slate-100 px-1.5 font-medium text-slate-500">
                                    Lote {p.loteCodigo}
                                  </span>
                                )}
                              </p>
                              {p.notas && (
                                <p className="mt-1 inline-block rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                                  {p.notas}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-slate-700">
                              {formatCantidad(p.cantidad)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{p.unidad || "—"}</TableCell>
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
                      {d.montoTotal !== null && (
                        <TableFooter>
                          <TableRow className="hover:bg-slate-50">
                            <TableCell
                              colSpan={verCostos ? 4 : 2}
                              className="text-right font-bold uppercase text-slate-500"
                            >
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
              </div>

              {/* Timeline de auditoría */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <History size={15} className="text-slate-400" /> Historial
                </h3>
                <SolicitudTimeline historial={d.historial} />
              </div>

              {error && <p className="text-[11px] text-rose-500">{error.message}</p>}
            </div>
          )}
        </div>

        {/* Acciones (solo ADMIN|BODEGUERO con estado válido) */}
        {(puedeAprobar || puedeEntregar) && (
          <div className="border-t border-slate-200 bg-white px-5 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {puedeAprobar && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMotivo("")
                    setConfirmar("RECHAZAR")
                  }}
                  className="flex-1 border-rose-200 font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Rechazar
                </Button>
                <Button
                  onClick={() => setConfirmar("APROBAR")}
                  className="flex-1 gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 size={16} /> {isDevolucion ? "Autorizar" : "Aprobar"}
                </Button>
              </div>
            )}
            {puedeEntregar && (
              <Button
                onClick={() => setConfirmar("ENTREGAR")}
                className={cn(
                  "w-full gap-1.5 font-semibold text-white shadow-sm",
                  isDevolucion ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700",
                )}
              >
                {isDevolucion ? <RotateCcw size={16} /> : <PackageCheck size={16} />}
                {isDevolucion ? "Confirmar reingreso a bodega" : "Generar documento de salida"}
              </Button>
            )}
          </div>
        )}

        {/* Modal de confirmación / éxito */}
        {exito && (
          <ConfirmacionOverlay
            titulo={exito.titulo}
            mensaje={exito.msg}
            onClose={() => {
              setExito(null)
              onClose()
            }}
            single
          />
        )}

        {confirmar && !exito && (
          <ConfirmacionOverlay
            titulo={
              confirmar === "APROBAR"
                ? isDevolucion
                  ? "¿Autorizar devolución?"
                  : "¿Aprobar solicitud?"
                : confirmar === "RECHAZAR"
                  ? "¿Rechazar solicitud?"
                  : isDevolucion
                    ? "¿Confirmar reingreso?"
                    : "¿Confirmar entrega?"
            }
            mensaje={
              confirmar === "APROBAR"
                ? "La solicitud quedará lista para entrega."
                : confirmar === "RECHAZAR"
                  ? "Esta acción es irreversible."
                  : isDevolucion
                    ? "Los productos volverán a sumar al stock de la bodega."
                    : "Se generará el documento y se descontará del inventario."
            }
            tono={confirmar === "RECHAZAR" ? "danger" : "emerald"}
            confirmText={
              confirmar === "APROBAR" ? "Aprobar" : confirmar === "RECHAZAR" ? "Rechazar" : "Confirmar"
            }
            procesando={procesando}
            onCancel={() => {
              if (!procesando) {
                setConfirmar(null)
                setMotivo("")
              }
            }}
            onConfirm={() => {
              if (confirmar === "RECHAZAR") {
                const motivoTrim = motivo.trim()
                void ejecutarCambioEstado({
                  estado: "RECHAZADA",
                  ...(motivoTrim ? { motivo: motivoTrim } : {}),
                })
              } else if (confirmar === "APROBAR") {
                void ejecutarCambioEstado({ estado: "APROBADA" })
              } else {
                void ejecutarEntrega()
              }
            }}
            motivo={
              confirmar === "RECHAZAR"
                ? { value: motivo, onChange: setMotivo, disabled: procesando }
                : undefined
            }
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetalleSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando detalle">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
            <Skeleton className="mb-1.5 h-2.5 w-16 bg-slate-200" />
            <Skeleton className="h-4 w-3/4 bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-3 flex-1 bg-slate-200" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 flex-1 bg-slate-200" />
              <Skeleton className="h-4 w-12 bg-slate-200" />
              <Skeleton className="h-4 w-10 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Meta({ label, icon, value }: { label: string; icon: ReactNode; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
      <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-700">{value}</p>
    </div>
  )
}

type ConfirmacionProps = {
  titulo: string
  mensaje: string
  tono?: "emerald" | "danger"
  confirmText?: string
  procesando?: boolean
  single?: boolean
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: () => void
  motivo?: { value: string; onChange: (v: string) => void; disabled?: boolean }
}

/** Overlay de confirmación / éxito por encima del Sheet (z-[70]). */
function ConfirmacionOverlay({
  titulo,
  mensaje,
  tono = "emerald",
  confirmText = "Confirmar",
  procesando = false,
  single = false,
  onClose,
  onCancel,
  onConfirm,
  motivo,
}: ConfirmacionProps) {
  const accent = tono === "danger" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
  const circle = tono === "danger" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
  const Icon = tono === "danger" ? CheckCircle2 : CheckCircle2

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl">
        <div className={cn("mx-auto mb-4 flex size-16 items-center justify-center rounded-full", circle)}>
          <Icon size={30} />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="mb-5 px-2 text-sm text-slate-500">{mensaje}</p>

        {motivo && (
          <div className="mb-5 text-left">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Motivo (opcional)
            </label>
            <textarea
              rows={2}
              value={motivo.value}
              disabled={motivo.disabled}
              onChange={(e) => motivo.onChange(e.target.value)}
              placeholder="Ej: cantidad incorrecta, producto dañado..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>
        )}

        {single ? (
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
          >
            Entendido
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={procesando}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={procesando}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-70",
                accent,
              )}
            >
              {procesando && <Loader2 className="size-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
