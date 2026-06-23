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
 * Roles autorizados para administrar la matriz.
 *
 * Es deliberadamente fijo para evitar un problema circular:
 * la matriz no puede depender de sí misma para autorizar quién puede editarla
 * antes de que exista una política persistida y auditada de bootstrap.
 */
const PERMISSION_MATRIX_ADMIN_ROLES = new Set(["Admin", "ADMIN"]);

async function requirePermissionMatrixAdmin() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    throw new Error("No autenticado.");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    throw new Error("No autenticado.");
  }

  const role = String(empleado.rolAplicacion ?? "");

  if (!PERMISSION_MATRIX_ADMIN_ROLES.has(role)) {
    throw new Error("No autorizado para administrar la matriz de permisos.");
  }

  return empleado;
}

export async function getPermissionMatrixAction(mode: PermissionMatrixMode) {
  await requirePermissionMatrixAdmin();

  return getPermissionMatrixFromDb(mode);
}

export async function savePermissionMatrixAction(params: {
  mode: PermissionMatrixMode;
  matrix: PermissionModule[];
}) {
  await requirePermissionMatrixAdmin();

  return savePermissionMatrixRules(params);
}
