import type {
  CompanyOption,
  DocumentBlock as DocumentBlockType,
  Responsible,
  RequestTemplate,
} from "@/features/impulsa/request-types";
import { formatDateForDocument } from "@/features/documentos/document-formatting";
import DocumentBlock from "./DocumentBlock";

type DocumentPageProps = {
  pageIndex: number;
  totalPages: number;
  blocks: DocumentBlockType[];
  selectedCompany: CompanyOption;
  template: RequestTemplate;
  projectedReference: string;
  generationDate: string;
  cutoffDate: string;
  responsible: Responsible;
  pageScale?: number;
};

function getItemsAfterCategory(params: {
  blocks: DocumentBlockType[];
  categoryIndex: number;
}) {
  const items: Extract<DocumentBlockType, { type: "item" }>[] = [];

  for (let index = params.categoryIndex + 1; index < params.blocks.length; index += 1) {
    const nextBlock = params.blocks[index];

    if (nextBlock.type === "category-title") {
      break;
    }

    if (nextBlock.type === "paragraph") {
      break;
    }

    if (nextBlock.type === "item") {
      items.push(nextBlock);
    }
  }

  return items;
}

export default function DocumentPage({
  pageIndex,
  totalPages,
  blocks,
  selectedCompany,
  template,
  projectedReference,
  generationDate,
  cutoffDate,
  responsible,
  pageScale = 1,
}: DocumentPageProps) {
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  return (
    <div
      className="mx-auto mb-8 flex flex-col items-center"
      style={{
        width: `${595 * pageScale}px`,
      }}
    >
      <div
        className="relative"
        style={{
          width: `${595 * pageScale}px`,
          height: `${842 * pageScale}px`,
        }}
      >
        <div
          className="absolute left-0 top-0 h-[842px] w-[595px] origin-top-left overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200"
          style={{
            transform: `scale(${pageScale})`,
            backgroundImage: "url('/rb-page-bg.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 px-[58px] pb-[96px] pr-[96px] pt-[128px]">
            {isFirstPage && (
              <>
                <div className="mb-7 grid grid-cols-[1fr_auto] gap-6 text-[11px] leading-5 text-slate-900">
                  <p>Medellín, {formatDateForDocument(generationDate)}</p>

                  <p className="mr-10 mt-10 font-bold">
                    {projectedReference}
                  </p>
                </div>

                <div className="mb-5 text-[11px] leading-5 text-slate-900">
                  <p className="font-bold">Señores:</p>
                  <p className="font-bold">{selectedCompany.name}</p>
                </div>

                <p className="mb-5 text-[11px] leading-5 text-slate-900">
                  <span className="font-bold">ASUNTO: </span>
                  {template.subject}{" "}
                  <span className="font-bold">
                    {formatDateForDocument(cutoffDate)}.
                  </span>
                </p>
              </>
            )}

            {!isFirstPage && (
              <div className="mb-4 text-right text-[10px] text-slate-500">
                Página {pageIndex + 1} de {totalPages}
              </div>
            )}

            <div>
              {blocks.map((block, blockIndex) => {
                if (block.type === "item") {
                  return null;
                }

                if (block.type === "category-title") {
                  const categoryItems = getItemsAfterCategory({
                    blocks,
                    categoryIndex: blockIndex,
                  });

                  return (
                    <section key={block.id}>
                      <DocumentBlock block={block} />

                      {categoryItems.length > 0 && (
                        <ul className="mb-3 list-disc pl-5">
                          {categoryItems.map((item) => (
                            <DocumentBlock key={item.id} block={item} />
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                }

                return <DocumentBlock key={block.id} block={block} />;
              })}
            </div>

            {isLastPage && (
              <div className="mt-8 text-[11px] leading-5 text-slate-900">
                <p>Cordialmente,</p>

                <div className="mt-8">
                  <p className="font-bold">{responsible.name}</p>
                  <p className="font-bold">{responsible.role}</p>
                  <p className="font-bold">
                    En representación de {responsible.firm}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Página {pageIndex + 1} de {totalPages}
      </p>
    </div>
  );
}