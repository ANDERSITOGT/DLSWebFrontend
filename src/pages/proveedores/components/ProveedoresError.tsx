import { Link } from "react-router-dom"
import { RefreshCw, ShieldAlert, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ApiError } from "@/services/apiError"

type ProveedoresErrorProps = {
  error: ApiError
  onRetry: () => void
}

/**
 * Estado de error del módulo. Distingue el 403 de "sin permisos de módulo"
 * (la sesión NO se cerró gracias a apiFetch) de un error recuperable, que
 * ofrece "Reintentar".
 */
export function ProveedoresError({ error, onRetry }: ProveedoresErrorProps) {
  // `ApiError` cuenta con `isModuleForbidden`; usamos ambos criterios por robustez.
  const sinAcceso =
    error.isModuleForbidden || (error.status === 403 && error.code === "FORBIDDEN_MODULE")

  if (sinAcceso) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="rounded-full bg-rose-50 p-3 text-rose-600">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Sin acceso a este módulo</h2>
          <p className="text-sm text-slate-500">
            Tu rol no tiene permisos para ver los proveedores. Contacta a un administrador si
            crees que es un error.
          </p>
          <Button asChild variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <div className="rounded-full bg-amber-50 p-3 text-amber-600">
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">No se pudieron cargar los proveedores</h2>
        <p className="text-sm text-slate-500">{error.message || "Error de conexión con el servidor."}</p>
        <Button
          onClick={onRetry}
          size="sm"
          className="gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <RefreshCw size={15} /> Reintentar
        </Button>
      </CardContent>
    </Card>
  )
}
