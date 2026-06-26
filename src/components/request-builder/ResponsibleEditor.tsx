"use client";

import { Check, Pencil } from "lucide-react";
import type { Responsible } from "@/features/impulsa/request-types";

type ResponsibleEditorProps = {
  responsible: Responsible;
  isEditingResponsible: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onResponsibleChange: (responsible: Responsible) => void;
};

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#079b85] focus:ring-4 focus:ring-[#0ccba9]/15";

export default function ResponsibleEditor({
  responsible,
  isEditingResponsible,
  onStartEditing,
  onStopEditing,
  onResponsibleChange,
}: ResponsibleEditorProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        Responsable
      </span>

      <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
        {isEditingResponsible ? (
          <div className="space-y-2">
            <input
              className={INPUT_CLASS}
              value={responsible.name}
              onChange={(event) =>
                onResponsibleChange({
                  ...responsible,
                  name: event.target.value,
                })
              }
              placeholder="Nombre del responsable"
              autoFocus
            />

            <input
              className={INPUT_CLASS}
              value={responsible.role}
              onChange={(event) =>
                onResponsibleChange({
                  ...responsible,
                  role: event.target.value,
                })
              }
              placeholder="Cargo"
            />

            <input
              className={INPUT_CLASS}
              value={responsible.firm}
              onChange={(event) =>
                onResponsibleChange({
                  ...responsible,
                  firm: event.target.value,
                })
              }
              placeholder="Firma"
            />

            <button
              type="button"
              onClick={onStopEditing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0ccba9] px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              <Check size={14} />
              Listo
            </button>
          </div>
        ) : (
          <div className="flex h-8 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {responsible.name}
              </p>
            </div>

            <button
              type="button"
              className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-[#0ccba9]/10 hover:text-[#041461]"
              onClick={onStartEditing}
              aria-label="Editar responsable"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </div>

      {!isEditingResponsible ? (
        <p className="truncate text-[11px] text-slate-400">
          {responsible.role} · {responsible.firm}
        </p>
      ) : null}
    </div>
  );
}
