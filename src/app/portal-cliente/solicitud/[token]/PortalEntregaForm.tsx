"use client";

import { useMemo, useState } from "react";

type PortalItem = {
  id: string;
  orderIndex: number;
  status: string;
  itemMode: string;
  text: string;
  children: string[];
};

type PortalCategory = {
  id: string;
  title: string;
  items: PortalItem[];
};

type PortalEntregaFormProps = {
  categories: PortalCategory[];
  action: (formData: FormData) => void;
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    SUBMITTED: "Adjuntos enviados",
    CREATED: "Creado",
    SENT: "Enviado",
    CLIENT_SUBMITTED: "Adjuntos recibidos",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    FAILED: "Fallido",
  };

  return labels[status] ?? status;
}

function getStatusClassName(status: string) {
  if (status === "SUBMITTED" || status === "CLIENT_SUBMITTED") {
    return "bg-[#00bfb3]/10 text-[#008b83] ring-[#00bfb3]/20";
  }

  if (status === "CANCELLED" || status === "FAILED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export default function PortalEntregaForm({
  categories,
  action,
}: PortalEntregaFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(
    () => new Set(),
  );

  const totalItems = useMemo(() => {
    return categories.reduce((total, category) => total + category.items.length, 0);
  }, [categories]);

  const canCheckItems = selectedFiles.length > 0;
  const canSubmit = selectedFiles.length > 0 && checkedItemIds.size > 0;

  return (
    <form action={action} className="mt-5 flex min-h-0 flex-1 flex-col">
      <div className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Adjuntar documentos de la entrega
          </span>

          <input
            type="file"
            name="attachments"
            multiple
            className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#001871] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:bg-slate-100"
            onChange={(event) => {
              setSelectedFiles(Array.from(event.currentTarget.files ?? []));
              setCheckedItemIds(new Set());
            }}
          />
        </label>

        <p className="mt-2 text-xs text-slate-500">
          Los archivos se cargarán únicamente cuando finalice la entrega.
          Todos se guardarán en la carpeta Información suministrada de esta solicitud.
        </p>

        {selectedFiles.length > 0 ? (
          <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            <p className="font-bold text-slate-700">
              Archivos seleccionados: {selectedFiles.length}
            </p>

            <ul className="mt-2 max-h-28 space-y-1 overflow-auto">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`}>
                  {file.name} — {(file.size / 1024).toFixed(1)} KB
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {!canCheckItems && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          Adjunte al menos un archivo para habilitar la marcación de ítems.
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        {categories.map((category, categoryIndex) => {
          const categorySubmittedItems = category.items.filter(
            (item) => item.status === "SUBMITTED",
          ).length;

          return (
            <details
              key={category.id}
              className="group rounded-2xl border border-slate-200 bg-slate-50/60"
              open={categoryIndex === 0}
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Categoría {categoryIndex + 1}
                  </p>

                  <h3 className="mt-1 text-base font-extrabold text-[#001871]">
                    {category.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                    {categorySubmittedItems}/{category.items.length} recibidos
                  </span>

                  <span className="rounded-full bg-[#001871]/5 px-2.5 py-1 text-xs font-bold text-[#001871] ring-1 ring-[#001871]/10">
                    <span className="group-open:hidden">Desplegar</span>
                    <span className="hidden group-open:inline">Replegar</span>
                  </span>
                </div>
              </summary>

              <div className="space-y-4 border-t border-slate-200 p-4">
                {category.items.map((item) => {
                  const checked = checkedItemIds.has(item.id);

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#001871]/10 px-2.5 py-1 text-xs font-bold text-[#001871]">
                              Ítem {item.orderIndex}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClassName(
                                item.status,
                              )}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>

                            {item.itemMode === "ADVANCED" && (
                              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-bold text-fuchsia-700 ring-1 ring-fuchsia-100">
                                Adicional
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-800">
                            {item.text}
                          </p>

                          {item.children.length > 0 && (
                            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                              {item.children.map((child, index) => (
                                <li key={`${item.id}-child-${index}`}>
                                  {child}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <input
                          type="checkbox"
                          name="checkedItemIds"
                          value={item.id}
                          disabled={!canCheckItems}
                          checked={checked}
                          onChange={(event) => {
                            setCheckedItemIds((current) => {
                              const next = new Set(current);

                              if (event.currentTarget.checked) {
                                next.add(item.id);
                              } else {
                                next.delete(item.id);
                              }

                              return next;
                            });
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#001871]"
                        />

                        <span className="text-sm text-slate-700">
                          Este ítem está cubierto por los adjuntos de esta entrega.
                        </span>
                      </label>
                    </article>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <div className="-mx-5 mt-4 shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-xl bg-[#001871] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finalizar entrega
        </button>

        <p className="mt-2 text-center text-xs text-slate-400">
          Para finalizar, debe adjuntar al menos un archivo y marcar al menos un
          ítem cubierto por la entrega. Total de ítems: {totalItems}.
        </p>
      </div>
    </form>
  );
}
