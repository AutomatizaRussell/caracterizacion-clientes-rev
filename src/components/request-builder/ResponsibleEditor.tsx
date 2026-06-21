"use client";

import { Pencil } from "lucide-react";
import type { Responsible } from "@/features/impulsa/request-types";

type ResponsibleEditorProps = {
  responsible: Responsible;
  isEditingResponsible: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onResponsibleChange: (responsible: Responsible) => void;
};

export default function ResponsibleEditor({
  responsible,
  isEditingResponsible,
  onStartEditing,
  onStopEditing,
  onResponsibleChange,
}: ResponsibleEditorProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold uppercase text-slate-500">
        Responsable
      </span>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
        {isEditingResponsible ? (
          <input
            className="w-full outline-none"
            value={responsible.name}
            onChange={(event) =>
              onResponsibleChange({
                ...responsible,
                name: event.target.value,
              })
            }
            onBlur={onStopEditing}
            autoFocus
          />
        ) : (
          <span className="truncate">{responsible.name}</span>
        )}

        <button
          type="button"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          onClick={onStartEditing}
          aria-label="Editar responsable"
        >
          <Pencil size={16} />
        </button>
      </div>

      <p className="text-[11px] text-slate-400">
        {responsible.role} · {responsible.firm}
      </p>
    </div>
  );
}