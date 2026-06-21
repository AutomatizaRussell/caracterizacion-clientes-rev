"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type RespuestaStatus =
  | "PENDING"
  | "OK"
  | "NOT_APPLICABLE_AUTO"
  | "MISSING_DETAIL"
  | "INVALID";

type FormularioStatus = "DRAFT" | "COMPLETE" | "CONFIRMED";

type CampoConRespuesta = {
  id: string;
  campo: {
    code: string;
    fieldType: string;
    isRequired: boolean;
    hasInlineDetail: boolean;
    inlineDetailRequiredWhenValue: string | null;
    dependsOnFieldCode: string | null;
    dependsOnValue: string | null;
  };
};

type ResultadoRespuestaCalculada = {
  isRequired: boolean;
  isApplicable: boolean;
  status: RespuestaStatus;
};

function normalizeEmpty(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text || null;
}

function parseNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const sanitized = value.trim().replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return null;
  }

  const hasComma = sanitized.includes(",");
  const hasDot = sanitized.includes(".");

  let normalized = sanitized;

  if (hasComma && hasDot) {
    const lastCommaIndex = sanitized.lastIndexOf(",");
    const lastDotIndex = sanitized.lastIndexOf(".");
    const decimalSeparator = lastCommaIndex > lastDotIndex ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";

    normalized = sanitized
      .replaceAll(thousandsSeparator, "")
      .replace(decimalSeparator, ".");
  } else if (hasComma) {
    normalized = sanitized.replace(",", ".");
  } else if (hasDot) {
    const dotParts = sanitized.split(".");

    if (dotParts.length > 2) {
      normalized = sanitized.replaceAll(".", "");
    } else {
      const decimals = dotParts[1] ?? "";
      normalized = decimals.length === 3 ? sanitized.replace(".", "") : sanitized;
    }
  }

  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? null : parsed;
}

function getRespuestaStatus(params: {
  value: string | null;
  detail: string | null;
  isRequired: boolean;
  hasInlineDetail: boolean;
  inlineDetailRequiredWhenValue: string | null;
}): RespuestaStatus {
  if (!params.isRequired && !params.value && !params.detail) {
    return "OK";
  }

  if (!params.value) {
    return "PENDING";
  }

  if (
    params.hasInlineDetail &&
    params.inlineDetailRequiredWhenValue &&
    params.value === params.inlineDetailRequiredWhenValue &&
    !params.detail
  ) {
    return "MISSING_DETAIL";
  }

  return "OK";
}

function getFormValueByRespuestaId(formData: FormData, respuestaId: string) {
  return normalizeEmpty(formData.get(`respuesta:${respuestaId}`));
}

function getFormDetailByRespuestaId(formData: FormData, respuestaId: string) {
  return normalizeEmpty(formData.get(`respuestaDetalle:${respuestaId}`));
}

function buildValueByCampoCode(params: {
  respuestas: CampoConRespuesta[];
  formData: FormData;
}) {
  const valuesByCampoCode = new Map<string, string | null>();

  for (const respuesta of params.respuestas) {
    valuesByCampoCode.set(
      respuesta.campo.code,
      getFormValueByRespuestaId(params.formData, respuesta.id),
    );
  }

  return valuesByCampoCode;
}

function isCampoAplicable(params: {
  campo: CampoConRespuesta["campo"];
  valuesByCampoCode: Map<string, string | null>;
}) {
  if (!params.campo.dependsOnFieldCode || !params.campo.dependsOnValue) {
    return true;
  }

  const parentValue = params.valuesByCampoCode.get(
    params.campo.dependsOnFieldCode,
  );

  return parentValue === params.campo.dependsOnValue;
}

function buildRespuestaUpdateQuery(params: {
  respuesta: CampoConRespuesta;
  value: string | null;
  detail: string | null;
  status: RespuestaStatus;
  empleadoId: string | null;
}) {
  const shouldStoreInlineDetail = params.respuesta.campo.hasInlineDetail;

  const effectiveDetail =
    params.respuesta.campo.inlineDetailRequiredWhenValue &&
    params.value === params.respuesta.campo.inlineDetailRequiredWhenValue
      ? params.detail
      : null;

  const commonData = {
    updatedByEmpleadoId: params.empleadoId,
    status: params.status,
    ...(shouldStoreInlineDetail
      ? {
          valueJson: {
            value: params.value,
            detail: effectiveDetail,
            notApplicable: false,
          },
        }
      : {}),
  };

  if (
    params.respuesta.campo.fieldType === "INTEGER" ||
    params.respuesta.campo.fieldType === "DECIMAL"
  ) {
    return prisma.respuestaCaracterizacion.update({
      where: {
        id: params.respuesta.id,
      },
      data: {
        ...commonData,
        valueText: null,
        valueNumber: parseNumber(params.value),
        valueDate: null,
      },
    });
  }

  if (params.respuesta.campo.fieldType === "DATE") {
    return prisma.respuestaCaracterizacion.update({
      where: {
        id: params.respuesta.id,
      },
      data: {
        ...commonData,
        valueText: null,
        valueNumber: null,
        valueDate: params.value
          ? new Date(`${params.value}T00:00:00.000Z`)
          : null,
      },
    });
  }

  return prisma.respuestaCaracterizacion.update({
    where: {
      id: params.respuesta.id,
    },
    data: {
      ...commonData,
      valueText: params.value,
      valueNumber: null,
      valueDate: null,
    },
  });
}

