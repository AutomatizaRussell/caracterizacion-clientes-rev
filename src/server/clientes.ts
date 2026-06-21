import { prisma } from "@/lib/prisma";

export type ClienteOptionParaSolicitud = {
  id: string;
  razonSocial: string;
  nit: string;
};

/**
 * Límite defensivo para combos/listas de selección.
 *
 * No es una restricción funcional arbitraria: evita que una vista de selección
 * cargue miles de registros si la base crece. Si en el futuro se supera este
 * volumen, la solución correcta será búsqueda server-side/paginada, no cargar
 * todo el universo de clientes.
 */
const MAX_CLIENTES_OPTIONS = 500;

export async function getClientesOptionsParaEmpleado(
  empleadoId: string,
): Promise<ClienteOptionParaSolicitud[]> {
  return prisma.refEmpresa.findMany({
    where: {
      asignaciones: {
        some: {
          empleadoRefId: empleadoId,
          activo: true,
        },
      },
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
    },
    orderBy: {
      razonSocial: "asc",
    },
    take: MAX_CLIENTES_OPTIONS,
  });
}

export async function getClienteOptionParaEmpleado(params: {
  clienteId: string;
  empleadoId: string;
}): Promise<ClienteOptionParaSolicitud | null> {
  return prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      asignaciones: {
        some: {
          empleadoRefId: params.empleadoId,
          activo: true,
        },
      },
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
    },
  });
}