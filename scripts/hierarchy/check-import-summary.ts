import { prisma } from "../../src/lib/prisma";

async function main() {
  const summary = {
    clientes: await prisma.refEmpresa.count(),
    empleados: await prisma.refEmpleado.count(),
    admins: await prisma.refEmpleado.count({
      where: {
        rolAplicacion: {
          equals: "Admin",
          mode: "insensitive",
        },
      },
    }),
    equipos: await prisma.refClienteEquipo.count(),
    asistentes: await prisma.refClienteEquipoStaff.count(),
    asignaciones: await prisma.refAsignacion.count(),
    clientesSinEquipo: await prisma.refEmpresa.count({
      where: {
        equipos: {
          none: {
            activo: true,
          },
        },
      },
    }),
    equiposSinAsistentes: await prisma.refClienteEquipo.count({
      where: {
        activo: true,
        staffs: {
          none: {
            activo: true,
          },
        },
      },
    }),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (summary.clientes !== 173) {
    throw new Error(`Conteo inesperado de clientes: ${summary.clientes}. Esperado: 173.`);
  }

  if (summary.empleados !== 61) {
    throw new Error(`Conteo inesperado de empleados: ${summary.empleados}. Esperado: 61.`);
  }

  if (summary.admins !== 1) {
    throw new Error(`Debe existir exactamente un Admin inicial. Encontrados: ${summary.admins}.`);
  }

  if (summary.equipos !== 173) {
    throw new Error(`Conteo inesperado de equipos: ${summary.equipos}. Esperado: 173.`);
  }

  if (summary.asistentes !== 179) {
    throw new Error(`Conteo inesperado de asistentes asignados: ${summary.asistentes}. Esperado: 179.`);
  }

  if (summary.asignaciones !== 698) {
    throw new Error(`Conteo inesperado de asignaciones compatibles: ${summary.asignaciones}. Esperado: 698.`);
  }

  if (summary.clientesSinEquipo > 0) {
    throw new Error(`Hay ${summary.clientesSinEquipo} clientes sin equipo activo.`);
  }

  if (summary.equiposSinAsistentes > 0) {
    throw new Error(`Hay ${summary.equiposSinAsistentes} equipos sin asistentes activos.`);
  }

  console.log("[OK] Resumen de importación consistente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
