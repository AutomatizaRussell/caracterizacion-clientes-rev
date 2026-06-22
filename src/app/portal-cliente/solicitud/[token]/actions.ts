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

function extractFilesFromFormData(formData: FormData) {
  return formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function extractCheckedItemIdsFromFormData(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("checkedItemIds")
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

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

    const files = extractFilesFromFormData(formData);
    const checkedItemIds = extractCheckedItemIdsFromFormData(formData);

    if (files.length === 0) {
      return {
        ok: false,
        message: "Debe adjuntar al menos un archivo antes de finalizar la entrega.",
      };
    }

    if (checkedItemIds.length === 0) {
      return {
        ok: false,
        message:
          "Debe marcar al menos un ítem cubierto por los adjuntos antes de finalizar la entrega.",
      };
    }

    const result = await guardarAdjuntosPortalCliente({
      token: normalizedToken,
      checkedItemIds,
      files,
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
