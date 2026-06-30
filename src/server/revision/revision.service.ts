import type { Prisma } from '@/generated/prisma/client';
import { EstadoSolicitudItem } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { getClienteVisibilityWhere } from '@/server/clientes-visibilidad';
import { buildLocalMatchSuggestions } from './revision-ai.service';
import { getReviewLevelForRole, type ItemReviewStatus, type ReviewLevel } from './revision-types';

function toPrismaJsonOrUndefined(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return undefined;
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

export async function getVisibleSolicitudForRevision(params: { empleadoId: string; solicitudId: string }) {
  const visibilityWhere = await getClienteVisibilityWhere(params.empleadoId);
  if (!visibilityWhere) return null;

  return prisma.solicitud.findFirst({
    where: { id: params.solicitudId, empresa: visibilityWhere },
    select: {
      id: true,
      status: true,
      requestTypeName: true,
      subject: true,
      portalUrl: true,
      clientContactEmail: true,
      empresaRefId: true,
      empresa: { select: { id: true, razonSocial: true, nit: true } },
      radicado: { select: { reference: true } },
      items: {
        /*
         * La asociación archivo-ítem solo debe ofrecer ítems que el cliente
         * marcó como cubiertos en el portal. Mostrar todos los ítems de la
         * solicitud vuelve inmanejable la vista y permite asociar soportes a
         * requerimientos que el cliente no declaró entregados.
         *
         * SUBMITTED es el estado que deja el portal cuando el cliente marca
         * el check. Se conservan estados posteriores para no perder el ítem si
         * en el futuro otro flujo actualiza estado durante revisión/cierre.
         */
        where: {
          status: {
            in: [
              EstadoSolicitudItem.SUBMITTED,
              EstadoSolicitudItem.UNDER_REVIEW,
              EstadoSolicitudItem.ACCEPTED,
              EstadoSolicitudItem.REJECTED,
            ],
          },
        },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          categoryId: true,
          categoryTitle: true,
          text: true,
          status: true,
        },
      },
      portalAdjuntos: {
        orderBy: { uploadedAt: 'asc' },
        select: {
          id: true,
          originalFileName: true,
          storedFileName: true,
          mimeType: true,
          sizeBytes: true,
          oneDriveUrl: true,
          oneDriveItemId: true,
          uploadedAt: true,
        },
      },
    },
  });
}

