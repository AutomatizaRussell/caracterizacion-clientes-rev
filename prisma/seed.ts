
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getDatabaseUrlWithSearchPath() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const [baseUrl] = rawUrl.split("?");

  return `${baseUrl}?options=-c%20search_path%3Dcore,caracterizacion,impulsa,public`;
}


const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrlWithSearchPath(),
  }),
});


const SOURCE = "programacion_mayo_2026";

type CsvRow = Record<string, string>;

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      currentRow.push(currentValue);
      currentValue = "";

      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  const [headers, ...dataRows] = rows;

  if (!headers) {
    return [];
  }

  return dataRows.map((row) => {
    const obj: CsvRow = {};

    headers.forEach((header, index) => {
      obj[header.trim()] = (row[index] ?? "").trim();
    });

    return obj;
  });
}

function readCsv(fileName: string): CsvRow[] {
  const filePath = path.join(process.cwd(), "prisma", "seed-data", fileName);
  const content = fs.readFileSync(filePath, "utf8");
  return parseCsv(content);
}

function toBool(value: string | undefined): boolean {
  return String(value ?? "").toLowerCase() === "true";
}

async function main() {
  const empresas = readCsv("mvp_ref_empresa.csv");
  const empleados = readCsv("mvp_ref_empleado.csv");
  const asignaciones = readCsv("mvp_ref_asignacion.csv");
  const jerarquias = readCsv("mvp_ref_empleado_jerarquia.csv");

  console.log("Seed source:", SOURCE);
  console.log("CSV empresas:", empresas.length);
  console.log("CSV empleados:", empleados.length);
  console.log("CSV asignaciones:", asignaciones.length);
  console.log("CSV jerarquias:", jerarquias.length);

  console.log("Limpiando datos temporales previos...");

  await prisma.respuestaAudit.deleteMany();
  await prisma.respuestaCaracterizacion.deleteMany();
  await prisma.formularioCliente.deleteMany();

  await prisma.refEmpleadoJerarquia.deleteMany({
    where: { source: SOURCE },
  });

  await prisma.refAsignacion.deleteMany({
    where: { source: SOURCE },
  });

  await prisma.exportLog.deleteMany();

  await prisma.refEmpleado.deleteMany({
    where: { source: SOURCE },
  });

  await prisma.refEmpresa.deleteMany({
    where: { source: SOURCE },
  });

  console.log("Insertando empresas...");

  const empresaIdBySourceKey = new Map<string, string>();

  for (const row of empresas) {
    const sourceKey = row.source_key;
    const razonSocial = row.razon_social;
    const nit = row.nit;

    if (!sourceKey || !razonSocial || !nit) {
      continue;
    }

    const empresa = await prisma.refEmpresa.create({
      data: {
        razonSocial,
        nit,
        digitoVerificacion: row.digito_verificacion || null,
        estado: row.estado || "activo",
        source: row.source || SOURCE,
        isPlaceholder: toBool(row.is_placeholder),
      },
    });

    empresaIdBySourceKey.set(sourceKey, empresa.id);
  }

  console.log("Empresas insertadas:", empresaIdBySourceKey.size);

  console.log("Insertando empleados...");

  const empleadoIdBySourceKey = new Map<string, string>();

  for (const row of empleados) {
    const sourceKey = row.source_key;
    const nombreCompleto = row.nombre_completo;
    const correoCorporativo = row.correo_corporativo;

    if (!sourceKey || !nombreCompleto || !correoCorporativo) {
      continue;
    }

    const empleado = await prisma.refEmpleado.create({
      data: {
        nombreCompleto,
        correoCorporativo,
        cargoNombre: row.cargo_nombre || null,
        estado: "ACTIVA",
        rolAplicacion: row.rol_aplicacion || "staff",
        source: row.source || SOURCE,
        isPlaceholder: toBool(row.is_placeholder),
      },
    });

    empleadoIdBySourceKey.set(sourceKey, empleado.id);
  }

  console.log("Empleados insertados:", empleadoIdBySourceKey.size);

  console.log("Insertando asignaciones...");

  let asignacionesInsertadas = 0;
  let asignacionesSaltadas = 0;

  for (const row of asignaciones) {
    const empresaRefId = empresaIdBySourceKey.get(row.empresa_source_key);
    const empleadoRefId = empleadoIdBySourceKey.get(row.empleado_source_key);

    if (!empresaRefId || !empleadoRefId) {
      asignacionesSaltadas++;
      continue;
    }

    await prisma.refAsignacion.create({
      data: {
        empresaRefId,
        empleadoRefId,
        rol: row.rol || "staff",
        activo: toBool(row.activo),
        source: row.source || SOURCE,
      },
    });

    asignacionesInsertadas++;
  }

  console.log("Asignaciones insertadas:", asignacionesInsertadas);
  console.log("Asignaciones saltadas:", asignacionesSaltadas);

  console.log("Insertando jerarquía operativa...");

  let jerarquiasInsertadas = 0;
  let jerarquiasSaltadas = 0;

  for (const row of jerarquias) {
    const empleadoRefId = empleadoIdBySourceKey.get(row.empleado_source_key);
    const jefeRefId = empleadoIdBySourceKey.get(row.jefe_source_key);

    if (!empleadoRefId || !jefeRefId || empleadoRefId === jefeRefId) {
      jerarquiasSaltadas++;
      continue;
    }

    await prisma.refEmpleadoJerarquia.create({
      data: {
        empleadoRefId,
        jefeRefId,
        tipoRelacion: row.tipo_relacion || "operativa_programacion",
        activo: toBool(row.activo),
        source: row.source || SOURCE,
      },
    });

    jerarquiasInsertadas++;
  }

  console.log("Jerarquías insertadas:", jerarquiasInsertadas);
  console.log("Jerarquías saltadas:", jerarquiasSaltadas);

  console.log("Seed terminado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });