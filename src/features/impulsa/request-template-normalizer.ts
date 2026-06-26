import type {
  RawRequestTemplate,
  RequestCategory,
  RequestItem,
  RequestTemplate,
} from "./request-types";

function createAdvancedPlaceholderItems(categoryId: string): RequestItem[] {
  return [
    {
      id: `${categoryId}-advanced-item-1`,
      text: "Ítem adicional 1",
      mode: "advanced",
      selected: false,
      children: [],
      type: "text",
      table: null,
    },
  ];
}

function normalizeCategory(category: RawRequestTemplate["categories"][number]) {
  const baseItems: RequestItem[] = category.items.map((item) => ({
    id: item.id,
    text: item.text,
    mode: "base",
    selected: true,
    children: item.children ?? [],
    type: item.type ?? "text",
    table: item.table ?? null,
  }));

  const advancedItems = createAdvancedPlaceholderItems(category.id);

  return {
    id: category.id,
    title: category.title,
    items: [...baseItems, ...advancedItems],
  } satisfies RequestCategory;
}

export function normalizeRequestTemplate(
  template: RawRequestTemplate,
): RequestTemplate {
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