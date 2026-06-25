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
                href={`/clientes/${solicitud.empresa.id}/solicitudes`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Volver a solicitudes
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

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ítems solicitados
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {solicitud.items.map((item) => (
                  <article key={item.id} className="px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.categoryTitle}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {item.text}
                    </p>
                  </article>
                ))}

                {solicitud.items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No hay ítems registrados para esta solicitud.
                  </div>
                ) : null}
              </div>
            </div>
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
