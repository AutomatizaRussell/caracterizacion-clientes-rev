"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, FileText, Maximize2 } from "lucide-react";
import {
  crearSolicitudDesdeBuilderAction,
  generarYEnviarSolicitudAction,
} from "@/app/solicitudes/crear/actions";
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
import {
  buildReference,
  getCurrentYear,
} from "@/features/impulsa/request-reference";
import { buildDocumentBlocks } from "@/features/documentos/document-blocks";
import { paginateBlocks } from "@/features/documentos/document-pagination";
import DocumentPage from "@/components/document-preview/DocumentPage";
import DocumentPreviewModal from "@/components/document-preview/DocumentPreviewModal";
import RequestControls from "./RequestControls";
import RequestCategorySummaryPanel from "./RequestCategorySummaryPanel";
import RequestCategoryEditorPanel from "./RequestCategoryEditorPanel";

type RequestBuilderProps = {
  companies: CompanyOption[];
  initialCompanyId?: string | null;
  initialCutoffDate?: string;
  initialResponsible?: Responsible;
};

type GenerateRequestFolder = {
  key: string;
  title: string;
  folderName: string;
  folderUrl?: string;
  informacionSuministradaFolderUrl?: string;
};

type GenerateResult = {
  solicitudId: string;
  radicadoId: string;
  radicadoReference: string;
  portalUrl: string;
  totalItems: number;
  n8nExecutionId?: string;
  htmlUrl?: string;
  pdfUrl?: string;
  controlInternoFolderUrl?: string;
  solicitudesInformacionFolderUrl?: string;
  requestFolders?: GenerateRequestFolder[];
  emailMessageId?: string;
};

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

