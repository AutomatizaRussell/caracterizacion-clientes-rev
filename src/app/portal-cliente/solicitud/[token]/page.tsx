import { redirect } from "next/navigation";
import { getPortalSolicitudByToken } from "@/server/impulsa/portal-cliente.service";
import { guardarRespuestasPortalAction } from "./actions";

export const dynamic = "force-dynamic";

type PortalSolicitudPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    submitted?: string;
    updatedItems?: string;
    error?: string;
  }>;
};

function formatDateEsCo(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

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

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-red-500">
          Portal cliente
        </p>

        <h1 className="mt-2 text-2xl font-extrabold text-[#001871]">
          No fue posible abrir la solicitud
        </h1>

        <p className="mt-3 text-sm text-slate-600">{message}</p>

        <p className="mt-6 text-xs text-slate-400">
          Si considera que este enlace debería estar activo, contacte al equipo
          responsable de la solicitud.
        </p>
      </section>
    </main>
  );
}

export default async function PortalSolicitudPage({
  params,
  searchParams,
}: PortalSolicitudPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const token = resolvedParams.token;

  let solicitud;

  try {
    solicitud = await getPortalSolicitudByToken(token);
  } catch (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "El enlace de la solicitud no es válido."
        }
      />
    );
  }

  async function submitResponses(formData: FormData) {
    "use server";

    const result = await guardarRespuestasPortalAction(token, formData);

    if (!result.ok) {
      redirect(
        `/portal-cliente/solicitud/${encodeURIComponent(
          token,
        )}?error=${encodeURIComponent(result.message)}`,
      );
    }

    redirect(
      `/portal-cliente/solicitud/${encodeURIComponent(
        token,
      )}?submitted=1&updatedItems=${encodeURIComponent(
        String(result.updatedItems),
      )}`,
    );
  }

  const submitted = resolvedSearchParams.submitted === "1";
  const updatedItems = Number(resolvedSearchParams.updatedItems ?? 0);
  const errorMessage = resolvedSearchParams.error;

  const totalItems = solicitud.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  const submittedItems = solicitud.categories.reduce((total, category) => {
    return (
      total +
      category.items.filter((item) => item.status === "SUBMITTED").length
    );
  }, 0);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 md:px-6 md:py-5 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
        <header className="shrink-0 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Portal cliente
              </p>

              <h1 className="mt-1 text-2xl font-extrabold text-[#001871]">
                Solicitud de información
              </h1>
            </div>

            <div className="rounded-xl bg-[#001871]/5 px-4 py-3 ring-1 ring-[#001871]/10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Radicado
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#001871]">
                {solicitud.radicadoReference}
              </p>
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-4 lg:min-h-0 lg:overflow-hidden">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#001871]">
                Información general
              </h2>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">Cliente</dt>
                  <dd className="mt-1 text-slate-800">
                    {solicitud.empresaNombre}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-500">NIT</dt>
                  <dd className="mt-1 text-slate-800">
                    {solicitud.empresaNit}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-500">
                    Tipo de solicitud
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {solicitud.requestTypeName}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-500">Asunto</dt>
                  <dd className="mt-1 text-slate-800">{solicitud.subject}</dd>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-slate-500">
                      Fecha de generación
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatDateEsCo(solicitud.generationDate)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold text-slate-500">
                      Fecha de corte
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatDateEsCo(solicitud.cutoffDate)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#001871]">
                Responsable
              </h2>

              <div className="mt-4 text-sm text-slate-700">
                <p className="font-bold">{solicitud.responsibleName}</p>
                <p>{solicitud.responsibleRole}</p>
                <p>{solicitud.responsibleFirm}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#001871]">Avance</h2>

              <p className="mt-3 text-sm text-slate-600">
                Ítems con adjuntos recibidos:
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[#001871]">
                {submittedItems}/{totalItems}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Los archivos se asociarán a la solicitud y al ítem
                correspondiente.
              </p>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="shrink-0 border-b border-slate-200 pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#001871]">
                    Requerimientos
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Adjunte los documentos solicitados por cada ítem.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                  {totalItems} ítems
                </div>
              </div>

              {submitted && (
                <div className="mt-4 rounded-xl bg-[#00bfb3]/10 px-4 py-3 text-sm text-[#008b83] ring-1 ring-[#00bfb3]/20">
                  Adjuntos guardados correctamente. Ítems actualizados:{" "}
                  <span className="font-bold">{updatedItems}</span>.
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                  {errorMessage}
                </div>
              )}
            </div>

            <form
              action={submitResponses}
              className="mt-5 flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                {solicitud.categories.map((category, categoryIndex) => {
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
                            {categorySubmittedItems}/{category.items.length}{" "}
                            recibidos
                          </span>

                          <span className="rounded-full bg-[#001871]/5 px-2.5 py-1 text-xs font-bold text-[#001871] ring-1 ring-[#001871]/10">
                            <span className="group-open:hidden">
                              Desplegar
                            </span>
                            <span className="hidden group-open:inline">
                              Replegar
                            </span>
                          </span>
                        </div>
                      </summary>

                      <div className="space-y-4 border-t border-slate-200 p-4">
                        {category.items.map((item) => (
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

                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                              <label className="block">
                                <span className="text-sm font-bold text-slate-600">
                                  Adjuntar soporte documental
                                </span>

                                <input
                                  type="file"
                                  name={`attachment:${item.id}`}
                                  multiple
                                  className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#001871] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:bg-slate-100"
                                />
                              </label>

                              <p className="mt-2 text-xs text-slate-400">
                                Puede adjuntar uno o varios archivos
                                relacionados con este requerimiento.
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>

              <div className="-mx-5 mt-4 shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-[#001871] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Enviar adjuntos
                </button>

                <p className="mt-2 text-center text-xs text-slate-400">
                  Al enviar, los archivos seleccionados se guardarán y se
                  asociarán internamente a la solicitud.
                </p>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}