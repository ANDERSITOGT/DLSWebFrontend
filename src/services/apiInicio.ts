// src/services/apiInicio.ts
export type InicioBodegueroResponse = {
  resumen: {
    pendientes: number;
    stockBajo: number;
  };
  solicitudesPorAtender: Array<{
    codigo: string;
    cliente: string;
    bodega: string;
    productos: number;
    fecha: string;
    estado: string;
  }>;
  movimientosDelDia: Array<{
    codigo: string;
    tipo: string;
    productos: number;
    fecha: string;
  }>;
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchInicioBodeguero(): Promise<InicioBodegueroResponse> {
  const res = await fetch(`${API_BASE_URL}/api/inicio/bodeguero`);

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`);
  }

  const data = (await res.json()) as InicioBodegueroResponse;
  return data;
}
