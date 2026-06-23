import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";
import { EstadoSolicitud } from "@/generated/prisma/enums";

export type ClienteSolicitudesFilter =
  | "todas"
  | "activas"
  | "pendiente-cliente"
  | "pendiente-revision"
  | "fallidas"
  | "completadas"
  | "canceladas";

const MAX_SOLICITUDES_CLIENTE = 300;

const STATUS_BY_FILTER: Record<
  Exclude<ClienteSolicitudesFilter, "todas">,
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

export function normalizeClienteSolicitudesFilter(
  value: string | null | undefined,
): ClienteSolicitudesFilter {
  const normalized = String(value ?? "").trim();

  const allowedFilters: ClienteSolicitudesFilter[] = [
    "todas",
    "activas",
    "pendiente-cliente",
    "pendiente-revision",
    "fallidas",
    "completadas",
    "canceladas",
  ];

  return allowedFilters.includes(normalized as ClienteSolicitudesFilter)
    ? (normalized as ClienteSolicitudesFilter)
    : "activas";
}

async function canEmpleadoSeeCliente(params: {
  empleadoId: string;
  clienteId: string;
}) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return false;
  }

  const cliente = await prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      ...visibilityWhere,
    },
    select: {
      id: true,
    },
  });

  return Boolean(cliente);
}

export async function getSolicitudesClienteParaEmpleado(params: {
  empleadoId: string;
  clienteId: string;
  filter: ClienteSolicitudesFilter;
}) {
  const canSeeCliente = await canEmpleadoSeeCliente({
    empleadoId: params.empleadoId,
    clienteId: params.clienteId,
  });

  if (!canSeeCliente) {
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
      empresaRefId: params.clienteId,
      ...statusWhere,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_SOLICITUDES_CLIENTE,
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
      portalUrl: true,
      n8nExecutionId: true,
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
          fileName: true,
          oneDriveUrl: true,
          status: true,
          generatedAt: true,
          storedAt: true,
        },
      },
    },
  });
}

export async function getSolicitudesClienteCounts(params: {
  empleadoId: string;
  clienteId: string;
}) {
  const canSeeCliente = await canEmpleadoSeeCliente({
    empleadoId: params.empleadoId,
    clienteId: params.clienteId,
  });

  if (!canSeeCliente) {
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

  const baseWhere = {
    empresaRefId: params.clienteId,
  };

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
      where: baseWhere,
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
        status: {
          in: STATUS_BY_FILTER.activas,
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
        status: {
          in: STATUS_BY_FILTER["pendiente-cliente"],
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
        status: {
          in: STATUS_BY_FILTER["pendiente-revision"],
        },
      },
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
        status: EstadoSolicitud.FAILED,
      },
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
        status: EstadoSolicitud.COMPLETED,
      },
    }),
    prisma.solicitud.count({
      where: {
        ...baseWhere,
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
