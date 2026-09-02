import AsyncSelect from "react-select/async";
import type { ActionMeta, SingleValue, StylesConfig } from "react-select";

export type BuscadorOption<T = unknown> = {
  label: string;
  value: string;
  data?: T;
};

interface BuscadorSelectProps<T = unknown> {
  options?: BuscadorOption<T>[];
  value: BuscadorOption<T> | null;
  onChange: (option: BuscadorOption<T> | null, actionMeta: ActionMeta<BuscadorOption<T>>) => void;
  loadOptions?: (inputValue: string) => Promise<BuscadorOption<T>[]>;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  noOptionsMessage?: string;
}

const createStyles = <T,>(): StylesConfig<BuscadorOption<T>, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderColor: state.isFocused ? "#64748b" : "#cbd5e1",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(100, 116, 139, 0.15)" : "none",
    backgroundColor: state.isFocused ? "#fff" : "#f8fafc",
    "&:hover": { borderColor: "#94a3b8" }
  }),
  menu: (base) => ({ ...base, zIndex: 30, borderRadius: 12, overflow: "hidden" }),
  option: (base, state) => ({
    ...base,
    color: "#1e293b",
    backgroundColor: state.isFocused ? "#f1f5f9" : "#fff",
    cursor: "pointer"
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  indicatorSeparator: () => ({ display: "none" })
});

export default function BuscadorSelect<T = unknown>({
  options = [],
  value,
  onChange,
  loadOptions,
  placeholder = "Seleccione...",
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  isSearchable = true,
  noOptionsMessage = "Sin resultados"
}: BuscadorSelectProps<T>) {
  const load = loadOptions ?? (async (inputValue: string) => {
    const query = inputValue.trim().toLocaleLowerCase();
    return query
      ? options.filter((option) => option.label.toLocaleLowerCase().includes(query))
      : options;
  });

  return (
    <AsyncSelect<BuscadorOption<T>, false>
      cacheOptions
      defaultOptions={options.length > 0 ? options : true}
      value={value}
      options={options}
      loadOptions={load}
      onChange={(option: SingleValue<BuscadorOption<T>>, actionMeta) => onChange(option, actionMeta)}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      isSearchable={isSearchable}
      noOptionsMessage={() => noOptionsMessage}
      loadingMessage={() => "Buscando..."}
      styles={createStyles<T>()}
    />
  );
}