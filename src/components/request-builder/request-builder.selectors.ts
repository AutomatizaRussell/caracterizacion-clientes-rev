import type {
  CompanyOption,
  RequestTemplate,
} from "@/features/impulsa/request-types";
import {
  buildReference,
  getCurrentYear,
} from "@/features/impulsa/request-reference";
import { buildDocumentBlocks } from "@/features/documentos/document-blocks";
import { paginateBlocks } from "@/features/documentos/document-pagination";

export function getSelectedCompany(params: {
  companies: CompanyOption[];
  selectedCompanyId: string;
}) {
  return (
    params.companies.find((company) => company.id === params.selectedCompanyId) ??
    params.companies[0]
  );
}

export function getEditingCategory(params: {
  workingTemplate: RequestTemplate;
  editingCategoryId: string | null;
}) {
  if (!params.editingCategoryId) {
    return null;
  }

  return (
    params.workingTemplate.categories.find(
      (category) => category.id === params.editingCategoryId,
    ) ?? null
  );
}

export function getProjectedReference(params: {
  workingTemplate: RequestTemplate;
  selectedCompany?: CompanyOption;
}) {
  return buildReference({
    prefix: params.workingTemplate.prefix,
    consecutive: 1,
    year: getCurrentYear(),
    companyCode: params.selectedCompany?.shortName ?? "CLIENTE",
  });
}

export function getCategoryStats(workingTemplate: RequestTemplate) {
  return workingTemplate.categories.map((category) => {
    const baseItems = category.items.filter((item) => item.mode === "base");
    const advancedItems = category.items.filter(
      (item) => item.mode === "advanced",
    );

    const includedBaseItems = baseItems.filter((item) => item.selected);
    const excludedBaseItems = baseItems.filter((item) => !item.selected);
    const includedAdvancedItems = advancedItems.filter(
      (item) => item.selected,
    );

    return {
      categoryId: category.id,
      baseTotal: baseItems.length,
      baseIncluded: includedBaseItems.length,
      baseExcluded: excludedBaseItems.length,
      advancedTotal: advancedItems.length,
      advancedIncluded: includedAdvancedItems.length,
    };
  });
}

export function getTotalIncludedItemsCount(workingTemplate: RequestTemplate) {
  return workingTemplate.categories.reduce((total, category) => {
    return total + category.items.filter((item) => item.selected).length;
  }, 0);
}

export function getTotalBaseItemsCount(workingTemplate: RequestTemplate) {
  return workingTemplate.categories.reduce((total, category) => {
    return total + category.items.filter((item) => item.mode === "base").length;
  }, 0);
}

export function getTotalExcludedBaseItemsCount(workingTemplate: RequestTemplate) {
  return workingTemplate.categories.reduce((total, category) => {
    return (
      total +
      category.items.filter(
        (item) => item.mode === "base" && !item.selected,
      ).length
    );
  }, 0);
}

export function getTotalIncludedAdvancedItemsCount(
  workingTemplate: RequestTemplate,
) {
  return workingTemplate.categories.reduce((total, category) => {
    return (
      total +
      category.items.filter(
        (item) => item.mode === "advanced" && item.selected,
      ).length
    );
  }, 0);
}

export function getDocumentPages(workingTemplate: RequestTemplate) {
  const documentBlocks = buildDocumentBlocks({
    template: workingTemplate,
  });

  return paginateBlocks(documentBlocks);
}
