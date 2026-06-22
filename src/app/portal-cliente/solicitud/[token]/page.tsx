import { redirect } from "next/navigation";
import { getPortalSolicitudByToken } from "@/server/impulsa/portal-cliente.service";
import { guardarRespuestasPortalAction } from "./actions";
import PortalEntregaForm from "./PortalEntregaForm";

export const dynamic = "force-dynamic";

type PortalSolicitudPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    submitted?: string;
    updatedItems?: string;
    uploadedFiles?: string;
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
      )}&uploadedFiles=${encodeURIComponent(String(result.uploadedFiles))}`,
    );
  }

  const submitted = resolvedSearchParams.submitted === "1";
  const updatedItems = Number(resolvedSearchParams.updatedItems ?? 0);
  const uploadedFiles = Number(resolvedSearchParams.uploadedFiles ?? 0);
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
    <main className="min-h-screen bg-slate-100 px-4 py-4 md:px-6 md:py-5">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <header className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
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

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Cliente
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#001871]">
              {solicitud.empresaNombre}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              NIT {solicitud.empresaNit}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Tipo / asunto
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#001871]">
              {solicitud.requestTypeName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {solicitud.subject}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Fechas
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Generación: {formatDateEsCo(solicitud.generationDate)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Corte: {formatDateEsCo(solicitud.cutoffDate)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Avance
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#001871]">
              {submittedItems}/{totalItems}
            </p>
            <p className="text-xs text-slate-500">
              Ítems marcados como recibidos
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#001871]">
                  Entrega de información
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Adjunte los archivos de la entrega y marque los ítems que
                  quedan cubiertos.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                {totalItems} ítems
              </div>
            </div>

            {submitted && (
              <div className="mt-4 rounded-xl bg-[#00bfb3]/10 px-4 py-3 text-sm text-[#008b83] ring-1 ring-[#00bfb3]/20">
                Entrega guardada correctamente. Archivos cargados:{" "}
                <span className="font-bold">{uploadedFiles}</span>. Ítems
                actualizados:{" "}
                <span className="font-bold">{updatedItems}</span>.
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                {errorMessage}
              </div>
            )}
          </div>

          <PortalEntregaForm
            categories={solicitud.categories}
            action={submitResponses}
          />
        </section>
      </div>
    </main>
  );
}
