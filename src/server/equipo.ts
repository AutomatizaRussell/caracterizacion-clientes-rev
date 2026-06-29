import { prisma } from '@/lib/prisma';
import { getClienteVisibilityWhere } from '@/server/clientes-visibilidad';

export async function getMapaEquipoParaEmpleado(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);
  if (!visibilityWhere) return [];

  const clientes = await prisma.refEmpresa.findMany({
    where: visibilityWhere,
    orderBy: { razonSocial: 'asc' },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      equipos: {
        where: { activo: true },
        select: {
          id: true,
          socio: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          gerente: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          senior: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          staffs: { where: { activo: true }, select: { id: true, staff: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } } } },
        },
        take: 1,
      },
    },
  });

  return clientes.map((cliente) => ({ cliente: { id: cliente.id, razonSocial: cliente.razonSocial, nit: cliente.nit }, equipo: cliente.equipos[0] ?? null })).filter((item) => item.equipo !== null);
}
