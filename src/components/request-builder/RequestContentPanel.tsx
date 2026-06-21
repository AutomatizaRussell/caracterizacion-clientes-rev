"use client";

import type { RequestTemplate } from "@/features/impulsa/request-types";

type RequestContentPanelProps = {
  template: RequestTemplate;
  advancedModeEnabled: boolean;
  selectedBaseItemsCount: number;
  selectedAdvancedItemsCount: number;
  totalBaseItemsCount: number;
  totalAdvancedItemsCount: number;
  onAdvancedModeChange: (enabled: boolean) => void;
  onToggleAdvancedItem: (categoryId: string, itemId: string) => void;
  onAdvancedItemTextChange: (
    categoryId: string,
    itemId: string,
    text: string,
  ) => void;
};

export default function RequestContentPanel({
  template,
  advancedModeEnabled,
  selectedBaseItemsCount,
  selectedAdvancedItemsCount,
  totalBaseItemsCount,
  totalAdvancedItemsCount,
  onAdvancedModeChange,
  onToggleAdvancedItem,
  onAdvancedItemTextChange,
}: RequestContentPanelProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#001871]">
            Contenido de la solicitud
          </h2>

          <p className="text-sm text-slate-500">
            Los ítems base se incluyen siempre en el documento. El modo avanzado
            permite agregar requerimientos adicionales por categoría.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {selectedBaseItemsCount}/{totalBaseItemsCount} base
          </div>

          <div className="rounded-full bg-[#981d97]/10 px-3 py-1 text-sm font-semibold text-[#981d97]">
            {selectedAdvancedItemsCount}/{totalAdvancedItemsCount} avanzado
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#001871]">Modo avanzado</p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Activa campos adicionales para complementar el documento base.
              Por ahora se muestran placeholders por categoría.
            </p>
          </div>

          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-slate-300 accent-[#001871]"
            checked={advancedModeEnabled}
            onChange={(event) => onAdvancedModeChange(event.target.checked)}
          />
        </label>
      </div>

      <div className="max-h-[calc(100vh-330px)] space-y-4 overflow-auto pr-2">
        {template.categories.map((category) => {
          const baseItems = category.items.filter((item) => item.mode === "base");
          const advancedItems = category.items.filter(
            (item) => item.mode === "advanced",
          );

          return (
            <section
              key={category.id}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-bold text-[#001871]">{category.title}</h3>
              </header>

              <div className="divide-y divide-slate-100">
                {baseItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00bfb3]" />

                    <div>
                      <p className="text-sm leading-6 text-slate-800">
                        {item.text}
                      </p>

                      {item.children.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-xs leading-5 text-slate-600">
                          {item.children.map((child, index) => (
                            <li key={`${item.id}-child-${index}`}>{child}</li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#008b83]">
                        Incluido por defecto
                      </p>
                    </div>
                  </div>
                ))}

                {advancedModeEnabled &&
                  advancedItems.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-2 bg-[#981d97]/[0.03] px-4 py-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#981d97]"
                          checked={item.selected}
                          onChange={() =>
                            onToggleAdvancedItem(category.id, item.id)
                          }
                        />

                        <div className="w-full">
                          <input
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#981d97]"
                            value={item.text}
                            onChange={(event) =>
                              onAdvancedItemTextChange(
                                category.id,
                                item.id,
                                event.target.value,
                              )
                            }
                          />

                          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#981d97]">
                            Ítem avanzado opcional
                          </p>
                        </div>
                      </label>
                    </div>
                  ))}

                {!advancedModeEnabled && advancedItems.length > 0 && (
                  <div className="bg-slate-50 px-4 py-3 text-xs text-slate-400">
                    Activa el modo avanzado para agregar ítems adicionales en
                    esta categoría.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}