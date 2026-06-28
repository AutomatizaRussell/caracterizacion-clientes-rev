import crypto from "node:crypto";
import path from "node:path";
import { existsSync } from "node:fs";
import * as XLSX from "xlsx";
import { prisma } from "../../src/lib/prisma";

type Role = "socio" | "gerente" | "senior" | "staff" | "Admin";

type Row = {
  rowNumber: number;
  nit: string;
  cliente: string;
  ccSocio: string;
  socio: string;
  ccGerente: string;
  gerente: string;
  ccSenior: string;
  senior: string;
  ccStaff: string;
  staff: string;
  tipoCliente: string;
  sector: string;
  erp: string;
};

function id() {
  return crypto.randomUUID();
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeId(value: unknown) {
  return normalizeText(value).replace(/[^\d]/g, "");
}

function normalizeEmailToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function inferCorporateEmail(params: {
  name: string;
  documentNumber: string;
  role: Role;
}) {
  const tokens = params.name
    .split(/\s+/)
    .map(normalizeEmailToken)
    .filter(Boolean);

  const firstName = tokens[0] ?? params.role;
  const firstSurname = tokens.length >= 3 ? tokens[2] : tokens[1];

  const localPart = `${firstName}${firstSurname ?? ""}` || params.documentNumber;

  return `${localPart}@rbcol.co`;
}

function getCargoName(role: Role) {
  switch (role) {
    case "socio":
      return "Socio";
    case "gerente":
      return "Gerente";
    case "senior":
      return "Senior";
    case "staff":
      return "Asistente";
    case "Admin":
      return "Admin";
  }
}

function readRows(filePath: string): Row[] {
  if (!existsSync(filePath)) {
    throw new Error(`No existe el archivo: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["CONSOLIDADA"];

  if (!sheet) {
    throw new Error("No existe la hoja CONSOLIDADA.");
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    blankrows: false,
  });

  return rawRows
    .slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
      nit: normalizeId(row[0]),
      cliente: normalizeText(row[1]),
      ccSocio: normalizeId(row[2]),
      socio: normalizeText(row[3]),
      ccGerente: normalizeId(row[4]),
      gerente: normalizeText(row[5]),
      ccSenior: normalizeId(row[6]),
      senior: normalizeText(row[7]),
      ccStaff: normalizeId(row[8]),
      staff: normalizeText(row[9]),
      tipoCliente: normalizeText(row[10]),
      sector: normalizeText(row[11]),
      erp: normalizeText(row[12]),
    }))
    .filter((row) => {
      return [
        row.nit,
        row.cliente,
        row.ccSocio,
        row.socio,
        row.ccGerente,
        row.gerente,
        row.ccSenior,
        row.senior,
        row.ccStaff,
        row.staff,
      ].some(Boolean);
    });
}

function groupBy<T>(values: T[], keyFn: (value: T) => string) {
  const groups = new Map<string, T[]>();

  for (const value of values) {
    const key = keyFn(value);
    groups.set(key, [...(groups.get(key) ?? []), value]);
  }

  return groups;
}

function validateRows(rows: Row[]) {
  const errors: string[] = [];

  const required: Array<[keyof Row, string]> = [
    ["nit", "NIT"],
    ["cliente", "CLIENTE"],
    ["ccSocio", "CC SOCIO"],
    ["socio", "SOCIO"],
    ["ccGerente", "CC GERENTE"],
    ["gerente", "GERENTE"],
    ["ccSenior", "CC SENIOR"],
    ["senior", "SENIOR"],
    ["ccStaff", "CC STAFF"],
    ["staff", "ASISTENTE"],
  ];

  for (const row of rows) {
    for (const [field, label] of required) {
      if (!row[field]) {
        errors.push(`Fila ${row.rowNumber}: falta ${label}.`);
      }
    }
  }

  const byNit = groupBy(rows, (row) => row.nit);

  for (const [nit, nitRows] of byNit.entries()) {
    const clientes = new Set(nitRows.map((row) => row.cliente));

    if (clientes.size > 1) {
      errors.push(
        `NIT ${nit}: aparece con más de una razón social: ${Array.from(
          clientes,
        ).join(" | ")}.`,
      );
    }
  }

  const byClient = groupBy(rows, (row) => `${row.nit}::${row.cliente}`);

  for (const [clientKey, clientRows] of byClient.entries()) {
    const socios = new Set(clientRows.map((row) => `${row.ccSocio}::${row.socio}`));
    const gerentes = new Set(clientRows.map((row) => `${row.ccGerente}::${row.gerente}`));
    const seniors = new Set(clientRows.map((row) => `${row.ccSenior}::${row.senior}`));

    if (socios.size > 1) {
      errors.push(`${clientKey}: tiene más de un socio.`);
    }

    if (gerentes.size > 1) {
      errors.push(`${clientKey}: tiene más de un gerente.`);
    }

    if (seniors.size > 1) {
      errors.push(`${clientKey}: tiene más de un senior.`);
    }
  }

  const byClientStaff = groupBy(
    rows,
    (row) => `${row.nit}::${row.cliente}::${row.ccStaff}::${row.staff}`,
  );

  for (const [clientStaffKey, values] of byClientStaff.entries()) {
    const seniors = new Set(values.map((row) => `${row.ccSenior}::${row.senior}`));

    if (seniors.size > 1) {
      errors.push(`${clientStaffKey}: mismo cliente y staff con distinto senior.`);
    }
  }

  const byDocument = new Map<string, Set<Role>>();

  for (const row of rows) {
    const entries: Array<[string, Role]> = [
      [row.ccSocio, "socio"],
      [row.ccGerente, "gerente"],
      [row.ccSenior, "senior"],
      [row.ccStaff, "staff"],
    ];

    for (const [documentNumber, role] of entries) {
      const roles = byDocument.get(documentNumber) ?? new Set<Role>();
      roles.add(role);
      byDocument.set(documentNumber, roles);
    }
  }

  for (const [documentNumber, roles] of byDocument.entries()) {
    if (roles.size > 1) {
      errors.push(
        `Documento ${documentNumber}: aparece con múltiples roles en el Excel: ${Array.from(
          roles,
        ).join(", ")}.`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `El Excel no cumple las reglas de importación:\n${errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
}

async function main() {
  if (process.env.CONFIRM_DESTRUCTIVE_IMPORT !== "YES") {
    throw new Error(
      "Importación destructiva bloqueada. Ejecuta con CONFIRM_DESTRUCTIVE_IMPORT=YES.",
    );
  }

  const fileArg = process.argv[2];

  if (!fileArg) {
    throw new Error(
      "Uso: CONFIRM_DESTRUCTIVE_IMPORT=YES pnpm tsx scripts/hierarchy/import-hierarchy-excel-bulk-destructive.ts <archivo.xlsx>",
    );
  }

  const filePath = path.resolve(fileArg);
  const rows = readRows(filePath);

  validateRows(rows);

  const byNit = groupBy(rows, (row) => row.nit);

  const employeeByDocument = new Map<
    string,
    {
      id: string;
      documentNumber: string;
      name: string;
      role: Role;
    }
  >();

  function addEmployee(documentNumber: string, name: string, role: Role) {
    if (!employeeByDocument.has(documentNumber)) {
      employeeByDocument.set(documentNumber, {
        id: id(),
        documentNumber,
        name,
        role,
      });
    }
  }

  for (const row of rows) {
    addEmployee(row.ccSocio, row.socio, "socio");
    addEmployee(row.ccGerente, row.gerente, "gerente");
    addEmployee(row.ccSenior, row.senior, "senior");
    addEmployee(row.ccStaff, row.staff, "staff");
  }

  const adminId = id();

  const empresaByNit = new Map<string, { id: string; row: Row }>();
  const equipoByNit = new Map<string, string>();

  for (const [nit, clientRows] of byNit.entries()) {
    const first = clientRows[0];

    if (!first) {
      continue;
    }

    empresaByNit.set(nit, {
      id: id(),
      row: first,
    });

    equipoByNit.set(nit, id());
  }

  const empleadosData: Array<{
    id: string;
    numeroDocumento: string | null;
    correoCorporativo: string;
    nombreCompleto: string;
    cargoNombre: string;
    rolAplicacion: string;
    estado: string;
    source: string;
    isPlaceholder: boolean;
  }> = Array.from(employeeByDocument.values()).map((employee) => ({
    id: employee.id,
    numeroDocumento: employee.documentNumber,
    correoCorporativo: inferCorporateEmail({
      name: employee.name,
      documentNumber: employee.documentNumber,
      role: employee.role,
    }),
    nombreCompleto: employee.name,
    cargoNombre: getCargoName(employee.role),
    rolAplicacion: employee.role,
    estado: "ACTIVO",
    source: "excel_estructura_jerarquica",
    isPlaceholder: true,
  }));

  empleadosData.push({
    id: adminId,
    numeroDocumento: null,
    correoCorporativo: process.env.ADMIN_EMAIL ?? "daniellopera@rbcol.co",
    nombreCompleto: "Daniel Felipe Lopera Estrada",
    cargoNombre: "Admin",
    rolAplicacion: "Admin",
    estado: "ACTIVO",
    source: "admin_inicial",
    isPlaceholder: false,
  });

  const empresasData = Array.from(empresaByNit.values()).map(({ id: empresaId, row }) => ({
    id: empresaId,
    nit: row.nit,
    razonSocial: row.cliente,
    estado: "ACTIVO",
    tipoCliente: row.tipoCliente || null,
    sector: row.sector || null,
    erp: row.erp || null,
    source: "excel_estructura_jerarquica",
    isPlaceholder: false,
  }));

  const equiposData = Array.from(empresaByNit.entries()).map(([nit, empresa]) => {
    const row = empresa.row;
    const socio = employeeByDocument.get(row.ccSocio);
    const gerente = employeeByDocument.get(row.ccGerente);
    const senior = employeeByDocument.get(row.ccSenior);
    const equipoId = equipoByNit.get(nit);

    if (!socio || !gerente || !senior || !equipoId) {
      throw new Error(`No fue posible resolver equipo para NIT ${nit}.`);
    }

    return {
      id: equipoId,
      empresaRefId: empresa.id,
      socioRefId: socio.id,
      gerenteRefId: gerente.id,
      seniorRefId: senior.id,
      activo: true,
      source: "excel_estructura_jerarquica",
    };
  });

  const staffAssignmentKeys = new Set<string>();
  const equipoStaffData: Array<{
    id: string;
    clienteEquipoId: string;
    staffRefId: string;
    activo: boolean;
    source: string;
  }> = [];

  const asignacionesData: Array<{
    id: string;
    empresaRefId: string;
    empleadoRefId: string;
    rol: string;
    activo: boolean;
    source: string;
  }> = [];

  const jerarquiaKeys = new Set<string>();
  const jerarquiasData: Array<{
    id: string;
    empleadoRefId: string;
    jefeRefId: string;
    tipoRelacion: string;
    activo: boolean;
    source: string;
  }> = [];

  for (const [nit, clientRows] of byNit.entries()) {
    const first = clientRows[0];

    if (!first) {
      continue;
    }

    const empresa = empresaByNit.get(nit);
    const equipoId = equipoByNit.get(nit);

    if (!empresa || !equipoId) {
      throw new Error(`No existe empresa/equipo para NIT ${nit}.`);
    }

    const socio = employeeByDocument.get(first.ccSocio);
    const gerente = employeeByDocument.get(first.ccGerente);
    const senior = employeeByDocument.get(first.ccSenior);

    if (!socio || !gerente || !senior) {
      throw new Error(`No existe socio/gerente/senior para NIT ${nit}.`);
    }

    asignacionesData.push(
      {
        id: id(),
        empresaRefId: empresa.id,
        empleadoRefId: socio.id,
        rol: "socio",
        activo: true,
        source: "excel_estructura_jerarquica",
      },
      {
        id: id(),
        empresaRefId: empresa.id,
        empleadoRefId: gerente.id,
        rol: "gerente",
        activo: true,
        source: "excel_estructura_jerarquica",
      },
      {
        id: id(),
        empresaRefId: empresa.id,
        empleadoRefId: senior.id,
        rol: "senior",
        activo: true,
        source: "excel_estructura_jerarquica",
      },
    );

    const gerenteSocioKey = `${gerente.id}->${socio.id}->gerente_socio_excel`;
    const seniorGerenteKey = `${senior.id}->${gerente.id}->senior_gerente_excel`;

    if (!jerarquiaKeys.has(gerenteSocioKey)) {
      jerarquiaKeys.add(gerenteSocioKey);
      jerarquiasData.push({
        id: id(),
        empleadoRefId: gerente.id,
        jefeRefId: socio.id,
        tipoRelacion: "gerente_socio_excel",
        activo: true,
        source: "excel_estructura_jerarquica",
      });
    }

    if (!jerarquiaKeys.has(seniorGerenteKey)) {
      jerarquiaKeys.add(seniorGerenteKey);
      jerarquiasData.push({
        id: id(),
        empleadoRefId: senior.id,
        jefeRefId: gerente.id,
        tipoRelacion: "senior_gerente_excel",
        activo: true,
        source: "excel_estructura_jerarquica",
      });
    }

    for (const row of clientRows) {
      const staff = employeeByDocument.get(row.ccStaff);

      if (!staff) {
        throw new Error(`No existe staff ${row.ccStaff} para NIT ${nit}.`);
      }

      const staffAssignmentKey = `${equipoId}::${staff.id}`;

      if (!staffAssignmentKeys.has(staffAssignmentKey)) {
        staffAssignmentKeys.add(staffAssignmentKey);

        equipoStaffData.push({
          id: id(),
          clienteEquipoId: equipoId,
          staffRefId: staff.id,
          activo: true,
          source: "excel_estructura_jerarquica",
        });

        asignacionesData.push({
          id: id(),
          empresaRefId: empresa.id,
          empleadoRefId: staff.id,
          rol: "staff",
          activo: true,
          source: "excel_estructura_jerarquica",
        });
      }

      const staffSeniorKey = `${staff.id}->${senior.id}->staff_senior_excel`;

      if (!jerarquiaKeys.has(staffSeniorKey)) {
        jerarquiaKeys.add(staffSeniorKey);

        jerarquiasData.push({
          id: id(),
          empleadoRefId: staff.id,
          jefeRefId: senior.id,
          tipoRelacion: "staff_senior_excel",
          activo: true,
          source: "excel_estructura_jerarquica",
        });
      }
    }
  }

  console.log("[1/5] Excel validado y datos preparados.");
  console.log(
    JSON.stringify(
      {
        filas: rows.length,
        empresas: empresasData.length,
        empleados: empleadosData.length,
        equipos: equiposData.length,
        equipoStaff: equipoStaffData.length,
        asignaciones: asignacionesData.length,
        jerarquias: jerarquiasData.length,
      },
      null,
      2,
    ),
  );

  console.log("[2/5] Ejecutando importación destructiva bulk...");

  await prisma.$transaction(
    [
      prisma.solicitudItemEntregaCliente.deleteMany(),
      prisma.solicitudPortalAdjunto.deleteMany(),
      prisma.solicitudPortalEntrega.deleteMany(),
      prisma.solicitudItemArchivo.deleteMany(),
      prisma.solicitudRequestFolder.deleteMany(),
      prisma.documentoGenerado.deleteMany(),
      prisma.solicitudEvento.deleteMany(),
      prisma.solicitudItem.deleteMany(),
      prisma.solicitudTokenCliente.deleteMany(),
      prisma.solicitud.deleteMany(),
      prisma.radicado.deleteMany(),
      prisma.radicadoCounter.deleteMany(),
      prisma.respuestaAudit.deleteMany(),
      prisma.respuestaCaracterizacion.deleteMany(),
      prisma.formularioCliente.deleteMany(),
      prisma.exportLog.deleteMany(),
      prisma.refClienteEquipoStaff.deleteMany(),
      prisma.refClienteEquipo.deleteMany(),
      prisma.refAsignacion.deleteMany(),
      prisma.refEmpleadoJerarquia.deleteMany(),
      prisma.refEmpresa.deleteMany(),
      prisma.refEmpleado.deleteMany(),

      prisma.refEmpleado.createMany({
        data: empleadosData,
      }),
      prisma.refEmpresa.createMany({
        data: empresasData,
      }),
      prisma.refClienteEquipo.createMany({
        data: equiposData,
      }),
      prisma.refClienteEquipoStaff.createMany({
        data: equipoStaffData,
      }),
      prisma.refAsignacion.createMany({
        data: asignacionesData,
      }),
      prisma.refEmpleadoJerarquia.createMany({
        data: jerarquiasData,
      }),
    ],
    {
      timeout: 300_000,
      maxWait: 120_000,
    },
  );

  console.log("[3/5] Importación bulk aplicada.");

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

  console.log("[4/5] Resumen post-importación:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.clientes !== 173) {
    throw new Error(`Clientes esperados: 173. Encontrados: ${summary.clientes}.`);
  }

  if (summary.equipos !== 173) {
    throw new Error(`Equipos esperados: 173. Encontrados: ${summary.equipos}.`);
  }

  if (summary.asistentes !== 179) {
    throw new Error(`Asistentes esperados: 179. Encontrados: ${summary.asistentes}.`);
  }

  if (summary.admins !== 1) {
    throw new Error(`Admins esperados: 1. Encontrados: ${summary.admins}.`);
  }

  if (summary.clientesSinEquipo > 0) {
    throw new Error(`Hay ${summary.clientesSinEquipo} clientes sin equipo.`);
  }

  if (summary.equiposSinAsistentes > 0) {
    throw new Error(`Hay ${summary.equiposSinAsistentes} equipos sin asistentes.`);
  }

  console.log("[5/5] OK: importación destructiva bulk completada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
