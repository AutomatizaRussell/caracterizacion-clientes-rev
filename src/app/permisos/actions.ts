"use server";

import {
  getPermissionMatrixFromDb,
  savePermissionMatrixRules,
  type PermissionMatrixMode,
} from "@/server/permisos/permission-matrix.service";
import type { PermissionModule } from "@/features/permisos/permission-matrix.data";

export async function getPermissionMatrixAction(mode: PermissionMatrixMode) {
  return getPermissionMatrixFromDb(mode);
}

export async function savePermissionMatrixAction(params: {
  mode: PermissionMatrixMode;
  matrix: PermissionModule[];
}) {
  return savePermissionMatrixRules(params);
}
