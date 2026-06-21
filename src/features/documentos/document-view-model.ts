import type {
  DocumentBlock,
  RequestTemplate,
} from "@/features/impulsa/request-types";

export type DocumentResponsibleViewModel = {
  name: string;
  role: string;
  firm: string;
};

export type DocumentCompanyViewModel = {
  name: string;
  nit?: string | null;
};

export type SolicitudDocumentItemViewModel = {
  id: string;
  orderIndex: number;
  categoryId: string;
  categoryTitle: string;
  text: string;
  children: string[];
};

export type SolicitudDocumentInput = {
  radicadoReference: string;
  clienteNombre: string;
  clienteNit: string;
  requestTypeName: string;
  subject: string;
  cutoffDate: Date;
  generationDate: Date;
  responsibleName: string;
  responsibleRole: string;
  responsibleFirm: string;
  portalUrl: string | null;
  items: SolicitudDocumentItemViewModel[];
};

export type DocumentViewModel = {
  pages: DocumentBlock[][];
  selectedCompany: DocumentCompanyViewModel;
  template: {
    subject: string;
    requestTypeName: string;
  };
  projectedReference: string;
  generationDate: string;
  cutoffDate: string;
  responsible: DocumentResponsibleViewModel;
};

/**
 * Misma estimación usada por la vista previa.
 * Esta función es deliberadamente simple: no es layout real, sino una
 * heurística estable para paginar bloques de contenido documental.
 */
export function estimateTextWeight(text: string) {
  const length = text.length;

  if (length <= 90) return 1;
  if (length <= 180) return 2;
  if (length <= 320) return 3;

  return 4;
}

/**
 * Misma paginación aproximada usada por la vista previa.
 */
export function paginateBlocks(blocks: DocumentBlock[]) {
  const pages: DocumentBlock[][] = [];
  let currentPage: DocumentBlock[] = [];
  let currentWeight = 0;

  const firstPageLimit = 24;
  const nextPageLimit = 32;

  blocks.forEach((block) => {
    const currentLimit = pages.length === 0 ? firstPageLimit : nextPageLimit;

    if (
      currentWeight + block.weight > currentLimit &&
      currentPage.length > 0
    ) {
      pages.push(currentPage);
      currentPage = [];
      currentWeight = 0;
    }

    currentPage.push(block);
    currentWeight += block.weight;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * Constructor usado por la preview interactiva del builder.
 * Mantiene compatibilidad con el estado client-side actual.
 */
export function buildDocumentBlocksFromTemplate(params: {
  template: RequestTemplate;
}): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];

  params.template.introParagraphs.forEach((paragraph, index) => {
    blocks.push({
      id: `intro-${index}`,
      type: "paragraph",
      text: paragraph,
      weight: estimateTextWeight(paragraph) + 1,
    });
  });

  params.template.categories.forEach((category) => {
    const includedItems = category.items.filter((item) => item.selected);

    if (includedItems.length === 0) {
      return;
    }

    blocks.push({
      id: `category-${category.id}`,
      type: "category-title",
      text: category.title,
      weight: 2,
    });

    includedItems.forEach((item) => {
      blocks.push({
        id: `item-${category.id}-${item.id}`,
        type: "item",
        text: item.text,
        children: item.children,
        weight: estimateTextWeight(item.text),
      });
    });
  });

  params.template.closingParagraphs.forEach((paragraph, index) => {
    blocks.push({
      id: `closing-${index}`,
      type: "paragraph",
      text: paragraph,
      weight: estimateTextWeight(paragraph) + 1,
    });
  });

  return blocks;
}

/**
 * Constructor usado por el documento real desde datos persistidos.
 *
 * Limitación real:
 * La solicitud persistida no guarda todavía el snapshot completo del template
 * original, por eso los párrafos de introducción/cierre se reconstruyen aquí.
 *
 * Si quieres 100% fidelidad con la plantilla elegida en el builder, el siguiente
 * refactor correcto será persistir introParagraphs/closingParagraphs o un
 * templateSnapshotJson al crear la solicitud.
 */
export function buildDocumentBlocksFromSolicitud(
  data: SolicitudDocumentInput,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];

  const introParagraphs = [
    "En desarrollo de nuestras actividades de revisoría fiscal y/o auditoría, solicitamos amablemente suministrar la información relacionada a continuación.",
    "Agradecemos que los documentos soporte sean cargados a través del portal de respuesta dispuesto para esta solicitud.",
  ];

  introParagraphs.forEach((paragraph, index) => {
    blocks.push({
      id: `intro-${index}`,
      type: "paragraph",
      text: paragraph,
      weight: estimateTextWeight(paragraph) + 1,
    });
  });

  const groupedItems = new Map<string, SolicitudDocumentItemViewModel[]>();

  for (const item of data.items) {
    const currentItems = groupedItems.get(item.categoryTitle) ?? [];
    currentItems.push(item);
    groupedItems.set(item.categoryTitle, currentItems);
  }

  Array.from(groupedItems.entries()).forEach(([categoryTitle, items]) => {
    blocks.push({
      id: `category-${categoryTitle}`,
      type: "category-title",
      text: categoryTitle,
      weight: 2,
    });

    items
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach((item) => {
        blocks.push({
          id: `item-${item.id}`,
          type: "item",
          text: item.text,
          children: item.children,
          weight: estimateTextWeight(item.text),
        });
      });
  });

  const closingParagraphs = [
    "Agradecemos su colaboración y oportunidad en la entrega de la información solicitada.",
  ];

  closingParagraphs.forEach((paragraph, index) => {
    blocks.push({
      id: `closing-${index}`,
      type: "paragraph",
      text: paragraph,
      weight: estimateTextWeight(paragraph) + 1,
    });
  });

  return blocks;
}

export function buildDocumentViewModelFromSolicitud(
  data: SolicitudDocumentInput,
): DocumentViewModel {
  const blocks = buildDocumentBlocksFromSolicitud(data);
  const pages = paginateBlocks(blocks);

  return {
    pages,
    selectedCompany: {
      name: data.clienteNombre,
      nit: data.clienteNit,
    },
    template: {
      subject: data.subject,
      requestTypeName: data.requestTypeName,
    },
    projectedReference: data.radicadoReference,
    generationDate: data.generationDate.toISOString().slice(0, 10),
    cutoffDate: data.cutoffDate.toISOString().slice(0, 10),
    responsible: {
      name: data.responsibleName,
      role: data.responsibleRole,
      firm: data.responsibleFirm,
    },
  };
}