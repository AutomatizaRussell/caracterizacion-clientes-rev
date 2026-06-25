import { CheckCircle2, FileText, Maximize2 } from "lucide-react";
import type {
  CompanyOption,
  DocumentBlock,
  RequestTemplate,
  Responsible,
} from "@/features/impulsa/request-types";
import DocumentPage from "@/components/document-preview/DocumentPage";
import type { GenerateResult } from "./hooks/useRequestGeneration";

type RequestDocumentPreviewPanelProps = {
  pages: DocumentBlock[][];
  selectedCompany: CompanyOption;
  template: RequestTemplate;
  projectedReference: string;
  generationDate: string;
  cutoffDate: string;
  responsible: Responsible;
  isGenerating: boolean;
  generateError: string | null;
  generateResult: GenerateResult | null;
  onOpenPreview: () => void;
  onGenerateSolicitud: () => void;
};

export default function RequestDocumentPreviewPanel({
  pages,
  selectedCompany,
  template,
  projectedReference,
  generationDate,
  cutoffDate,
  responsible,
  isGenerating,
  generateError,
  generateResult,
  onOpenPreview,
  onGenerateSolicitud,
}: RequestDocumentPreviewPanelProps) {
  return (
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
            onClick={onOpenPreview}
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
            template={template}
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
        onClick={onGenerateSolicitud}
      >
        <CheckCircle2 size={18} />
        {isGenerating ? "Creando y enviando solicitud..." : "Generar solicitud"}
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
            <span className="font-bold">{generateResult.radicadoReference}</span>
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
                    <span className="font-semibold">{folder.folderName}</span>

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
  );
}
