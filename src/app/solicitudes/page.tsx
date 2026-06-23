import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import {
  getSolicitudesPanelCounts,
  getSolicitudesPanelParaEmpleado,
  normalizeSolicitudesPanelFilter,
  type SolicitudesPanelFilter,
} from "@/server/solicitudes-panel";
import { formatSolicitudStatusLabel, getSolicitudStatusBadgeClass } from "@/features/solicitudes/solicitud-status.ui";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filtro?: string;
  }>;
};

const FILTERS: Array<{
  id: SolicitudesPanelFilter;
  label: string;
  description: string;
}> = [
  {
    id: "activas",
    label: "Activas",
    description: "Solicitudes en preparación, enviadas o en revisión.",
  },
  {
    id: "pendiente-cliente",
    label: "Pendiente cliente",
    description: "Solicitudes enviadas o abiertas, todavía sin respuesta.",
  },
  {
    id: "pendiente-revision",
    label: "Pendiente revisión",
    description: "Solicitudes respondidas por cliente y listas para revisión.",
  },
  {
    id: "fallidas",
    label: "Fallidas",
    description: "Solicitudes con error operativo o automatización fallida.",
  },
  {
    id: "completadas",
    label: "Completadas",
    description: "Solicitudes cerradas.",
  },
  {
    id: "todas",
    label: "Todas",
    description: "Vista completa dentro del alcance del usuario.",
  },
];

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

function getCountForFilter(
  filter: SolicitudesPanelFilter,
  counts: Awaited<ReturnType<typeof getSolicitudesPanelCounts>>,
) {
  switch (filter) {
    case "activas":
      return counts.activas;
    case "pendiente-cliente":
      return counts.pendienteCliente;
    case "pendiente-revision":
      return counts.pendienteRevision;
    case "fallidas":
      return counts.fallidas;
    case "completadas":
      return counts.completadas;
    case "canceladas":
      return counts.canceladas;
    case "todas":
      return counts.todas;
    default:
      return 0;
  }
}

export default async function SolicitudesPage({ searchParams }: PageProps) {
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
  const activeFilter = normalizeSolicitudesPanelFilter(
    resolvedSearchParams?.filtro,
  );

  const [counts, solicitudes] = await Promise.all([
    getSolicitudesPanelCounts(empleado.id),
    getSolicitudesPanelParaEmpleado({
      empleadoId: empleado.id,
      filter: activeFilter,
    }),
  ]);

  const activeFilterConfig =
    FILTERS.find((filter) => filter.id === activeFilter) ?? FILTERS[0];

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Solicitudes de información"
      pageDescription="Seguimiento operativo de requerimientos documentales"
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                {activeFilterConfig.description}
              </p>
            </div>

            <Link
              href="/solicitudes/crear"
              className="w-fit rounded-xl bg-[#001871] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              Nueva solicitud
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => {
              const isActive = filter.id === activeFilter;
              const count = getCountForFilter(filter.id, counts);

              return (
                <Link
                  key={filter.id}
                  href={`/solicitudes?filtro=${filter.id}`}
                  className={[
                    "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                    isActive
                      ? "bg-[#2d007f] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-[#001871]",
                  ].join(" ")}
                >
                  {filter.label} · {count}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden grid-cols-[1.4fr_0.9fr_1.3fr_0.8fr_0.7fr_0.7fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Cliente</span>
            <span>Radicado</span>
            <span>Solicitud</span>
            <span>Estado</span>
            <span>Fecha</span>
            <span>Acción</span>
          </div>

          <div className="divide-y divide-slate-100">
            {solicitudes.map((solicitud) => {
              const pdf = solicitud.documentos[0] ?? null;

              return (
                <article
                  key={solicitud.id}
                  className="grid gap-4 px-5 py-5 text-sm xl:grid-cols-[1.4fr_0.9fr_1.3fr_0.8fr_0.7fr_0.7fr] xl:items-center"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/clientes/${solicitud.empresa.id}`}
                      className="truncate font-bold uppercase text-[#001871] underline-offset-4 hover:underline"
                    >
                      {solicitud.empresa.razonSocial}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      NIT: {solicitud.empresa.nit}
                    </p>
                  </div>

                  <div className="font-bold text-slate-700">
                    {solicitud.radicado?.reference ?? "Sin radicado"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-slate-700">
                      {solicitud.requestTypeName}
                    </p>

                    {solicitud.subject ? (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {solicitud.subject}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getSolicitudStatusBadgeClass(
                        solicitud.status,
                      )}`}
                    >
                      {formatSolicitudStatusLabel(solicitud.status)}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    {formatDate(solicitud.generationDate)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/clientes/${solicitud.empresa.id}/solicitudes`}
                      className="text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
                    >
                      Cliente
                    </Link>

                    {pdf?.oneDriveUrl ? (
                      <a
                        href={pdf.oneDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
                      >
                        PDF
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {solicitudes.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-lg font-bold text-slate-800">
                  No hay solicitudes para este filtro.
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Cambia el filtro o crea una nueva solicitud de información
                  para un cliente.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
