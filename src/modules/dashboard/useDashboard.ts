import { useEffect, useState } from "react";
import { fetchDashboard, type DashboardResponse } from "@/services/dashboardService";
import { ApiError } from "@/services/apiError";
import type { Modulo } from "@/context/ModuleContext";
import { useAuth } from "@/context/AuthContext";
import type { Rol } from "@/config/permissions";
import { mockDashboard } from "./mockData";

type State = {
  key: string;
  data: DashboardResponse | null;
  error: ApiError | null;
};

const USE_MOCK = import.meta.env.VITE_DASHBOARD_MOCK === "true";

export function useDashboard(modulo: Modulo, dias = 7) {
  const { user } = useAuth();
  const rol = user?.rol as Rol | undefined;
  const key = `${modulo}:${dias}`;
  const [state, setState] = useState<State>({ key: "", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const request = USE_MOCK
      ? Promise.resolve(mockDashboard(modulo, dias, rol))
      : fetchDashboard(modulo, dias);

    request
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(err instanceof Error ? err.message : "Error desconocido", 0, "HTTP_ERROR");
        setState({ key, data: null, error: apiError });
      });

    return () => {
      cancelled = true;
    };
  }, [key, modulo, dias, rol]);

  const loading = state.key !== key;
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading };
}
