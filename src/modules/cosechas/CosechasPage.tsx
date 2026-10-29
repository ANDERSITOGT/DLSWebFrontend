import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, DollarSign, Loader2, Plus, Sprout } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { StatCard } from "../../components/ui/StatCard";
import { cosechasService, type Cosecha } from "../../services/cosechasService";
import { RegistroCosechaModal } from "./components/RegistroCosechaModal";

export function CosechasPage() {
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setCosechas(await cosechasService.getAll()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las cosechas."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString("es-GT") : "Sin fecha";
  const formatLibras = (value: number | null | undefined) => `${Number(value ?? 0).toLocaleString("es-GT")} lb`;
  const getStatus = (cosecha: Cosecha) => {
    const tieneBoletas = Boolean(cosecha.boleta_cosecha?.length || cosecha.boletas?.length);
    if (Number(cosecha.libras_vendidas) > 0) return { variant: "success" as const, label: "Liquidado" };
    if (tieneBoletas) return { variant: "warning" as const, label: "Enviado" };
    return { variant: "outline" as const, label: "En Campo" };
  };
  const { totalCosechado, totalVendido, totalRechazo } = useMemo(() => ({
    totalCosechado: cosechas.reduce((total, cosecha) => total + Number(cosecha.libras_campo || 0), 0),
    totalVendido: cosechas.reduce((total, cosecha) => total + Number(cosecha.libras_vendidas || 0), 0),
    totalRechazo: cosechas.reduce((total, cosecha) => total + Number(cosecha.libras_rechazo || 0), 0),
  }), [cosechas]);

  return (
    <div className="animate-in space-y-6 pb-20 fade-in duration-500">
      <header className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg md:flex-row md:items-center">
        <div><h1 className="flex items-center gap-3 text-3xl font-extrabold"><Sprout size={32} className="text-emerald-200" /> Cosechas</h1><p className="mt-1 text-sm text-emerald-100">Panel central de producción recolectada.</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 active:scale-95"><Plus size={18} /> Nueva Cosecha</button>
      </header>
      <section className="space-y-3">
        <SectionTitle title="Registro de Cosechas" subtitle="Consulta y seguimiento de la producción registrada." rightSlot={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{cosechas.length}</span>} />
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          <StatCard label="Total Cosechado" value={loading ? "Cargando..." : `${totalCosechado.toLocaleString()} lb`} description="Libras recolectadas" variant="green" icon={<Sprout size={20} />} />
          <StatCard label="Total Vendido" value={loading ? "Cargando..." : `${totalVendido.toLocaleString()} lb`} description="Libras vendidas" variant="blue" icon={<DollarSign size={20} />} />
          <StatCard label="Merma / Rechazo" value={loading ? "Cargando..." : `${totalRechazo.toLocaleString()} lb`} description="Libras rechazadas" variant="orange" icon={<AlertTriangle size={20} />} />
        </div>
        {loading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}
        {error && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>}
        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Lote</th><th className="px-4 py-3">Empacadora</th><th className="px-4 py-3">No. Boleta</th><th className="px-4 py-3 text-right">Libras Campo</th><th className="px-4 py-3 text-right">Libras Vendidas</th><th className="px-4 py-3 text-right">Libras Rechazo</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{cosechas?.map((cosecha) => { const status = getStatus(cosecha); return <tr key={cosecha.id} className="transition-colors hover:bg-slate-50/80"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(cosecha.fecha)}</td><td className="px-4 py-3 font-semibold text-slate-800">{cosecha.lote?.codigo ?? "Sin Lote"}</td><td className="px-4 py-3 text-slate-600">{cosecha.boleta_cosecha?.[0]?.empacadora?.nombre || cosecha.boletas?.[0]?.empacadora?.nombre || "Sin Empacadora"}</td><td className="px-4 py-3 text-slate-600">{cosecha.boleta_cosecha?.[0]?.numero_boleta || cosecha.boletas?.[0]?.numero_boleta || "—"}</td><td className="px-4 py-3 text-right font-semibold text-slate-800">{formatLibras(cosecha.libras_campo)}</td><td className="px-4 py-3 text-right text-slate-600">{formatLibras(cosecha.libras_vendidas)}</td><td className="px-4 py-3 text-right text-slate-600">{formatLibras(cosecha.libras_rechazo)}</td><td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td></tr>; })}</tbody></table></div>
            {!cosechas.length && <p className="p-10 text-center text-sm text-slate-400">Aún no hay cosechas registradas.</p>}
          </div>
        )}
      </section>
      {showModal && <RegistroCosechaModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); cargar(); }} />}
    </div>
  );
}
