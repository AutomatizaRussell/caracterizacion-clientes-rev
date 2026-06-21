import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type PortalSolicitudItem = {
  id: string;
  orderIndex: number;
  categoryId: string;
  categoryTitle: string;
  templateItemId: string | null;
  itemMode: "BASE" | "ADVANCED";
  text: string;
  children: string[];
  tableJson: unknown;
  status: string;
  clientResponseText: string | null;
  clientSubmittedAt: Date | null;
};

export type PortalSolicitudCategoria = {
  id: string;
  title: string;
  items: PortalSolicitudItem[];
};

export type PortalSolicitudData = {
  token: string;
  tokenId: string;
  solicitudId: string;
  radicadoReference: string;
  empresaNombre: string;
  empresaNit: string;
  requestTypeName: string;
  subject: string;
  cutoffDate: Date;
  generationDate: Date;
  responsibleName: string;
  responsibleRole: string;
  responsibleFirm: string;
  clientContactName: string | null;
  clientContactEmail: string | null;
  status: string;
  categories: PortalSolicitudCategoria[];
};

export type GuardarRespuestaPortalInput = {
  token: string;
  responses: {
    itemId: string;
    responseText: string;
  }[];
};

export type GuardarRespuestaPortalResult = {
  solicitudId: string;
  updatedItems: number;
  submittedAt: Date;
};

function hashPortalToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeToken(token: string) {
  const normalized = String(token ?? "").trim();

  if (!normalized) {
    throw new Error("Token inválido.");
  }

  return normalized;
}

function normalizeResponseText(value: string) {
  return String(value ?? "").trim();
}

function readChildren(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupItemsByCategory(items: PortalSolicitudItem[]) {
  const groups = new Map<string, PortalSolicitudItem[]>();

  for (const item of items) {
    const currentItems = groups.get(item.categoryTitle) ?? [];
    currentItems.push(item);
    groups.set(item.categoryTitle, currentItems);
  }

  return Array.from(groups.entries()).map(([title, categoryItems]) => ({
    id: categoryItems[0]?.categoryId ?? title,
    title,
    items: categoryItems.sort((a, b) => a.orderIndex - b.orderIndex),
  }));
}

async function getValidSolicitudToken(token: string) {
  const normalizedToken = normalizeToken(token);
  const tokenHash = hashPortalToken(normalizedToken);

  const solicitudToken = await prisma.solicitudTokenCliente.findFirst({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      clientEmail: true,
      openedAt: true,
      revokedAt: true,
      expiresAt: true,
      solicitud: {
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
          status: true,
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
              templateItemId: true,
              itemMode: true,
              text: true,
              childrenJson: true,
              tableJson: true,
              status: true,
              clientResponseText: true,
              clientSubmittedAt: true,
            },
          },
        },
      },
    },
  });

  if (!solicitudToken) {
    throw new Error("El enlace de la solicitud no es válido.");
  }

  if (solicitudToken.revokedAt) {
    throw new Error("El enlace de la solicitud fue revocado.");
  }

  if (
    solicitudToken.expiresAt &&
    solicitudToken.expiresAt.getTime() < Date.now()
  ) {
    throw new Error("El enlace de la solicitud expiró.");
  }

  return {
    normalizedToken,
    solicitudToken,
  };
}

