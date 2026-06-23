import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

const MAX_SOLICITUDES_DASHBOARD = 500;
const MAX_ULTIMAS_SOLICITUDES = 6;

const ACTIVE_STATUSES = [
  "CREATED",
  "DOCUMENT_GENERATED",
  "SENT",
  "CLIENT_OPENED",
  "CLIENT_SUBMITTED",
  "UNDER_REVIEW",
] as const;

const PENDING_CLIENT_OR_REVIEW_STATUSES = [
  "SENT",
  "CLIENT_OPENED",
  "CLIENT_SUBMITTED",
  "UNDER_REVIEW",
] as const;

export async function getDashboardOperativo(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return {
      totalClientes: 0,
      totalSolicitudes: 0,
      solicitudesActivas: 0,
      solicitudesPendientes: 0,
      solicitudesFallidas: 0,
      ultimasSolicitudes: [],
    };
  }

  const [totalClientes, solicitudes] = await Promise.all([
    prisma.refEmpresa.count({
      where: visibilityWhere,
    }),

    prisma.solicitud.findMany({
      where: {
        empresa: visibilityWhere,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_SOLICITUDES_DASHBOARD,
      select: {
        id: true,
        requestTypeName: true,
        subject: true,
        status: true,
        generationDate: true,
        createdAt: true,
        sentAt: true,
        completedAt: true,
        cancelledAt: true,
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

  const solicitudesActivas = solicitudes.filter((solicitud) =>
    ACTIVE_STATUSES.includes(solicitud.status as (typeof ACTIVE_STATUSES)[number]),
  ).length;

  const solicitudesPendientes = solicitudes.filter((solicitud) =>
    PENDING_CLIENT_OR_REVIEW_STATUSES.includes(
      solicitud.status as (typeof PENDING_CLIENT_OR_REVIEW_STATUSES)[number],
    ),
  ).length;

  const solicitudesFallidas = solicitudes.filter(
    (solicitud) => solicitud.status === "FAILED",
  ).length;

  return {
    totalClientes,
    totalSolicitudes: solicitudes.length,
    solicitudesActivas,
    solicitudesPendientes,
    solicitudesFallidas,
    ultimasSolicitudes: solicitudes.slice(0, MAX_ULTIMAS_SOLICITUDES),
  };
}
