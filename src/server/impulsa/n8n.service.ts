
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSolicitudDocumentHtmlById } from "./document-html.service";
import { generateSolicitudPdfFromHtml } from "./document-pdf.service";

type N8nGeneratedFileResult = {
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  oneDriveUrl?: string;
  oneDriveItemId?: string;
};

type N8nFolderResult = {
  yearFolderUrl?: string;
  clientFolderUrl?: string;
  planeacionFolderUrl?: string;
  ejecucionFolderUrl?: string;
  cierreFolderUrl?: string;
  impuestosFolderUrl?: string;
  comunicacionesFolderUrl?: string;
  solicitudComunicacionFolderUrl?: string;
};

type N8nFolderIdsResult = {
  yearFolderId?: string;
  clientFolderId?: string;
  planeacionFolderId?: string;
  ejecucionFolderId?: string;
  cierreFolderId?: string;
  impuestosFolderId?: string;
  comunicacionesFolderId?: string;
  solicitudComunicacionFolderId?: string;
};

type N8nCategoryFolderResult = {
  categoryId: string;
  categoryTitle: string;
  folderName: string;
  folderUrl?: string;
  folderId?: string;
};

type N8nEmailResult = {
  messageId?: string;
  sentAt?: string;
  to?: string;
};

type N8nImpulsaResponse = {
  ok: boolean;
  executionId?: string;
  folders?: N8nFolderResult;
  folderIds?: N8nFolderIdsResult;
  categoryFolders?: N8nCategoryFolderResult[];
  html?: N8nGeneratedFileResult;
  pdf?: N8nGeneratedFileResult;
  email?: N8nEmailResult;
  error?: string;
};

export type EnviarSolicitudAN8nResult = {
  ok: boolean;
  executionId?: string;
  htmlUrl?: string;
  pdfUrl?: string;
  requestFolderUrl?: string;
  emailMessageId?: string;
  error?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable de entorno requerida no configurada: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, defaultValue: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return defaultValue;
  }

  return value;
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

/**
 * Normaliza nombres de archivo.
 *
 * Decisión:
 * - Para archivos usamos una forma más estricta con "_" para evitar problemas
 *   de descarga, envío por correo y compatibilidad entre sistemas.
 */
function sanitizeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

/**
 * Normaliza segmentos de carpeta para OneDrive.
 *
 * Decisión:
 * - Preserva tildes, espacios y puntos para que los nombres sean legibles:
 *   "1. Planeación", "5. Comunicaciones", "I. Documentos Legales".
 * - Elimina caracteres conflictivos en rutas.
 * - Evita puntos/espacios finales.
 */
