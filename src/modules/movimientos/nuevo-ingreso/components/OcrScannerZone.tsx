import { useRef, useState, type DragEvent } from "react"
import { Camera, FileText, Info, Loader2, ScanLine, TriangleAlert, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { ACCEPT_OCR, esImagenEscaneable } from "../services/movimientosService"

type OcrScannerZoneProps = {
  scanning: boolean
  info: string | null
  error: string | null
  /** Ejecuta el escaneo con el archivo elegido. */
  onEscanear: (archivo: File) => void
  onDescartarMensaje: () => void
  /** Indica si el OCR ya rellenó campos (para el banner de confirmación). */
  aplicado: boolean
}

/**
 * Zona de carga del documento para escaneo OCR.
 * Acepta drag & drop, selección por input o pegar desde el portapapeles.
 * Solo admite imágenes JPG/PNG/WebP (tesseract.js rechaza PDF con
 * `400 ARCHIVO_INVALIDO`). Los estados de info (404 motor OCR no disponible) y
 * error se muestran como Alert amigables.
 */
export function OcrScannerZone({
  scanning,
  info,
  error,
  onEscanear,
  onDescartarMensaje,
  aplicado,
}: OcrScannerZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const procesarArchivo = (archivo: File | undefined | null) => {
    if (!archivo) return
    if (!esImagenEscaneable(archivo)) {
      setErrorLocal(
        "Formato no soportado. Sube una imagen JPG, PNG o WebP (el PDF no es válido para el OCR).",
      )
      setArchivoNombre(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setErrorLocal(null)
    setArchivoNombre(archivo.name)
    onEscanear(archivo)
  }

  const mensajeError = errorLocal ?? error

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setArrastrando(false)
    const archivo = event.dataTransfer.files?.[0]
    procesarArchivo(archivo)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <ScanLine size={16} className="text-emerald-600" /> Escanear documento (OCR)
        </h3>
        {aplicado && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Aplicado
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        onClick={() => !scanning && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !scanning) inputRef.current?.click()
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          arrastrando
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/40",
          scanning && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_OCR}
          className="hidden"
          onChange={(e) => procesarArchivo(e.target.files?.[0])}
        />
        <div className="rounded-full bg-white p-3 shadow-sm">
          {scanning ? (
            <Loader2 size={22} className="animate-spin text-emerald-600" />
          ) : (
            <Camera size={22} className="text-emerald-600" />
          )}
        </div>
        <p className="text-sm font-bold text-slate-800">
          {scanning ? "Procesando documento..." : "Arrastra la factura o recibo aquí"}
        </p>
        <p className="max-w-xs text-xs text-slate-400">
          o haz clic para seleccionar una imagen (JPG, PNG o WebP). El sistema
          intentará extraer proveedor, fecha e ítems automáticamente.
        </p>
        {archivoNombre && !scanning && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
            <FileText size={10} /> {archivoNombre}
          </span>
        )}
      </div>

      {scanning && (
        <p className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <Loader2 size={12} className="animate-spin" /> Escaneando, esto puede tardar unos segundos...
        </p>
      )}

      {info && (
        <Alert variant="info">
          <Info size={18} />
          <div className="flex-1">
            <AlertDescription>{info}</AlertDescription>
            <button
              type="button"
              onClick={onDescartarMensaje}
              className="mt-1 text-[11px] font-bold text-blue-700 underline-offset-2 hover:underline"
            >
              Entendido
            </button>
          </div>
          <button
            type="button"
            onClick={onDescartarMensaje}
            className="rounded-full p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </Alert>
      )}

      {mensajeError && (
        <Alert variant="warning">
          <TriangleAlert size={18} />
          <div className="flex-1">
            <AlertDescription>{mensajeError}</AlertDescription>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorLocal(null)
              onDescartarMensaje()
            }}
            className="rounded-full p-1 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </Alert>
      )}
    </div>
  )
}