function buildRespuestaNoAplicableQuery(params: {
  respuestaId: string;
  empleadoId: string | null;
}) {
  return prisma.respuestaCaracterizacion.update({
    where: {
      id: params.respuestaId,
    },
    data: {
      updatedByEmpleadoId: params.empleadoId,
      status: "NOT_APPLICABLE_AUTO",
      valueText: null,
      valueNumber: null,
      valueDate: null,
      valueJson: {
        value: null,
        detail: null,
        notApplicable: true,
      },
    },
  });
}

function buildFormularioUpdateQuery(params: {
  formularioId: string;
  empleadoId: string | null;
  formularioStatusActual: string | null;
  resultados: ResultadoRespuestaCalculada[];
}) {
  const requiredApplicableResults = params.resultados.filter(
    (resultado) => resultado.isRequired && resultado.isApplicable,
  );

  const totalCount = requiredApplicableResults.length;

  const answeredCount = requiredApplicableResults.filter(
    (resultado) => resultado.status === "OK",
  ).length;

  const completionPercentage =
    totalCount === 0
      ? 0
      : Number(((answeredCount / totalCount) * 100).toFixed(2));

  const nextStatus: FormularioStatus =
    totalCount > 0 && answeredCount === totalCount ? "COMPLETE" : "DRAFT";

  return prisma.formularioCliente.update({
    where: {
      id: params.formularioId,
    },
    data: {
      answeredCount,
      totalCount,
      completionPercentage,
      updatedByEmpleadoId: params.empleadoId,
      status:
        params.formularioStatusActual === "CONFIRMED"
          ? "CONFIRMED"
          : nextStatus,
      hasPostConfirmationChanges:
        params.formularioStatusActual === "CONFIRMED" ? true : undefined,
    },
  });
}

function revalidateClientePaths(clienteId: string) {
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/caracterizacion`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function guardarFormularioCliente(formData: FormData) {
  const formularioId = String(formData.get("formularioId") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");
  const empleadoIdRaw = String(formData.get("empleadoId") ?? "");
  const empleadoId = empleadoIdRaw || null;

  if (!formularioId || !clienteId) {
    return;
  }

  const formularioActual = await prisma.formularioCliente.findUnique({
    where: {
      id: formularioId,
    },
    select: {
      status: true,
    },
  });

  const respuestas = await prisma.respuestaCaracterizacion.findMany({
    where: {
      formularioId,
      campo: {
        isActive: true,
      },
    },
    orderBy: {
      campo: {
        orderIndex: "asc",
      },
    },
    select: {
      id: true,
      campo: {
        select: {
          code: true,
          fieldType: true,
          isRequired: true,
          hasInlineDetail: true,
          inlineDetailRequiredWhenValue: true,
          dependsOnFieldCode: true,
          dependsOnValue: true,
        },
      },
    },
  });

  const valuesByCampoCode = buildValueByCampoCode({
    respuestas,
    formData,
  });

  const resultados: ResultadoRespuestaCalculada[] = [];
  const updateQueries = [];

  for (const respuesta of respuestas) {
    const campoAplicable = isCampoAplicable({
      campo: respuesta.campo,
      valuesByCampoCode,
    });

    if (!campoAplicable) {
      updateQueries.push(
        buildRespuestaNoAplicableQuery({
          respuestaId: respuesta.id,
          empleadoId,
        }),
      );

      resultados.push({
        isRequired: respuesta.campo.isRequired,
        isApplicable: false,
        status: "NOT_APPLICABLE_AUTO",
      });

      continue;
    }

    const rawValue = getFormValueByRespuestaId(formData, respuesta.id);
    const rawDetail = getFormDetailByRespuestaId(formData, respuesta.id);

    const status = getRespuestaStatus({
      value: rawValue,
      detail: rawDetail,
      isRequired: respuesta.campo.isRequired,
      hasInlineDetail: respuesta.campo.hasInlineDetail,
      inlineDetailRequiredWhenValue:
        respuesta.campo.inlineDetailRequiredWhenValue,
    });

    resultados.push({
      isRequired: respuesta.campo.isRequired,
      isApplicable: true,
      status,
    });

    updateQueries.push(
      buildRespuestaUpdateQuery({
        respuesta,
        value: rawValue,
        detail: rawDetail,
        status,
        empleadoId,
      }),
    );
  }

  await prisma.$transaction([
    ...updateQueries,
    buildFormularioUpdateQuery({
      formularioId,
      empleadoId,
      formularioStatusActual: formularioActual?.status ?? null,
      resultados,
    }),
  ]);

  revalidateClientePaths(clienteId);
}

export async function confirmarFormularioCliente(formData: FormData) {
  const formularioId = String(formData.get("formularioId") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");

  if (!formularioId || !clienteId) {
    return;
  }

  const formulario = await prisma.formularioCliente.findUnique({
    where: {
      id: formularioId,
    },
    select: {
      completionPercentage: true,
    },
  });

  if (!formulario || Number(formulario.completionPercentage) < 100) {
    revalidateClientePaths(clienteId);
    return;
  }

  await prisma.formularioCliente.update({
    where: {
      id: formularioId,
    },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      hasPostConfirmationChanges: false,
    },
  });

  revalidateClientePaths(clienteId);
}