"use client";

import { useMemo, useState, useTransition } from "react";
import { guardarFormularioCliente } from "./actions";

type RespuestaFormulario = {
  id: string;
  valueText: string | null;
  valueNumber: string | null;
  valueDate: string | null;
  valueJson: unknown;
  status: string;
  campo: {
    code: string;
    label: string;
    section: string;
    helpText: string | null;
    fieldType: string;
    isRequired: boolean;
    hasInlineDetail: boolean;
    inlineDetailLabel: string | null;
    inlineDetailRequiredWhenValue: string | null;
    dependsOnFieldCode: string | null;
    dependsOnValue: string | null;
    unit: string | null;
  };
};

type SeccionFormulario = {
  section: string;
  respuestas: RespuestaFormulario[];
};

type Props = {
  formularioId: string;
  clienteId: string;
  empleadoId: string;
  secciones: SeccionFormulario[];
  sectores: readonly string[];
};

type FieldRow =
  | {
      type: "single";
      respuesta: RespuestaFormulario;
    }
  | {
      type: "pair";
      left: RespuestaFormulario;
      right: RespuestaFormulario;
    };

function readJsonProperty(valueJson: unknown, propertyName: "value" | "detail") {
  if (!valueJson || typeof valueJson !== "object") {
    return "";
  }

  const record = valueJson as Record<string, unknown>;
  const value = record[propertyName];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getInitialValue(respuesta: RespuestaFormulario) {
  const jsonValue = readJsonProperty(respuesta.valueJson, "value");

  if (jsonValue) {
    return jsonValue;
  }

  if (respuesta.valueText !== null) {
    return respuesta.valueText;
  }

  if (respuesta.valueNumber !== null) {
    return respuesta.valueNumber;
  }

  if (respuesta.valueDate !== null) {
    return respuesta.valueDate.slice(0, 10);
  }

  return "";
}

function getInitialDetail(respuesta: RespuestaFormulario) {
  return readJsonProperty(respuesta.valueJson, "detail");
}

function parseDisplayNumber(value: string) {
  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const sanitized = raw.replace(/[^\d,.-]/g, "");

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

      normalized =
        decimals.length === 3 ? sanitized.replace(".", "") : sanitized;
    }
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMilesCopEquivalent(value: string) {
  const parsed = parseDisplayNumber(value);

  if (parsed === null) {
    return null;
  }

  return parsed * 1000;
}

function shouldShowMilesCopEquivalent(respuesta: RespuestaFormulario) {
  const unit = respuesta.campo.unit?.toLowerCase() ?? "";

  return (
    (respuesta.campo.fieldType === "DECIMAL" ||
      respuesta.campo.fieldType === "INTEGER") &&
    (unit.includes("miles") || unit.includes("cop") || unit.includes("pesos"))
  );
}

function getInputClassName() {
  return "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm text-slate-800 outline-none transition focus:border-[#00a9ce] focus:ring-4 focus:ring-[#00a9ce]/10";
}

function getStatusBadge(status: string) {
  if (status === "OK") {
    return "Completo";
  }

  if (status === "MISSING_DETAIL") {
    return "Falta detalle";
  }

  if (status === "INVALID") {
    return "Inválido";
  }

  if (status === "NOT_APPLICABLE_AUTO") {
    return "No aplica";
  }

  return "Pendiente";
}

function getStatusClassName(status: string) {
  if (status === "OK") {
    return "bg-[#00bfb3]/10 text-[#008b83]";
  }

  if (status === "MISSING_DETAIL") {
    return "bg-[#ed8b00]/10 text-[#b46600]";
  }

  if (status === "INVALID") {
    return "bg-red-100 text-red-700";
  }

  if (status === "NOT_APPLICABLE_AUTO") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-slate-100 text-slate-500";
}

function isVisible(
  respuesta: RespuestaFormulario,
  valuesByCode: Record<string, string>,
) {
  const dependsOnFieldCode = respuesta.campo.dependsOnFieldCode;
  const dependsOnValue = respuesta.campo.dependsOnValue;

  if (!dependsOnFieldCode || !dependsOnValue) {
    return true;
  }

  return valuesByCode[dependsOnFieldCode] === dependsOnValue;
}

function shouldShowInlineDetail(
  respuesta: RespuestaFormulario,
  valuesByRespuestaId: Record<string, string>,
) {
  if (!respuesta.campo.hasInlineDetail) {
    return false;
  }

  if (!respuesta.campo.inlineDetailRequiredWhenValue) {
    return false;
  }

  return (
    valuesByRespuestaId[respuesta.id] ===
    respuesta.campo.inlineDetailRequiredWhenValue
  );
}

function isFullSpanField(respuesta: RespuestaFormulario) {
  return (
    respuesta.campo.fieldType === "LONG_TEXT" ||
    respuesta.campo.hasInlineDetail ||
    Boolean(respuesta.campo.dependsOnFieldCode)
  );
}

function buildFieldRows(respuestas: RespuestaFormulario[]) {
  const rows: FieldRow[] = [];
  let index = 0;

  while (index < respuestas.length) {
    const current = respuestas[index];
    const currentIsFullSpan = isFullSpanField(current);

    if (currentIsFullSpan) {
      rows.push({
        type: "single",
        respuesta: current,
      });

      index += 1;
      continue;
    }

    const next = respuestas[index + 1];

    if (!next) {
      rows.push({
        type: "single",
        respuesta: current,
      });

      index += 1;
      continue;
    }

    const nextIsFullSpan = isFullSpanField(next);

    if (nextIsFullSpan) {
      rows.push({
        type: "single",
        respuesta: current,
      });

      index += 1;
      continue;
    }

    rows.push({
      type: "pair",
      left: current,
      right: next,
    });

    index += 2;
  }

  return rows;
}

function getFieldContainerClassName(respuesta: RespuestaFormulario) {
  if (respuesta.campo.fieldType === "LONG_TEXT") {
    return "mx-auto w-full max-w-4xl text-center";
  }

  if (respuesta.campo.hasInlineDetail || respuesta.campo.dependsOnFieldCode) {
    return "mx-auto w-full max-w-2xl text-center";
  }

  return "mx-auto w-full max-w-xl text-center";
}

export default function CaracterizacionFormClient({
  formularioId,
  clienteId,
  empleadoId,
  secciones,
  sectores,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const allRespuestas = useMemo(
    () => secciones.flatMap((seccion) => seccion.respuestas),
    [secciones],
  );

  const initialValuesByRespuestaId = useMemo(() => {
    const values: Record<string, string> = {};

    for (const respuesta of allRespuestas) {
      values[respuesta.id] = getInitialValue(respuesta);
    }

    return values;
  }, [allRespuestas]);

  const initialDetailsByRespuestaId = useMemo(() => {
    const details: Record<string, string> = {};

    for (const respuesta of allRespuestas) {
      details[respuesta.id] = getInitialDetail(respuesta);
    }

    return details;
  }, [allRespuestas]);

  const [valuesByRespuestaId, setValuesByRespuestaId] = useState(
    initialValuesByRespuestaId,
  );

  const [detailsByRespuestaId, setDetailsByRespuestaId] = useState(
    initialDetailsByRespuestaId,
  );

  const valuesByCode = useMemo(() => {
    const values: Record<string, string> = {};

    for (const respuesta of allRespuestas) {
      values[respuesta.campo.code] = valuesByRespuestaId[respuesta.id] ?? "";
    }

    return values;
  }, [allRespuestas, valuesByRespuestaId]);

  function updateValue(respuestaId: string, value: string) {
    setValuesByRespuestaId((current) => ({
      ...current,
      [respuestaId]: value,
    }));
  }

  function updateDetail(respuestaId: string, value: string) {
    setDetailsByRespuestaId((current) => ({
      ...current,
      [respuestaId]: value,
    }));
  }

  function renderInput(respuesta: RespuestaFormulario) {
    const name = `respuesta:${respuesta.id}`;
    const value = valuesByRespuestaId[respuesta.id] ?? "";

    if (respuesta.campo.fieldType === "YES_NO_NA") {
      return (
        <select
          name={name}
          value={value}
          onChange={(event) => updateValue(respuesta.id, event.target.value)}
          className={getInputClassName()}
        >
          <option value="">SELECCIONE UNA OPCIÓN</option>
          <option value="SI">SI</option>
          <option value="NO">NO</option>
          <option value="NO_APLICA">NO APLICA</option>
        </select>
      );
    }

    if (respuesta.campo.fieldType === "SECTOR") {
      return (
        <select
          name={name}
          value={value}
          onChange={(event) => updateValue(respuesta.id, event.target.value)}
          className={getInputClassName()}
        >
          <option value="">SELECCIONE UNA OPCIÓN</option>

          {sectores.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      );
    }

    if (respuesta.campo.fieldType === "LONG_TEXT") {
      return (
        <textarea
          name={name}
          value={value}
          onChange={(event) => updateValue(respuesta.id, event.target.value)}
          rows={3}
          className={getInputClassName()}
          placeholder="Digite la respuesta"
        />
      );
    }

    if (respuesta.campo.fieldType === "DATE") {
      return (
        <input
          name={name}
          type="date"
          value={value}
          onChange={(event) => updateValue(respuesta.id, event.target.value)}
          className={getInputClassName()}
        />
      );
    }

    if (
      respuesta.campo.fieldType === "INTEGER" ||
      respuesta.campo.fieldType === "DECIMAL"
    ) {
      return (
        <input
          name={name}
          type="text"
          inputMode={
            respuesta.campo.fieldType === "DECIMAL" ? "decimal" : "numeric"
          }
          value={value}
          onChange={(event) => updateValue(respuesta.id, event.target.value)}
          className={getInputClassName()}
          placeholder="0"
        />
      );
    }

    return (
      <input
        name={name}
        type="text"
        value={value}
        onChange={(event) => updateValue(respuesta.id, event.target.value)}
        className={getInputClassName()}
        placeholder="Digite la respuesta"
      />
    );
  }

  function renderRespuestaField(respuesta: RespuestaFormulario) {
    const showInlineDetail = shouldShowInlineDetail(
      respuesta,
      valuesByRespuestaId,
    );

    const value = valuesByRespuestaId[respuesta.id] ?? "";
    const milesEquivalent = getMilesCopEquivalent(value);

    return (
      <div className={getFieldContainerClassName(respuesta)}>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <label className="rb-label mb-0">
            {respuesta.campo.label}
            {respuesta.campo.isRequired && (
              <span className="text-[#ed8b00]"> *</span>
            )}
          </label>

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getStatusClassName(
              respuesta.status,
            )}`}
          >
            {getStatusBadge(respuesta.status)}
          </span>
        </div>

        {respuesta.campo.helpText && (
          <p className="mb-3 text-xs leading-5 text-slate-500">
            {respuesta.campo.helpText}
            {respuesta.campo.unit && (
              <span className="font-semibold">
                {" "}
                Unidad: {respuesta.campo.unit}.
              </span>
            )}
          </p>
        )}

        {renderInput(respuesta)}

        {shouldShowMilesCopEquivalent(respuesta) && (
          <div className="mx-auto mt-2 max-w-3xl rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 ring-1 ring-slate-200">
            {value ? (
              <>
                <span className="font-semibold text-slate-700">
                  Equivalente estimado:
                </span>{" "}
                {milesEquivalent === null
                  ? "Valor no válido"
                  : formatCop(milesEquivalent)}
              </>
            ) : (
              <span>
                Ingresa el valor en miles de pesos. Ejemplo:{" "}
                <span className="font-semibold">1.500</span> equivale a{" "}
                <span className="font-semibold">{formatCop(1500000)}</span>.
              </span>
            )}
          </div>
        )}

        {showInlineDetail && (
          <div className="mx-auto mt-3 max-w-3xl space-y-2">
            <textarea
              name={`respuestaDetalle:${respuesta.id}`}
              value={detailsByRespuestaId[respuesta.id] ?? ""}
              onChange={(event) => updateDetail(respuesta.id, event.target.value)}
              rows={2}
              className={getInputClassName()}
              placeholder={
                respuesta.campo.inlineDetailLabel ?? "Detalle de la respuesta"
              }
            />

            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#ed8b00]">
              Detalle obligatorio si responde{" "}
              {respuesta.campo.inlineDetailRequiredWhenValue}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await guardarFormularioCliente(formData);
        });
      }}
    >
      <input type="hidden" name="formularioId" value={formularioId} />
      <input type="hidden" name="clienteId" value={clienteId} />
      <input type="hidden" name="empleadoId" value={empleadoId} />

      {secciones.map((seccion) => {
        const respuestasVisibles = seccion.respuestas.filter((respuesta) =>
          isVisible(respuesta, valuesByCode),
        );

        if (respuestasVisibles.length === 0) {
          return null;
        }

        const fieldRows = buildFieldRows(respuestasVisibles);

        return (
          <section key={seccion.section} className="mb-12">
            <div className="rb-subsection-label mb-8">{seccion.section}</div>

            <div className="space-y-7">
              {fieldRows.map((row) => {
                if (row.type === "single") {
                  return (
                    <div
                      key={`row-${seccion.section}-${row.respuesta.id}`}
                      className="grid grid-cols-1"
                    >
                      {renderRespuestaField(row.respuesta)}
                    </div>
                  );
                }

                return (
                  <div
                    key={`row-${seccion.section}-${row.left.id}-${row.right.id}`}
                    className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2"
                  >
                    {renderRespuestaField(row.left)}
                    {renderRespuestaField(row.right)}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <button
        type="submit"
        disabled={isPending}
        className="rb-button-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar Caracterización"}
      </button>

      {!isPending && (
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          Los cambios se aplican al guardar. El autoguardado se implementará en
          el siguiente paso.
        </p>
      )}
    </form>
  );
}
