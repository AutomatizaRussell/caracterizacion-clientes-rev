import type {
  CompanyOption,
  RawRequestTemplate,
  Responsible,
  RequestCategory,
  RequestItem,
  RequestTemplate,
} from "./request-types";
import { rawRequestTypes } from "./request-templates.raw";

export const temporaryCompanies = [
  {
    id: "pg",
    name: "PROMOCIONES GUIBEL S.A.S.",
    shortName: "PG",
    contactEmail: "contacto@promocionesguibel.com",
  },
  {
    id: "cit",
    name: "COMERCIALIZADORA INTEGRAL TODO S.A.S.",
    shortName: "CIT",
    contactEmail: "contabilidad@cit.com",
  },
  {
    id: "nova",
    name: "INDUSTRIAS NOVA S.A.S.",
    shortName: "IN",
    contactEmail: "financiera@industriasnova.com",
  },
] satisfies CompanyOption[];

/**
 * Responsable temporal por defecto.
 *
 * Luego debe venir de:
 * - usuario autenticado
 * - empleado asignado
 * - configuración del área
 * - o perfil del senior/revisor
 */
export const defaultResponsible = {
  name: "Katerine Echeverri Ramirez",
  role: "Senior de Auditoría y Revisoría Fiscal",
  firm: "Russell Bedford GCT S.A.S.",
} satisfies Responsible;

const ADVANCED_PLACEHOLDER_COUNT = 3;

function createAdvancedPlaceholderItems(categoryId: string): RequestItem[] {
  return Array.from({ length: ADVANCED_PLACEHOLDER_COUNT }, (_, index) => {
    const itemNumber = index + 1;

    return {
      id: `${categoryId}-advanced-item-${itemNumber}`,
      text: `Item avanzado ${itemNumber}`,
      mode: "advanced",
      selected: false,
      children: [],
      type: "text",
      table: null,
    };
  });
}

function normalizeBaseItem(params: {
  categoryId: string;
  item: RawRequestTemplate["categories"][number]["items"][number];
}): RequestItem {
  return {
    id: params.item.id,
    text: params.item.text,

    /**
     * Decisión funcional:
     * Los ítems existentes del prototipo dejan de ser checklist opcional.
     * Ahora son base documental y siempre entran al documento.
     */
    mode: "base",
    selected: true,

    children: params.item.children ?? [],
    type: params.item.type ?? "text",
    table: params.item.table ?? null,
  };
}

function normalizeCategory(
  category: RawRequestTemplate["categories"][number],
): RequestCategory {
  const baseItems = category.items.map((item) =>
    normalizeBaseItem({
      categoryId: category.id,
      item,
    }),
  );

  const advancedPlaceholderItems = createAdvancedPlaceholderItems(category.id);

  return {
    id: category.id,
    title: category.title,
    items: [...baseItems, ...advancedPlaceholderItems],
  };
}

function normalizeRequestTemplate(template: RawRequestTemplate): RequestTemplate {
  return {
    id: template.id,
    name: template.name,
    prefix: template.prefix,
    templateFile: template.templateFile,
    defaultCutoffDate: template.defaultCutoffDate,
    subject: template.subject,
    introParagraphs: [...template.introParagraphs],
    closingParagraphs: [...template.closingParagraphs],
    categories: template.categories.map(normalizeCategory),
  };
}

export function cloneRequestTemplate(template: RequestTemplate): RequestTemplate {
  return {
    ...template,
    introParagraphs: [...template.introParagraphs],
    closingParagraphs: [...template.closingParagraphs],
    categories: template.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        children: [...item.children],
      })),
    })),
  };
}

export function getRequestTemplateById(templateId: string) {
  return requestTypes.find((template) => template.id === templateId) ?? null;
}

export function getDefaultRequestTemplate() {
  const defaultTemplate =
    getRequestTemplateById("auditoria-financiera-cierre") ?? requestTypes[0];

  if (!defaultTemplate) {
    throw new Error("No hay plantillas de solicitud configuradas.");
  }

  return defaultTemplate;
}

export const requestTypes = rawRequestTypes.map(normalizeRequestTemplate);
