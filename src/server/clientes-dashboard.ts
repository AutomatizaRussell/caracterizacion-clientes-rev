import { prisma } from "@/lib/prisma";

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

/**
 * Construye el filtro de visibilidad de clientes para vistas internas.
 *
 * Regla actual:
 * - Admin ve todos los clientes registrados.
 * - Roles operativos ven únicamente clientes con asignación activa.
 *
 * Esta regla pertenece a vistas generales de cliente, no al servicio de
 * caracterización. La caracterización solo debe resolver formularios, campos
 * y respuestas.
 */
async function getClienteVisibilityWhere(empleadoId: string) {
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

export async function getClientesConAvanceParaEmpleado(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  return prisma.refEmpresa.findMany({
    where: visibilityWhere,
    orderBy: {
      razonSocial: "asc",
    },
    select: {
      id: true,
      generalEmpresaId: true,
      razonSocial: true,
      nit: true,
      digitoVerificacion: true,
      estado: true,
      radicadoCode: true,
      formularios: {
        select: {
          id: true,
          status: true,
          answeredCount: true,
          totalCount: true,
          completionPercentage: true,
          confirmedAt: true,
          hasPostConfirmationChanges: true,
        },
        take: 1,
      },
    },
  });
}

export async function getClienteConAvanceParaEmpleado(params: {
  clienteId: string;
  empleadoId: string;
}) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return null;
  }

  return prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      ...visibilityWhere,
    },
    select: {
      id: true,
      generalEmpresaId: true,
      razonSocial: true,
      nit: true,
      digitoVerificacion: true,
      estado: true,
      radicadoCode: true,
      formularios: {
        select: {
          id: true,
          status: true,
          answeredCount: true,
          totalCount: true,
          completionPercentage: true,
          confirmedAt: true,
          hasPostConfirmationChanges: true,
        },
        take: 1,
      },
    },
  });
}
