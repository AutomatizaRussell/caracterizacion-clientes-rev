import Link from "next/link";

type RequestBuilderHeaderProps = {
  selectedCompanyId: string;
  projectedReference: string;
};

export default function RequestBuilderHeader({
  selectedCompanyId,
  projectedReference,
}: RequestBuilderHeaderProps) {
  return (
    <section className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Radicado proyectado
          </p>

          <p className="mt-1 truncate text-lg font-bold tracking-wide text-[#001871]">
            {projectedReference}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs text-slate-400 sm:max-w-[360px] sm:text-right">
            El consecutivo real se asignará al generar la solicitud.
          </p>

          <Link
            href={`/clientes/${selectedCompanyId}`}
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
          >
            Volver a ficha 360
          </Link>
        </div>
      </div>
    </section>
  );
}
