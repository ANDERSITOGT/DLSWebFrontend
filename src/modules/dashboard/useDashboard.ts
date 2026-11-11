import { useEffect, useState } from "react";
import { fetchDashboard, type DashboardResponse } from "@/services/dashboardService";
import type { Modulo } from "@/context/ModuleContext";
import { mockDashboard } from "./mockData";

type State = {
  key: string;
  data: DashboardResponse | null;
  error: string | null;
};

const USE_MOCK = import.meta.env.VITE_DASHBOARD_MOCK === "true";

export function useDashboard(modulo: Modulo, dias = 7) {
  const key = `${modulo}:${dias}`;
  const [state, setState] = useState<State>({ key: "", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const request = USE_MOCK ? Promise.resolve(mockDashboard(modulo, dias)) : fetchDashboard(modulo, dias);

    request
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ key, data: null, error: err instanceof Error ? err.message : "Error desconocido" });
      });

    return () => {
      cancelled = true;
    };
  }, [key, modulo, dias]);

  const loading = state.key !== key;
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading };
}
