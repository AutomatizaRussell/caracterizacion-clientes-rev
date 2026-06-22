import crypto from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildReference } from "@/features/impulsa/request-reference";

type ResponsibleInput = {
  name: string;
  role: string;
  firm: string;
};

type SolicitudItemInput = {
  id: string;
  text: string;
  mode: "base" | "advanced";
  children: string[];
  type: "text" | "table";
  table: unknown | null;
};

type SolicitudCategoryInput = {
  id: string;
  title: string;
  items: SolicitudItemInput[];
};

export type CrearSolicitudInput = {
  empresaRefId: string;
  empleadoId: string | null;
  responsibleEmpleadoId?: string | null;

  requestTypeId: string;
  requestTypeName: string;
  prefix: string;
  templateFile?: string | null;

  subject: string;
  cutoffDate: string;
  generationDate: string;

  responsible: ResponsibleInput;

  categories: SolicitudCategoryInput[];

  clientContactName?: string | null;
  clientContactEmail?: string | null;
};

export type CrearSolicitudResult = {
  solicitudId: string;
  radicadoId: string;
  radicadoReference: string;
  portalToken: string;
  portalUrl: string;
  totalItems: number;
};

const TOKEN_BYTES = 32;

/**
 * Convierte valores arbitrarios a JSON compatible con Prisma.
 *
 * Intención:
 * - Evitar guardar `undefined`.
 * - Evitar romper escrituras por objetos no serializables.
 * - Mantener los eventos auditables sin acoplarlos al tipo exacto de entrada.
 */
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
 * Convierte un string YYYY-MM-DD a Date UTC.
 *
 * Se usa UTC porque las fechas son DateOnly de negocio y no deben desplazarse
 * por zona horaria del servidor.
 */
function parseDateOnly(value: string) {
  if (!value) {
    throw new Error("Fecha inválida.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha inválida.");
  }

  return date;
}

/**
 * Crea un token opaco para el portal cliente.
 *
 * El token plano solo se entrega en la URL. En base de datos se almacena
 * únicamente el hash SHA-256.
 */
function createPortalToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getApplicationBaseUrl() {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getDemoClientName() {
  return process.env.IMPULSA_DEMO_CLIENT_NAME ?? null;
}

function getDemoClientEmail() {
  return process.env.IMPULSA_DEMO_CLIENT_EMAIL ?? null;
}

function normalizeForCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Deriva un código corto de cliente para el texto visible del radicado.
 *
 * Importante:
 * - Este código NO se usa como scope del contador.
 * - El scope real del contador es empresa.id, porque es estable.
 * - El código puede cambiar por negocio; el UUID no.
 */
function deriveTemporaryCompanyCode(params: {
  radicadoCode?: string | null;
  razonSocial: string;
  nit: string;
}) {
  if (params.radicadoCode?.trim()) {
    return params.radicadoCode.trim().toUpperCase();
  }

  const normalizedName = normalizeForCode(params.razonSocial);

  const ignoredWords = new Set([
    "S",
    "A",
    "SAS",
    "SA",
    "LTDA",
    "LIMITADA",
    "CIA",
    "COMPANIA",
    "GRUPO",
    "FUNDACION",
    "CORPORACION",
    "INVERSIONES",
  ]);

  const words = normalizedName
    .split(" ")
    .filter((word) => word.length > 0 && !ignoredWords.has(word));

  const acronym = words
    .slice(0, 3)
    .map((word) => word[0])
    .join("");

  if (acronym.length >= 2) {
    return acronym.slice(0, 8);
  }

  return `NIT${params.nit.slice(-4)}`;
}

function getIncludedItems(categories: SolicitudCategoryInput[]) {
  return categories.flatMap((category) =>
    category.items.map((item) => ({
      categoryId: category.id,
      categoryTitle: category.title,
      item,
    })),
  );
}

function mapItemMode(mode: SolicitudItemInput["mode"]) {
  if (mode === "advanced") {
    return "ADVANCED" as const;
  }

  return "BASE" as const;
}

/**
 * Genera o incrementa el contador de radicado.
 *
 * Regla nueva:
 * - El consecutivo NO es global.
 * - El consecutivo se reinicia por cliente y por año.
 * - También se separa por prefijo/tipo de solicitud.
 *
 * Scope elegido:
 * - empresa.id
 *
 * Razón:
 * - empresa.id es estable.
 * - companyCode/radicadoCode puede cambiar.
 * - nit puede tener formatos inconsistentes.
 */
async function getNextRadicadoConsecutive(params: {
  tx: Prisma.TransactionClient;
  prefix: string;
  year: number;
  empresaId: string;
}) {
  const counterScope = params.empresaId;

  const counter = await params.tx.radicadoCounter.upsert({
    where: {
      prefix_year_scope: {
        prefix: params.prefix,
        year: params.year,
        scope: counterScope,
      },
    },
    create: {
      prefix: params.prefix,
      year: params.year,
      scope: counterScope,

      /**
       * El contador interno inicia creando el primer consecutivo como 1.
       * Conceptualmente el contador por cliente/año arranca en 0 antes de
       * existir el primer registro.
       */
      lastConsecutive: 1,
    },
    update: {
      lastConsecutive: {
        increment: 1,
      },
    },
  });

  return {
    consecutive: counter.lastConsecutive,
    counterScope,
  };
}

export async function crearSolicitudImpulsa(
  input: CrearSolicitudInput,
): Promise<CrearSolicitudResult> {
  const includedItems = getIncludedItems(input.categories);

  if (includedItems.length === 0) {
    throw new Error("La solicitud debe tener al menos un ítem incluido.");
  }

  const demoClientName = getDemoClientName();
  const demoClientEmail = getDemoClientEmail();

  const clientContactName = input.clientContactName ?? demoClientName;
  const clientContactEmail = input.clientContactEmail ?? demoClientEmail;

  if (!clientContactEmail) {
    throw new Error(
      "No hay correo de cliente configurado. Define IMPULSA_DEMO_CLIENT_EMAIL o envía clientContactEmail.",
    );
  }

  const cutoffDate = parseDateOnly(input.cutoffDate);
  const generationDate = parseDateOnly(input.generationDate);
  const year = generationDate.getUTCFullYear();

  const portalToken = createPortalToken();
  const tokenHash = hashToken(portalToken);
  const baseUrl = getApplicationBaseUrl();

  return prisma.$transaction(async (tx) => {
    const empresa = await tx.refEmpresa.findUnique({
      where: {
        id: input.empresaRefId,
      },
      select: {
        id: true,
        razonSocial: true,
        nit: true,
        radicadoCode: true,
      },
    });

    if (!empresa) {
      throw new Error("Cliente no encontrado.");
    }

    const companyCode = deriveTemporaryCompanyCode({
      radicadoCode: empresa.radicadoCode,
      razonSocial: empresa.razonSocial,
      nit: empresa.nit,
    });

    const { consecutive, counterScope } = await getNextRadicadoConsecutive({
      tx,
      prefix: input.prefix,
      year,
      empresaId: empresa.id,
    });

    const radicadoReference = buildReference({
      prefix: input.prefix,
      consecutive,
      year,
      companyCode,
    });

    const radicado = await tx.radicado.create({
      data: {
        reference: radicadoReference,
        prefix: input.prefix,
        consecutive,
        year,
        companyCode,
        empresaRefId: empresa.id,
      },
    });

    const portalUrl = `${baseUrl}/portal-cliente/solicitud/${portalToken}`;

    const solicitud = await tx.solicitud.create({
      data: {
        radicadoId: radicado.id,
        empresaRefId: empresa.id,

        createdByEmpleadoId: input.empleadoId,
        responsibleEmpleadoId: input.responsibleEmpleadoId ?? input.empleadoId,

        requestTypeId: input.requestTypeId,
        requestTypeName: input.requestTypeName,
        templateFile: input.templateFile ?? null,

        subject: input.subject,
        cutoffDate,
        generationDate,

        clientContactName,
        clientContactEmail,

        responsibleName: input.responsible.name,
        responsibleRole: input.responsible.role,
        responsibleFirm: input.responsible.firm,

        status: "CREATED",
        portalUrl,
      },
    });

    await tx.solicitudItem.createMany({
      data: includedItems.map((entry, index) => ({
        solicitudId: solicitud.id,
        categoryId: entry.categoryId,
        categoryTitle: entry.categoryTitle,
        templateItemId: entry.item.id,
        itemMode: mapItemMode(entry.item.mode),
        orderIndex: index + 1,
        text: entry.item.text,
        childrenJson: entry.item.children as Prisma.InputJsonValue,
        tableJson: toPrismaJsonOrUndefined(entry.item.table),
        status: "PENDING",
      })),
    });

    const token = await tx.solicitudTokenCliente.create({
      data: {
        solicitudId: solicitud.id,
        tokenHash,
        clientName: clientContactName,
        clientEmail: clientContactEmail,
      },
    });

    await tx.solicitudEvento.createMany({
      data: [
        {
          solicitudId: solicitud.id,
          eventType: "CREATED",
          actorType: input.empleadoId ? "EMPLEADO" : "SYSTEM",
          actorEmpleadoId: input.empleadoId,
          message: "Solicitud creada.",
          payloadJson: toPrismaJsonOrUndefined({
            radicadoReference,
            requestTypeId: input.requestTypeId,
            requestTypeName: input.requestTypeName,
            empresaRefId: empresa.id,
            clientContactEmail,

            /**
             * Trazabilidad explícita de la nueva regla de consecutivo.
             */
            radicadoCounter: {
              prefix: input.prefix,
              year,
              scope: counterScope,
              scopeType: "EMPRESA_REF_ID",
              consecutive,
            },
          }),
        },
        {
          solicitudId: solicitud.id,
          eventType: "ITEMS_CREATED",
          actorType: "SYSTEM",
          message: "Ítems de solicitud creados.",
          payloadJson: toPrismaJsonOrUndefined({
            totalItems: includedItems.length,
            categories: input.categories.map((category) => ({
              id: category.id,
              title: category.title,
              itemsCount: category.items.length,
            })),
          }),
        },
        {
          solicitudId: solicitud.id,
          eventType: "TOKEN_CREATED",
          actorType: "SYSTEM",
          message: "Token de portal cliente creado.",
          payloadJson: toPrismaJsonOrUndefined({
            tokenId: token.id,
            clientEmail: clientContactEmail,
            portalUrl,
          }),
        },
      ],
    });

    return {
      solicitudId: solicitud.id,
      radicadoId: radicado.id,
      radicadoReference,
      portalToken,
      portalUrl,
      totalItems: includedItems.length,
    };
  });
}