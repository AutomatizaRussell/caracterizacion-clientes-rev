import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

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
