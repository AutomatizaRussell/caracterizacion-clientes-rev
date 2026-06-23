import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

/**
 * Límite defensivo para el listado inicial de formatos/radicados.
 *
 * Si esta vista crece, la solución correcta será búsqueda server-side,
 * filtros y paginación, no cargar todo sin límite.
 */
const MAX_RADICADOS = 300;

export async function getRadicadosParaEmpleado(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  return prisma.radicado.findMany({
    where: {
      empresa: visibilityWhere,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_RADICADOS,
    select: {
      id: true,
      reference: true,
      prefix: true,
      consecutive: true,
      year: true,
      companyCode: true,
      createdAt: true,
      empresa: {
        select: {
          id: true,
          razonSocial: true,
          nit: true,
        },
      },
      solicitud: {
        select: {
          id: true,
          requestTypeName: true,
          subject: true,
          generationDate: true,
          documentos: {
            where: {
              documentType: "PDF",
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              fileName: true,
              oneDriveUrl: true,
              generatedAt: true,
              storedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}