export async function getPortalSolicitudByToken(
  token: string,
): Promise<PortalSolicitudData> {
  const { normalizedToken, solicitudToken } = await getValidSolicitudToken(
    token,
  );

  if (!solicitudToken.openedAt) {
    await prisma.$transaction([
      prisma.solicitudTokenCliente.update({
        where: {
          id: solicitudToken.id,
        },
        data: {
          openedAt: new Date(),
        },
      }),
      prisma.solicitudEvento.create({
        data: {
          solicitudId: solicitudToken.solicitud.id,
          eventType: "CLIENT_OPENED",
          actorType: "CLIENTE",
          message: "El cliente abrió el enlace del portal.",
          payloadJson: {
            tokenId: solicitudToken.id,
            clientEmail: solicitudToken.clientEmail,
          },
        },
      }),
    ]);
  }

  const items: PortalSolicitudItem[] = solicitudToken.solicitud.items.map(
    (item) => ({
      id: item.id,
      orderIndex: item.orderIndex,
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      templateItemId: item.templateItemId,
      itemMode: item.itemMode,
      text: item.text,
      children: readChildren(item.childrenJson),
      tableJson: item.tableJson,
      status: item.status,
      clientResponseText: item.clientResponseText,
      clientSubmittedAt: item.clientSubmittedAt,
    }),
  );

  return {
    token: normalizedToken,
    tokenId: solicitudToken.id,
    solicitudId: solicitudToken.solicitud.id,
    radicadoReference: solicitudToken.solicitud.radicado.reference,
    empresaNombre: solicitudToken.solicitud.empresa.razonSocial,
    empresaNit: solicitudToken.solicitud.empresa.nit,
    requestTypeName: solicitudToken.solicitud.requestTypeName,
    subject: solicitudToken.solicitud.subject,
    cutoffDate: solicitudToken.solicitud.cutoffDate,
    generationDate: solicitudToken.solicitud.generationDate,
    responsibleName: solicitudToken.solicitud.responsibleName,
    responsibleRole: solicitudToken.solicitud.responsibleRole,
    responsibleFirm: solicitudToken.solicitud.responsibleFirm,
    clientContactName: solicitudToken.solicitud.clientContactName,
    clientContactEmail: solicitudToken.solicitud.clientContactEmail,
    status: solicitudToken.solicitud.status,
    categories: groupItemsByCategory(items),
  };
}

export async function guardarRespuestasPortalCliente(
  input: GuardarRespuestaPortalInput,
): Promise<GuardarRespuestaPortalResult> {
  const { solicitudToken } = await getValidSolicitudToken(input.token);

  const submittedAt = new Date();
  const solicitudId = solicitudToken.solicitud.id;

  const normalizedResponses = input.responses
    .map((response) => ({
      itemId: String(response.itemId ?? "").trim(),
      responseText: normalizeResponseText(response.responseText),
    }))
    .filter((response) => response.itemId && response.responseText);

  if (normalizedResponses.length === 0) {
    throw new Error("Debe diligenciar al menos una respuesta.");
  }

  const validItemIds = new Set(
    solicitudToken.solicitud.items.map((item) => item.id),
  );

  const invalidItemIds = normalizedResponses
    .map((response) => response.itemId)
    .filter((itemId) => !validItemIds.has(itemId));

  if (invalidItemIds.length > 0) {
    throw new Error("La solicitud contiene ítems inválidos.");
  }

  await prisma.$transaction([
    ...normalizedResponses.map((response) =>
      prisma.solicitudItem.update({
        where: {
          id: response.itemId,
        },
        data: {
          clientResponseText: response.responseText,
          clientSubmittedAt: submittedAt,
          status: "SUBMITTED",
        },
      }),
    ),
    prisma.solicitudTokenCliente.update({
      where: {
        id: solicitudToken.id,
      },
      data: {
        submittedAt,
      },
    }),
    prisma.solicitud.update({
      where: {
        id: solicitudId,
      },
      data: {
        status: "CLIENT_SUBMITTED",
      },
    }),
    prisma.solicitudEvento.create({
      data: {
        solicitudId,
        eventType: "CLIENT_SUBMITTED",
        actorType: "CLIENTE",
        message: "El cliente envió respuestas desde el portal.",
        payloadJson: {
          tokenId: solicitudToken.id,
          clientEmail: solicitudToken.clientEmail,
          updatedItems: normalizedResponses.length,
          submittedAt: submittedAt.toISOString(),
          itemIds: normalizedResponses.map((response) => response.itemId),
        },
      },
    }),
  ]);

  return {
    solicitudId,
    updatedItems: normalizedResponses.length,
    submittedAt,
  };
}