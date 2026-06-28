import { prisma } from "@/lib/prisma";

export type EmpleadoSesion = {
  id: string;
  nombreCompleto: string;
  correoCorporativo: string;
  rolAplicacion: string;
  cargoNombre: string | null;
};

export type ClienteVisibleParaEmpleado = {
  id: string;
  razonSocial: string;
  nit: string;
  estado: string | null;
  radicadoCode: string | null;
};

/**
 * Límite defensivo para listados generales.
 *
 * Si el negocio supera este volumen en pantalla, la solución correcta es
 * paginación/búsqueda server-side. No se debe cargar todo indefinidamente.
 */
const MAX_CLIENTES_VISIBLES = 500;

export async function getEmpleadosParaLogin(): Promise<EmpleadoSesion[]> {
  return prisma.refEmpleado.findMany({
    where: {
      OR: [
        {
          equiposComoSocio: {
            some: {
              activo: true,
            },
          },
        },
        {
          equiposComoGerente: {
            some: {
              activo: true,
            },
          },
        },
        {
          equiposComoSenior: {
            some: {
              activo: true,
            },
          },
        },
        {
          equiposComoStaff: {
            some: {
              activo: true,
            },
          },
        },
        {
          rolAplicacion: {
            equals: "Admin",
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      nombreCompleto: "asc",
    },
    select: {
      id: true,
      nombreCompleto: true,
      correoCorporativo: true,
      rolAplicacion: true,
      cargoNombre: true,
    },
  });
}

export async function getEmpleadoById(
  id: string,
): Promise<EmpleadoSesion | null> {
  return prisma.refEmpleado.findUnique({
    where: { id },
    select: {
      id: true,
      nombreCompleto: true,
      correoCorporativo: true,
      rolAplicacion: true,
      cargoNombre: true,
    },
  });
}

export async function getEmpleadoByCorreo(
  correoCorporativo: string,
): Promise<EmpleadoSesion | null> {
  return prisma.refEmpleado.findUnique({
    where: {
      correoCorporativo,
    },
    select: {
      id: true,
      nombreCompleto: true,
      correoCorporativo: true,
      rolAplicacion: true,
      cargoNombre: true,
    },
  });
}

export async function getClientesVisiblesParaEmpleado(
  empleadoId: string,
): Promise<ClienteVisibleParaEmpleado[]> {
  return prisma.refEmpresa.findMany({
    where: {
      OR: [
        {
          equipos: {
            some: {
              socioRefId: empleadoId,
              activo: true,
            },
          },
        },
        {
          equipos: {
            some: {
              gerenteRefId: empleadoId,
              activo: true,
            },
          },
        },
        {
          equipos: {
            some: {
              seniorRefId: empleadoId,
              activo: true,
            },
          },
        },
        {
          equipos: {
            some: {
              activo: true,
              staffs: {
                some: {
                  staffRefId: empleadoId,
                  activo: true,
                },
              },
            },
          },
        },
      ],
    },
    orderBy: {
      razonSocial: "asc",
    },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      estado: true,
      radicadoCode: true,
    },
    take: MAX_CLIENTES_VISIBLES,
  });
}
