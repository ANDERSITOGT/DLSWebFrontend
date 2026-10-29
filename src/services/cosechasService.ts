import { apiFetch } from "./api";

export type Cosecha = {
  id: string;
  fecha: string | null;
  libras_campo: number;
  libras_rechazo: number;
  libras_vendidas: number;
  numero_boleta?: string | null;
  estado?: string | null;
  lote?: { id: string; codigo: string; finca?: { nombre: string } | null } | null;
  empacadora?: { id: string; nombre: string } | null;
  boleta_cosecha?: BoletaCosecha[] | null;
  boletas?: BoletaCosecha[] | null;
  observaciones?: string | null;
};

export type BoletaCosecha = {
  numero_boleta?: string | null;
  empacadora?: { nombre: string } | null;
};

export type CosechaPayload = {
  loteId: string;
  empacadoraId: string;
  fecha: string;
  libras_campo: number;
  libras_rechazo: number;
  libras_vendidas: number;
  numero_boleta: string;
  observaciones: string;
};

export type CatalogoOption = { id: string; nombre?: string; codigo?: string; variedad?: string | null; finca?: { nombre: string } | null };

async function readJson(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }
  return response.json();
}

function extractCosechas(data: unknown): Cosecha[] {
  if (Array.isArray(data)) return data.filter((item): item is Cosecha => item !== null && typeof item === "object");
  if (!data || typeof data !== "object") return [];

  const response = data as { cosechas?: unknown; data?: unknown };
  if (Array.isArray(response.cosechas)) {
    return response.cosechas.filter((item): item is Cosecha => item !== null && typeof item === "object");
  }
  if (Array.isArray(response.data)) {
    return response.data.filter((item): item is Cosecha => item !== null && typeof item === "object");
  }
  return [];
}

export const cosechasService = {
  async getAll(): Promise<Cosecha[]> {
    const data = await readJson(await apiFetch("/api/cosechas"));
    return extractCosechas(data);
  },

  async crearCosecha(payload: CosechaPayload): Promise<Cosecha> {
    const cosechaPayload: CosechaPayload = {
      loteId: payload.loteId,
      empacadoraId: payload.empacadoraId,
      fecha: payload.fecha,
      libras_campo: payload.libras_campo,
      libras_rechazo: payload.libras_rechazo,
      libras_vendidas: payload.libras_vendidas,
      numero_boleta: payload.numero_boleta,
      observaciones: payload.observaciones,
    };

    return readJson(await apiFetch("/api/cosechas", {
      method: "POST",
      body: JSON.stringify(cosechaPayload),
    }));
  },

  async getLotes(): Promise<CatalogoOption[]> {
    // Este catálogo es el endpoint autenticado usado por el backend para lotes.
    return readJson(await apiFetch("/api/lotes/catalogo"));
  },

  async getEmpacadoras(): Promise<CatalogoOption[]> {
    return readJson(await apiFetch("/api/cosechas/empacadoras"));
  },

  async getCultivos(): Promise<CatalogoOption[]> {
    return readJson(await apiFetch("/api/cosechas/cultivos"));
  },
};
