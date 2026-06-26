"use client";

import type { Responsible } from "@/features/impulsa/request-types";

type ResponsibleEditorProps = {
  responsible: Responsible;
};

export default function ResponsibleEditor({
  responsible,
}: ResponsibleEditorProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        Responsable
      </span>

      <div className="flex h-12 items-center rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">
            {responsible.name}
          </p>
        </div>
      </div>

      <p className="truncate text-[11px] text-slate-400">
        {responsible.role} · Russell Bedford
      </p>
    </div>
  );
}
