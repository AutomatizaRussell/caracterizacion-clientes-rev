"use client";

import { PermissionMatrixEditor } from "@/features/permisos/PermissionMatrixEditor";
import {
  DECISION_ACTION_DETAILS,
  DECISION_MATRIX_RULES,
  DECISION_PERMISSION_MATRIX,
} from "./permission-decision-matrix.data";

export function PermissionDecisionMatrix() {
  return (
    <PermissionMatrixEditor
      storageKey="revisoria.permissionMatrix.solicitudesDecision.v1"
      exportFileName="matriz-decision-solicitudes-informacion.json"
      eyebrow="Definición de permisos"
      title="Matriz de permisos — Solicitudes de información"
      description="Diligencie únicamente las acciones pendientes de decisión para el flujo de solicitudes de información. Las acciones de consulta y estado ya fueron predefinidas."
      warning="Esta matriz guarda cambios en este navegador. Al terminar, exporte o copie el JSON para enviar las decisiones."
      defaultMatrix={DECISION_PERMISSION_MATRIX}
    >
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-[#001871]">
            Reglas y aclaraciones
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {DECISION_MATRIX_RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00bfb3]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-[#001871]">
            Glosario breve
          </h2>

          <div className="mt-4 space-y-4">
            {DECISION_ACTION_DETAILS.map((item) => (
              <details
                key={item.action}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
                  {item.action}
                </summary>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>

                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-500 ring-1 ring-slate-200">
                  <span className="font-bold text-slate-700">Ejemplo: </span>
                  {item.example}
                </p>
              </details>
            ))}
          </div>
        </article>
      </section>
    </PermissionMatrixEditor>
  );
}
