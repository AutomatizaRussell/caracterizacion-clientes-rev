import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";
import { EstadoSolicitud } from "@/generated/prisma/enums";

const MAX_ULTIMAS_SOLICITUDES = 6;

export async function getDashboardOperativo(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return {
      totalClientes: 0,
      solicitudesActivas: 0,
      pendientesCliente: 0,
      pendientesRevision: 0,
      solicitudesFallidas: 0,
      ultimasSolicitudes: [],
    };
  }

  const [
    totalClientes,
    solicitudesActivas,
    pendientesCliente,
    pendientesRevision,
    solicitudesFallidas,
    ultimasSolicitudes,
  ] = await Promise.all([
    prisma.refEmpresa.count({
      where: visibilityWhere,
    }),

    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: [
            EstadoSolicitud.CREATED,
            EstadoSolicitud.DOCUMENT_GENERATED,
            EstadoSolicitud.SENT,
            EstadoSolicitud.CLIENT_OPENED,
            EstadoSolicitud.CLIENT_SUBMITTED,
            EstadoSolicitud.UNDER_REVIEW,
          ],
        },
      },
    }),

    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: [EstadoSolicitud.SENT, EstadoSolicitud.CLIENT_OPENED],
        },
      },
    }),

    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: [EstadoSolicitud.CLIENT_SUBMITTED, EstadoSolicitud.UNDER_REVIEW],
        },
      },
    }),

    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: EstadoSolicitud.FAILED,
      },
    }),

    prisma.solicitud.findMany({
      where: {
        empresa: visibilityWhere,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_ULTIMAS_SOLICITUDES,
      select: {
        id: true,
        requestTypeName: true,
        subject: true,
        status: true,
        generationDate: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
          },
        },
        radicado: {
          select: {
            reference: true,
          },
        },
      },
    }),
  ]);

  return {
    totalClientes,
    solicitudesActivas,
    pendientesCliente,
    pendientesRevision,
    solicitudesFallidas,
    ultimasSolicitudes,
  };
}
