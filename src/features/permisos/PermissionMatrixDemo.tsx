"use client";

import { DEFAULT_PERMISSION_MATRIX } from "./permission-matrix.data";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";

export function PermissionMatrixDemo() {
  return (
    <PermissionMatrixEditor
      storageKey="revisoria.permissionMatrix.demo.v4"
      exportFileName="matriz-roles-permisos-demo.json"
      eyebrow="Vista demostrativa"
      title="Matriz de roles y permisos"
      description="Ajusta autorizaciones y alcances durante la reunión. Los cambios se guardan localmente en este navegador; todavía no afectan permisos reales ni base de datos."
      warning="Esta versión guarda cambios en localStorage. Exporta el JSON al terminar la reunión para no perder decisiones."
      defaultMatrix={DEFAULT_PERMISSION_MATRIX}
    />
  );
}
