// src/config/permissions.ts

import type { Modulo } from "@/context/ModuleContext";

export type Rol = "ADMIN" | "BODEGUERO" | "SOLICITANTE" | "VISOR" | "COSECHA";

/** Matriz de acceso a módulos por rol (espeja el backend, docs/DASHBOARD_FRONTEND.md §2). */
export const MODULE_ACCESS: Record<Rol, Modulo[]> = {
  ADMIN: ["BODEGA", "COSECHAS"],
  BODEGUERO: ["BODEGA"],
  COSECHA: ["COSECHAS"],
  SOLICITANTE: ["BODEGA"],
  VISOR: ["BODEGA"],
};

/** Roles cuyo dashboard de BODEGA es "modo simple" (sin datos críticos). */
export const SIMPLE_MODE_ROLES: Rol[] = ["SOLICITANTE", "VISOR"];

/** ¿El rol puede ver el módulo indicado? */
export function canAccessModule(rol: Rol | undefined, modulo: Modulo): boolean {
  if (!rol) return false;
  return (MODULE_ACCESS[rol] ?? []).includes(modulo);
}

/** Módulos permitidos para un rol (para el selector). */
export function allowedModules(rol: Rol | undefined): Modulo[] {
  if (!rol) return [];
  return MODULE_ACCESS[rol] ?? [];
}

/** ¿El rol usa el dashboard en modo simple? */
export function isSimpleMode(rol: Rol | undefined): boolean {
  return !!rol && SIMPLE_MODE_ROLES.includes(rol);
}

/** Roles que pueden crear solicitudes (fuente única para CTA y rutas). */
export const SOLICITUD_CREATE_ROLES: Rol[] = ["SOLICITANTE", "ADMIN", "BODEGUERO"];

/** ¿El rol puede crear solicitudes (CTA "Nueva solicitud")? */
export function canCreateSolicitud(rol: Rol | undefined): boolean {
  return !!rol && SOLICITUD_CREATE_ROLES.includes(rol);
}

/** Roles que pueden gestionar (crear/editar) proveedores y sus contactos. */
export const PROVEEDORES_MANAGE_ROLES: Rol[] = ["ADMIN", "BODEGUERO"];

/** ¿El rol puede crear/editar proveedores y sus contactos? */
export function canManageProveedores(rol: Rol | undefined): boolean {
  return !!rol && PROVEEDORES_MANAGE_ROLES.includes(rol);
}

