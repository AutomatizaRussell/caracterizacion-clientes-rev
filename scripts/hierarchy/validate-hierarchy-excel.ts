import * as XLSX from "xlsx";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

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

function normalizeText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeId(value: unknown) {
  return normalizeText(value).replace(/[^\d]/g, "");
}

function normalizeNit(value: unknown) {
  return normalizeId(value);
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
      nit: normalizeNit(row[0]),
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

function uniqueSet<T>(values: T[]) {
  return new Set(values);
}

export function validateHierarchyRows(rows: Row[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields: Array<[keyof Row, string]> = [
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
    for (const [field, label] of requiredFields) {
      if (!row[field]) {
        errors.push(`Fila ${row.rowNumber}: falta ${label}.`);
      }
    }

    if (!row.sector) {
      warnings.push(`Fila ${row.rowNumber}: SECTOR vacío.`);
    }

    if (!row.erp) {
      warnings.push(`Fila ${row.rowNumber}: ERP vacío.`);
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
    const socios = uniqueSet(
      clientRows.map((row) => `${row.ccSocio}::${row.socio}`),
    );
    const gerentes = uniqueSet(
      clientRows.map((row) => `${row.ccGerente}::${row.gerente}`),
    );
    const seniors = uniqueSet(
      clientRows.map((row) => `${row.ccSenior}::${row.senior}`),
    );

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
    const seniors = uniqueSet(
      values.map((row) => `${row.ccSenior}::${row.senior}`),
    );

    if (seniors.size > 1) {
      errors.push(
        `${clientStaffKey}: mismo cliente y staff con distinto senior.`,
      );
    }
  }

  const summary = {
    rows: rows.length,
    clients: new Set(rows.map((row) => `${row.nit}::${row.cliente}`)).size,
    socios: new Set(rows.map((row) => `${row.ccSocio}::${row.socio}`)).size,
    gerentes: new Set(rows.map((row) => `${row.ccGerente}::${row.gerente}`))
      .size,
    seniors: new Set(rows.map((row) => `${row.ccSenior}::${row.senior}`)).size,
    staffs: new Set(rows.map((row) => `${row.ccStaff}::${row.staff}`)).size,
    clientsWithMultipleStaff: Array.from(byClient.values()).filter(
      (clientRows) =>
        new Set(clientRows.map((row) => `${row.ccStaff}::${row.staff}`)).size >
        1,
    ).length,
  };

  return {
    summary,
    errors,
    warnings,
  };
}

function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    throw new Error(
      "Uso: pnpm tsx scripts/hierarchy/validate-hierarchy-excel.ts <archivo.xlsx>",
    );
  }

  const filePath = path.resolve(fileArg);
  const rows = readRows(filePath);
  const result = validateHierarchyRows(rows);

  mkdirSync("/root/ops/plataforma-revisoria/hierarchy/logs", {
    recursive: true,
  });

  const reportPath = `/root/ops/plataforma-revisoria/hierarchy/logs/validation-${Date.now()}.json`;

  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        filePath,
        ...result,
      },
      null,
      2,
    ),
  );

  console.log("Resumen validación jerarquía:");
  console.log(JSON.stringify(result.summary, null, 2));
  console.log(`Reporte: ${reportPath}`);

  if (result.warnings.length > 0) {
    console.log(`Warnings: ${result.warnings.length}`);
  }

  if (result.errors.length > 0) {
    console.error("\nErrores encontrados:");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }

    process.exit(1);
  }

  console.log("\nOK: el Excel cumple las reglas estructurales esperadas.");
}

main();
