import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import {
  getSolicitudesPanelCounts,
  getSolicitudesPanelParaEmpleado,
  normalizeSolicitudesPanelFilter,
  type SolicitudesPanelFilter,
} from "@/server/solicitudes-panel";
import {
  formatSolicitudStatusLabel,
  getSolicitudStatusBadgeClass,
} from "@/features/solicitudes/solicitud-status.ui";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filtro?: string;
  }>;
};

const FILTERS: Array<{
  id: Exclude<SolicitudesPanelFilter, "todas">;
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
      id: "canceladas",
      label: "Canceladas",
      description: "Solicitudes canceladas.",
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

function getFilterHref(
  filter: SolicitudesPanelFilter,
  activeFilter: SolicitudesPanelFilter,
) {
  if (filter === activeFilter) {
    return "/solicitudes";
  }

  return `/solicitudes?filtro=${filter}`;
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
    activeFilter === "todas"
      ? {
        label: "Todas las solicitudes",
        description: "Vista completa dentro del alcance del usuario.",
      }
      : FILTERS.find((filter) => filter.id === activeFilter);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Solicitudes de información"
      pageDescription="Seguimiento operativo de requerimientos documentales"
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="hidden items-center justify-between gap-4 md:flex">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {FILTERS.map((filter) => {
                const isActive = filter.id === activeFilter;
                const count = getCountForFilter(filter.id, counts);

                return (
                  <Link
                    key={filter.id}
                    href={getFilterHref(filter.id, activeFilter)}
                    className={[
                      "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                      isActive
                        ? "text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-[#0ccba9]/10 hover:text-[#041461]",
                    ].join(" ")}
                    style={isActive ? { backgroundColor: BRAND.teal } : undefined}
                    title={isActive ? "Quitar filtro" : filter.description}
                  >
                    {filter.label} · {count}
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {activeFilter === "todas" ? (
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Mostrando todas · {counts.todas}
                </span>
              ) : (
                <Link
                  href="/solicitudes"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10 hover:text-[#041461]"
                >
                  × Limpiar
                </Link>
              )}

              <Link
                href="/solicitudes/crear"
                className="rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: BRAND.teal }}
              >
                Nueva solicitud
              </Link>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            <details className="rounded-2xl border border-slate-200 bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#041461]">
                Filtro: {activeFilterConfig?.label ?? "Todas las solicitudes"}
              </summary>

              <div className="space-y-1 border-t border-slate-100 p-2">
                {FILTERS.map((filter) => {
                  const isActive = filter.id === activeFilter;
                  const count = getCountForFilter(filter.id, counts);

                  return (
                    <Link
                      key={filter.id}
                      href={getFilterHref(filter.id, activeFilter)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#0ccba9]/10"
                    >
                      <span>{filter.label} · {count}</span>
                      <span className="text-xs text-[#079b85]">
                        {isActive ? "✓" : ""}
                      </span>
                    </Link>
                  );
                })}

                {activeFilter !== "todas" ? (
                  <Link
                    href="/solicitudes"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                  >
                    <span>Mostrar todas</span>
                    <span>{counts.todas}</span>
                  </Link>
                ) : null}
              </div>
            </details>

            <Link
              href="/solicitudes/crear"
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: BRAND.teal }}
            >
              Nueva solicitud
            </Link>
          </div>
        </section>


        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden grid-cols-[1.25fr_0.9fr_1.2fr_0.8fr_0.7fr_1.15fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
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
                  className="group relative grid gap-4 px-5 py-5 text-sm transition hover:bg-[#0ccba9]/5 xl:grid-cols-[1.25fr_0.9fr_1.2fr_0.8fr_0.7fr_1.15fr] xl:items-center"
                >
                  <Link
                    href={`/solicitudes/${solicitud.id}`}
                    className="absolute inset-0 z-10 rounded-2xl"
                    aria-label={`Abrir solicitud ${solicitud.radicado?.reference ?? solicitud.id
                      }`}
                  />

                  <div className="relative z-20 min-w-0">
                    <Link
                      href={`/clientes/${solicitud.empresa.id}`}
                      className="truncate font-bold uppercase text-[#041461] underline-offset-4 hover:text-[#0b9f86] hover:underline"
                    >
                      {solicitud.empresa.razonSocial}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      NIT: {solicitud.empresa.nit}
                    </p>
                  </div>

                  <div className="min-w-0 font-bold text-slate-700">
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

                  <div className="relative z-20 grid w-full max-w-[230px] grid-cols-2 gap-2 justify-self-start xl:justify-self-end">
                    {pdf?.oneDriveUrl ? (
                      <a
                        href={pdf.oneDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                      >
                        PDF
                      </a>
                    ) : null}

                    {solicitud.oneDriveClientFolderUrl ? (
                      <a
                        href={solicitud.oneDriveClientFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                      >
                        Carpetas
                      </a>
                    ) : null}

                    {solicitud.portalUrl ? (
                      <a
                        href={solicitud.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="col-span-2 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                      >
                        Portal
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
