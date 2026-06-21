"use client";

import { X } from "lucide-react";
import type {
  CompanyOption,
  DocumentBlock,
  Responsible,
  RequestTemplate,
} from "@/features/impulsa/request-types";
import DocumentPage from "./DocumentPage";

type DocumentPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pages: DocumentBlock[][];
  selectedCompany: CompanyOption;
  template: RequestTemplate;
  projectedReference: string;
  generationDate: string;
  cutoffDate: string;
  responsible: Responsible;
};

const BRAND = {
  navy: "#001871",
};

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  pages,
  selectedCompany,
  template,
  projectedReference,
  generationDate,
  cutoffDate,
  responsible,
}: DocumentPreviewModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: BRAND.navy }}
            >
              Vista documental estimada
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Esta vista permite revisar estructura y contenido. La paginación
              final puede variar en el archivo DOCX generado.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            aria-label="Cerrar vista previa completa"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200 px-6 py-8">
          {pages.length === 0 && (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
              No hay contenido para previsualizar.
            </div>
          )}

          {pages.map((pageBlocks, index) => (
            <DocumentPage
              key={`modal-page-${index}`}
              pageIndex={index}
              totalPages={pages.length}
              blocks={pageBlocks}
              selectedCompany={selectedCompany}
              template={template}
              projectedReference={projectedReference}
              generationDate={generationDate}
              cutoffDate={cutoffDate}
              responsible={responsible}
              pageScale={1.75}
            />
          ))}
        </div>
      </div>
    </div>
  );
}