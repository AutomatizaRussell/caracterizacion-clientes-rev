import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";
import { normalizeRole } from "@/server/permisos/solicitudes-permisos";

export type ClienteOptionParaSolicitud = {
  id: string;
  razonSocial: string;
  nit: string;
  defaultResponsible: {
    name: string;
    role: string;
    firm: string;
  } | null;
};

const MAX_CLIENTES_OPTIONS = 500;

function toResponsible(empleado: {
  nombreCompleto: string;
  cargoNombre: string | null;
  rolAplicacion: string;
}) {
  return {
    name: empleado.nombreCompleto,
    role: empleado.cargoNombre ?? empleado.rolAplicacion,
    firm: "Russell Bedford",
  };
}

export async function getClientesOptionsParaEmpleado(
  empleadoId: string,
): Promise<ClienteOptionParaSolicitud[]> {
  const empleado = await prisma.refEmpleado.findUnique({
    where: {
      id: empleadoId,
    },
    select: {
      id: true,
      nombreCompleto: true,
      cargoNombre: true,
      rolAplicacion: true,
    },
  });

  if (!empleado) {
    return [];
  }

  const role = normalizeRole(empleado.rolAplicacion);
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  const clientes = await prisma.refEmpresa.findMany({
    where: visibilityWhere,
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      equipos: {
        where: {
          activo: true,
        },
        select: {
          senior: {
            select: {
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
        },
        take: 1,
      },
    },
    orderBy: {
      razonSocial: "asc",
    },
    take: MAX_CLIENTES_OPTIONS,
  });

  return clientes.map((cliente) => {
    const equipo = cliente.equipos[0] ?? null;

    if (role === "senior") {
      return {
        id: cliente.id,
        razonSocial: cliente.razonSocial,
        nit: cliente.nit,
        defaultResponsible: toResponsible(empleado),
      };
    }

    return {
      id: cliente.id,
      razonSocial: cliente.razonSocial,
      nit: cliente.nit,
      defaultResponsible: equipo ? toResponsible(equipo.senior) : null,
    };
  });
}

export async function getClienteOptionParaEmpleado(params: {
  clienteId: string;
  empleadoId: string;
}): Promise<ClienteOptionParaSolicitud | null> {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return null;
  }

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
    return null;
  }

  const cliente = await prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      ...visibilityWhere,
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      equipos: {
        where: {
          activo: true,
        },
        select: {
          senior: {
            select: {
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!cliente) {
    return null;
  }

  const role = normalizeRole(empleado.rolAplicacion);
  const equipo = cliente.equipos[0] ?? null;

  return {
    id: cliente.id,
    razonSocial: cliente.razonSocial,
    nit: cliente.nit,
    defaultResponsible:
      role === "senior"
        ? toResponsible(empleado)
        : equipo
          ? toResponsible(equipo.senior)
          : null,
  };
}
