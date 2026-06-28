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

  if (role !== "staff" && role !== "senior") {
    return [];
  }

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
          seniorRefId: true,
          senior: {
            select: {
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
          staffs: {
            where: {
              activo: true,
              staffRefId: empleadoId,
            },
            select: {
              id: true,
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
  const clientes = await getClientesOptionsParaEmpleado(params.empleadoId);

  return clientes.find((cliente) => cliente.id === params.clienteId) ?? null;
}
