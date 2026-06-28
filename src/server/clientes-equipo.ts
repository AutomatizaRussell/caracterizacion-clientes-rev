import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

export async function getClienteEquipoAsignadoParaEmpleado(params: {
  clienteId: string;
  empleadoId: string;
}) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
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
          id: true,
          socio: {
            select: {
              id: true,
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
          gerente: {
            select: {
              id: true,
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
          senior: {
            select: {
              id: true,
              nombreCompleto: true,
              cargoNombre: true,
              rolAplicacion: true,
            },
          },
          staffs: {
            where: {
              activo: true,
            },
            select: {
              id: true,
              staff: {
                select: {
                  id: true,
                  nombreCompleto: true,
                  cargoNombre: true,
                  rolAplicacion: true,
                },
              },
            },
            orderBy: {
              staff: {
                nombreCompleto: "asc",
              },
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

  return {
    cliente: {
      id: cliente.id,
      razonSocial: cliente.razonSocial,
      nit: cliente.nit,
    },
    equipo: cliente.equipos[0] ?? null,
  };
}
