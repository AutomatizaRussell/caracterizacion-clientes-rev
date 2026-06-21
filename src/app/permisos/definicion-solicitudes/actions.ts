"use server";

import {
  getPermissionMatrixFromDb,
  savePermissionMatrixRules,
} from "@/server/permisos/permission-matrix.service";
import type { PermissionModule } from "@/features/permisos/permission-matrix.data";

/**
 * Acciones públicas para diligenciamiento puntual.
 *
 * Restricción crítica:
 * - No aceptan `mode` desde el cliente.
 * - Siempre operan sobre mode="decision".
 * - El servicio valida que solo se guarden acciones de la matriz reducida.
 *
 * Riesgo aceptado:
 * - Al no usar login ni token, cualquier persona con la URL puede guardar
 *   respuestas de esta matriz reducida.
 */
export async function getDecisionPermissionMatrixPublicAction() {
  return getPermissionMatrixFromDb("decision");
}

export async function saveDecisionPermissionMatrixPublicAction(matrix: PermissionModule[]) {
  return savePermissionMatrixRules({
    mode: "decision",
    matrix,
  });
}
