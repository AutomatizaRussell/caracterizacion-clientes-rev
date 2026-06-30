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

type SolicitudPanelItem = Awaited<
  ReturnType<typeof getSolicitudesPanelParaEmpleado>
>[number];

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

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getSolicitudProgress(solicitud: SolicitudPanelItem) {
  const totalItems = solicitud.items.length;
  const submittedItems = solicitud.items.filter(
    (item) =>
      item.status === "SUBMITTED" ||
      item.status === "UNDER_REVIEW" ||
      item.status === "ACCEPTED" ||
      item.status === "REJECTED",
  ).length;
  const reviewedItems = solicitud.items.filter((item) => item.reviewedAt).length;

  const primaryCount = reviewedItems > 0 ? reviewedItems : submittedItems;
  const primaryLabel = reviewedItems > 0 ? "Revisados" : "Cliente";
  const percent = totalItems > 0 ? clampPercent((primaryCount / totalItems) * 100) : 0;

  return {
    totalItems,
    submittedItems,
    reviewedItems,
    primaryCount,
    primaryLabel,
    percent,
  };
}

function SolicitudProgressBar({ solicitud }: { solicitud: SolicitudPanelItem }) {
  const progress = getSolicitudProgress(solicitud);

  return (
    <div className="mt-3 min-w-0">
      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>{progress.primaryLabel}</span>
        <span className="shrink-0 text-slate-500">
          {Math.round(progress.percent)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        <div
          className="h-full rounded-full bg-[#0ccba9] transition-[width]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

function ActionButtons({ solicitud }: { solicitud: SolicitudPanelItem }) {
  const pdf = solicitud.documentos[0] ?? null;

  return (
    <div className="pointer-events-auto relative z-30 grid w-full grid-cols-2 gap-2">
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
  );
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
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="hidden gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="grid min-w-0 grid-cols-3 gap-2 2xl:flex 2xl:flex-wrap">
              {FILTERS.map((filter) => {
                const isActive = filter.id === activeFilter;
                const count = getCountForFilter(filter.id, counts);

                return (
                  <Link
                    key={filter.id}
                    href={getFilterHref(filter.id, activeFilter)}
                    className={[
                      "flex min-w-0 items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                      isActive
                        ? "text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-[#0ccba9]/10 hover:text-[#041461]",
                    ].join(" ")}
                    style={isActive ? { backgroundColor: BRAND.teal } : undefined}
                    title={isActive ? "Quitar filtro" : filter.description}
                  >
                    <span className="truncate">{filter.label}</span>
                    <span className="shrink-0">· {count}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {activeFilter !== "todas" ? (
                <Link
                  href="/solicitudes"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold leading-none text-slate-500 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10 hover:text-[#041461]"
                  title="Quitar filtro"
                  aria-label="Quitar filtro"
                >
                  ×
                </Link>
              ) : null}

              <Link
                href="/solicitudes/crear"
                className="shrink-0 rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: BRAND.teal }}
              >
                Nueva solicitud
              </Link>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            <div
              className={
                activeFilter !== "todas"
                  ? "grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                  : "grid"
              }
            >
              <details className="min-w-0 rounded-2xl border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none truncate px-4 py-3 text-sm font-bold text-[#041461]">
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
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#0ccba9]/10"
                      >
                        <span className="truncate">
                          {filter.label} · {count}
                        </span>
                        <span className="shrink-0 text-xs text-[#079b85]">
                          {isActive ? "✓" : ""}
                        </span>
                      </Link>
                    );
                  })}

                  {activeFilter !== "todas" ? (
                    <Link
                      href="/solicitudes"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-[#0ccba9]/10"
                    >
                      <span>Mostrar todas</span>
                      <span>{counts.todas}</span>
                    </Link>
                  ) : null}
                </div>
              </details>

              {activeFilter !== "todas" ? (
                <Link
                  href="/solicitudes"
                  className="flex h-[50px] w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold leading-none text-slate-500 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10 hover:text-[#041461]"
                  title="Quitar filtro"
                  aria-label="Quitar filtro"
                >
                  ×
                </Link>
              ) : null}
            </div>

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
          <div className="hidden grid-cols-[minmax(230px,1.15fr)_minmax(120px,0.58fr)_minmax(180px,0.9fr)_minmax(150px,0.72fr)_minmax(90px,0.45fr)_minmax(170px,0.82fr)] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Cliente</span>
            <span>Radicado</span>
            <span>Solicitud</span>
            <span>Estado / progreso</span>
            <span>Fecha</span>
            <span className="text-center">Acción</span>
          </div>

          <div className="divide-y divide-slate-100">
            {solicitudes.map((solicitud) => (
              <article
                key={solicitud.id}
                className="group relative px-5 py-5 text-sm transition hover:bg-[#0ccba9]/5 xl:grid xl:grid-cols-[minmax(230px,1.15fr)_minmax(120px,0.58fr)_minmax(180px,0.9fr)_minmax(150px,0.72fr)_minmax(90px,0.45fr)_minmax(170px,0.82fr)] xl:items-center xl:gap-4"
              >
                <Link
                  href={`/solicitudes/${solicitud.id}`}
                  className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0ccba9]"
                  aria-label={`Abrir detalle de solicitud ${
                    solicitud.radicado?.reference ?? solicitud.id
                  }`}
                />

                <div className="relative z-20 hidden min-w-0 xl:block">
                  <Link
                    href={`/clientes/${solicitud.empresa.id}`}
                    className="pointer-events-auto block max-w-full whitespace-normal break-words text-sm font-bold uppercase leading-5 text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"
                    title={solicitud.empresa.razonSocial}
                  >
                    {solicitud.empresa.razonSocial}
                  </Link>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    NIT: {solicitud.empresa.nit}
                  </p>
                </div>

                <div className="relative z-0 hidden min-w-0 font-bold text-slate-700 xl:block">
                  <p className="truncate">
                    {solicitud.radicado?.reference ?? "Sin radicado"}
                  </p>
                </div>

                <div className="relative z-0 hidden min-w-0 xl:block">
                  <p className="whitespace-normal break-words leading-5 text-slate-700">
                    {solicitud.requestTypeName}
                  </p>

                  {solicitud.subject ? (
                    <p className="mt-1 line-clamp-2 whitespace-normal break-words text-xs leading-4 text-slate-400">
                      {solicitud.subject}
                    </p>
                  ) : null}
                </div>

                <div className="relative z-0 hidden min-w-0 xl:block">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getSolicitudStatusBadgeClass(
                      solicitud.status,
                    )}`}
                  >
                    {formatSolicitudStatusLabel(solicitud.status)}
                  </span>
                  <SolicitudProgressBar solicitud={solicitud} />
                </div>

                <div className="relative z-0 hidden text-slate-600 xl:block">
                  {formatDate(solicitud.generationDate)}
                </div>

                <div className="relative z-30 hidden w-full max-w-[240px] justify-self-end xl:block">
                  <ActionButtons solicitud={solicitud} />
                </div>

                <div className="pointer-events-none relative z-20 xl:hidden">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                    <div className="min-w-0 text-left">
                      <Link
                        href={`/clientes/${solicitud.empresa.id}`}
                        className="pointer-events-auto block max-w-full whitespace-normal break-words font-bold uppercase leading-5 text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"
                        title={solicitud.empresa.razonSocial}
                      >
                        {solicitud.empresa.razonSocial}
                      </Link>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        NIT: {solicitud.empresa.nit}
                      </p>
                    </div>

                    <div className="min-w-[125px] text-right">
                      <p className="font-bold text-slate-700">
                        {solicitud.radicado?.reference ?? "Sin radicado"}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {formatDate(solicitud.generationDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <p className="whitespace-normal break-words text-slate-700">
                      {solicitud.requestTypeName}
                    </p>

                    {solicitud.subject ? (
                      <p className="mx-auto mt-1 max-w-xl whitespace-normal break-words text-xs leading-4 text-slate-400">
                        {solicitud.subject}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getSolicitudStatusBadgeClass(
                          solicitud.status,
                        )}`}
                      >
                        {formatSolicitudStatusLabel(solicitud.status)}
                      </span>
                    </div>

                    <div className="mx-auto mt-4 max-w-md">
                      <SolicitudProgressBar solicitud={solicitud} />
                    </div>

                    <div className="relative z-30 mx-auto mt-5 w-full max-w-[390px]">
                      <ActionButtons solicitud={solicitud} />
                    </div>
                  </div>
                </div>
              </article>
            ))}

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
