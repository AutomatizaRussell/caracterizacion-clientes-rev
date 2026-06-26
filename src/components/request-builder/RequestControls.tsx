"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
  hasTemplateCustomizations?: boolean;
  onCompanyChange: (companyId: string) => void;
  onRequestTypeChange: (requestTypeId: string) => void;
  onCutoffDateChange: (cutoffDate: string) => void;
};

const CONTROL_CLASS =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#079b85] focus:ring-4 focus:ring-[#0ccba9]/15";

const LABEL_CLASS =
  "text-[11px] font-extrabold uppercase tracking-wide text-slate-500";

function normalizeSearchValue(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getCompanyDisplayName(company: CompanyOption) {
  if (!company.shortName) {
    return company.name;
  }

  return `${company.name} · ${company.shortName}`;
}

function ClientCombobox({
  companies,
  selectedCompanyId,
  onCompanyChange,
}: {
  companies: CompanyOption[];
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
}) {
  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ??
    companies[0];

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) {
      return companies;
    }

    return companies.filter((company) => {
      const normalizedName = normalizeSearchValue(company.name);
      const normalizedShortName = normalizeSearchValue(company.shortName);

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedShortName.includes(normalizedQuery)
      );
    });
  }, [companies, query]);

  function selectCompany(company: CompanyOption) {
    onCompanyChange(company.id);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="relative space-y-1.5">
      <span className={LABEL_CLASS}>Cliente</span>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#079b85] focus:ring-4 focus:ring-[#0ccba9]/15"
          value={query}
          placeholder={
            selectedCompany
              ? getCompanyDisplayName(selectedCompany)
              : "Buscar cliente..."
          }
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => {
            /*
             * Permite que el click sobre una opción se ejecute antes de cerrar
             * el listado.
             */
            window.setTimeout(() => setIsOpen(false), 120);
          }}
        />
      </div>

      {isOpen ? (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
          {filteredCompanies.map((company) => {
            const isSelected = company.id === selectedCompanyId;

            return (
              <button
                key={company.id}
                type="button"
                className={[
                  "flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm transition",
                  isSelected
                    ? "bg-[#0ccba9]/10 text-[#041461]"
                    : "text-slate-700 hover:bg-[#0ccba9]/10",
                ].join(" ")}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCompany(company);
                }}
              >
                <span className="truncate font-bold">{company.name}</span>

                {company.shortName ? (
                  <span className="mt-0.5 truncate text-xs text-slate-500">
                    {company.shortName}
                  </span>
                ) : null}
              </button>
            );
          })}

          {filteredCompanies.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">
              No se encontraron clientes.
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedCompany ? (
        <p className="truncate text-[11px] text-slate-400">
          Seleccionado: {getCompanyDisplayName(selectedCompany)}
        </p>
      ) : null}
    </div>
  );
}

export default function RequestControls({
  companies,
  requestTypes,
  selectedCompanyId,
  selectedRequestTypeId,
  cutoffDate,
  responsible,
  hasTemplateCustomizations = false,
  onCompanyChange,
  onRequestTypeChange,
  onCutoffDateChange,
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
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Configuración
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#041461]">
          Datos base de la solicitud
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.13fr)_minmax(0,1.25fr)_220px_minmax(280px,0.85fr)]">
        <ClientCombobox
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={onCompanyChange}
        />

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

        <ResponsibleEditor responsible={responsible} />
      </div>
    </section>
  );
}
