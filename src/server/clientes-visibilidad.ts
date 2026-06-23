import { prisma } from "@/lib/prisma";

export function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

/**
 * Filtro canónico de visibilidad de clientes para vistas internas.
 *
 * Regla actual:
 * - Admin ve todos los clientes.
 * - Roles operativos ven clientes con asignación activa.
 *
 * Este helper evita duplicar reglas entre listado de clientes, ficha 360,
 * dashboard y creación de solicitudes.
 */
export async function getClienteVisibilityWhere(empleadoId: string) {
  const empleado = await prisma.refEmpleado.findUnique({
    where: {
      id: empleadoId,
    },
    select: {
      rolAplicacion: true,
    },
  });

  if (!empleado) {
    return null;
  }

  if (isAdminRole(empleado.rolAplicacion)) {
    return {};
  }

  return {
    asignaciones: {
      some: {
        empleadoRefId: empleadoId,
        activo: true,
      },
    },
  };
}
