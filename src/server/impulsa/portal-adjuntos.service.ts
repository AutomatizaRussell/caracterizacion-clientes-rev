import crypto from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type GuardarAdjuntosPortalInput = {
  token: string;
  checkedItemIds: string[];
  files: File[];
};

export type GuardarAdjuntosPortalResult = {
  solicitudId: string;
  uploadedFiles: number;
  updatedItems: number;
  submittedAt: Date;
};

type N8nAttachmentUploadResponse = {
  ok: boolean;
  originalFileName?: string;
  storedFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  oneDriveUrl?: string;
  oneDriveItemId?: string;
  error?: string;
};

const DEFAULT_MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const DEFAULT_MAX_ATTACHMENTS_PER_SUBMISSION = 50;
const DEFAULT_MAX_TOTAL_ATTACHMENT_BYTES = 250 * 1024 * 1024;

/**
 * El token plano vive únicamente en la URL del cliente.
 * La base almacena solo el hash SHA-256.
 */
function hashPortalToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable de entorno requerida no configurada: ${name}`);
  }

  return value;
}

function getPositiveIntegerEnv(name: string, defaultValue: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return defaultValue;
  }

  return parsedValue;
}

function getMaxAttachmentBytes() {
  return getPositiveIntegerEnv(
    "IMPULSA_MAX_ATTACHMENT_BYTES",
    DEFAULT_MAX_ATTACHMENT_BYTES,
  );
}

function getMaxAttachmentsPerSubmission() {
  return getPositiveIntegerEnv(
    "IMPULSA_MAX_ATTACHMENTS_PER_SUBMISSION",
    DEFAULT_MAX_ATTACHMENTS_PER_SUBMISSION,
  );
}

function getMaxTotalAttachmentBytes() {
  return getPositiveIntegerEnv(
    "IMPULSA_MAX_TOTAL_ATTACHMENT_BYTES",
    DEFAULT_MAX_TOTAL_ATTACHMENT_BYTES,
  );
}

function normalizeToken(token: string) {
  const normalized = String(token ?? "").trim();

  if (!normalized) {
    throw new Error("Token inválido.");
  }

  return normalized;
}

function sanitizeOriginalFileNameForOneDrive(value: string) {
  /**
   * Conserva el nombre visible original del archivo.
   *
   * Solo elimina:
   * - rutas accidentales enviadas por navegador;
   * - caracteres inválidos para OneDrive;
   * - caracteres de control;
   * - puntos/espacios finales.
   */
  const originalName = String(value ?? "archivo").trim() || "archivo";
  const withoutPath = originalName.split(/[\\/]/).pop() ?? "archivo";

  const sanitized = withoutPath
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 180);

  return sanitized || "archivo";
}

function buildStoredFileName(params: {
  radicadoReference: string;
  fileIndex: number;
  originalFileName: string;
}) {
  /**
   * Regla actual:
   * - conservar el nombre original visible del archivo;
   * - no anteponer radicado, fecha ni índice;
   * - dejar que Microsoft Graph renombre si hay conflicto.
   *
   * Los parámetros radicadoReference/fileIndex permanecen en la firma para no
   * romper llamadas existentes, pero ya no participan en el nombre final.
   */
  return sanitizeOriginalFileNameForOneDrive(params.originalFileName);
}

function toPrismaJsonOrUndefined(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    return undefined;
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

async function fileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return Buffer.from(arrayBuffer).toString("base64");
}

async function getValidSolicitudForAttachmentUpload(token: string) {
  const normalizedToken = normalizeToken(token);
  const tokenHash = hashPortalToken(normalizedToken);

  const solicitudToken = await prisma.solicitudTokenCliente.findFirst({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      clientEmail: true,
      revokedAt: true,
      expiresAt: true,
      solicitud: {
        select: {
          id: true,
          status: true,
          radicado: {
            select: {
              reference: true,
            },
          },
          requestFolders: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              key: true,
              title: true,
              folderId: true,
              folderUrl: true,
              informacionSuministradaFolderId: true,
              informacionSuministradaFolderUrl: true,
              informacionSuministradaFolderPath: true,
            },
          },
          items: {
            select: {
              id: true,
              orderIndex: true,
              status: true,
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

  if (solicitudToken.solicitud.status === "CANCELLED") {
    throw new Error("La solicitud fue cancelada.");
  }

  if (solicitudToken.solicitud.status === "COMPLETED") {
    throw new Error("La solicitud ya fue completada.");
  }

  const requestFolders = solicitudToken.solicitud.requestFolders;

  if (requestFolders.length !== 1) {
    throw new Error(
      "La solicitud debe tener exactamente una carpeta documental para recibir adjuntos.",
    );
  }

  const requestFolder = requestFolders[0];

  if (!requestFolder.informacionSuministradaFolderId) {
    throw new Error(
      "La solicitud no tiene configurada la carpeta Información suministrada.",
    );
  }

  return {
    normalizedToken,
    solicitudToken,
    requestFolder,
  };
}

async function uploadAttachmentWithN8n(params: {
  solicitudId: string;
  tokenId: string;
  radicadoReference: string;
  informacionSuministradaFolderId: string;
  informacionSuministradaFolderUrl: string | null;
  originalFileName: string;
  storedFileName: string;
  mimeType: string | null;
  sizeBytes: number;
  base64: string;
}) {
  const webhookUrl = getRequiredEnv("N8N_IMPULSA_ATTACHMENT_WEBHOOK_URL");
  const webhookSecret = getRequiredEnv("N8N_IMPULSA_WEBHOOK_SECRET");

  const payload = {
    event: "impulsa.portal.attachment.upload",
    version: 3,

    solicitudId: params.solicitudId,
    tokenId: params.tokenId,

    radicado: {
      reference: params.radicadoReference,
    },

    target: {
      informacionSuministradaFolderId:
        params.informacionSuministradaFolderId,
      informacionSuministradaFolderUrl:
        params.informacionSuministradaFolderUrl,
    },

    file: {
      originalFileName: params.originalFileName,
      storedFileName: params.storedFileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      base64: params.base64,
    },
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-impulsa-secret": webhookSecret,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();

  let parsedResponse: N8nAttachmentUploadResponse;

  try {
    parsedResponse = JSON.parse(responseText) as N8nAttachmentUploadResponse;
  } catch {
    throw new Error(
      `n8n adjuntos devolvió una respuesta no JSON. HTTP ${response.status}: ${responseText.slice(
        0,
        500,
      )}`,
    );
  }

  if (!response.ok || !parsedResponse.ok) {
    throw new Error(
      parsedResponse.error ??
        (response.ok
          ? "n8n adjuntos respondió ok=false sin detalle de error."
          : `n8n adjuntos respondió con error HTTP ${response.status}.`),
    );
  }

  if (!parsedResponse.oneDriveUrl || !parsedResponse.oneDriveItemId) {
    throw new Error("n8n adjuntos no devolvió oneDriveUrl y oneDriveItemId.");
  }

  return parsedResponse;
}

/**
 * Guarda una entrega o una corrección de checks desde el portal cliente.
 *
 * Regla funcional actual:
 * - Los archivos se suben solo al guardar la entrega.
 * - Todos los archivos van a Información suministrada.
 * - checkedItemIds representa el estado canónico actual de los ítems cubiertos.
 * - Ítems incluidos en checkedItemIds => SUBMITTED.
 * - Ítems antes SUBMITTED y ahora no incluidos => PENDING.
 * - Se permite guardar cambios de checks sin archivos nuevos si ya existe
 *   soporte cargado previamente para la solicitud.
 */
export async function guardarAdjuntosPortalCliente(
  input: GuardarAdjuntosPortalInput,
): Promise<GuardarAdjuntosPortalResult> {
  const files = Array.isArray(input.files)
    ? input.files.filter((file) => file instanceof File && file.size > 0)
    : [];

  const checkedItemIds = Array.from(
    new Set(
      (input.checkedItemIds ?? [])
        .map((itemId) => String(itemId ?? "").trim())
        .filter(Boolean),
    ),
  );

  const maxAttachmentBytes = getMaxAttachmentBytes();
  const maxAttachments = getMaxAttachmentsPerSubmission();
  const maxTotalBytes = getMaxTotalAttachmentBytes();

  if (files.length > maxAttachments) {
    throw new Error(
      `La entrega supera el número máximo de archivos permitido (${maxAttachments}).`,
    );
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalBytes > maxTotalBytes) {
    throw new Error(
      "La entrega supera el tamaño total máximo permitido para adjuntos.",
    );
  }

  for (const file of files) {
    if (file.size > maxAttachmentBytes) {
      throw new Error(
        `El archivo "${file.name}" supera el tamaño máximo permitido.`,
      );
    }
  }

  const { solicitudToken, requestFolder } =
    await getValidSolicitudForAttachmentUpload(input.token);

  const submittedAt = new Date();
  const solicitud = solicitudToken.solicitud;
  const solicitudId = solicitud.id;

  const validItemsById = new Map(
    solicitud.items.map((item) => [item.id, item]),
  );

  for (const itemId of checkedItemIds) {
    if (!validItemsById.has(itemId)) {
      throw new Error("La entrega contiene ítems inválidos.");
    }
  }

  const previousCheckedItemIds = new Set(
    solicitud.items
      .filter((item) => item.status === "SUBMITTED")
      .map((item) => item.id),
  );

  const checkedItemIdSet = new Set(checkedItemIds);

  const newlyCheckedItemIds = checkedItemIds.filter(
    (itemId) => !previousCheckedItemIds.has(itemId),
  );

  const newlyUncheckedItemIds = Array.from(previousCheckedItemIds).filter(
    (itemId) => !checkedItemIdSet.has(itemId),
  );

  const hasChecksChanged =
    newlyCheckedItemIds.length > 0 || newlyUncheckedItemIds.length > 0;

  const existingUploadedFiles = await prisma.solicitudPortalAdjunto.count({
    where: {
      solicitudId,
    },
  });

  const hasExistingSupport = existingUploadedFiles > 0;

  if (files.length > 0 && checkedItemIds.length === 0) {
    throw new Error(
      "Debe marcar al menos un ítem cubierto por los adjuntos antes de guardar la entrega.",
    );
  }

  if (checkedItemIds.length > 0 && files.length === 0 && !hasExistingSupport) {
    throw new Error(
      "Debe adjuntar al menos un archivo antes de marcar ítems como completos.",
    );
  }

  if (files.length === 0 && !hasChecksChanged) {
    throw new Error("No hay archivos nuevos ni cambios de checks para guardar.");
  }

  const uploadedFiles: {
    originalFileName: string;
    storedFileName: string;
    mimeType: string | null;
    sizeBytes: number;
    oneDriveUrl: string;
    oneDriveItemId: string;
    n8nResponse: N8nAttachmentUploadResponse;
  }[] = [];

  for (const [index, file] of files.entries()) {
    const originalFileName = sanitizeOriginalFileNameForOneDrive(file.name);
    const storedFileName = buildStoredFileName({
      radicadoReference: solicitud.radicado.reference,
      fileIndex: index + 1,
      originalFileName,
    });

    const base64 = await fileToBase64(file);

    const uploadResult = await uploadAttachmentWithN8n({
      solicitudId,
      tokenId: solicitudToken.id,
      radicadoReference: solicitud.radicado.reference,
      informacionSuministradaFolderId:
        requestFolder.informacionSuministradaFolderId!,
      informacionSuministradaFolderUrl:
        requestFolder.informacionSuministradaFolderUrl,
      originalFileName,
      storedFileName,
      mimeType: file.type || null,
      sizeBytes: file.size,
      base64,
    });

    uploadedFiles.push({
      originalFileName,
      storedFileName: uploadResult.storedFileName ?? storedFileName,
      mimeType: uploadResult.mimeType ?? file.type ?? null,
      sizeBytes: uploadResult.sizeBytes ?? file.size,
      oneDriveUrl: uploadResult.oneDriveUrl!,
      oneDriveItemId: uploadResult.oneDriveItemId!,
      n8nResponse: uploadResult,
    });
  }

  const allItemIds = Array.from(validItemsById.keys());
  const uncheckedItemIds = allItemIds.filter(
    (itemId) => !checkedItemIdSet.has(itemId),
  );

  await prisma.$transaction(async (tx) => {
    const entrega = await tx.solicitudPortalEntrega.create({
      data: {
        solicitudId,
        tokenId: solicitudToken.id,
        submittedAt,
      },
    });

    if (uploadedFiles.length > 0) {
      await tx.solicitudPortalAdjunto.createMany({
        data: uploadedFiles.map((file) => ({
          solicitudId,
          entregaId: entrega.id,
          uploadedByTokenId: solicitudToken.id,
          originalFileName: file.originalFileName,
          storedFileName: file.storedFileName,
          mimeType: file.mimeType,
          sizeBytes: BigInt(file.sizeBytes),
          storageProvider: "onedrive",
          oneDriveUrl: file.oneDriveUrl,
          oneDriveItemId: file.oneDriveItemId,
          informacionSuministradaFolderId:
            requestFolder.informacionSuministradaFolderId,
          informacionSuministradaFolderUrl:
            requestFolder.informacionSuministradaFolderUrl,
        })),
      });
    }

    if (checkedItemIds.length > 0) {
      await tx.solicitudItemEntregaCliente.createMany({
        data: checkedItemIds.map((itemId) => ({
          entregaId: entrega.id,
          solicitudItemId: itemId,
          tokenId: solicitudToken.id,
          checkedAt: submittedAt,
        })),
        skipDuplicates: true,
      });
    }

    if (checkedItemIds.length > 0) {
      await tx.solicitudItem.updateMany({
        where: {
          id: {
            in: checkedItemIds,
          },
        },
        data: {
          status: "SUBMITTED",
          clientSubmittedAt: submittedAt,
        },
      });
    }

    if (uncheckedItemIds.length > 0) {
      await tx.solicitudItem.updateMany({
        where: {
          id: {
            in: uncheckedItemIds,
          },
          status: "SUBMITTED",
        },
        data: {
          status: "PENDING",
          clientSubmittedAt: null,
        },
      });
    }

    await tx.solicitudTokenCliente.update({
      where: {
        id: solicitudToken.id,
      },
      data: {
        submittedAt,
      },
    });

    await tx.solicitud.update({
      where: {
        id: solicitudId,
      },
      data: {
        status: "CLIENT_SUBMITTED",
      },
    });

    await tx.solicitudEvento.createMany({
      data: [
        ...newlyCheckedItemIds.map((itemId) => ({
          solicitudId,
          eventType: "CLIENT_ITEM_SUBMITTED" as const,
          actorType: "CLIENTE" as const,
          message: "El cliente marcó un ítem como cubierto por archivos.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: solicitudToken.id,
            entregaId: entrega.id,
            itemId,
            uploadedFiles: uploadedFiles.length,
          }),
        })),
        ...newlyUncheckedItemIds.map((itemId) => ({
          solicitudId,
          eventType: "CLIENT_ITEM_SUBMITTED" as const,
          actorType: "CLIENTE" as const,
          message: "El cliente desmarcó un ítem previamente marcado como cubierto.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: solicitudToken.id,
            entregaId: entrega.id,
            itemId,
            unchecked: true,
            uploadedFiles: uploadedFiles.length,
          }),
        })),
        {
          solicitudId,
          eventType: "CLIENT_SUBMITTED",
          actorType: "CLIENTE",
          message: "El cliente guardó una entrega o cambios de checks.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: solicitudToken.id,
            entregaId: entrega.id,
            uploadedFiles: uploadedFiles.length,
            checkedItems: checkedItemIds.length,
            uncheckedItems: newlyUncheckedItemIds.length,
            submittedAt: submittedAt.toISOString(),
          }),
        },
      ],
    });
  });

  return {
    solicitudId,
    uploadedFiles: uploadedFiles.length,
    updatedItems: newlyCheckedItemIds.length + newlyUncheckedItemIds.length,
    submittedAt,
  };
}
