export function normalizeRole(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Permiso operativo temporal hasta que la matriz real de permisos gobierne
 * botones, vistas, server actions y funciones.
 *
 * Regla actual:
 * - Staff/Asistente: puede crear solicitudes.
 * - Senior: puede crear solicitudes.
 * - Admin: puede crear solicitudes.
 * - Gerente/Socio: no crean solicitudes de información por operación normal.
 */
export function canCreateInformacionSolicitud(userRole?: string | null) {
  const role = normalizeRole(userRole);

  return role === "staff" || role === "senior" || role === "admin";
}
