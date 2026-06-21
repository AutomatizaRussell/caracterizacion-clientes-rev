import type { DocumentBlock } from "@/features/impulsa/request-types";
import type { DocumentViewModel } from "./document-view-model";

type RenderDocumentHtmlOptions = {
  backgroundImageDataUri: string;
};

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateForDocument(value: string | null | undefined) {
  if (!value) {
    return "fecha pendiente";
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getItemsAfterCategory(params: {
  blocks: DocumentBlock[];
  categoryIndex: number;
}) {
  const items: Extract<DocumentBlock, { type: "item" }>[] = [];

  for (
    let index = params.categoryIndex + 1;
    index < params.blocks.length;
    index += 1
  ) {
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

function renderDocumentBlock(block: DocumentBlock) {
  if (block.type === "category-title") {
    return `
      <h3 class="category-title">
        ${escapeHtml(block.text)}
      </h3>
    `;
  }

  if (block.type === "item") {
    const childrenHtml =
      block.children.length > 0
        ? `
          <ul class="item-children">
            ${block.children
              .map(
                (child, index) => `
                  <li class="item-child" data-child-index="${index}">
                    ${escapeHtml(child)}
                  </li>
                `,
              )
              .join("")}
          </ul>
        `
        : "";

    return `
      <li class="document-item">
        <span>${escapeHtml(block.text)}</span>
        ${childrenHtml}
      </li>
    `;
  }

  return `
    <p class="document-paragraph">
      ${escapeHtml(block.text)}
    </p>
  `;
}

function renderPageBlocks(blocks: DocumentBlock[]) {
  return blocks
    .map((block, blockIndex) => {
      if (block.type === "item") {
        return "";
      }

      if (block.type === "category-title") {
        const categoryItems = getItemsAfterCategory({
          blocks,
          categoryIndex: blockIndex,
        });

        return `
          <section class="category-section">
            ${renderDocumentBlock(block)}
            ${
              categoryItems.length > 0
                ? `
                  <ul class="document-items">
                    ${categoryItems
                      .map((item) => renderDocumentBlock(item))
                      .join("")}
                  </ul>
                `
                : ""
            }
          </section>
        `;
      }

      return renderDocumentBlock(block);
    })
    .join("");
}

function renderPage(params: {
  pageIndex: number;
  totalPages: number;
  blocks: DocumentBlock[];
  viewModel: DocumentViewModel;
}) {
  const isFirstPage = params.pageIndex === 0;
  const isLastPage = params.pageIndex === params.totalPages - 1;

  return `
    <div class="page-outer">
      <div class="page-frame">
        <div class="page-background">
          <div class="page-content">
            ${
              isFirstPage
                ? `
                  <div class="first-header">
                    <p>Medellín, ${escapeHtml(
                      formatDateForDocument(params.viewModel.generationDate),
                    )}</p>

                    <p class="reference-code">
                      ${escapeHtml(params.viewModel.projectedReference)}
                    </p>
                  </div>

                  <div class="recipient-block">
                    <p class="bold">Señores:</p>
                    <p class="bold">${escapeHtml(
                      params.viewModel.selectedCompany.name,
                    )}</p>
                  </div>

                  <p class="subject-line">
                    <span class="bold">ASUNTO: </span>
                    ${escapeHtml(params.viewModel.template.subject)}
                    <span class="bold">
                      ${escapeHtml(
                        formatDateForDocument(params.viewModel.cutoffDate),
                      )}.
                    </span>
                  </p>
                `
                : `
                  <div class="continuation-page">
                    Página ${params.pageIndex + 1} de ${params.totalPages}
                  </div>
                `
            }

            <div class="blocks">
              ${renderPageBlocks(params.blocks)}
            </div>

            ${
              isLastPage
                ? `
                  <div class="signature-block">
                    <p>Cordialmente,</p>

                    <div class="signature-content">
                      <p class="bold">${escapeHtml(
                        params.viewModel.responsible.name,
                      )}</p>
                      <p class="bold">${escapeHtml(
                        params.viewModel.responsible.role,
                      )}</p>
                      <p class="bold">
                        En representación de ${escapeHtml(
                          params.viewModel.responsible.firm,
                        )}
                      </p>
                    </div>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      </div>

      <p class="page-label">
        Página ${params.pageIndex + 1} de ${params.totalPages}
      </p>
    </div>
  `;
}

export function renderDocumentHtml(
  viewModel: DocumentViewModel,
  options: RenderDocumentHtmlOptions,
) {
  const pagesHtml = viewModel.pages
    .map((pageBlocks, index) =>
      renderPage({
        pageIndex: index,
        totalPages: viewModel.pages.length,
        blocks: pageBlocks,
        viewModel,
      }),
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(viewModel.projectedReference)}</title>

  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      padding: 32px 0;
    }

    .page-outer {
      width: 595px;
      margin: 0 auto 32px auto;
    }

    .page-frame {
      position: relative;
      width: 595px;
      height: 842px;
    }

    .page-background {
      position: absolute;
      inset: 0;
      width: 595px;
      height: 842px;
      overflow: hidden;
      background-color: #ffffff;
      background-image: url("${options.backgroundImageDataUri}");
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
      outline: 1px solid #e2e8f0;
    }

    .page-content {
      position: absolute;
      inset: 0;
      padding: 128px 96px 96px 58px;
    }

    .first-header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      margin-bottom: 28px;
      color: #0f172a;
      font-size: 11px;
      line-height: 20px;
    }

    .first-header p {
      margin: 0;
    }

    .reference-code {
      margin-right: 40px !important;
      margin-top: 40px !important;
      font-weight: 700;
      white-space: nowrap;
    }

    .recipient-block {
      margin-bottom: 20px;
      color: #0f172a;
      font-size: 11px;
      line-height: 20px;
    }

    .recipient-block p {
      margin: 0;
    }

    .subject-line {
      margin: 0 0 20px 0;
      color: #0f172a;
      font-size: 11px;
      line-height: 20px;
    }

    .bold {
      font-weight: 700;
    }

    .continuation-page {
      margin-bottom: 16px;
      text-align: right;
      color: #64748b;
      font-size: 10px;
    }

    .document-paragraph {
      margin: 0 0 12px 0;
      text-align: justify;
      font-size: 11px;
      line-height: 1.55;
      color: #0f172a;
    }

    .category-section {
      margin: 0;
    }

    .category-title {
      margin: 16px 0 8px 0;
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.3;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .document-items {
      margin: 0 0 12px 0;
      padding-left: 20px;
      list-style-type: disc;
    }

    .document-item {
      margin: 0 0 8px 0;
      padding-left: 4px;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.55;
    }

    .item-children {
      margin: 4px 0 0 0;
      padding-left: 20px;
      list-style-type: circle;
    }

    .item-child {
      margin: 0 0 4px 0;
      color: #1e293b;
      font-size: 10.5px;
      line-height: 1.5;
    }

    .signature-block {
      margin-top: 32px;
      color: #0f172a;
      font-size: 11px;
      line-height: 20px;
    }

    .signature-block p {
      margin: 0;
    }

    .signature-content {
      margin-top: 32px;
    }

    .page-label {
      margin: 8px 0 0 0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }

    @media print {
      html,
      body {
        width: 210mm;
        background: #ffffff;
        padding: 0;
      }

      .page-outer {
        width: 210mm;
        height: 297mm;
        margin: 0;
        page-break-after: always;
      }

      .page-frame,
      .page-background {
        width: 210mm;
        height: 297mm;
        box-shadow: none;
        outline: none;
      }

      .page-content {
        padding: 45.16mm 33.87mm 33.87mm 20.47mm;
      }

      .page-label {
        display: none;
      }
    }
  </style>
</head>

<body>
  ${pagesHtml}
</body>
</html>`;
}