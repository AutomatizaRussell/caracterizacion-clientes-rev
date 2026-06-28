import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/server/permisos/solicitudes-permisos";

export function isAdminRole(userRole?: string | null) {
  return normalizeRole(userRole) === "admin";
}

/**
 * Filtro canónico de visibilidad de clientes.
 *
 * Fuente actual:
 * - core.ref_cliente_equipo
 * - core.ref_cliente_equipo_staff
 *
 * Reglas:
 * - Admin ve todo.
 * - Socio ve clientes donde es socio activo.
 * - Gerente ve clientes donde es gerente activo.
 * - Senior ve clientes donde es senior activo.
 * - Staff ve clientes donde aparece como asistente activo.
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

  const role = normalizeRole(empleado.rolAplicacion);

  if (isAdminRole(empleado.rolAplicacion)) {
    return {};
  }

  if (role === "socio") {
    return {
      equipos: {
        some: {
          socioRefId: empleadoId,
          activo: true,
        },
      },
    };
  }

  if (role === "gerente") {
    return {
      equipos: {
        some: {
          gerenteRefId: empleadoId,
          activo: true,
        },
      },
    };
  }

  if (role === "senior") {
    return {
      equipos: {
        some: {
          seniorRefId: empleadoId,
          activo: true,
        },
      },
    };
  }

  if (role === "staff") {
    return {
      equipos: {
        some: {
          activo: true,
          staffs: {
            some: {
              staffRefId: empleadoId,
              activo: true,
            },
          },
        },
      },
    };
  }

  return {
    id: "__NO_VISIBLE_CLIENTS__",
  };
}
