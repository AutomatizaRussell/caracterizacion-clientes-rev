import type {
  RequestTemplate,
  Responsible,
} from "@/features/impulsa/request-types";
import type { CrearSolicitudDesdeBuilderPayload } from "@/app/solicitudes/crear/actions";

/**
 * Construye el contrato que la UI envía hacia la server action
 * crearSolicitudDesdeBuilderAction().
 *
 * Esta función existe para separar claramente:
 * - estado visual/editorial del builder;
 * - estructura de la plantilla de trabajo;
 * - payload transaccional enviado al backend.
 *
 * No valida reglas de negocio. Las validaciones definitivas siguen viviendo
 * en la server action y en los servicios de dominio.
 */
export function buildCreateSolicitudPayload(params: {
  selectedCompanyId: string;
  selectedRequestTypeId: string;
  cutoffDate: string;
  generationDate: string;
  responsible: Responsible;
  workingTemplate: RequestTemplate;
}): CrearSolicitudDesdeBuilderPayload {
  return {
    empresaRefId: params.selectedCompanyId,
    requestTypeId: params.selectedRequestTypeId,
    cutoffDate: params.cutoffDate,
    generationDate: params.generationDate,
    responsible: params.responsible,
    categories: params.workingTemplate.categories.map((category) => ({
      id: category.id,
      title: category.title,
      items: category.items.map((item) => ({
        id: item.id,
        text: item.text,
        mode: item.mode,
        selected: item.selected,
        children: item.children,
        type: item.type,
        table: item.table,
      })),
    })),
  };
}
