// src/modules/inicio/InicioPage.tsx
import { useUserRole } from "../../hooks/useUserRole";
import { InicioBodeguero } from "./InicioBodeguero";
import { InicioSolicitante } from "./InicioSolicitante";
import { InicioAdmin } from "./InicioAdmin";

export function InicioPage() {
  const role = useUserRole();

  if (role === "BODEGUERO") {
    return <InicioBodeguero />;
  }

  if (role === "SOLICITANTE") {
    return <InicioSolicitante />;
  }

  // ADMIN
  return <InicioAdmin />;
}
