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
 * Regla actual:
 * - Staff: responsable = Senior asignado al cliente.
 * - Senior: responsable = el mismo Senior.
 * - Admin: responsable = Senior asignado al cliente.
 * - Gerente/Socio: no permitido para crear solicitudes por ahora.
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

  if (role === "admin") {
    const equipo = await prisma.refClienteEquipo.findFirst({
      where: {
        empresaRefId: params.empresaRefId,
        activo: true,
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
      throw new Error("El cliente no tiene senior activo asignado.");
    }

    return toResponsible(equipo.senior);
  }

  throw new Error(
    "El rol actual no tiene permiso para crear solicitudes de información.",
  );
}
