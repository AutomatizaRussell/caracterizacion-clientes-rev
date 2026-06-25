import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getSolicitudDetalleParaEmpleado } from "@/server/solicitudes-panel";
import {
  formatSolicitudStatusLabel,
  getSolicitudStatusBadgeClass,
} from "@/features/solicitudes/solicitud-status.ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SolicitudDetalle = NonNullable<
  Awaited<ReturnType<typeof getSolicitudDetalleParaEmpleado>>
>;

type SolicitudItem = SolicitudDetalle["items"][number];

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function groupItemsByCategory(items: SolicitudItem[]) {
  const grouped = new Map<string, SolicitudItem[]>();

  for (const item of items) {
    const key = item.categoryTitle || "Sin categoría";
    const currentItems = grouped.get(key) ?? [];

    currentItems.push(item);
    grouped.set(key, currentItems);
  }

  return Array.from(grouped.entries()).map(([title, categoryItems]) => ({
    title,
    items: categoryItems,
    totalItems: categoryItems.length,
    submittedItems: categoryItems.filter((item) => item.status === "SUBMITTED")
      .length,
    reviewedItems: categoryItems.filter((item) => Boolean(item.reviewedAt))
      .length,
    rejectedItems: categoryItems.filter((item) => Boolean(item.rejectedReason))
      .length,
  }));
}

function canStartOrContinueReview(status: string) {
  return status === "CLIENT_SUBMITTED" || status === "UNDER_REVIEW";
}

function getReviewCtaLabel(status: string) {
  if (status === "UNDER_REVIEW") {
    return "Continuar revisión";
  }

  return "Preparar revisión";
}

export default async function SolicitudDetallePage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const solicitud = await getSolicitudDetalleParaEmpleado({
    empleadoId: empleado.id,
    solicitudId: id,
  });

  if (!solicitud) {
    notFound();
  }

  const pdf = solicitud.documentos.find(
    (documento) => documento.documentType === "PDF",
  );

  const categories = groupItemsByCategory(solicitud.items);

  const totalItems = solicitud.items.length;
  const submittedItems = solicitud.items.filter(
    (item) => item.status === "SUBMITTED",
  ).length;
  const reviewedItems = solicitud.items.filter((item) =>
    Boolean(item.reviewedAt),
  ).length;
  const rejectedItems = solicitud.items.filter((item) =>
    Boolean(item.rejectedReason),
  ).length;

  const shouldShowReviewCta = canStartOrContinueReview(solicitud.status);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Detalle de solicitud"
      pageDescription={solicitud.radicado?.reference ?? "Solicitud sin radicado"}
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cliente
              </p>

              <h1 className="mt-1 truncate text-xl font-extrabold text-[#041461]">
                {solicitud.empresa.razonSocial}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                NIT: {solicitud.empresa.nit} ·{" "}
                {solicitud.radicado?.reference ?? "Sin radicado"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/solicitudes"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Todas las solicitudes
              </Link>

              <Link
                href={`/clientes/${solicitud.empresa.id}/solicitudes`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Solicitudes del cliente
              </Link>

              <Link
                href={`/clientes/${solicitud.empresa.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Ficha 360
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#041461]">
                    {solicitud.requestTypeName}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {solicitud.subject}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getSolicitudStatusBadgeClass(
                    solicitud.status,
                  )}`}
                >
                  {formatSolicitudStatusLabel(solicitud.status)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Fecha generación
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDate(solicitud.generationDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Fecha corte
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDate(solicitud.cutoffDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Enviada
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDate(solicitud.sentAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Completada
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDate(solicitud.completedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#041461]">
                    Resumen de ítems
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Los ítems se agrupan por categoría para evitar listas
                    interminables.
                  </p>
                </div>

                {shouldShowReviewCta ? (
                  <Link
                    href={`/solicitudes/${solicitud.id}/revision`}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: "#0ccba9" }}
                  >
                    {getReviewCtaLabel(solicitud.status)}
                  </Link>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Total ítems
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#041461]">
                    {totalItems}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Marcados cliente
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#041461]">
                    {submittedItems}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Revisados
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#041461]">
                    {reviewedItems}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Rechazados
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#041461]">
                    {rejectedItems}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-lg font-bold text-[#041461]">
                  Categorías solicitadas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Abra una categoría para revisar los ítems que contiene.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {categories.map((category, index) => (
                  <details
                    key={category.title}
                    className="group"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#0ccba9]/5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold uppercase tracking-wide text-[#041461]">
                          {category.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {category.totalItems} ítems ·{" "}
                          {category.submittedItems} marcados por cliente ·{" "}
                          {category.reviewedItems} revisados
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        {category.submittedItems}/{category.totalItems}
                      </span>
                    </summary>

                    <div className="divide-y divide-slate-100 border-t border-slate-100 bg-white">
                      {category.items.map((item) => (
                        <article key={item.id} className="px-5 py-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <p className="text-sm leading-6 text-slate-700">
                              {item.text}
                            </p>

                            <span
                              className={`w-fit shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                                item.status === "SUBMITTED"
                                  ? "bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/20"
                                  : "bg-slate-50 text-slate-500 ring-slate-200"
                              }`}
                            >
                              {item.status === "SUBMITTED"
                                ? "Marcado cliente"
                                : "Pendiente"}
                            </span>
                          </div>

                          {item.reviewComment ? (
                            <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100">
                              {item.reviewComment}
                            </p>
                          ) : null}

                          {item.rejectedReason ? (
                            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
                              {item.rejectedReason}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </details>
                ))}

                {categories.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No hay ítems registrados para esta solicitud.
                  </div>
                ) : null}
              </div>
            </section>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#041461]">Acciones</h2>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {pdf?.oneDriveUrl ? (
                  <a
                    href={pdf.oneDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                  >
                    PDF
                  </a>
                ) : null}

                {solicitud.oneDriveClientFolderUrl ? (
                  <a
                    href={solicitud.oneDriveClientFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                  >
                    Carpetas
                  </a>
                ) : null}

                {solicitud.portalUrl ? (
                  <a
                    href={solicitud.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                  >
                    Portal
                  </a>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#041461]">
                Revisión
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                La asociación archivo–ítem y la revisión de soportes se trabajan
                desde el flujo de revisión de esta solicitud.
              </p>

              {shouldShowReviewCta ? (
                <Link
                  href={`/solicitudes/${solicitud.id}/revision`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: "#0ccba9" }}
                >
                  {getReviewCtaLabel(solicitud.status)}
                </Link>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                  Revisión no disponible para este estado
                </p>
              )}
            </section>

            {solicitud.n8nLastError ? (
              <section className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-bold">Último error de automatización</p>
                <p className="mt-2 leading-6">{solicitud.n8nLastError}</p>
              </section>
            ) : null}
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
