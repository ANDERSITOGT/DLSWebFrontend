import { useEffect, useState } from "react";
import { Calendar, Loader2, Save, X } from "lucide-react";
import { BuscadorSelect, type BuscadorSelectOption } from "../../../components/ui/BuscadorSelect";
import { cosechasService, type CatalogoOption, type CosechaPayload } from "../../../services/cosechasService";

type RegistroCosechaModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export function RegistroCosechaModal({ onClose, onSuccess }: RegistroCosechaModalProps) {
  const [lotes, setLotes] = useState<CatalogoOption[]>([]);
  const [empacadoras, setEmpacadoras] = useState<CatalogoOption[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CosechaPayload>({
    loteId: "", empacadoraId: "", fecha: new Date().toISOString().slice(0, 10),
    libras_campo: 0, libras_rechazo: 0, libras_vendidas: 0,
    numero_boleta: "", observaciones: "",
  });

  useEffect(() => {
    Promise.all([cosechasService.getLotes(), cosechasService.getEmpacadoras()])
      .then(([loadedLotes, loadedEmpacadoras]) => {
        setLotes(loadedLotes);
        setEmpacadoras(loadedEmpacadoras);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los catálogos."))
      .finally(() => setLoadingCatalogos(false));
  }, []);

  const loteOptions: BuscadorSelectOption[] = lotes.map((lote) => ({
    value: lote.id,
    label: lote.codigo ?? lote.nombre ?? "Lote sin código",
    description: lote.finca?.nombre,
  }));
  const empacadoraOptions: BuscadorSelectOption[] = empacadoras.map((empacadora) => ({
    value: empacadora.id,
    label: empacadora.nombre ?? "Empacadora sin nombre",
  }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.loteId || !form.empacadoraId || form.libras_campo <= 0) {
      setError("Completa lote, empacadora y las libras de campo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await cosechasService.crearCosecha(form);
      onSuccess();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo registrar la cosecha.");
    } finally {
      setGuardando(false);
    }
  };

  const update = (field: keyof CosechaPayload, value: string | number) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form onSubmit={submit} className="flex h-full w-full flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-auto sm:max-w-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between bg-slate-900 p-4 text-white sm:px-6">
          <div><h2 className="text-lg font-bold">Nueva Cosecha</h2><p className="text-xs text-slate-400">Registra la producción recolectada.</p></div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={20} /></button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {error && <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <BuscadorSelect label="Lote *" placeholder="Seleccionar lote..." value={form.loteId} options={loteOptions} loading={loadingCatalogos} onChange={(value) => update("loteId", value)} />
            <BuscadorSelect label="Empacadora *" placeholder="Seleccionar empacadora..." value={form.empacadoraId} options={empacadoraOptions} loading={loadingCatalogos} onChange={(value) => update("empacadoraId", value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha *<span className="relative mt-1 block"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="date" value={form.fecha} onChange={(e) => update("fecha", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 pl-9 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></span></label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Libras Campo (recolectadas, lb) *<input type="number" min="0.01" step="0.01" value={form.libras_campo || ""} onChange={(e) => update("libras_campo", Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">No. Boleta<input value={form.numero_boleta} onChange={(e) => update("numero_boleta", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Libras Vendidas (lb)<input type="number" min="0" step="0.01" value={form.libras_vendidas || ""} onChange={(e) => update("libras_vendidas", Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Libras Rechazo (lb)<input type="number" min="0" step="0.01" value={form.libras_rechazo || ""} onChange={(e) => update("libras_rechazo", Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></label>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Observaciones<textarea value={form.observaciones} onChange={(e) => update("observaciones", e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500" /></label>
        </div>
        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-white p-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button disabled={guardando} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60">{guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Registrar</button>
        </footer>
      </form>
    </div>
  );
}
