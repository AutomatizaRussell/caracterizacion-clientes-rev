"use server";

import { cookies } from "next/headers";
import {
  getPermissionMatrixFromDb,
  savePermissionMatrixRules,
  type PermissionMatrixMode,
} from "@/server/permisos/permission-matrix.service";
import type { PermissionModule } from "@/features/permisos/permission-matrix.data";
import { getEmpleadoById } from "@/server/queries";

/**
 * Validación mínima de sesión para las acciones administrativas de permisos.
 *
 * Motivo:
 * - /permisos es una vista interna.
 * - La vista pública de definición de solicitudes usa acciones separadas
 *   que solo permiten mode="decision".
 */
async function requireEmpleadoAutenticado() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    throw new Error("No autenticado.");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    throw new Error("No autenticado.");
  }

  return empleado;
}

export async function getPermissionMatrixAction(mode: PermissionMatrixMode) {
  await requireEmpleadoAutenticado();

  return getPermissionMatrixFromDb(mode);
}

export async function savePermissionMatrixAction(params: {
  mode: PermissionMatrixMode;
  matrix: PermissionModule[];
}) {
  await requireEmpleadoAutenticado();

  return savePermissionMatrixRules(params);
}