function sanitizeOneDriveSegment(value: string) {
  const sanitized = value
    .replace(/["*:<>?/\\|]/g, " ")
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 160);

  return sanitized || "Sin nombre";
}

/**
 * Normaliza una ruta funcional compuesta por segmentos.
 *
 * Ejemplo:
 * - Entrada: "/Impulsa//Solicitudes/"
 * - Salida:  "Impulsa/Solicitudes"
 *
 * Esta ruta NO define el drive físico. El drive físico lo decidirá n8n con
 * IMPULSA_GRAPH_DRIVE_BASE_URL. El backend solo define la raíz funcional.
 */
function normalizeOneDriveRootPath(value: string) {
  const normalized = value
    .split("/")
    .map((segment) => sanitizeOneDriveSegment(segment))
    .filter(Boolean)
    .join("/");

  return normalized || "Impulsa/Solicitudes";
}

function normalizeOutboundEmail(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .toLowerCase();

  return normalized || null;
}

/**
 * Devuelve categorías únicas de la solicitud preservando el primer orden
 * de aparición de los ítems.
 *
 * Estas categorías serán usadas por n8n para crear:
 * 5. Comunicaciones / {radicado} / {categoría}
 */
function buildCategoryFolders(
  items: Awaited<
    ReturnType<typeof buildSolicitudDocumentHtmlById>
  >["data"]["items"],
) {
  const categories = new Map<
    string,
    {
      categoryId: string;
      categoryTitle: string;
      folderName: string;
    }
  >();

  for (const item of items) {
    if (categories.has(item.categoryId)) {
      continue;
    }

    categories.set(item.categoryId, {
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      folderName: sanitizeOneDriveSegment(item.categoryTitle),
    });
  }

  return Array.from(categories.values());
}

/**
 * Construye el plan lógico de carpetas que n8n materializa en OneDrive.
 *
 * Estructura definitiva:
 *
 * {rootPath}/{año}/{cliente}/1. Planeación
 * {rootPath}/{año}/{cliente}/2. Ejecución
 * {rootPath}/{año}/{cliente}/3. Cierre
 * {rootPath}/{año}/{cliente}/4. Impuestos
 * {rootPath}/{año}/{cliente}/5. Comunicaciones/{radicado}
 *
 * Regla:
 * - Una carpeta de cliente por año.
 * - No una carpeta de cliente por solicitud.
 * - La solicitud vive dentro de "5. Comunicaciones".
 * - Los adjuntos del portal irán dentro de subcarpetas por categoría.
 *
 * Separación arquitectónica:
 * - Backend define el plan funcional/documental.
 * - n8n define el drive físico donde ejecuta Graph.
 */
function buildOneDriveFolderPlan(params: {
  rootPath: string;
  clienteNombre: string;
  clienteNit: string;
  radicadoReference: string;
  year: number;
  categoryFolders: ReturnType<typeof buildCategoryFolders>;
}) {
  const rootPath = normalizeOneDriveRootPath(params.rootPath);
  const yearFolderName = String(params.year);

  const clientFolderName = sanitizeOneDriveSegment(
    `${params.clienteNombre}_${params.clienteNit}`,
  );

  const solicitudFolderName = sanitizeOneDriveSegment(
    params.radicadoReference,
  );

  const yearPath = `${rootPath}/${yearFolderName}`;
  const clientPath = `${yearPath}/${clientFolderName}`;

  const planeacionPath = `${clientPath}/1. Planeación`;
  const ejecucionPath = `${clientPath}/2. Ejecución`;
  const cierrePath = `${clientPath}/3. Cierre`;
  const impuestosPath = `${clientPath}/4. Impuestos`;
  const comunicacionesPath = `${clientPath}/5. Comunicaciones`;
  const solicitudComunicacionPath = `${comunicacionesPath}/${solicitudFolderName}`;

  return {
    rootPath,
    year: params.year,
    yearFolderName,
    yearPath,
    clientFolderName,
    clientPath,
    solicitudFolderName,
    solicitudComunicacionPath,
    folders: {
      planeacion: planeacionPath,
      ejecucion: ejecucionPath,
      cierre: cierrePath,
      impuestos: impuestosPath,
      comunicaciones: comunicacionesPath,
      solicitudComunicacion: solicitudComunicacionPath,
    },
    categoryFolders: params.categoryFolders.map((category) => ({
      ...category,
      path: `${solicitudComunicacionPath}/${category.folderName}`,
    })),
  };
}

/**
 * Construye payload estable para n8n.
 *
 * El backend genera:
 * - HTML canónico real.
 * - PDF real derivado de ese HTML.
 *
 * n8n:
 * - crea/reutiliza carpetas;
 * - sube PDF;
 * - envía correo;
 * - devuelve URLs/IDs.
 *
 * Nota:
 * - documento.html se conserva temporalmente en el payload para no mezclar
 *   demasiados cambios a la vez.
 * - El nuevo workflow n8n debe ignorar documento.html.
 * - Luego se puede eliminar documento.html del payload para reducir tamaño.
 */
function buildN8nPayload(params: {
  solicitudId: string;
  html: string;
  pdfBuffer: Buffer;
  data: Awaited<ReturnType<typeof buildSolicitudDocumentHtmlById>>["data"];
}) {
  const year = params.data.generationDate.getUTCFullYear();
  const categoryFolders = buildCategoryFolders(params.data.items);

  const rootPath = getOptionalEnv(
    "IMPULSA_ONEDRIVE_ROOT_PATH",
    "Impulsa/Solicitudes",
  );

  const folderPlan = buildOneDriveFolderPlan({
    rootPath,
    clienteNombre: params.data.clienteNombre,
    clienteNit: params.data.clienteNit,
    radicadoReference: params.data.radicadoReference,
    year,
    categoryFolders,
  });

  const htmlFileName = `${sanitizeFilePart(
    params.data.radicadoReference,
  )}.html`;

  const pdfFileName = `${sanitizeFilePart(
    params.data.radicadoReference,
  )}.pdf`;

  const clientContactEmail = normalizeOutboundEmail(
    params.data.clientContactEmail,
  );

  return {
    event: "impulsa.solicitud.generate_and_send",
    version: 2,
    solicitudId: params.solicitudId,

    radicado: {
      reference: params.data.radicadoReference,
    },

    cliente: {
      nombre: params.data.clienteNombre,
      nit: params.data.clienteNit,
      contactName: params.data.clientContactName,
      contactEmail: clientContactEmail,
    },

    responsable: {
      name: params.data.responsibleName,
      role: params.data.responsibleRole,
      firm: params.data.responsibleFirm,
    },

    documento: {
      requestTypeName: params.data.requestTypeName,
      subject: params.data.subject,
      cutoffDate: params.data.cutoffDate.toISOString().slice(0, 10),
      generationDate: params.data.generationDate.toISOString().slice(0, 10),

      /**
       * HTML canónico.
       *
       * El nuevo workflow n8n NO debe guardarlo en OneDrive ni enviarlo por
       * correo. Se conserva temporalmente para evitar mezclar la reducción del
       * payload con el rediseño del workflow.
       */
      html: params.html,

      fileNames: {
        html: htmlFileName,
        pdf: pdfFileName,
      },

      /**
       * PDF real generado en backend desde el HTML canónico.
       * No se guarda en eventos ni en DB como base64.
       */
      pdf: {
        fileName: pdfFileName,
        mimeType: "application/pdf",
        sizeBytes: params.pdfBuffer.length,
        base64: params.pdfBuffer.toString("base64"),
      },
    },

    portal: {
      url: params.data.portalUrl,
    },

    oneDrive: folderPlan,

    email: {
      to: clientContactEmail,
      subject: params.data.subject,
      attachPdf: true,
    },
  };
}

async function getSolicitudForN8nUpdate(solicitudId: string) {
  const solicitud = await prisma.solicitud.findUnique({
    where: {
      id: solicitudId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!solicitud) {
    throw new Error("Solicitud no encontrada.");
  }

  return solicitud;
}

/**
 * Construye una versión auditable del payload sin binarios/base64.
 */
function buildAuditableWebhookPayload(
  payload: ReturnType<typeof buildN8nPayload>,
) {
  return {
    event: payload.event,
    version: payload.version,
    solicitudId: payload.solicitudId,
    radicado: payload.radicado,
    cliente: payload.cliente,
    responsable: payload.responsable,
    documento: {
      requestTypeName: payload.documento.requestTypeName,
      subject: payload.documento.subject,
      cutoffDate: payload.documento.cutoffDate,
      generationDate: payload.documento.generationDate,
      fileNames: payload.documento.fileNames,
      pdf: {
        fileName: payload.documento.pdf.fileName,
        mimeType: payload.documento.pdf.mimeType,
        sizeBytes: payload.documento.pdf.sizeBytes,
      },
    },
    portal: payload.portal,
    oneDrive: payload.oneDrive,
    email: payload.email,
  };
}

/**
 * Construye una versión auditable de la respuesta sin aceptar campos obsoletos.
 */
function buildAuditableN8nResponse(response: N8nImpulsaResponse) {
  return {
    ok: response.ok,
    executionId: response.executionId,
    folders: response.folders,
    folderIds: response.folderIds,
    categoryFolders: response.categoryFolders,
    html: response.html,
    pdf: response.pdf,
    email: response.email,
    error: response.error,
  };
}

async function registrarEventoN8nEnviado(params: {
  solicitudId: string;
  empleadoId: string | null;
  payload: unknown;
}) {
  await prisma.solicitud.update({
    where: {
      id: params.solicitudId,
    },
    data: {
      n8nLastWebhookAt: new Date(),
      eventos: {
        create: {
          eventType: "N8N_WEBHOOK_SENT",
          actorType: params.empleadoId ? "EMPLEADO" : "SYSTEM",
          actorEmpleadoId: params.empleadoId,
          message:
            "Webhook enviado a n8n para generación documental, carpetas y correo.",
          payloadJson: toPrismaJsonOrUndefined(params.payload),
        },
      },
    },
  });
}

async function registrarFalloN8n(params: {
  solicitudId: string;
  empleadoId: string | null;
  errorMessage: string;
  payload?: unknown;
}) {
  await prisma.solicitud.update({
    where: {
      id: params.solicitudId,
    },
    data: {
      status: "FAILED",
      n8nLastError: params.errorMessage,
      eventos: {
        create: {
          eventType: "FAILED",
          actorType: "SYSTEM",
          actorEmpleadoId: params.empleadoId,
          message: params.errorMessage.slice(0, 500),
          payloadJson: toPrismaJsonOrUndefined(params.payload),
        },
      },
    },
  });
}

async function registrarDocumentoGenerado(params: {
  tx: Prisma.TransactionClient;
  solicitudId: string;
  empleadoId: string | null;
  documentType: "PDF" | "HTML_SNAPSHOT";
  defaultFileName: string;
  defaultMimeType: string;
  file: N8nGeneratedFileResult;
  now: Date;
}) {
  if (!params.file.oneDriveUrl) {
    return;
  }

  await params.tx.documentoGenerado.create({
    data: {
      solicitudId: params.solicitudId,
      generatedByEmpleadoId: params.empleadoId,
      documentType: params.documentType,
      status: "STORED",
      fileName: params.file.fileName ?? params.defaultFileName,
      mimeType: params.file.mimeType ?? params.defaultMimeType,
      sizeBytes: params.file.sizeBytes ? BigInt(params.file.sizeBytes) : null,
      storageProvider: "onedrive",
      oneDriveUrl: params.file.oneDriveUrl,
      oneDriveItemId: params.file.oneDriveItemId ?? null,
      generatedAt: params.now,
      storedAt: params.now,
    },
  });
}

async function registrarResultadoN8n(params: {
  solicitudId: string;
  empleadoId: string | null;
  response: N8nImpulsaResponse;
}) {
  const now = new Date();
  const folders = params.response.folders ?? {};
  const folderIds = params.response.folderIds ?? {};
  const auditableResponse = buildAuditableN8nResponse(params.response);

  await prisma.$transaction(async (tx) => {
    await tx.solicitud.update({
      where: {
        id: params.solicitudId,
      },
      data: {
        status: "SENT",
        sentAt: now,

        n8nExecutionId: params.response.executionId ?? null,
        n8nLastCallbackAt: now,
        n8nLastError: null,

        oneDriveYearFolderUrl: folders.yearFolderUrl ?? null,
        oneDriveYearFolderId: folderIds.yearFolderId ?? null,

        oneDriveClientFolderUrl: folders.clientFolderUrl ?? null,
        oneDriveClientFolderId: folderIds.clientFolderId ?? null,

        oneDrivePlaneacionFolderUrl: folders.planeacionFolderUrl ?? null,
        oneDrivePlaneacionFolderId: folderIds.planeacionFolderId ?? null,

        oneDriveEjecucionFolderUrl: folders.ejecucionFolderUrl ?? null,
        oneDriveEjecucionFolderId: folderIds.ejecucionFolderId ?? null,

        oneDriveCierreFolderUrl: folders.cierreFolderUrl ?? null,
        oneDriveCierreFolderId: folderIds.cierreFolderId ?? null,

        oneDriveImpuestosFolderUrl: folders.impuestosFolderUrl ?? null,
        oneDriveImpuestosFolderId: folderIds.impuestosFolderId ?? null,

        oneDriveComunicacionesFolderUrl:
          folders.comunicacionesFolderUrl ?? null,
        oneDriveComunicacionesFolderId:
          folderIds.comunicacionesFolderId ?? null,

        oneDriveSolicitudComunicacionFolderUrl:
          folders.solicitudComunicacionFolderUrl ?? null,
        oneDriveSolicitudComunicacionFolderId:
          folderIds.solicitudComunicacionFolderId ?? null,
      },
    });

    if (params.response.html?.oneDriveUrl) {
      await registrarDocumentoGenerado({
        tx,
        solicitudId: params.solicitudId,
        empleadoId: params.empleadoId,
        documentType: "HTML_SNAPSHOT",
        defaultFileName: "solicitud.html",
        defaultMimeType: "text/html",
        file: params.response.html,
        now,
      });
    }

    if (params.response.pdf?.oneDriveUrl) {
      await registrarDocumentoGenerado({
        tx,
        solicitudId: params.solicitudId,
        empleadoId: params.empleadoId,
        documentType: "PDF",
        defaultFileName: "solicitud.pdf",
        defaultMimeType: "application/pdf",
        file: params.response.pdf,
        now,
      });
    }

    await tx.solicitudEvento.createMany({
      data: [
        {
          solicitudId: params.solicitudId,
          eventType: "N8N_CALLBACK_RECEIVED",
          actorType: "N8N",
          message: "Respuesta recibida desde n8n.",
          payloadJson: toPrismaJsonOrUndefined(auditableResponse),
        },
        {
          solicitudId: params.solicitudId,
          eventType: "ONEDRIVE_FOLDERS_CREATED",
          actorType: "N8N",
          message: "Estructura OneDrive V2 registrada.",
          payloadJson: toPrismaJsonOrUndefined({
            folders,
            folderIds,
            categoryFolders: params.response.categoryFolders,
          }),
        },
        {
          solicitudId: params.solicitudId,
          eventType: "DOCUMENT_GENERATED",
          actorType: "N8N",
          message: params.response.html?.oneDriveUrl
            ? "HTML y PDF registrados como documentos disponibles."
            : "PDF registrado como documento disponible.",
          payloadJson: toPrismaJsonOrUndefined({
            html: params.response.html,
            pdf: params.response.pdf,
          }),
        },
        {
          solicitudId: params.solicitudId,
          eventType: "EMAIL_SENT",
          actorType: "N8N",
          message: "Correo enviado al cliente con PDF adjunto.",
          payloadJson: toPrismaJsonOrUndefined(params.response.email),
        },
      ],
    });
  });
}

/**
 * Orquesta el envío a n8n para una solicitud ya creada.
 *
 * Responsabilidades:
 * - construir HTML canónico;
 * - generar PDF real desde ese HTML;
 * - enviar el payload funcional a n8n;
 * - registrar respuesta real en PostgreSQL.
 */
export async function enviarSolicitudAN8n(params: {
  solicitudId: string;
  empleadoId: string | null;
}): Promise<EnviarSolicitudAN8nResult> {
  const webhookUrl = getRequiredEnv("N8N_IMPULSA_WEBHOOK_URL");
  const webhookSecret = getRequiredEnv("N8N_IMPULSA_WEBHOOK_SECRET");

  await getSolicitudForN8nUpdate(params.solicitudId);

  const { data, html } = await buildSolicitudDocumentHtmlById(
    params.solicitudId,
  );

  if (!data.clientContactEmail) {
    throw new Error("La solicitud no tiene correo de contacto del cliente.");
  }

  const pdfBuffer = await generateSolicitudPdfFromHtml({
    html,
  });

  const payload = buildN8nPayload({
    solicitudId: params.solicitudId,
    html,
    pdfBuffer,
    data,
  });

  await registrarEventoN8nEnviado({
    solicitudId: params.solicitudId,
    empleadoId: params.empleadoId,
    payload: buildAuditableWebhookPayload(payload),
  });

  try {
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

    let parsedResponse: N8nImpulsaResponse;

    try {
      parsedResponse = JSON.parse(responseText) as N8nImpulsaResponse;
    } catch {
      throw new Error(
        `n8n devolvió una respuesta no JSON. HTTP ${response.status}: ${responseText.slice(
          0,
          500,
        )}`,
      );
    }

    if (!response.ok || !parsedResponse.ok) {
      const errorMessage =
        parsedResponse.error ??
        `n8n respondió con error HTTP ${response.status}.`;

      await registrarFalloN8n({
        solicitudId: params.solicitudId,
        empleadoId: params.empleadoId,
        errorMessage,
        payload: buildAuditableN8nResponse(parsedResponse),
      });

      return {
        ok: false,
        error: errorMessage,
      };
    }

    await registrarResultadoN8n({
      solicitudId: params.solicitudId,
      empleadoId: params.empleadoId,
      response: parsedResponse,
    });

    return {
      ok: true,
      executionId: parsedResponse.executionId,
      htmlUrl: parsedResponse.html?.oneDriveUrl,
      pdfUrl: parsedResponse.pdf?.oneDriveUrl,
      requestFolderUrl:
        parsedResponse.folders?.solicitudComunicacionFolderUrl,
      emailMessageId: parsedResponse.email?.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "No fue posible ejecutar el webhook de n8n.";

    await registrarFalloN8n({
      solicitudId: params.solicitudId,
      empleadoId: params.empleadoId,
      errorMessage,
    });

    return {
      ok: false,
      error: errorMessage,
    };
  }
}
