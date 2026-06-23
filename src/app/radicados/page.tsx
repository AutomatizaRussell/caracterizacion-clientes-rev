import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getRadicadosParaEmpleado } from "@/server/radicados";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    tipo?: string;
  }>;
};

const RADICADO_TABS = [
  {
    id: "certificados",
    label: "Certificados",
    prefix: "RFC",
    description: "Formatos de radicado asociados a certificados.",
  },
  {
    id: "impuestos",
    label: "Impuestos",
    prefix: "RFI",
    description: "Formatos de radicado asociados a impuestos.",
  },
  {
    id: "auditoria",
    label: "Auditoría",
    prefix: "RFA",
    description: "Formatos de radicado asociados a auditoría.",
  },
] as const;

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

function getActiveTab(tipo?: string) {
  return (
    RADICADO_TABS.find((tab) => tab.id === tipo) ??
    RADICADO_TABS.find((tab) => tab.id === "auditoria") ??
    RADICADO_TABS[0]
  );
}

export default async function RadicadosPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = getActiveTab(resolvedSearchParams?.tipo);

  const radicados = await getRadicadosParaEmpleado(empleado.id);

  const radicadosPorTipo = radicados.filter((radicado) => {
    return radicado.prefix === activeTab.prefix;
  });

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Formato de radicados"
      pageDescription="Consulta de consecutivos por certificados, impuestos y auditoría"
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RADICADO_TABS.map((tab) => {
              const isActive = tab.id === activeTab.id;
              const count = radicados.filter(
                (radicado) => radicado.prefix === tab.prefix,
              ).length;

              return (
                <Link
                  key={tab.id}
                  href={`/radicados?tipo=${tab.id}`}
                  className={[
                    "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                    isActive
                      ? "bg-[#2d007f] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-[#001871]",
                  ].join(" ")}
                >
                  {tab.label} · {tab.prefix} · {count}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                {activeTab.description}
              </p>

              {activeTab.id !== "auditoria" ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Esta sección queda preparada para mostrar radicados cuando el
                  origen de datos de {activeTab.label.toLowerCase()} esté
                  definido.
                </p>
              ) : null}
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {radicadosPorTipo.length} registros
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-[0.9fr_1.8fr_0.7fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
              <span>Consecutivo</span>
              <span>Detalle</span>
              <span>Fecha</span>
            </div>

            <div className="divide-y divide-slate-100">
              {radicadosPorTipo.map((radicado) => {
                const solicitud = radicado.solicitud;
                const pdf = solicitud?.documentos[0] ?? null;

                const detalle =
                  pdf?.fileName ??
                  solicitud?.requestTypeName ??
                  solicitud?.subject ??
                  "Sin documento asociado";

                const fecha =
                  pdf?.generatedAt ??
                  pdf?.storedAt ??
                  solicitud?.generationDate ??
                  radicado.createdAt;

                return (
                  <article
                    key={radicado.id}
                    className="grid gap-4 px-5 py-5 text-sm md:grid-cols-[0.9fr_1.8fr_0.7fr] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#001871]">
                        {radicado.reference}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {radicado.empresa.razonSocial}
                      </p>
                    </div>

                    <div className="min-w-0">
                      {pdf?.oneDriveUrl ? (
                        <a
                        href={pdf.oneDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-bold text-[#001871] underline-offset-4 hover:underline"
                      >
                        {detalle}
                      </a>
                      ) : (
                        <p className="truncate text-slate-700">{detalle}</p>
                      )}

                      <p className="mt-1 text-xs text-slate-400">
                        NIT: {radicado.empresa.nit}
                      </p>
                    </div>

                    <div className="text-slate-600">{formatDate(fecha)}</div>
                  </article>
                );
              })}

              {radicadosPorTipo.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-lg font-bold text-slate-800">
                    No hay registros para {activeTab.label.toLowerCase()}.
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Los formatos con prefijo {activeTab.prefix} aparecerán aquí
                    cuando exista información registrada para este tipo.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
