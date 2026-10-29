import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "../../utils/cn";

export type BuscadorSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type BuscadorSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  options: BuscadorSelectOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  renderOption?: (option: BuscadorSelectOption) => ReactNode;
};

export function BuscadorSelect({
  label,
  placeholder = "Seleccionar...",
  value,
  options,
  onChange,
  loading = false,
  disabled = false,
  emptyMessage = "No hay resultados",
  className,
  renderOption,
}: BuscadorSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) => {
    const text = `${option.label} ${option.description ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 p-3 text-left text-sm outline-none transition-all hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Cargando...
              </div>
            ) : filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-emerald-50"
                >
                  {renderOption ? renderOption(option) : (
                    <span>
                      <span className="block text-sm font-medium text-slate-700">{option.label}</span>
                      {option.description && <span className="block text-xs text-slate-400">{option.description}</span>}
                    </span>
                  )}
                  {option.value === value && <Check size={16} className="text-emerald-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
