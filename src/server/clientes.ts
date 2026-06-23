import { prisma } from "@/lib/prisma";
import { getClienteVisibilityWhere } from "@/server/clientes-visibilidad";

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
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return [];
  }

  return prisma.refEmpresa.findMany({
    where: visibilityWhere,
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
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);

  if (!visibilityWhere) {
    return null;
  }

  return prisma.refEmpresa.findFirst({
    where: {
      id: params.clienteId,
      ...visibilityWhere,
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
    },
  });
}
