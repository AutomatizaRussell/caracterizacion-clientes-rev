"use client";

import { useMemo, useState } from "react";
import type {
  CompanyOption,
  Responsible,
} from "@/features/impulsa/request-types";
import { requestTypes } from "@/features/impulsa/request-templates.data";
import DocumentPreviewModal from "@/components/document-preview/DocumentPreviewModal";
import RequestControls from "./RequestControls";
import RequestCategorySummaryPanel from "./RequestCategorySummaryPanel";
import RequestCategoryEditorPanel from "./RequestCategoryEditorPanel";
import RequestBuilderHeader from "./RequestBuilderHeader";
import RequestDocumentPreviewPanel from "./RequestDocumentPreviewPanel";
import { buildCreateSolicitudPayload } from "./request-builder.payload";
import {
  getCategoryStats,
  getDocumentPages,
  getEditingCategory,
  getProjectedReference,
  getSelectedCompany,
  getTotalBaseItemsCount,
  getTotalExcludedBaseItemsCount,
  getTotalIncludedAdvancedItemsCount,
  getTotalIncludedItemsCount,
} from "./request-builder.selectors";
import { useRequestBuilderState } from "./hooks/useRequestBuilderState";
import { useRequestGeneration } from "./hooks/useRequestGeneration";

type RequestBuilderProps = {
  companies: CompanyOption[];
  initialCompanyId?: string | null;
  initialCutoffDate?: string;
  initialResponsible?: Responsible;
  userRole?: string | null;
};

export default function RequestBuilder({
  companies,
  initialCompanyId = null,
  initialCutoffDate,
  initialResponsible,
  userRole = null,
}: RequestBuilderProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const generation = useRequestGeneration();

  const builder = useRequestBuilderState({
    companies,
    initialCompanyId,
    initialCutoffDate,
    initialResponsible,
    onInputChange: generation.clearGenerationState,
  });

  const selectedCompany = useMemo(
    () =>
      getSelectedCompany({
        companies,
        selectedCompanyId: builder.selectedCompanyId,
      }),
    [builder.selectedCompanyId, companies],
  );

  const editingCategory = useMemo(
    () =>
      getEditingCategory({
        workingTemplate: builder.workingTemplate,
        editingCategoryId: builder.editingCategoryId,
      }),
    [builder.editingCategoryId, builder.workingTemplate],
  );

  const projectedReference = useMemo(
    () =>
      getProjectedReference({
        workingTemplate: builder.workingTemplate,
        selectedCompany,
      }),
    [builder.workingTemplate, selectedCompany],
  );

  const categoryStats = useMemo(
    () => getCategoryStats(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const totalIncludedItemsCount = useMemo(
    () => getTotalIncludedItemsCount(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const totalBaseItemsCount = useMemo(
    () => getTotalBaseItemsCount(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const totalExcludedBaseItemsCount = useMemo(
    () => getTotalExcludedBaseItemsCount(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const totalIncludedAdvancedItemsCount = useMemo(
    () => getTotalIncludedAdvancedItemsCount(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const pages = useMemo(
    () => getDocumentPages(builder.workingTemplate),
    [builder.workingTemplate],
  );

  const createSolicitudPayload = useMemo(
    () =>
      buildCreateSolicitudPayload({
        selectedCompanyId: builder.selectedCompanyId,
        selectedRequestTypeId: builder.selectedRequestTypeId,
        cutoffDate: builder.cutoffDate,
        generationDate: builder.generationDate,
        responsible: builder.responsible,
        workingTemplate: builder.workingTemplate,
      }),
    [
      builder.selectedCompanyId,
      builder.selectedRequestTypeId,
      builder.cutoffDate,
      builder.generationDate,
      builder.responsible,
      builder.workingTemplate,
    ],
  );

  if (!selectedCompany) {
    return (
      <section className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        No hay clientes disponibles para crear solicitudes.
      </section>
    );
  }

  return (
    <main className="space-y-5">
      <RequestBuilderHeader
        selectedCompanyId={selectedCompany.id}
        projectedReference={projectedReference}
      />

      <RequestControls
        companies={companies}
        requestTypes={requestTypes}
        selectedCompanyId={builder.selectedCompanyId}
        selectedRequestTypeId={builder.selectedRequestTypeId}
        cutoffDate={builder.cutoffDate}
        responsible={builder.responsible}
        isEditingResponsible={builder.isEditingResponsible}
        hasTemplateCustomizations={
          totalExcludedBaseItemsCount > 0 || totalIncludedAdvancedItemsCount > 0
        }
        onCompanyChange={builder.handleCompanyChange}
        onRequestTypeChange={builder.handleRequestTypeChange}
        onCutoffDateChange={builder.handleCutoffDateChange}
        onStartEditingResponsible={builder.startEditingResponsible}
        onStopEditingResponsible={builder.stopEditingResponsible}
        onResponsibleChange={builder.handleResponsibleChange}
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.82fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.86fr)]">
        <div className="min-w-0">
          {!editingCategory ? (
            <div key="summary-panel" className="rb-panel-swap">
              <RequestCategorySummaryPanel
                template={builder.workingTemplate}
                categoryStats={categoryStats}
                totalBaseItemsCount={totalBaseItemsCount}
                totalIncludedItemsCount={totalIncludedItemsCount}
                totalExcludedBaseItemsCount={totalExcludedBaseItemsCount}
                totalIncludedAdvancedItemsCount={
                  totalIncludedAdvancedItemsCount
                }
                onEditCategory={builder.setEditingCategoryId}
              />
            </div>
          ) : (
            <div
              key={`editor-panel-${editingCategory.id}`}
              className="rb-panel-swap"
            >
              <RequestCategoryEditorPanel
                category={editingCategory}
                onBack={() => builder.setEditingCategoryId(null)}
                onToggleItem={builder.toggleItem}
                onAdvancedItemTextChange={builder.updateAdvancedItemText}
                onAddAdvancedItem={builder.addAdvancedItem}
                onRemoveAdvancedItem={builder.removeAdvancedItem}
                onResetCategoryToBase={builder.resetCategoryToBase}
              />
            </div>
          )}
        </div>

        <RequestDocumentPreviewPanel
          pages={pages}
          selectedCompany={selectedCompany}
          template={builder.workingTemplate}
          projectedReference={projectedReference}
          generationDate={builder.generationDate}
          cutoffDate={builder.cutoffDate}
          responsible={builder.responsible}
          isGenerating={generation.isGenerating}
          generationPhase={generation.generationPhase}
          generateError={generation.generateError}
          generateResult={generation.generateResult}
          userRole={userRole}
          onOpenPreview={() => setIsPreviewOpen(true)}
          onGenerateSolicitud={() =>
            generation.handleGenerateSolicitud(createSolicitudPayload)
          }
        />
      </section>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pages={pages}
        selectedCompany={selectedCompany}
        template={builder.workingTemplate}
        projectedReference={projectedReference}
        generationDate={builder.generationDate}
        cutoffDate={builder.cutoffDate}
        responsible={builder.responsible}
      />
    </main>
  );
}
