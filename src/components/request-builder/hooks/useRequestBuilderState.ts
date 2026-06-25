import { useState } from "react";
import type {
  CompanyOption,
  RequestTemplate,
  Responsible,
} from "@/features/impulsa/request-types";
import {
  cloneRequestTemplate,
  defaultResponsible,
  getDefaultRequestTemplate,
  requestTypes,
} from "@/features/impulsa/request-templates.data";

function createAdvancedItem(categoryId: string, itemNumber: number) {
  return {
    id: `${categoryId}-custom-advanced-${Date.now()}-${itemNumber}`,
    text: `Item avanzado ${itemNumber}`,
    mode: "advanced" as const,
    selected: true,
    children: [],
    type: "text" as const,
    table: null,
  };
}

type UseRequestBuilderStateParams = {
  companies: CompanyOption[];
  initialCompanyId?: string | null;
  initialCutoffDate?: string;
  initialResponsible?: Responsible;
  onInputChange?: () => void;
};

export function useRequestBuilderState({
  companies,
  initialCompanyId = null,
  initialCutoffDate,
  initialResponsible,
  onInputChange,
}: UseRequestBuilderStateParams) {
  const defaultTemplate = getDefaultRequestTemplate();

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    initialCompanyId &&
      companies.some((company) => company.id === initialCompanyId)
      ? initialCompanyId
      : companies[0]?.id ?? "",
  );

  const [selectedRequestTypeId, setSelectedRequestTypeId] = useState(
    defaultTemplate.id,
  );

  const [workingTemplate, setWorkingTemplate] = useState<RequestTemplate>(() =>
    cloneRequestTemplate(defaultTemplate),
  );

  const [cutoffDate, setCutoffDate] = useState(
    initialCutoffDate ?? defaultTemplate.defaultCutoffDate,
  );

  const [generationDate] = useState(new Date().toISOString().slice(0, 10));

  const [responsible, setResponsible] = useState<Responsible>(
    initialResponsible ?? defaultResponsible,
  );

  const [isEditingResponsible, setIsEditingResponsible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  function notifyInputChange() {
    onInputChange?.();
  }

  function handleRequestTypeChange(requestTypeId: string) {
    const nextTemplate = requestTypes.find(
      (requestType) => requestType.id === requestTypeId,
    );

    if (!nextTemplate) {
      return;
    }

    setSelectedRequestTypeId(requestTypeId);
    setWorkingTemplate(cloneRequestTemplate(nextTemplate));
    setCutoffDate(nextTemplate.defaultCutoffDate);
    setEditingCategoryId(null);
    notifyInputChange();
  }

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId);
    notifyInputChange();
  }

  function handleCutoffDateChange(value: string) {
    setCutoffDate(value);
    notifyInputChange();
  }

  function handleResponsibleChange(value: Responsible) {
    setResponsible(value);
    notifyInputChange();
  }

  function toggleItem(categoryId: string, itemId: string) {
    setWorkingTemplate((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,
          items: category.items.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              selected: !item.selected,
            };
          }),
        };
      }),
    }));

    notifyInputChange();
  }

  function updateAdvancedItemText(
    categoryId: string,
    itemId: string,
    text: string,
  ) {
    setWorkingTemplate((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,
          items: category.items.map((item) => {
            if (item.id !== itemId || item.mode !== "advanced") {
              return item;
            }

            return {
              ...item,
              text,
            };
          }),
        };
      }),
    }));

    notifyInputChange();
  }

  function addAdvancedItem(categoryId: string) {
    setWorkingTemplate((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        const advancedItemsCount = category.items.filter(
          (item) => item.mode === "advanced",
        ).length;

        return {
          ...category,
          items: [
            ...category.items,
            createAdvancedItem(category.id, advancedItemsCount + 1),
          ],
        };
      }),
    }));

    notifyInputChange();
  }

  function removeAdvancedItem(categoryId: string, itemId: string) {
    setWorkingTemplate((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,
          items: category.items.filter((item) => {
            if (item.id !== itemId) {
              return true;
            }

            return item.mode !== "advanced";
          }),
        };
      }),
    }));

    notifyInputChange();
  }

  function resetCategoryToBase(categoryId: string) {
    setWorkingTemplate((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,
          items: category.items.map((item) => {
            if (item.mode === "base") {
              return {
                ...item,
                selected: true,
              };
            }

            return {
              ...item,
              selected: false,
            };
          }),
        };
      }),
    }));

    notifyInputChange();
  }

  return {
    selectedCompanyId,
    selectedRequestTypeId,
    workingTemplate,
    cutoffDate,
    generationDate,
    responsible,
    isEditingResponsible,
    editingCategoryId,

    setEditingCategoryId,
    startEditingResponsible: () => setIsEditingResponsible(true),
    stopEditingResponsible: () => setIsEditingResponsible(false),

    handleCompanyChange,
    handleRequestTypeChange,
    handleCutoffDateChange,
    handleResponsibleChange,
    toggleItem,
    updateAdvancedItemText,
    addAdvancedItem,
    removeAdvancedItem,
    resetCategoryToBase,
  };
}