export async function getRevisionInbox(empleadoId: string) {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);
  if (!visibilityWhere) return [];

  return prisma.solicitud.findMany({
    where: {
      empresa: visibilityWhere,
      status: { in: ['CLIENT_SUBMITTED', 'UNDER_REVIEW'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 150,
    select: {
      id: true,
      status: true,
      updatedAt: true,
      requestTypeName: true,
      empresa: { select: { id: true, razonSocial: true, nit: true } },
      radicado: { select: { reference: true } },
      items: { select: { id: true, status: true } },
      portalAdjuntos: { select: { id: true } },
    },
  });
}

export async function getAssociationWorkspace(params: { empleadoId: string; solicitudId: string }) {
  const solicitud = await getVisibleSolicitudForRevision(params);
  if (!solicitud) return null;

  const matches = await prisma.solicitudAdjuntoItemMatch.findMany({
    where: { solicitudId: solicitud.id },
    orderBy: { createdAt: 'asc' },
  });

  return { solicitud, matches };
}

export async function generateLocalAssociationSuggestions(params: { empleadoId: string; solicitudId: string }) {
  const workspace = await getAssociationWorkspace(params);
  if (!workspace) throw new Error('Solicitud no encontrada o no visible.');

  const { solicitud, matches } = workspace;
  const alreadyMatchedAdjuntos = new Set(
    matches
      .filter((match) => !['REJECTED_MATCH', 'IGNORED'].includes(match.matchStatus))
      .map((match) => match.adjuntoId),
  );

  const suggestions = buildLocalMatchSuggestions({
    items: solicitud.items.map((item) => ({ id: item.id, text: item.text, categoryTitle: item.categoryTitle })),
    files: solicitud.portalAdjuntos
      .filter((adjunto) => !alreadyMatchedAdjuntos.has(adjunto.id))
      .map((adjunto) => ({ id: adjunto.id, originalFileName: adjunto.originalFileName })),
  });

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const suggestion of suggestions) {
      if (!suggestion.itemId || suggestion.status === 'UNMATCHED') continue;

      await tx.solicitudAdjuntoItemMatch.create({
        data: {
          solicitudId: solicitud.id,
          itemId: suggestion.itemId,
          adjuntoId: suggestion.adjuntoId,
          matchStatus: suggestion.status,
          matchSource: 'AI',
          confidenceScore: suggestion.score,
          aiReason: suggestion.reason,
          aiWarningsJson: toPrismaJsonOrUndefined(suggestion.warnings),
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    await tx.solicitudEvento.create({
      data: {
        solicitudId: solicitud.id,
        eventType: 'REVIEW_STARTED',
        actorType: 'EMPLEADO',
        actorEmpleadoId: params.empleadoId,
        message: 'Se generaron sugerencias locales de asociación archivo-ítem.',
        payloadJson: toPrismaJsonOrUndefined({ suggestions: suggestions.length }),
      },
    });
  });

  return { suggestions: suggestions.length };
}

export async function assignAttachmentToItem(params: {
  empleadoId: string;
  solicitudId: string;
  adjuntoId: string;
  itemId: string;
  comment?: string | null;
}) {
  const solicitud = await getVisibleSolicitudForRevision(params);
  if (!solicitud) throw new Error('Solicitud no encontrada o no visible.');

  const validItem = solicitud.items.some((item) => item.id === params.itemId);
  const validAdjunto = solicitud.portalAdjuntos.some((adjunto) => adjunto.id === params.adjuntoId);

  if (!validItem || !validAdjunto) throw new Error('Ítem o archivo inválido.');

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.solicitudAdjuntoItemMatch.updateMany({
      where: {
        solicitudId: solicitud.id,
        adjuntoId: params.adjuntoId,
        matchStatus: { notIn: ['REJECTED_MATCH', 'IGNORED'] },
      },
      data: {
        matchStatus: 'REJECTED_MATCH',
        correctionComment: params.comment ?? 'Reemplazado por una asociación manual.',
        updatedAt: now,
      },
    });

    await tx.solicitudAdjuntoItemMatch.create({
      data: {
        solicitudId: solicitud.id,
        itemId: params.itemId,
        adjuntoId: params.adjuntoId,
        matchStatus: 'MANUALLY_MATCHED',
        matchSource: 'MANUAL',
        confirmedByEmpleadoId: params.empleadoId,
        confirmedAt: now,
        correctionComment: params.comment ?? null,
      },
    });

    await tx.solicitud.update({ where: { id: solicitud.id }, data: { status: 'UNDER_REVIEW' } });
  });
}

export async function confirmMatch(params: { empleadoId: string; matchId: string }) {
  await prisma.solicitudAdjuntoItemMatch.update({
    where: { id: params.matchId },
    data: {
      matchStatus: 'CONFIRMED_BY_USER',
      confirmedByEmpleadoId: params.empleadoId,
      confirmedAt: new Date(),
    },
  });
}

export async function ignoreAttachment(params: { solicitudId: string; empleadoId: string; adjuntoId: string; reason: string }) {
  const solicitud = await getVisibleSolicitudForRevision({ empleadoId: params.empleadoId, solicitudId: params.solicitudId });
  if (!solicitud) throw new Error('Solicitud no encontrada o no visible.');

  const validAdjunto = solicitud.portalAdjuntos.some((adjunto) => adjunto.id === params.adjuntoId);
  if (!validAdjunto) throw new Error('Archivo inválido.');

  await prisma.$transaction(async (tx) => {
    await tx.solicitudAdjuntoItemMatch.updateMany({
      where: {
        solicitudId: solicitud.id,
        adjuntoId: params.adjuntoId,
        matchStatus: { notIn: ['REJECTED_MATCH', 'IGNORED'] },
      },
      data: {
        matchStatus: 'REJECTED_MATCH',
        correctionComment: 'Reemplazado por devolución del archivo.',
        updatedAt: new Date(),
      },
    });

    await tx.solicitudAdjuntoItemMatch.create({
      data: {
        solicitudId: solicitud.id,
        itemId: null,
        adjuntoId: params.adjuntoId,
        matchStatus: 'IGNORED',
        matchSource: 'MANUAL',
        confirmedByEmpleadoId: params.empleadoId,
        confirmedAt: new Date(),
        correctionComment: params.reason,
      },
    });
  });
}

export async function getReviewWorkspace(params: { empleadoId: string; solicitudId: string; rolAplicacion: string }) {
  const solicitud = await getVisibleSolicitudForRevision(params);
  if (!solicitud) return null;

  const reviewLevel = getReviewLevelForRole(params.rolAplicacion);
  if (!reviewLevel) return { solicitud, reviewLevel: null, matches: [], revisions: [], closed: null };

  const [matches, revisions, closed] = await Promise.all([
    prisma.solicitudAdjuntoItemMatch.findMany({
      where: {
        solicitudId: solicitud.id,
        matchStatus: { in: ['CONFIRMED_BY_USER', 'MANUALLY_MATCHED'] },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.solicitudItemRevision.findMany({
      where: { solicitudId: solicitud.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.solicitudRevisionCierre.findUnique({
      where: { solicitudId_reviewLevel: { solicitudId: solicitud.id, reviewLevel } },
    }).catch(() => null),
  ]);

  return { solicitud, reviewLevel, matches, revisions, closed };
}

export async function saveItemReviewDecision(params: {
  empleadoId: string;
  solicitudId: string;
  itemId: string;
  reviewLevel: ReviewLevel;
  status: ItemReviewStatus;
  comment?: string | null;
}) {
  if (params.status === 'REJECTED' && !String(params.comment ?? '').trim()) {
    throw new Error('El comentario es obligatorio al rechazar.');
  }

  const solicitud = await getVisibleSolicitudForRevision(params);
  if (!solicitud) throw new Error('Solicitud no encontrada o no visible.');

  const validItem = solicitud.items.some((item) => item.id === params.itemId);
  if (!validItem) throw new Error('Ítem inválido.');

  await prisma.solicitudItemRevision.upsert({
    where: { itemId_reviewLevel: { itemId: params.itemId, reviewLevel: params.reviewLevel } },
    create: {
      solicitudId: solicitud.id,
      itemId: params.itemId,
      reviewLevel: params.reviewLevel,
      status: params.status,
      reviewerEmpleadoId: params.empleadoId,
      reviewComment: params.status === 'APPROVED' ? params.comment ?? null : null,
      rejectedReason: params.status === 'REJECTED' ? params.comment ?? null : null,
      decidedAt: new Date(),
    },
    update: {
      status: params.status,
      reviewerEmpleadoId: params.empleadoId,
      reviewComment: params.status === 'APPROVED' ? params.comment ?? null : null,
      rejectedReason: params.status === 'REJECTED' ? params.comment ?? null : null,
      decidedAt: new Date(),
    },
  });
}

export async function closeReview(params: { empleadoId: string; solicitudId: string; reviewLevel: ReviewLevel }) {
  const solicitud = await getVisibleSolicitudForRevision({ empleadoId: params.empleadoId, solicitudId: params.solicitudId });
  if (!solicitud) throw new Error('Solicitud no encontrada o no visible.');

  const [matches, revisions] = await Promise.all([
    prisma.solicitudAdjuntoItemMatch.findMany({
      where: { solicitudId: solicitud.id, itemId: { not: null }, matchStatus: { in: ['CONFIRMED_BY_USER', 'MANUALLY_MATCHED'] } },
    }),
    prisma.solicitudItemRevision.findMany({ where: { solicitudId: solicitud.id, reviewLevel: params.reviewLevel } }),
  ]);

  const matchedItemIds = new Set(matches.map((match) => match.itemId).filter(Boolean));
  const reviewableItems = solicitud.items.filter((item) => matchedItemIds.has(item.id));

  if (reviewableItems.length === 0) {
    throw new Error('No hay ítems con archivo asociado para cerrar revisión.');
  }

  const revisionByItem = new Map(revisions.map((revision) => [revision.itemId, revision]));
  const pendingItems = reviewableItems.filter(
    (item) =>
      !revisionByItem.get(item.id) ||
      revisionByItem.get(item.id)?.status === 'PENDING_REVIEW',
  );

  if (pendingItems.length > 0) {
    throw new Error(`Hay ${pendingItems.length} ítem(s) con archivo asociado sin decisión de revisión.`);
  }

  const approved = revisions.filter((revision) => revision.status === 'APPROVED');
  const rejected = revisions.filter((revision) => revision.status === 'REJECTED');
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.solicitudItemRevision.updateMany({
      where: { solicitudId: solicitud.id, reviewLevel: params.reviewLevel },
      data: { lockedAt: now },
    });

    await tx.solicitudRevisionCierre.create({
      data: {
        solicitudId: solicitud.id,
        reviewLevel: params.reviewLevel,
        closedByEmpleadoId: params.empleadoId,
        closedAt: now,
        emailStatus: 'PENDING',
        summaryJson: toPrismaJsonOrUndefined({
          approved: approved.length,
          rejected: rejected.length,
          total: reviewableItems.length,
          portalUrl: solicitud.portalUrl,
        }),
        emailRecipientsJson: toPrismaJsonOrUndefined({
          cliente: solicitud.clientContactEmail,
          policy: params.reviewLevel === 'STAFF' ? 'CLIENTE_Y_SENIOR' : 'CLIENTE_Y_EQUIPO',
        }),
      },
    });

    await tx.solicitud.update({
      where: { id: solicitud.id },
      data: {
        status: rejected.length > 0 ? 'UNDER_REVIEW' : params.reviewLevel === 'SENIOR' ? 'COMPLETED' : 'UNDER_REVIEW',
        completedAt: rejected.length === 0 && params.reviewLevel === 'SENIOR' ? now : undefined,
      },
    });
  });
}
