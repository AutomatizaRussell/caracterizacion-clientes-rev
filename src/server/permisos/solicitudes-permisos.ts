export function normalizeRole(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Permiso operativo temporal hasta que la matriz real de permisos gobierne
 * botones, vistas, server actions y funciones.
 *
 * Regla acordada:
 * - Staff/Asistente: puede crear solicitudes.
 * - Senior: puede crear solicitudes.
 * - Gerente/Socio/Admin: no crea solicitudes de información.
 */
export function canCreateInformacionSolicitud(userRole?: string | null) {
  const role = normalizeRole(userRole);

  return role === "staff" || role === "senior";
}
