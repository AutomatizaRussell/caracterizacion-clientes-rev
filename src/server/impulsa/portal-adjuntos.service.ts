import crypto from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type PortalAttachmentInput = {
  itemId: string;
  file: File;
};

export type GuardarAdjuntosPortalInput = {
  token: string;
  attachments: PortalAttachmentInput[];
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

  /**
   * Opcional. El workflow de n8n puede devolver la carpeta de categoría que
   * creó/reutilizó dentro de:
   *
   * 5. Comunicaciones / {radicado} / {categoría}
   */
  categoryFolderId?: string;
  categoryFolderUrl?: string;

  error?: string;
};

const DEFAULT_MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/**
 * El token plano solo vive en la URL del cliente.
 * La base almacena únicamente el hash.
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

function getMaxAttachmentBytes() {
  const rawValue = process.env.IMPULSA_MAX_ATTACHMENT_BYTES?.trim();

  if (!rawValue) {
    return DEFAULT_MAX_ATTACHMENT_BYTES;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_MAX_ATTACHMENT_BYTES;
  }

  return parsedValue;
}

function normalizeToken(token: string) {
  const normalized = String(token ?? "").trim();

  if (!normalized) {
    throw new Error("Token inválido.");
  }

  return normalized;
}

/**
 * Limpia nombres de archivo para evitar caracteres problemáticos en OneDrive.
 * No conserva rutas enviadas por navegador; solo conserva el nombre base.
 */
function sanitizeFileName(value: string) {
  const originalName = String(value ?? "archivo").trim() || "archivo";
  const withoutPath = originalName.split(/[\\/]/).pop() ?? "archivo";

  return withoutPath
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 180);
}

/**
 * Limpia segmentos de carpeta para OneDrive.
 *
 * A diferencia de los nombres de archivo, aquí se preservan tildes, espacios y
 * puntos porque las carpetas deben ser legibles para el equipo.
 */
