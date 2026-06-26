import { CheckCircle2, FileText, Maximize2 } from "lucide-react";
import type {
  CompanyOption,
  DocumentBlock,
  RequestTemplate,
  Responsible,
} from "@/features/impulsa/request-types";
import DocumentPage from "@/components/document-preview/DocumentPage";
import type {
  GenerateResult,
  RequestGenerationPhase,
} from "./hooks/useRequestGeneration";
import RequestGenerationOverlay from "./RequestGenerationOverlay";
import RequestGenerationResult from "./RequestGenerationResult";

type RequestDocumentPreviewPanelProps = {
  pages: DocumentBlock[][];
  selectedCompany: CompanyOption;
  template: RequestTemplate;
  projectedReference: string;
  generationDate: string;
  cutoffDate: string;
  responsible: Responsible;
  isGenerating: boolean;
  generationPhase: RequestGenerationPhase;
  generateError: string | null;
  generateResult: GenerateResult | null;
  userRole?: string | null;
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
  generationPhase,
  generateError,
  generateResult,
  userRole,
  onOpenPreview,
  onGenerateSolicitud,
}: RequestDocumentPreviewPanelProps) {
  return (
    <aside className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <RequestGenerationOverlay
        isVisible={isGenerating}
        phase={generationPhase}
      />

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#041461]">
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
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
            onClick={onOpenPreview}
            aria-label="Abrir vista previa grande"
            disabled={isGenerating}
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ccba9] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isGenerating}
        onClick={onGenerateSolicitud}
      >
        <CheckCircle2 size={18} />
        {isGenerating ? "Procesando solicitud..." : "Generar solicitud"}
      </button>

      <p className="mt-2 text-center text-xs text-slate-400">
        Esta acción crea el radicado, genera el documento PDF, llama n8n y
        registra la respuesta de automatización.
      </p>

      <RequestGenerationResult
        result={generateResult}
        error={generateError}
        userRole={userRole}
      />
    </aside>
  );
}
