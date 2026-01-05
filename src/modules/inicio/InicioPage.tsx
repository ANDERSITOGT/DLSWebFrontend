// src/modules/inicio/InicioPage.tsx
import { useAuth } from "../../context/AuthContext"; // 👈 Usamos el contexto real
import { InicioBodeguero } from "./InicioBodeguero";
import { InicioSolicitante } from "./InicioSolicitante";
import { InicioAdmin } from "./InicioAdmin";

export function InicioPage() {
  // Obtenemos el usuario real de la sesión
  const { user } = useAuth();

  // Leemos el rol directamente del usuario
  // (Nota: asegúrate que en tu BD el rol esté en mayúsculas: BODEGUERO, ADMIN, etc.)
  if (user?.rol === "BODEGUERO") {
    return <InicioBodeguero />;
  }

  if (user?.rol === "SOLICITANTE") {
    return <InicioSolicitante />;
  }

  // Por defecto, o si es ADMIN, mostramos el dashboard Admin
  return <InicioAdmin />;
}