function sanitizeOneDriveSegment(value: string) {
  const sanitized = String(value ?? "")
    .replace(/["*:<>?/\\|]/g, " ")
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 160);

  return sanitized || "Sin categoría";
}

function buildStoredFileName(params: {
  radicadoReference: string;
  itemOrderIndex: number;
  originalFileName: string;
}) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  const radicado = params.radicadoReference
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  const fileName = sanitizeFileName(params.originalFileName);

  return `${radicado}__item_${params.itemOrderIndex}__${timestamp}__${fileName}`;
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

/**
 * Valida token y carga la solicitud con los datos mínimos necesarios para:
 * - validar ítems;
 * - obtener carpeta base de comunicaciones de la solicitud;
 * - identificar categoría del ítem;
 * - subir archivos;
 * - registrar trazabilidad.
 */
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
          oneDriveSolicitudComunicacionFolderId: true,
          oneDriveSolicitudComunicacionFolderUrl: true,
          radicado: {
            select: {
              reference: true,
            },
          },
          items: {
            select: {
              id: true,
              orderIndex: true,
              status: true,
              categoryId: true,
              categoryTitle: true,
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

  if (!solicitudToken.solicitud.oneDriveSolicitudComunicacionFolderId) {
    throw new Error(
      "La solicitud no tiene configurado el ID de la carpeta de comunicaciones de la solicitud en OneDrive.",
    );
  }

  return {
    normalizedToken,
    solicitudToken,
  };
}
/**
 * Llama al workflow n8n de adjuntos.
 *
 * Estructura destino:
 *
 * 5. Comunicaciones / {radicado} / {categoría} / archivo
 *
 * El backend envía a n8n:
 * - carpeta base de la solicitud en comunicaciones;
 * - categoría del ítem;
 * - archivo en base64.
 *
 * n8n debe buscar/crear la carpeta de categoría y subir allí el archivo.
 */
async function uploadAttachmentWithN8n(params: {
  solicitudId: string;
  solicitudItemId: string;
  tokenId: string;
  radicadoReference: string;

  solicitudComunicacionFolderId: string;
  solicitudComunicacionFolderUrl: string | null;

  categoryId: string;
  categoryTitle: string;
  categoryFolderName: string;

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
    version: 2,

    solicitudId: params.solicitudId,
    solicitudItemId: params.solicitudItemId,
    tokenId: params.tokenId,

    radicado: {
      reference: params.radicadoReference,
    },

    target: {
      solicitudComunicacionFolderId: params.solicitudComunicacionFolderId,
      solicitudComunicacionFolderUrl: params.solicitudComunicacionFolderUrl,
    },

    category: {
      id: params.categoryId,
      title: params.categoryTitle,
      folderName: params.categoryFolderName,
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
        `n8n adjuntos respondió con error HTTP ${response.status}.`,
    );
  }

  if (!parsedResponse.oneDriveUrl || !parsedResponse.oneDriveItemId) {
    throw new Error("n8n adjuntos no devolvió oneDriveUrl y oneDriveItemId.");
  }

  return parsedResponse;
}

/**
 * Guarda adjuntos enviados desde el portal cliente.
 *
 * Flujo:
 * 1. Valida token.
 * 2. Valida que cada itemId pertenezca a la solicitud.
 * 3. Valida tamaño.
 * 4. Determina la categoría del ítem.
 * 5. Convierte archivo a base64.
 * 6. Llama webhook n8n de adjuntos.
 * 7. n8n sube el archivo a:
 *    5. Comunicaciones / {radicado} / {categoría} / archivo.
 * 8. Registra archivo en PostgreSQL.
 * 9. Marca ítem como SUBMITTED.
 * 10. Marca solicitud como CLIENT_SUBMITTED.
 *
 * Restricción:
 * No existe transacción distribuida entre OneDrive y PostgreSQL. Si OneDrive
 * sube correctamente y luego falla PostgreSQL, quedaría un archivo huérfano.
 * Para producción se puede añadir reconciliación por evento/executionId.
 */
export async function guardarAdjuntosPortalCliente(
  input: GuardarAdjuntosPortalInput,
): Promise<GuardarAdjuntosPortalResult> {
  const { solicitudToken } = await getValidSolicitudForAttachmentUpload(
    input.token,
  );

  const maxAttachmentBytes = getMaxAttachmentBytes();
  const submittedAt = new Date();

  const solicitud = solicitudToken.solicitud;
  const solicitudId = solicitud.id;

  const validItemsById = new Map(
    solicitud.items.map((item) => [item.id, item]),
  );

  const normalizedAttachments = input.attachments
    .map((attachment) => ({
      itemId: String(attachment.itemId ?? "").trim(),
      file: attachment.file,
    }))
    .filter((attachment) => attachment.itemId && attachment.file.size > 0);

  if (normalizedAttachments.length === 0) {
    throw new Error("Debe adjuntar al menos un archivo.");
  }

  for (const attachment of normalizedAttachments) {
    if (!validItemsById.has(attachment.itemId)) {
      throw new Error("La solicitud contiene ítems inválidos.");
    }

    if (attachment.file.size > maxAttachmentBytes) {
      throw new Error(
        `El archivo "${attachment.file.name}" supera el tamaño máximo permitido.`,
      );
    }
  }

  const uploadedFiles: {
    solicitudItemId: string;
    categoryId: string;
    categoryTitle: string;
    categoryFolderName: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string | null;
    sizeBytes: number;
    oneDriveUrl: string;
    oneDriveItemId: string;
    categoryFolderId?: string;
    categoryFolderUrl?: string;
    n8nResponse: N8nAttachmentUploadResponse;
  }[] = [];

  for (const attachment of normalizedAttachments) {
    const item = validItemsById.get(attachment.itemId);

    if (!item) {
      throw new Error("Ítem no encontrado.");
    }

    const originalFileName = sanitizeFileName(attachment.file.name);
    const storedFileName = buildStoredFileName({
      radicadoReference: solicitud.radicado.reference,
      itemOrderIndex: item.orderIndex,
      originalFileName,
    });

    const categoryFolderName = sanitizeOneDriveSegment(item.categoryTitle);
    const base64 = await fileToBase64(attachment.file);

    const uploadResult = await uploadAttachmentWithN8n({
      solicitudId,
      solicitudItemId: attachment.itemId,
      tokenId: solicitudToken.id,
      radicadoReference: solicitud.radicado.reference,

      solicitudComunicacionFolderId:
        solicitud.oneDriveSolicitudComunicacionFolderId!,
      solicitudComunicacionFolderUrl:
        solicitud.oneDriveSolicitudComunicacionFolderUrl,

      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      categoryFolderName,

      originalFileName,
      storedFileName,
      mimeType: attachment.file.type || null,
      sizeBytes: attachment.file.size,
      base64,
    });

    uploadedFiles.push({
      solicitudItemId: attachment.itemId,
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      categoryFolderName,
      originalFileName,
      storedFileName,
      mimeType: uploadResult.mimeType ?? attachment.file.type ?? null,
      sizeBytes: uploadResult.sizeBytes ?? attachment.file.size,
      oneDriveUrl: uploadResult.oneDriveUrl!,
      oneDriveItemId: uploadResult.oneDriveItemId!,
      categoryFolderId: uploadResult.categoryFolderId,
      categoryFolderUrl: uploadResult.categoryFolderUrl,
      n8nResponse: uploadResult,
    });
  }

  const updatedItemIds = Array.from(
    new Set(uploadedFiles.map((file) => file.solicitudItemId)),
  );

  await prisma.$transaction(async (tx) => {
    for (const uploadedFile of uploadedFiles) {
      await tx.solicitudItemArchivo.create({
        data: {
          solicitudItemId: uploadedFile.solicitudItemId,
          uploadedByTokenId: solicitudToken.id,
          originalFileName: uploadedFile.originalFileName,
          storedFileName: uploadedFile.storedFileName,
          mimeType: uploadedFile.mimeType,
          sizeBytes: BigInt(uploadedFile.sizeBytes),
          storageProvider: "onedrive",
          oneDriveUrl: uploadedFile.oneDriveUrl,
          oneDriveItemId: uploadedFile.oneDriveItemId,
        },
      });
    }

    await tx.solicitudItem.updateMany({
      where: {
        id: {
          in: updatedItemIds,
        },
      },
      data: {
        status: "SUBMITTED",
        clientSubmittedAt: submittedAt,
      },
    });

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
        ...updatedItemIds.map((itemId) => ({
          solicitudId,
          eventType: "CLIENT_ITEM_SUBMITTED" as const,
          actorType: "CLIENTE" as const,
          message: "El cliente cargó adjuntos para un ítem.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: solicitudToken.id,
            itemId,
            files: uploadedFiles
              .filter((file) => file.solicitudItemId === itemId)
              .map((file) => ({
                categoryId: file.categoryId,
                categoryTitle: file.categoryTitle,
                categoryFolderName: file.categoryFolderName,
                categoryFolderId: file.categoryFolderId,
                categoryFolderUrl: file.categoryFolderUrl,
                originalFileName: file.originalFileName,
                storedFileName: file.storedFileName,
                oneDriveUrl: file.oneDriveUrl,
                oneDriveItemId: file.oneDriveItemId,
                sizeBytes: file.sizeBytes,
                mimeType: file.mimeType,
              })),
          }),
        })),
        {
          solicitudId,
          eventType: "CLIENT_SUBMITTED",
          actorType: "CLIENTE",
          message: "El cliente envió adjuntos desde el portal.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: solicitudToken.id,
            uploadedFiles: uploadedFiles.length,
            updatedItems: updatedItemIds.length,
            submittedAt: submittedAt.toISOString(),
          }),
        },
      ],
    });
  });

  return {
    solicitudId,
    uploadedFiles: uploadedFiles.length,
    updatedItems: updatedItemIds.length,
    submittedAt,
  };
}