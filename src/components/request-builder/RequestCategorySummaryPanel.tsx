"use client";

import { SlidersHorizontal } from "lucide-react";
import type { RequestTemplate } from "@/features/impulsa/request-types";

type CategoryStat = {
  categoryId: string;
  baseTotal: number;
  baseIncluded: number;
  baseExcluded: number;
  advancedTotal: number;
  advancedIncluded: number;
};

type RequestCategorySummaryPanelProps = {
  template: RequestTemplate;
  categoryStats: CategoryStat[];
  totalBaseItemsCount: number;
  totalIncludedItemsCount: number;
  totalExcludedBaseItemsCount: number;
  totalIncludedAdvancedItemsCount: number;
  onEditCategory: (categoryId: string) => void;
};

function getCategoryStat(params: {
  categoryId: string;
  categoryStats: CategoryStat[];
}) {
  return (
    params.categoryStats.find(
      (categoryStat) => categoryStat.categoryId === params.categoryId,
    ) ?? {
      categoryId: params.categoryId,
      baseTotal: 0,
      baseIncluded: 0,
      baseExcluded: 0,
      advancedTotal: 0,
      advancedIncluded: 0,
    }
  );
}

export default function RequestCategorySummaryPanel({
  template,
  categoryStats,
  totalBaseItemsCount,
  totalIncludedItemsCount,
  totalExcludedBaseItemsCount,
  totalIncludedAdvancedItemsCount,
  onEditCategory,
}: RequestCategorySummaryPanelProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Contenido
          </p>

          <h2 className="mt-1 text-lg font-bold text-[#001871]">
            Contenido por categorías
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Revisa el contenido base de la solicitud y personaliza solo las
            categorías que necesiten ajustes.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 text-center sm:grid-cols-4 xl:w-auto xl:min-w-[360px] xl:shrink-0">
          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <p className="text-lg font-extrabold text-[#001871]">
              {totalBaseItemsCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Base
            </p>
          </div>

          <div className="rounded-xl bg-[#00bfb3]/10 px-3 py-2 ring-1 ring-[#00bfb3]/20">
            <p className="text-lg font-extrabold text-[#008b83]">
              {totalIncludedItemsCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#008b83]">
              Incluidos
            </p>
          </div>

          <div className="rounded-xl bg-[#ed8b00]/10 px-3 py-2 ring-1 ring-[#ed8b00]/20">
            <p className="text-lg font-extrabold text-[#b46600]">
              {totalExcludedBaseItemsCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#b46600]">
              Excluidos
            </p>
          </div>

          <div className="rounded-xl bg-[#981d97]/10 px-3 py-2 ring-1 ring-[#981d97]/20">
            <p className="text-lg font-extrabold text-[#981d97]">
              {totalIncludedAdvancedItemsCount}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#981d97]">
              Adicionales
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-340px)] space-y-3 overflow-auto pr-2">
        {template.categories.map((category) => {
          const stat = getCategoryStat({
            categoryId: category.id,
            categoryStats,
          });

          const hasCustomization =
            stat.baseExcluded > 0 || stat.advancedIncluded > 0;

          return (
            <article
              key={category.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[#001871]">
                      {category.title}
                    </h3>

                    {hasCustomization && (
                      <span className="rounded-full bg-[#981d97]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#981d97] ring-1 ring-[#981d97]/20">
                        Personalizada
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {stat.baseIncluded} de {stat.baseTotal} ítems base
                    incluidos
                    {stat.baseExcluded > 0
                      ? ` · ${stat.baseExcluded} excluidos`
                      : ""}
                    {stat.advancedIncluded > 0
                      ? ` · ${stat.advancedIncluded} adicionales agregados`
                      : ""}
                    .
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Base: {stat.baseTotal}
                    </span>

                    <span className="rounded-full bg-[#00bfb3]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#008b83]">
                      Incluidos: {stat.baseIncluded}
                    </span>

                    {stat.baseExcluded > 0 && (
                      <span className="rounded-full bg-[#ed8b00]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b46600]">
                        Excluidos: {stat.baseExcluded}
                      </span>
                    )}

                    {stat.advancedIncluded > 0 && (
                      <span className="rounded-full bg-[#981d97]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#981d97]">
                        Adicionales: {stat.advancedIncluded}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEditCategory(category.id)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-white"
                >
                  <SlidersHorizontal size={16} />
                  Personalizar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}