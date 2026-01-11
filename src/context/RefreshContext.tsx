import { createContext, useContext, useState, type ReactNode } from "react";

type RefreshContextType = {
  refreshSolicitudes: number;
  triggerRefreshSolicitudes: () => void;
};

const RefreshContext = createContext<RefreshContextType>({
  refreshSolicitudes: 0,
  triggerRefreshSolicitudes: () => {},
});

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshSolicitudes, setRefreshSolicitudes] = useState(0);

  const triggerRefreshSolicitudes = () => {
    // Al cambiar este número, obligamos a la página a recargar
    setRefreshSolicitudes((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshSolicitudes, triggerRefreshSolicitudes }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => useContext(RefreshContext);