export default function RequestBuilder({
  companies,
  initialCompanyId = null,
  initialCutoffDate,
  initialResponsible,
}: RequestBuilderProps) {
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ??
    companies[0];

  const editingCategory = editingCategoryId
    ? workingTemplate.categories.find(
        (category) => category.id === editingCategoryId,
      ) ?? null
    : null;

  const projectedReference = useMemo(() => {
    return buildReference({
      prefix: workingTemplate.prefix,
      consecutive: 1,
      year: getCurrentYear(),
      companyCode: selectedCompany?.shortName ?? "CLIENTE",
    });
  }, [selectedCompany?.shortName, workingTemplate.prefix]);

  const categoryStats = useMemo(() => {
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
  }, [workingTemplate]);

  const totalIncludedItemsCount = useMemo(() => {
    return workingTemplate.categories.reduce((total, category) => {
      return total + category.items.filter((item) => item.selected).length;
    }, 0);
  }, [workingTemplate]);

  const totalBaseItemsCount = useMemo(() => {
    return workingTemplate.categories.reduce((total, category) => {
      return (
        total + category.items.filter((item) => item.mode === "base").length
      );
    }, 0);
  }, [workingTemplate]);

  const totalExcludedBaseItemsCount = useMemo(() => {
    return workingTemplate.categories.reduce((total, category) => {
      return (
        total +
        category.items.filter(
          (item) => item.mode === "base" && !item.selected,
        ).length
      );
    }, 0);
  }, [workingTemplate]);

  const totalIncludedAdvancedItemsCount = useMemo(() => {
    return workingTemplate.categories.reduce((total, category) => {
      return (
        total +
        category.items.filter(
          (item) => item.mode === "advanced" && item.selected,
        ).length
      );
    }, 0);
  }, [workingTemplate]);

  const documentBlocks = useMemo(() => {
    return buildDocumentBlocks({
      template: workingTemplate,
    });
  }, [workingTemplate]);

  const pages = useMemo(() => {
    return paginateBlocks(documentBlocks);
  }, [documentBlocks]);

  function clearGenerationState() {
    setGenerateResult(null);
    setGenerateError(null);
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
    clearGenerationState();
  }

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId);
    clearGenerationState();
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

    clearGenerationState();
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

    clearGenerationState();
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

    clearGenerationState();
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

    clearGenerationState();
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

    clearGenerationState();
  }

  function buildCreateSolicitudPayload() {
    return {
      empresaRefId: selectedCompanyId,
      requestTypeId: selectedRequestTypeId,
      cutoffDate,
      generationDate,
      responsible,
      categories: workingTemplate.categories.map((category) => ({
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

  function handleGenerateSolicitud() {
    setGenerateError(null);
    setGenerateResult(null);

    startGeneratingTransition(async () => {
      const createResult = await crearSolicitudDesdeBuilderAction(
        buildCreateSolicitudPayload(),
      );

      if (!createResult.ok) {
        setGenerateError(createResult.message);
        return;
      }

      const sendResult = await generarYEnviarSolicitudAction({
        solicitudId: createResult.solicitudId,
      });

      if (!sendResult.ok) {
        setGenerateResult({
          solicitudId: createResult.solicitudId,
          radicadoId: createResult.radicadoId,
          radicadoReference: createResult.radicadoReference,
          portalUrl: createResult.portalUrl,
          totalItems: createResult.totalItems,
        });

        setGenerateError(
          `La solicitud fue creada, pero falló la generación/envío por n8n: ${sendResult.message}`,
        );

        return;
      }

      setGenerateResult({
        solicitudId: createResult.solicitudId,
        radicadoId: createResult.radicadoId,
        radicadoReference: createResult.radicadoReference,
        portalUrl: createResult.portalUrl,
        totalItems: createResult.totalItems,
        n8nExecutionId: sendResult.executionId,
        htmlUrl: sendResult.htmlUrl,
        pdfUrl: sendResult.pdfUrl,
        controlInternoFolderUrl: sendResult.controlInternoFolderUrl,
        solicitudesInformacionFolderUrl:
          sendResult.solicitudesInformacionFolderUrl,
        requestFolders: sendResult.requestFolders,
        emailMessageId: sendResult.emailMessageId,
      });
    });
  }

  if (!selectedCompany) {
    return (
      <section className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        No hay clientes disponibles para crear solicitudes.
      </section>
    );
  }

  return (
    <main className="space-y-5">
      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Radicado proyectado
            </p>

            <p className="mt-1 truncate text-lg font-bold tracking-wide text-[#001871]">
              {projectedReference}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-xs text-slate-400 sm:max-w-[360px] sm:text-right">
              El consecutivo real se asignará al generar la solicitud.
            </p>

            <Link
              href={`/clientes/${selectedCompany.id}`}
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              Volver a ficha 360
            </Link>
          </div>
        </div>
      </section>

      <RequestControls
    companies={companies}
        requestTypes={requestTypes}
        selectedCompanyId={selectedCompanyId}
        selectedRequestTypeId={selectedRequestTypeId}
        cutoffDate={cutoffDate}
        responsible={responsible}
        isEditingResponsible={isEditingResponsible}
        onCompanyChange={handleCompanyChange}
        onRequestTypeChange={handleRequestTypeChange}
        onCutoffDateChange={(value) => {
          setCutoffDate(value);
          clearGenerationState();
        }}
        onStartEditingResponsible={() => setIsEditingResponsible(true)}
        onStopEditingResponsible={() => setIsEditingResponsible(false)}
        onResponsibleChange={(value) => {
          setResponsible(value);
          clearGenerationState();
        }}
      />

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(480px,0.9fr)]">
        <div className="min-w-0">
          {!editingCategory ? (
            <div key="summary-panel" className="rb-panel-swap">
              <RequestCategorySummaryPanel
                template={workingTemplate}
                categoryStats={categoryStats}
                totalBaseItemsCount={totalBaseItemsCount}
                totalIncludedItemsCount={totalIncludedItemsCount}
                totalExcludedBaseItemsCount={totalExcludedBaseItemsCount}
                totalIncludedAdvancedItemsCount={
                  totalIncludedAdvancedItemsCount
                }
                onEditCategory={setEditingCategoryId}
              />
            </div>
          ) : (
            <div
              key={`editor-panel-${editingCategory.id}`}
              className="rb-panel-swap"
            >
              <RequestCategoryEditorPanel
                category={editingCategory}
                onBack={() => setEditingCategoryId(null)}
                onToggleItem={toggleItem}
                onAdvancedItemTextChange={updateAdvancedItemText}
                onAddAdvancedItem={addAdvancedItem}
                onRemoveAdvancedItem={removeAdvancedItem}
                onResetCategoryToBase={resetCategoryToBase}
              />
            </div>
          )}
        </div>

        <aside className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#001871]">
                Vista documental estimada
              </h2>

              <p className="text-sm text-slate-500">
                Vista previa de estructura y contenido.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="text-slate-400" size={22} />

              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsPreviewOpen(true)}
                aria-label="Abrir vista previa grande"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="h-[calc(100vh-330px)] overflow-auto rounded-xl bg-slate-200 px-4 py-6">
            {pages.map((pageBlocks, index) => (
              <DocumentPage
                key={`page-${index}`}
                pageIndex={index}
                totalPages={pages.length}
                blocks={pageBlocks}
                selectedCompany={selectedCompany}
                template={workingTemplate}
                projectedReference={projectedReference}
                generationDate={generationDate}
                cutoffDate={cutoffDate}
                responsible={responsible}
                pageScale={0.82}
              />
            ))}
          </div>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#001871] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isGenerating}
            onClick={handleGenerateSolicitud}
          >
            <CheckCircle2 size={18} />
            {isGenerating
              ? "Creando y enviando solicitud..."
              : "Generar solicitud"}
          </button>

          <p className="mt-2 text-center text-xs text-slate-400">
            Esta acción crea el radicado, genera el documento PDF, llama n8n y
            registra la respuesta de automatización.
          </p>

          {generateError && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              {generateError}
            </div>
          )}

          {generateResult && (
            <div className="mt-4 rounded-xl bg-[#00bfb3]/10 px-4 py-3 text-sm text-[#008b83] ring-1 ring-[#00bfb3]/20">
              <p className="font-bold">Solicitud procesada.</p>

              <p className="mt-1">
                Radicado:{" "}
                <span className="font-bold">
                  {generateResult.radicadoReference}
                </span>
              </p>

              <p className="mt-1">
                Ítems incluidos:{" "}
                <span className="font-bold">{generateResult.totalItems}</span>
              </p>

              <p className="mt-2 break-all text-xs text-[#006f68]">
                Portal cliente: {generateResult.portalUrl}
              </p>

              {generateResult.n8nExecutionId && (
                <p className="mt-2 break-all text-xs text-[#006f68]">
                  Ejecución n8n: {generateResult.n8nExecutionId}
                </p>
              )}

              {generateResult.controlInternoFolderUrl && (
                <p className="mt-2 break-all text-xs">
                  Control Interno:{" "}
                  <a
                    href={generateResult.controlInternoFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline underline-offset-4"
                  >
                    Abrir carpeta
                  </a>
                </p>
              )}

              {generateResult.solicitudesInformacionFolderUrl && (
                <p className="mt-2 break-all text-xs">
                  Solicitudes de información:{" "}
                  <a
                    href={generateResult.solicitudesInformacionFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline underline-offset-4"
                  >
                    Abrir carpeta
                  </a>
                </p>
              )}

              {generateResult.requestFolders?.length ? (
                <div className="mt-3 rounded-lg bg-white/60 p-3 text-xs text-[#006f68] ring-1 ring-[#00bfb3]/20">
                  <p className="font-bold">
                    Carpetas para información suministrada:
                  </p>

                  <ul className="mt-2 space-y-1">
                    {generateResult.requestFolders.map((folder) => (
                      <li key={folder.key} className="break-all">
                        <span className="font-semibold">
                          {folder.folderName}
                        </span>

                        {folder.informacionSuministradaFolderUrl && (
                          <>
                            {" "}
                            —{" "}
                            <a
                              href={folder.informacionSuministradaFolderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold underline underline-offset-4"
                            >
                              Información suministrada
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {generateResult.htmlUrl && (
                <p className="mt-2 break-all text-xs">
                  HTML:{" "}
                  <a
                    href={generateResult.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline underline-offset-4"
                  >
                    Abrir HTML
                  </a>
                </p>
              )}

              {generateResult.pdfUrl && (
                <p className="mt-2 break-all text-xs">
                  PDF:{" "}
                  <a
                    href={generateResult.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline underline-offset-4"
                  >
                    Abrir PDF
                  </a>
                </p>
              )}

              {generateResult.emailMessageId && (
                <p className="mt-2 break-all text-xs text-[#006f68]">
                  Correo enviado. Message ID: {generateResult.emailMessageId}
                </p>
              )}
            </div>
          )}
        </aside>
      </section>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pages={pages}
        selectedCompany={selectedCompany}
        template={workingTemplate}
        projectedReference={projectedReference}
        generationDate={generationDate}
        cutoffDate={cutoffDate}
        responsible={responsible}
      />
    </main>
  );
}