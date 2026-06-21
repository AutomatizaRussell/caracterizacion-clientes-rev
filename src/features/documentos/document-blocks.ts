import type {
  DocumentBlock,
  RequestTemplate,
} from "@/features/impulsa/request-types";
import {
  buildDocumentBlocksFromTemplate,
  estimateTextWeight,
} from "./document-view-model";

export { estimateTextWeight };

export function buildDocumentBlocks(params: {
  template: RequestTemplate;
}): DocumentBlock[] {
  return buildDocumentBlocksFromTemplate(params);
}