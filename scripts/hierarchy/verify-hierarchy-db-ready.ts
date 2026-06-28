import { prisma } from "../../src/lib/prisma";

type ColumnRow = {
  table_schema: string;
  table_name: string;
  column_name: string;
};

type TableRow = {
  table_schema: string;
  table_name: string;
};

async function main() {
  const columns = await prisma.$queryRaw<ColumnRow[]>`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND (
        table_name = 'ref_empresa'
        OR table_name = 'ref_empleado'
        OR table_name = 'ref_cliente_equipo'
        OR table_name = 'ref_cliente_equipo_staff'
      )
    ORDER BY table_schema, table_name, column_name
  `;

  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'core'
      AND table_name IN (
        'ref_empresa',
        'ref_empleado',
        'ref_cliente_equipo',
        'ref_cliente_equipo_staff'
      )
    ORDER BY table_schema, table_name
  `;

  const foundTables = new Set(tables.map((row) => row.table_name));
  const foundColumns = new Set(
    columns.map((row) => `${row.table_name}.${row.column_name}`),
  );

  const requiredTables = [
    "ref_empresa",
    "ref_empleado",
    "ref_cliente_equipo",
    "ref_cliente_equipo_staff",
  ];

  const requiredColumns = [
    "ref_empresa.tipo_cliente",
    "ref_empresa.sector",
    "ref_empresa.erp",
    "ref_empleado.numero_documento",
    "ref_cliente_equipo.empresa_ref_id",
    "ref_cliente_equipo.socio_ref_id",
    "ref_cliente_equipo.gerente_ref_id",
    "ref_cliente_equipo.senior_ref_id",
    "ref_cliente_equipo_staff.cliente_equipo_id",
    "ref_cliente_equipo_staff.staff_ref_id",
  ];

  const missingTables = requiredTables.filter((table) => !foundTables.has(table));
  const missingColumns = requiredColumns.filter(
    (column) => !foundColumns.has(column),
  );

  const counts = {
    refEmpresa: await prisma.refEmpresa.count(),
    refEmpleado: await prisma.refEmpleado.count(),
    refClienteEquipo: await prisma.refClienteEquipo.count(),
    refClienteEquipoStaff: await prisma.refClienteEquipoStaff.count(),
    refAsignacion: await prisma.refAsignacion.count(),
  };

  console.log("Tablas requeridas faltantes:");
  console.log(missingTables);

  console.log("Columnas requeridas faltantes:");
  console.log(missingColumns);

  console.log("Conteos actuales:");
  console.log(JSON.stringify(counts, null, 2));

  if (missingTables.length > 0 || missingColumns.length > 0) {
    throw new Error("La base no está lista para importación de jerarquía.");
  }

  console.log("OK: DB lista para importación de jerarquía.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
