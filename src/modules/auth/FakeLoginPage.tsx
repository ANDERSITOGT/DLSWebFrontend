// src/modules/auth/FakeLoginPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole, useSetUserRole, type UserRole } from "../../hooks/useUserRole";
import { Card, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { cn } from "../../utils/cn";

const roles: { id: UserRole; label: string; description: string }[] = [
  {
    id: "BODEGUERO",
    label: "Bodeguero",
    description: "Gestiona existencias, movimientos y solicitudes.",
  },
  {
    id: "SOLICITANTE",
    label: "Solicitante",
    description: "Crea solicitudes y revisa su estado.",
  },
  {
    id: "ADMIN",
    label: "Administrador",
    description: "Ve indicadores globales y alertas.",
  },
];

export function FakeLoginPage() {
  const currentRole = useUserRole();
  const setRole = useSetUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setRole(selectedRole);
    navigate("/"); // Ir al inicio
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <CardTitle className="text-lg">Selecciona un rol de prueba</CardTitle>
          <CardDescription className="text-sm">
            Este login es solo para pruebas internas. Más adelante
            implementaremos el inicio de sesión real con usuarios.
          </CardDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "text-left rounded-xl border px-3 py-3 text-sm transition hover:border-sky-400 hover:bg-sky-50",
                    selectedRole === role.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {role.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Entrar con este rol
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
