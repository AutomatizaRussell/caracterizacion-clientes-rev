export function formatDateForDocument(value: string | null | undefined) {
  if (!value) {
    return "fecha pendiente";
  }

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}