/**
 * Presentación canónica de estados de solicitudes de información.
 *
 * Regla:
 * - El enum técnico puede conservar nombres como SENT o CLIENT_SUBMITTED.
 * - La UI debe mostrar una etiqueta operativa consistente en todas las vistas.
 * - Si una vista necesita mostrar el evento técnico crudo, debe usar otro campo,
 *   no redefinir el label principal del estado.
 */
export function formatSolicitudStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Sin estado";
  }

  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    CREATED: "Creada",
    DOCUMENT_GENERATED: "Documento generado",
    SENT: "Pendiente cliente",
    CLIENT_OPENED: "Pendiente cliente",
    CLIENT_SUBMITTED: "Pendiente revisión",
    UNDER_REVIEW: "En revisión",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    FAILED: "Fallida",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export function getSolicitudStatusBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-100";
    case "SENT":
    case "CLIENT_OPENED":
      return "bg-orange-50 text-orange-700 ring-orange-100";
    case "CLIENT_SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-[#00bfb3]/10 text-[#008b83] ring-[#00bfb3]/20";
    case "DOCUMENT_GENERATED":
    case "CREATED":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "DRAFT":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}
