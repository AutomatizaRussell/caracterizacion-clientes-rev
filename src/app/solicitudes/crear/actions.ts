"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEmpleadoById } from "@/server/queries";
import { getClienteOptionParaEmpleado } from "@/server/clientes";
import { requestTypes } from "@/features/impulsa/request-templates.data";
import { crearSolicitudImpulsa } from "@/server/impulsa/solicitudes.service";
import { enviarSolicitudAN8n } from "@/server/impulsa/n8n.service";

type ResponsiblePayload = {
  name: string;
  role: string;
  firm: string;
};

type RequestItemPayload = {
  id: string;
  text: string;
  mode: "base" | "advanced";
  selected: boolean;
  children: string[];
  type: "text" | "table";
  table: unknown | null;
};

type RequestCategoryPayload = {
  id: string;
  title: string;
  items: RequestItemPayload[];
};

export type CrearSolicitudDesdeBuilderPayload = {
  empresaRefId: string;
  requestTypeId: string;
  cutoffDate: string;
  generationDate: string;
  responsible: ResponsiblePayload;
  categories: RequestCategoryPayload[];
  clientContactName?: string | null;
  clientContactEmail?: string | null;
};

export type CrearSolicitudDesdeBuilderActionResult =
  | {
      ok: true;
      solicitudId: string;
      radicadoId: string;
      radicadoReference: string;
      portalUrl: string;
      totalItems: number;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type GenerarYEnviarSolicitudActionResult =
  | {
      ok: true;
      solicitudId: string;
      executionId?: string;
      htmlUrl?: string;
      pdfUrl?: string;
      requestFolderUrl?: string;
      emailMessageId?: string;
    }
  | {
      ok: false;
      message: string;
    };

function normalizeText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  return normalized;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
}

function normalizeEmail(value: string | null | undefined) {
  const email = normalizeText(value);

  if (!email) {
    return null;
  }

  /**
   * Normaliza correos digitados o pegados con comillas envolventes.
   *
   * Caso real detectado:
   * - Entrada:  "\"daniellopera@rbcol.co\""
   * - Antes:    "\"daniellopera@rbcol.co\""
   * - Ahora:    "daniellopera@rbcol.co"
   *
   * No intenta hacer validación avanzada RFC; solo limpia basura común de input.
   * La validación formal sigue quedando en validateEmail().
   */
  return email
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .toLowerCase();
}

function validateEmail(value: string | null) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSelectedCategories(categories: RequestCategoryPayload[]) {
  return categories
    .map((category) => {
      const selectedItems = category.items
        .filter((item) => item.selected)
        .map((item) => ({
          id: item.id,
          text: item.text.trim(),
          mode: item.mode,
          children: item.children,
          type: item.type,
          table: item.table,
        }))
        .filter((item) => item.text.length > 0);

      return {
        id: category.id,
        title: category.title,
        items: selectedItems,
      };
    })
    .filter((category) => category.items.length > 0);
}

function validatePayload(payload: CrearSolicitudDesdeBuilderPayload) {
  const fieldErrors: Record<string, string> = {};

  if (!normalizeText(payload.empresaRefId)) {
    fieldErrors.empresaRefId = "Debe seleccionar un cliente.";
  }

  if (!normalizeText(payload.requestTypeId)) {
    fieldErrors.requestTypeId = "Debe seleccionar un tipo de solicitud.";
  }

  if (!isValidDateOnly(payload.cutoffDate)) {
    fieldErrors.cutoffDate = "La fecha de corte no es válida.";
  }

  if (!isValidDateOnly(payload.generationDate)) {
    fieldErrors.generationDate = "La fecha de generación no es válida.";
  }

  if (!normalizeText(payload.responsible?.name)) {
    fieldErrors.responsibleName = "Debe indicar el nombre del responsable.";
  }

  if (!normalizeText(payload.responsible?.role)) {
    fieldErrors.responsibleRole = "Debe indicar el cargo del responsable.";
  }

  if (!normalizeText(payload.responsible?.firm)) {
    fieldErrors.responsibleFirm = "Debe indicar la firma del responsable.";
  }

  const clientContactEmail = normalizeEmail(payload.clientContactEmail);

  if (!validateEmail(clientContactEmail)) {
    fieldErrors.clientContactEmail = "El correo del cliente no es válido.";
  }

  const selectedCategories = getSelectedCategories(payload.categories ?? []);
  const selectedItemsCount = selectedCategories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  if (selectedItemsCount === 0) {
    fieldErrors.items = "La solicitud debe tener al menos un ítem incluido.";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    selectedCategories,
    clientContactEmail,
  };
}

async function getAuthenticatedEmpleado() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value ?? null;

  if (!empleadoId) {
    return null;
  }

  return getEmpleadoById(empleadoId);
}

