"use client";

import { ArrowLeft, Plus, RotateCcw, Trash2 } from "lucide-react";
import type {
  RequestCategory,
  RequestItem,
} from "@/features/impulsa/request-types";

type RequestCategoryEditorPanelProps = {
  category: RequestCategory;
  onBack: () => void;
  onToggleItem: (categoryId: string, itemId: string) => void;
  onAdvancedItemTextChange: (
    categoryId: string,
    itemId: string,
    text: string,
  ) => void;
  onAddAdvancedItem: (categoryId: string) => void;
  onRemoveAdvancedItem: (categoryId: string, itemId: string) => void;
  onResetCategoryToBase: (categoryId: string) => void;
};

function getBaseItems(category: RequestCategory) {
  return category.items.filter((item) => item.mode === "base");
}

function getAdvancedItems(category: RequestCategory) {
  return category.items.filter((item) => item.mode === "advanced");
}

function RequestBaseItemRow({
  categoryId,
  item,
  onToggleItem,
}: {
  categoryId: string;
  item: RequestItem;
  onToggleItem: (categoryId: string, itemId: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#001871]"
        checked={item.selected}
        onChange={() => onToggleItem(categoryId, item.id)}
      />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-6 ${
            item.selected ? "text-slate-800" : "text-slate-400 line-through"
          }`}
        >
          {item.text}
        </p>

        {item.children.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-xs leading-5 text-slate-500">
            {item.children.map((child, index) => (
              <li key={`${item.id}-child-${index}`}>{child}</li>
            ))}
          </ul>
        )}

        <p
          className={`mt-2 text-[11px] font-bold uppercase tracking-wide ${
            item.selected ? "text-[#008b83]" : "text-[#b46600]"
          }`}
        >
          {item.selected ? "Incluido en la solicitud" : "Excluido de la solicitud"}
        </p>
      </div>
    </label>
  );
}

function RequestAdvancedItemRow({
  categoryId,
  item,
  onToggleItem,
  onAdvancedItemTextChange,
  onRemoveAdvancedItem,
}: {
  categoryId: string;
  item: RequestItem;
  onToggleItem: (categoryId: string, itemId: string) => void;
  onAdvancedItemTextChange: (
    categoryId: string,
    itemId: string,
    text: string,
  ) => void;
  onRemoveAdvancedItem: (categoryId: string, itemId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[#981d97]/20 bg-[#981d97]/[0.03] px-4 py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-3 h-4 w-4 rounded border-slate-300 accent-[#981d97]"
          checked={item.selected}
          onChange={() => onToggleItem(categoryId, item.id)}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#981d97] focus:ring-4 focus:ring-[#981d97]/10"
            value={item.text}
            onChange={(event) =>
              onAdvancedItemTextChange(categoryId, item.id, event.target.value)
            }
            placeholder="Describe el requerimiento adicional"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={`text-[11px] font-bold uppercase tracking-wide ${
                item.selected ? "text-[#981d97]" : "text-slate-400"
              }`}
            >
              {item.selected
                ? "Ítem avanzado incluido"
                : "Ítem avanzado no incluido"}
            </p>

            <button
              type="button"
              onClick={() => onRemoveAdvancedItem(categoryId, item.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={13} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestCategoryEditorPanel({
  category,
  onBack,
  onToggleItem,
  onAdvancedItemTextChange,
  onAddAdvancedItem,
  onRemoveAdvancedItem,
  onResetCategoryToBase,
}: RequestCategoryEditorPanelProps) {
  const baseItems = getBaseItems(category);
  const advancedItems = getAdvancedItems(category);

  const includedBaseItemsCount = baseItems.filter((item) => item.selected).length;
  const excludedBaseItemsCount = baseItems.length - includedBaseItemsCount;
  const includedAdvancedItemsCount = advancedItems.filter(
    (item) => item.selected,
  ).length;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
          >
            <ArrowLeft size={15} />
            Volver a categorías
          </button>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Personalizar solicitud
          </p>

          <h2 className="mt-1 text-lg font-bold text-[#001871]">
            {category.title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ajusta qué ítems base se enviarán y agrega requerimientos avanzados
            específicos para esta categoría.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onResetCategoryToBase(category.id)}
          className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 transition hover:border-[#ed8b00] hover:bg-[#ed8b00]/5 hover:text-[#b46600]"
        >
          <RotateCcw size={15} />
          Restaurar base
        </button>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-[#00bfb3]/10 px-3 py-2 ring-1 ring-[#00bfb3]/20">
          <p className="text-lg font-extrabold text-[#008b83]">
            {includedBaseItemsCount}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#008b83]">
            Base incluidos
          </p>
        </div>

        <div className="rounded-xl bg-[#ed8b00]/10 px-3 py-2 ring-1 ring-[#ed8b00]/20">
          <p className="text-lg font-extrabold text-[#b46600]">
            {excludedBaseItemsCount}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#b46600]">
            Base excluidos
          </p>
        </div>

        <div className="rounded-xl bg-[#981d97]/10 px-3 py-2 ring-1 ring-[#981d97]/20">
          <p className="text-lg font-extrabold text-[#981d97]">
            {includedAdvancedItemsCount}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#981d97]">
            Avanzados
          </p>
        </div>
      </div>

      <div className="max-h-[calc(100vh-390px)] space-y-6 overflow-auto pr-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#001871]">
                Ítems base
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Estos ítems vienen por defecto. Puedes excluirlos si no aplican
                a esta solicitud específica.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {baseItems.map((item) => (
              <RequestBaseItemRow
                key={item.id}
                categoryId={category.id}
                item={item}
                onToggleItem={onToggleItem}
              />
            ))}

            {baseItems.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                Esta categoría no tiene ítems base.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#981d97]">
                Ítems avanzados
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Agrega requerimientos adicionales que solo aplican a esta
                solicitud.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddAdvancedItem(category.id)}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#981d97] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              <Plus size={15} />
              Agregar ítem
            </button>
          </div>

          <div className="space-y-2">
            {advancedItems.map((item) => (
              <RequestAdvancedItemRow
                key={item.id}
                categoryId={category.id}
                item={item}
                onToggleItem={onToggleItem}
                onAdvancedItemTextChange={onAdvancedItemTextChange}
                onRemoveAdvancedItem={onRemoveAdvancedItem}
              />
            ))}

            {advancedItems.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No hay ítems avanzados en esta categoría. Usa “Agregar ítem”
                para crear uno.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}