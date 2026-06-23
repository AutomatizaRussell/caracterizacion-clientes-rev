import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";
import { EstadoSolicitud } from "@/generated/prisma/enums";

export type SolicitudesPanelFilter =
  | "todas"
  | "activas"
  | "pendiente-cliente"
  | "pendiente-revision"
  | "fallidas"
  | "completadas"
  | "canceladas";

const MAX_SOLICITUDES_PANEL = 500;

const STATUS_BY_FILTER: Record<
  Exclude<SolicitudesPanelFilter, "todas">,
  EstadoSolicitud[]
> = {
  activas: [
    EstadoSolicitud.CREATED,
    EstadoSolicitud.DOCUMENT_GENERATED,
    EstadoSolicitud.SENT,
    EstadoSolicitud.CLIENT_OPENED,
    EstadoSolicitud.CLIENT_SUBMITTED,
    EstadoSolicitud.UNDER_REVIEW,
  ],
  "pendiente-cliente": [
    EstadoSolicitud.SENT,
    EstadoSolicitud.CLIENT_OPENED,
  ],
  "pendiente-revision": [
    EstadoSolicitud.CLIENT_SUBMITTED,
    EstadoSolicitud.UNDER_REVIEW,
  ],
  fallidas: [EstadoSolicitud.FAILED],
  completadas: [EstadoSolicitud.COMPLETED],
  canceladas: [EstadoSolicitud.CANCELLED],
};

export function normalizeSolicitudesPanelFilter(
  value: string | null | undefined,
): SolicitudesPanelFilter {
  const normalized = String(value ?? "").trim();

  const allowedFilters: SolicitudesPanelFilter[] = [
    "todas",
    "activas",
    "pendiente-cliente",
    "pendiente-revision",
    "fallidas",
    "completadas",
    "canceladas",
  ];

  return allowedFilters.includes(normalized as SolicitudesPanelFilter)
    ? (normalized as SolicitudesPanelFilter)
    : "activas";
}

export async function getSolicitudesPanelParaEmpleado(params: {
  empleadoId: string;
  filter: SolicitudesPanelFilter;
}) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  const statusWhere =
    params.filter === "todas"
      ? {}
      : {
          status: {
            in: STATUS_BY_FILTER[params.filter],
          },
        };

  return prisma.solicitud.findMany({
    where: {
      empresa: visibilityWhere,
      ...statusWhere,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_SOLICITUDES_PANEL,
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
      n8nExecutionId: true,
      portalUrl: true,
      empresa: {
        select: {
          id: true,
          razonSocial: true,
          nit: true,
        },
      },
      radicado: {
        select: {
          id: true,
          reference: true,
        },
      },
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
          oneDriveUrl: true,
          fileName: true,
          status: true,
        },
      },
    },
  });
}

export async function getSolicitudesPanelCounts(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return {
      todas: 0,
      activas: 0,
      pendienteCliente: 0,
      pendienteRevision: 0,
      fallidas: 0,
      completadas: 0,
      canceladas: 0,
    };
  }

  const [
    todas,
    activas,
    pendienteCliente,
    pendienteRevision,
    fallidas,
    completadas,
    canceladas,
  ] = await Promise.all([
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: STATUS_BY_FILTER.activas,
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: STATUS_BY_FILTER["pendiente-cliente"],
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: {
          in: STATUS_BY_FILTER["pendiente-revision"],
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: EstadoSolicitud.FAILED,
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: EstadoSolicitud.COMPLETED,
      },
    }),
    prisma.solicitud.count({
      where: {
        empresa: visibilityWhere,
        status: EstadoSolicitud.CANCELLED,
      },
    }),
  ]);

  return {
    todas,
    activas,
    pendienteCliente,
    pendienteRevision,
    fallidas,
    completadas,
    canceladas,
  };
}