export async function crearSolicitudDesdeBuilderAction(
  payload: CrearSolicitudDesdeBuilderPayload,
): Promise<CrearSolicitudDesdeBuilderActionResult> {
  try {
    const empleado = await getAuthenticatedEmpleado();

    if (!empleado) {
      return {
        ok: false,
        message: "Sesión no válida. Debe iniciar sesión nuevamente.",
      };
    }

    const validation = validatePayload(payload);

    if (!validation.isValid) {
      return {
        ok: false,
        message: "La solicitud tiene errores de validación.",
        fieldErrors: validation.fieldErrors,
      };
    }

    const cliente = await getClienteOptionParaEmpleado({
      clienteId: payload.empresaRefId,
      empleadoId: empleado.id,
    });

    if (!cliente) {
      return {
        ok: false,
        message:
          "El cliente seleccionado no existe o no está asignado al usuario actual.",
      };
    }

    const requestTemplate = requestTypes.find(
      (requestType) => requestType.id === payload.requestTypeId,
    );

    if (!requestTemplate) {
      return {
        ok: false,
        message: "El tipo de solicitud seleccionado no existe.",
      };
    }

    const result = await crearSolicitudImpulsa({
      empresaRefId: cliente.id,
      empleadoId: empleado.id,
      responsibleEmpleadoId: empleado.id,

      requestTypeId: requestTemplate.id,
      requestTypeName: requestTemplate.name,
      prefix: requestTemplate.prefix,
      templateFile: requestTemplate.templateFile,

      subject: requestTemplate.subject,
      cutoffDate: payload.cutoffDate,
      generationDate: payload.generationDate,

      responsible: {
        name: normalizeText(payload.responsible.name) ?? "",
        role: normalizeText(payload.responsible.role) ?? "",
        firm: normalizeText(payload.responsible.firm) ?? "",
      },

      categories: validation.selectedCategories,

      clientContactName: normalizeText(payload.clientContactName),
      clientContactEmail: validation.clientContactEmail,
    });

    revalidatePath("/solicitudes");
    revalidatePath("/radicados");
    revalidatePath(`/clientes/${cliente.id}`);
    revalidatePath(`/clientes/${cliente.id}/solicitudes`);

    return {
      ok: true,
      solicitudId: result.solicitudId,
      radicadoId: result.radicadoId,
      radicadoReference: result.radicadoReference,
      portalUrl: result.portalUrl,
      totalItems: result.totalItems,
    };
  } catch (error) {
    console.error("[crearSolicitudDesdeBuilderAction]", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible crear la solicitud.",
    };
  }
}

export async function generarYEnviarSolicitudAction(params: {
  solicitudId: string;
}): Promise<GenerarYEnviarSolicitudActionResult> {
  try {
    const solicitudId = normalizeText(params.solicitudId);

    if (!solicitudId) {
      return {
        ok: false,
        message: "Debe indicar la solicitud a generar.",
      };
    }

    const empleado = await getAuthenticatedEmpleado();

    if (!empleado) {
      return {
        ok: false,
        message: "Sesión no válida. Debe iniciar sesión nuevamente.",
      };
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: {
        id: solicitudId,
      },
      select: {
        id: true,
        empresaRefId: true,
        status: true,
      },
    });

    if (!solicitud) {
      return {
        ok: false,
        message: "Solicitud no encontrada.",
      };
    }

    const cliente = await getClienteOptionParaEmpleado({
      clienteId: solicitud.empresaRefId,
      empleadoId: empleado.id,
    });

    if (!cliente) {
      return {
        ok: false,
        message:
          "La solicitud no pertenece a un cliente asignado al usuario actual.",
      };
    }

    if (solicitud.status === "CANCELLED") {
      return {
        ok: false,
        message: "No se puede generar una solicitud cancelada.",
      };
    }

    if (solicitud.status === "COMPLETED") {
      return {
        ok: false,
        message: "No se puede reenviar una solicitud completada.",
      };
    }

    const result = await enviarSolicitudAN8n({
      solicitudId: solicitud.id,
      empleadoId: empleado.id,
    });

    revalidatePath("/solicitudes");
    revalidatePath("/radicados");
    revalidatePath(`/clientes/${cliente.id}`);
    revalidatePath(`/clientes/${cliente.id}/solicitudes`);

    if (!result.ok) {
      return {
        ok: false,
        message: result.error ?? "No fue posible generar y enviar la solicitud.",
      };
    }

    return {
      ok: true,
      solicitudId: solicitud.id,
      executionId: result.executionId,
      htmlUrl: result.htmlUrl,
      pdfUrl: result.pdfUrl,
      requestFolderUrl: result.requestFolderUrl,
      emailMessageId: result.emailMessageId,
    };
  } catch (error) {
    console.error("[generarYEnviarSolicitudAction]", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible generar y enviar la solicitud.",
    };
  }
}