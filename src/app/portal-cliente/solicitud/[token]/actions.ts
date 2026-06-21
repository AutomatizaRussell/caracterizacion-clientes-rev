"use server";

import { revalidatePath } from "next/cache";
import { guardarAdjuntosPortalCliente } from "@/server/impulsa/portal-adjuntos.service";

export type GuardarRespuestasPortalActionResult =
  | {
      ok: true;
      solicitudId: string;
      updatedItems: number;
      uploadedFiles: number;
      submittedAt: string;
    }
  | {
      ok: false;
      message: string;
    };

type PortalAttachmentInput = {
  itemId: string;
  file: File;
};

/**
 * Extrae archivos del FormData enviado desde el portal cliente.
 *
 * Convención del formulario:
 * - Cada input file tiene name="attachment:{itemId}"
 * - Cada input puede traer uno o varios archivos porque usa "multiple".
 *
 * Riesgos controlados:
 * - Se ignoran archivos vacíos.
 * - Se ignoran campos que no sean File.
 * - No se valida aquí si itemId pertenece a la solicitud. Esa validación
 *   queda en el servicio backend, donde existe contexto transaccional.
 */
function extractAttachmentsFromFormData(formData: FormData) {
  const attachments: PortalAttachmentInput[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("attachment:")) {
      continue;
    }

    if (!(value instanceof File)) {
      continue;
    }

    if (value.size === 0) {
      continue;
    }

    const itemId = key.replace("attachment:", "").trim();

    if (!itemId) {
      continue;
    }

    attachments.push({
      itemId,
      file: value,
    });
  }

  return attachments;
}

/**
 * Server Action pública del portal cliente.
 *
 * Flujo:
 * 1. Recibe token plano desde la URL.
 * 2. Extrae archivos del FormData.
 * 3. Llama al servicio de adjuntos.
 * 4. El servicio valida token, itemIds, folderId de OneDrive y sube vía n8n.
 * 5. Revalida la página del portal.
 *
 * No guarda archivos directamente desde la action. La action solo coordina
 * entrada del formulario y delega la lógica sensible al servicio.
 */
export async function guardarRespuestasPortalAction(
  token: string,
  formData: FormData,
): Promise<GuardarRespuestasPortalActionResult> {
  try {
    const normalizedToken = String(token ?? "").trim();

    if (!normalizedToken) {
      return {
        ok: false,
        message: "El enlace de la solicitud no es válido.",
      };
    }

    const attachments = extractAttachmentsFromFormData(formData);

    if (attachments.length === 0) {
      return {
        ok: false,
        message: "Debe adjuntar al menos un archivo antes de enviar.",
      };
    }

    const result = await guardarAdjuntosPortalCliente({
      token: normalizedToken,
      attachments,
    });

    revalidatePath(`/portal-cliente/solicitud/${normalizedToken}`);

    return {
      ok: true,
      solicitudId: result.solicitudId,
      updatedItems: result.updatedItems,
      uploadedFiles: result.uploadedFiles,
      submittedAt: result.submittedAt.toISOString(),
    };
  } catch (error) {
    console.error("[guardarRespuestasPortalAction]", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible guardar los adjuntos.",
    };
  }
}