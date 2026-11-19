import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { allowedModules, canAccessModule } from "@/config/permissions";

export type Modulo = "BODEGA" | "COSECHAS";

const STORAGE_KEY = "dls_modulo";

type ModuleContextValue = {
  modulo: Modulo;
  setModulo: (modulo: Modulo) => void;
};

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stored, setStored] = useState<Modulo>(() =>
    localStorage.getItem(STORAGE_KEY) === "COSECHAS" ? "COSECHAS" : "BODEGA",
  );

  const setModulo = useCallback((modulo: Modulo) => {
    localStorage.setItem(STORAGE_KEY, modulo);
    setStored(modulo);
  }, []);

  // ADMIN elige el módulo entre los permitidos; el resto queda anclado a su único módulo.
  // La matriz vive en config/permissions.ts (fuente única de verdad).
  const permitted = allowedModules(user?.rol);
  const modulo: Modulo =
    permitted.length === 1
      ? permitted[0]
      : canAccessModule(user?.rol, stored)
        ? stored
        : (permitted[0] ?? "BODEGA");
  const value = useMemo(() => ({ modulo, setModulo }), [modulo, setModulo]);

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModulo() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModulo debe usarse dentro de ModuleProvider");
  return ctx;
}
