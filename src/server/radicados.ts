import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

/**
 * Límite defensivo para la vista de formatos de radicado por cliente.
 *
 * Si un cliente acumula muchos registros, la evolución correcta será paginación
 * y filtros por año/tipo, no cargar indefinidamente.
 */
const MAX_RADICADOS_POR_CLIENTE = 300;

export async function getRadicadosParaClienteEmpleado(params: {
  empleadoId: string;
  clienteId: string;
}) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  return prisma.radicado.findMany({
    where: {
      empresaRefId: params.clienteId,
      empresa: visibilityWhere,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_RADICADOS_POR_CLIENTE,
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
