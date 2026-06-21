"use client";

import { DEFAULT_PERMISSION_MATRIX } from "./permission-matrix.data";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";

export function PermissionMatrixDemo() {
  return (
    <PermissionMatrixEditor
      storageKey="revisoria.permissionMatrix.demo.v4"
      exportFileName="matriz-roles-permisos-demo.json"
      eyebrow="Vista administrativa"
      title="Matriz de roles y permisos"
      description="Administra autorizaciones y alcances de la matriz completa. Los cambios se guardan en PostgreSQL al presionar Guardar en BD."
      warning="Esta versión lee y guarda contra base de datos. Exportar JSON queda disponible como respaldo operativo."
      defaultMatrix={DEFAULT_PERMISSION_MATRIX}
      persistenceMode="server"
      matrixMode="full"
    />
  );
}
