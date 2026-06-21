export function getCurrentYear() {
  return new Date().getFullYear();
}

export function buildReference(params: {
  prefix: string;
  consecutive: number;
  year: number;
  companyCode: string;
}) {
  return `${params.prefix} ${String(params.consecutive).padStart(3, "0")} - ${
    params.year
  } ${params.companyCode}`;
}