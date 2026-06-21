"use client";

import type {
  CompanyOption,
  Responsible,
  RequestTemplate,
} from "@/features/impulsa/request-types";
import ResponsibleEditor from "./ResponsibleEditor";

type RequestControlsProps = {
  companies: CompanyOption[];
  requestTypes: RequestTemplate[];
  selectedCompanyId: string;
  selectedRequestTypeId: string;
  cutoffDate: string;
  responsible: Responsible;
  isEditingResponsible: boolean;
  onCompanyChange: (companyId: string) => void;
  onRequestTypeChange: (requestTypeId: string) => void;
  onCutoffDateChange: (cutoffDate: string) => void;
  onStartEditingResponsible: () => void;
  onStopEditingResponsible: () => void;
  onResponsibleChange: (responsible: Responsible) => void;
};

export default function RequestControls({
  companies,
  requestTypes,
  selectedCompanyId,
  selectedRequestTypeId,
  cutoffDate,
  responsible,
  isEditingResponsible,
  onCompanyChange,
  onRequestTypeChange,
  onCutoffDateChange,
  onStartEditingResponsible,
  onStopEditingResponsible,
  onResponsibleChange,
}: RequestControlsProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1.3fr_0.7fr_0.9fr]">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">
            Cliente
          </span>

          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#001871]"
            value={selectedCompanyId}
            onChange={(event) => onCompanyChange(event.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">
            Tipo de solicitud
          </span>

          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#001871]"
            value={selectedRequestTypeId}
            onChange={(event) => onRequestTypeChange(event.target.value)}
          >
            {requestTypes.map((requestType) => (
              <option key={requestType.id} value={requestType.id}>
                {requestType.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">
            Fecha de corte
          </span>

          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#001871]"
            value={cutoffDate}
            onChange={(event) => onCutoffDateChange(event.target.value)}
          />
        </label>

        <ResponsibleEditor
          responsible={responsible}
          isEditingResponsible={isEditingResponsible}
          onStartEditing={onStartEditingResponsible}
          onStopEditing={onStopEditingResponsible}
          onResponsibleChange={onResponsibleChange}
        />
      </div>
    </section>
  );
}