// src/modules/inicio/InicioPage.tsx
//
// El home es único para todos los roles: cada rol consume /api/dashboard y el
// backend recorta el contenido (modo completo vs simple). Ver docs/DASHBOARD_FRONTEND.md.
import { Dashboard } from "../dashboard/Dashboard";

export function InicioPage() {
  return <Dashboard />;
}
