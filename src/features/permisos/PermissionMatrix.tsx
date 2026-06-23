"use client";

import { DEFAULT_PERMISSION_MATRIX } from "./permission-matrix.data";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";

export function PermissionMatrix() {
  return (
    <PermissionMatrixEditor
      storageKey="revisoria.permissionMatrix.full.v1"
      exportFileName="matriz-roles-permisos.json"
      eyebrow="Administración"
      title="Matriz de roles y permisos"
      description="Administra autorizaciones y alcances de la matriz completa."
      warning="Los cambios se guardan en PostgreSQL al presionar Guardar en BD. Exportar JSON queda disponible como respaldo operativo."
      defaultMatrix={DEFAULT_PERMISSION_MATRIX}
      persistenceMode="server"
      matrixMode="full"
    />
  );
}
