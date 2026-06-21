import { prisma } from "@/lib/prisma";
import { getRbPageBackgroundDataUri } from "@/features/documentos/document-assets.server";
import {
  buildDocumentViewModelFromSolicitud,
  type SolicitudDocumentInput,
} from "@/features/documentos/document-view-model";
import { renderDocumentHtml } from "@/features/documentos/document-html-renderer";

type SolicitudDocumentItem = {
  id: string;
  orderIndex: number;
  categoryId: string;
  categoryTitle: string;
  itemMode: "BASE" | "ADVANCED";
  text: string;
  childrenJson: unknown;
  tableJson: unknown;
};

export type SolicitudDocumentData = {
  solicitudId: string;
  radicadoReference: string;
  clienteNombre: string;
  clienteNit: string;
  requestTypeName: string;
  subject: string;
  cutoffDate: Date;
  generationDate: Date;
  responsibleName: string;
  responsibleRole: string;
  responsibleFirm: string;
  clientContactName: string | null;
  clientContactEmail: string | null;
  portalUrl: string | null;
  items: SolicitudDocumentItem[];
};

function readChildren(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Obtiene únicamente los campos necesarios para construir el documento.
 *
 * Antes se usaba include amplio en radicado/items. Aquí se usa select explícito
 * para reducir payload, serialización y memoria.
 */
export async function getSolicitudDocumentData(
  solicitudId: string,
): Promise<SolicitudDocumentData> {
  const solicitud = await prisma.solicitud.findUnique({
    where: {
      id: solicitudId,
    },
    select: {
      id: true,
      requestTypeName: true,
      subject: true,
      cutoffDate: true,
      generationDate: true,
      responsibleName: true,
      responsibleRole: true,
      responsibleFirm: true,
      clientContactName: true,
      clientContactEmail: true,
      portalUrl: true,
      radicado: {
        select: {
          reference: true,
        },
      },
      empresa: {
        select: {
          razonSocial: true,
          nit: true,
        },
      },
      items: {
        orderBy: {
          orderIndex: "asc",
        },
        select: {
          id: true,
          orderIndex: true,
          categoryId: true,
          categoryTitle: true,
          itemMode: true,
          text: true,
          childrenJson: true,
          tableJson: true,
        },
      },
    },
  });

  if (!solicitud) {
    throw new Error("Solicitud no encontrada.");
  }

  return {
    solicitudId: solicitud.id,
    radicadoReference: solicitud.radicado.reference,
    clienteNombre: solicitud.empresa.razonSocial,
    clienteNit: solicitud.empresa.nit,
    requestTypeName: solicitud.requestTypeName,
    subject: solicitud.subject,
    cutoffDate: solicitud.cutoffDate,
    generationDate: solicitud.generationDate,
    responsibleName: solicitud.responsibleName,
    responsibleRole: solicitud.responsibleRole,
    responsibleFirm: solicitud.responsibleFirm,
    clientContactName: solicitud.clientContactName,
    clientContactEmail: solicitud.clientContactEmail,
    portalUrl: solicitud.portalUrl,
    items: solicitud.items.map((item) => ({
      id: item.id,
      orderIndex: item.orderIndex,
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      itemMode: item.itemMode,
      text: item.text,
      childrenJson: item.childrenJson,
      tableJson: item.tableJson,
    })),
  };
}

function mapSolicitudDataToDocumentInput(
  data: SolicitudDocumentData,
): SolicitudDocumentInput {
  return {
    radicadoReference: data.radicadoReference,
    clienteNombre: data.clienteNombre,
    clienteNit: data.clienteNit,
    requestTypeName: data.requestTypeName,
    subject: data.subject,
    cutoffDate: data.cutoffDate,
    generationDate: data.generationDate,
    responsibleName: data.responsibleName,
    responsibleRole: data.responsibleRole,
    responsibleFirm: data.responsibleFirm,
    portalUrl: data.portalUrl,
    items: data.items.map((item) => ({
      id: item.id,
      orderIndex: item.orderIndex,
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      text: item.text,
      children: readChildren(item.childrenJson),
    })),
  };
}

export async function buildSolicitudDocumentHtml(data: SolicitudDocumentData) {
  const backgroundImageDataUri = await getRbPageBackgroundDataUri();

  const viewModel = buildDocumentViewModelFromSolicitud(
    mapSolicitudDataToDocumentInput(data),
  );

  return renderDocumentHtml(viewModel, {
    backgroundImageDataUri,
  });
}

export async function buildSolicitudDocumentHtmlById(solicitudId: string) {
  const data = await getSolicitudDocumentData(solicitudId);

  return {
    data,
    html: await buildSolicitudDocumentHtml(data),
  };
}