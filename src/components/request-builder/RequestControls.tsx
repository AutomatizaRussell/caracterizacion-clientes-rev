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
  hasTemplateCustomizations?: boolean;
  onCompanyChange: (companyId: string) => void;
  onRequestTypeChange: (requestTypeId: string) => void;
  onCutoffDateChange: (cutoffDate: string) => void;
  onStartEditingResponsible: () => void;
  onStopEditingResponsible: () => void;
  onResponsibleChange: (responsible: Responsible) => void;
};

const CONTROL_CLASS =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#079b85] focus:ring-4 focus:ring-[#0ccba9]/15";

const LABEL_CLASS =
  "text-[11px] font-extrabold uppercase tracking-wide text-slate-500";

export default function RequestControls({
  companies,
  requestTypes,
  selectedCompanyId,
  selectedRequestTypeId,
  cutoffDate,
  responsible,
  isEditingResponsible,
  hasTemplateCustomizations = false,
  onCompanyChange,
  onRequestTypeChange,
  onCutoffDateChange,
  onStartEditingResponsible,
  onStopEditingResponsible,
  onResponsibleChange,
}: RequestControlsProps) {
  function handleRequestTypeChange(nextRequestTypeId: string) {
    if (nextRequestTypeId === selectedRequestTypeId) {
      return;
    }

    if (hasTemplateCustomizations) {
      const shouldContinue = window.confirm(
        "Cambiar el tipo de solicitud reemplazará la plantilla actual y eliminará personalizaciones realizadas en categorías e ítems. ¿Deseas continuar?",
      );

      if (!shouldContinue) {
        return;
      }
    }

    onRequestTypeChange(nextRequestTypeId);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Configuración
          </p>

          <h2 className="mt-1 text-lg font-extrabold text-[#041461]">
            Datos base de la solicitud
          </h2>
        </div>

        <p className="max-w-2xl text-xs leading-5 text-slate-400 md:text-right">
          Estos datos impactan el documento, el radicado, el portal del cliente
          y la automatización posterior.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)] 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)_220px_minmax(300px,0.95fr)]">
        <label className="space-y-1.5">
          <span className={LABEL_CLASS}>Cliente</span>

          <select
            className={CONTROL_CLASS}
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

        <label className="space-y-1.5">
          <span className={LABEL_CLASS}>Tipo de solicitud</span>

          <select
            className={CONTROL_CLASS}
            value={selectedRequestTypeId}
            onChange={(event) => handleRequestTypeChange(event.target.value)}
          >
            {requestTypes.map((requestType) => (
              <option key={requestType.id} value={requestType.id}>
                {requestType.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className={LABEL_CLASS}>Fecha de corte</span>

          <input
            type="date"
            className={CONTROL_CLASS}
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
