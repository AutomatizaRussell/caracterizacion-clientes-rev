import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/server/permisos/solicitudes-permisos";

export type SolicitudResponsibleResolved = {
  empleadoId: string;
  name: string;
  role: string;
  firm: string;
};

function toResponsible(empleado: {
  id: string;
  nombreCompleto: string;
  cargoNombre: string | null;
  rolAplicacion: string;
}): SolicitudResponsibleResolved {
  return {
    empleadoId: empleado.id,
    name: empleado.nombreCompleto,
    role: empleado.cargoNombre ?? empleado.rolAplicacion,
    firm: "Russell Bedford",
  };
}

/**
 * Regla acordada:
 * - Staff: responsable = Senior asignado al cliente según equipo activo.
 * - Senior: responsable = el mismo Senior.
 * - Gerente/Socio/Admin: no permitido para crear solicitudes.
 */
export async function resolveSolicitudResponsibleForCreator(params: {
  empleadoId: string;
  empresaRefId: string;
}): Promise<SolicitudResponsibleResolved> {
  const empleado = await prisma.refEmpleado.findUnique({
    where: {
      id: params.empleadoId,
    },
    select: {
      id: true,
      nombreCompleto: true,
      cargoNombre: true,
      rolAplicacion: true,
    },
  });

  if (!empleado) {
    throw new Error("Empleado no encontrado.");
  }

  const role = normalizeRole(empleado.rolAplicacion);

  if (role === "staff") {
    const equipo = await prisma.refClienteEquipo.findFirst({
      where: {
        empresaRefId: params.empresaRefId,
        activo: true,
        staffs: {
          some: {
            staffRefId: params.empleadoId,
            activo: true,
          },
        },
      },
      select: {
        senior: {
          select: {
            id: true,
            nombreCompleto: true,
            cargoNombre: true,
            rolAplicacion: true,
          },
        },
      },
    });

    if (!equipo) {
      throw new Error(
        "El usuario no tiene asignación activa como asistente para este cliente.",
      );
    }

    return toResponsible(equipo.senior);
  }

  if (role === "senior") {
    const equipo = await prisma.refClienteEquipo.findFirst({
      where: {
        empresaRefId: params.empresaRefId,
        seniorRefId: params.empleadoId,
        activo: true,
      },
      select: {
        id: true,
      },
    });

    if (!equipo) {
      throw new Error(
        "El usuario no tiene asignación activa como senior para este cliente.",
      );
    }

    return toResponsible(empleado);
  }

  throw new Error(
    "El rol actual no tiene permiso para crear solicitudes de información.",
  );
}
