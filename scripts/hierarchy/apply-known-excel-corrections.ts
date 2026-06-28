import * as XLSX from "xlsx";
import path from "node:path";

const inputPath = path.resolve("Estructura jerárquica con clientes.xlsx");
const outputPath = path.resolve("Estructura jerárquica con clientes.corregido.xlsx");

const workbook = XLSX.readFile(inputPath);
const sheet = workbook.Sheets["CONSOLIDADA"];

if (!sheet) {
  throw new Error("No existe la hoja CONSOLIDADA.");
}

const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
  header: 1,
  raw: false,
  blankrows: false,
});

let updatedRows = 0;

for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index];

  if (!row) {
    continue;
  }

  const nit = String(row[0] ?? "").trim();
  const cliente = String(row[1] ?? "").trim();

  if (nit === "901491963" && cliente === "ABC CORPORATION S.A.S.") {
    row[0] = "900819391";
    updatedRows += 1;
  }
}

if (updatedRows !== 1) {
  throw new Error(
    `Se esperaba corregir exactamente 1 fila de ABC CORPORATION S.A.S.; corregidas: ${updatedRows}`,
  );
}

const newSheet = XLSX.utils.aoa_to_sheet(rows);
workbook.Sheets["CONSOLIDADA"] = newSheet;

XLSX.writeFile(workbook, outputPath);

console.log(`[OK] Archivo corregido: ${outputPath}`);
console.log(`[OK] Filas actualizadas: ${updatedRows}`);
