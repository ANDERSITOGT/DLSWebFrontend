// src/modules/inicio/InicioPage.tsx
import { useAuth } from "../../context/AuthContext"; // 👈 Usamos el contexto real
import { InicioSolicitante } from "./InicioSolicitante";
import { Dashboard } from "../dashboard/Dashboard";

export function InicioPage() {
  // Obtenemos el usuario real de la sesión
  const { user } = useAuth();

  // Leemos el rol directamente del usuario
  // (Nota: asegúrate que en tu BD el rol esté en mayúsculas: BODEGUERO, ADMIN, etc.)
  if (user?.rol === "SOLICITANTE") {
    return <InicioSolicitante />;
  }

  return <Dashboard />;
}