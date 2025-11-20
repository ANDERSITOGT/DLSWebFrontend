// src/hooks/useUserRole.ts
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "BODEGUERO" | "SOLICITANTE" | "ADMIN";

type UserRoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(
  undefined
);

type UserRoleProviderProps = {
  children: ReactNode;
};

export function UserRoleProvider({ children }: UserRoleProviderProps) {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "BODEGUERO";

    const stored = window.localStorage.getItem("userRole") as
      | UserRole
      | null;

    return stored ?? "BODEGUERO";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("userRole", role);
    }
  }, [role]);

  // 👇 OJO: aquí NO usamos JSX, solo createElement
  return React.createElement(
    UserRoleContext.Provider,
    { value: { role, setRole } },
    children
  );
}

export function useUserRole(): UserRole {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return ctx.role;
}

export function useSetUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error("useSetUserRole must be used within a UserRoleProvider");
  }
  return ctx.setRole;
}
