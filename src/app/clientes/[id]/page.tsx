import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getClienteConAvanceParaEmpleado } from "@/server/clientes-dashboard";
import {
  getSolicitudesClienteCounts,
  getSolicitudesClienteParaEmpleado,
} from "@/server/cliente-solicitudes";
import { formatSolicitudStatusLabel, getSolicitudStatusBadgeClass } from "@/features/solicitudes/solicitud-status.ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatNullableValue(value: string | null | undefined) {
  return value?.trim() ? value : "Sin dato";
}

function formatCaracterizacionStatus(status: string | null | undefined) {
  if (!status) {
    return "Sin iniciar";
  }

  const normalizedStatus = status.trim().toUpperCase();

  const labels: Record<string, string> = {
    SIN_INICIAR: "Sin iniciar",
    IN_PROGRESS: "En progreso",
    EN_PROGRESO: "En progreso",
    DRAFT: "Borrador",
    COMPLETE: "Completa",
    COMPLETED: "Completada",
    COMPLETA: "Completada",
    CONFIRMED: "Confirmada",
    CONFIRMADA: "Confirmada",
  };

  return labels[normalizedStatus] ?? status.replaceAll("_", " ");
}

export default async function ClientePage({ params }: PageProps) {
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

  const cliente = await getClienteConAvanceParaEmpleado({
    clienteId: id,
    empleadoId: empleado.id,
  });

  if (!cliente) {
    notFound();
  }

  const formulario = cliente.formularios[0] ?? null;

  const completionPercentage = formulario
    ? Number(formulario.completionPercentage)
    : 0;

  const answeredCount = formulario?.answeredCount ?? 0;
  const totalCount = formulario?.totalCount ?? 0;
  const caracterizacionStatus = formatCaracterizacionStatus(formulario?.status);

  const [solicitudesCounts, solicitudesRecientes] = await Promise.all([
    getSolicitudesClienteCounts({
      empleadoId: empleado.id,
      clienteId: cliente.id,
    }),
    getSolicitudesClienteParaEmpleado({
      empleadoId: empleado.id,
      clienteId: cliente.id,
      filter: "todas",
      take: 4,
    }),
  ]);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle={cliente.razonSocial}
      pageDescription="Ficha 360 del cliente"
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cliente
              </p>

              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Razón social
                  </p>
                  <p className="mt-1 font-bold text-[#001871]">
                    {cliente.razonSocial}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    NIT
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatNullableValue(cliente.nit)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatNullableValue(cliente.estado)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/clientes"
                className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                Volver a clientes
              </Link>

              <Link
                href={`/solicitudes/crear?clienteId=${cliente.id}`}
                className="w-fit rounded-xl bg-[#001871] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              >
                Nueva solicitud
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#001871]">
                  Solicitudes de información
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Crea y consulta requerimientos documentales asociados a este
                  cliente.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href={`/clientes/${cliente.id}/solicitudes?filtro=todas`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#001871]">
                  {solicitudesCounts.todas}
                </p>
              </Link>

              <Link
                href={`/clientes/${cliente.id}/solicitudes?filtro=activas`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Activas
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#001871]">
                  {solicitudesCounts.activas}
                </p>
              </Link>

              <Link
                href={`/clientes/${cliente.id}/solicitudes?filtro=pendiente-cliente`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pendiente cliente
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#ed8b00]">
                  {solicitudesCounts.pendienteCliente}
                </p>
              </Link>

              <Link
                href={`/clientes/${cliente.id}/solicitudes?filtro=pendiente-revision`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pendiente revisión
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#00bfb3]">
                  {solicitudesCounts.pendienteRevision}
                </p>
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Últimas solicitudes
                </p>

                <Link
                  href={`/clientes/${cliente.id}/solicitudes`}
                  className="text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {solicitudesRecientes.map((solicitud) => (
                  <Link
                    key={solicitud.id}
                    href={`/clientes/${cliente.id}/solicitudes?filtro=todas`}
                    className="block px-4 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#001871]">
                          {solicitud.radicado?.reference ?? "Sin radicado"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {solicitud.requestTypeName}
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
                  </Link>
                ))}

                {solicitudesRecientes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No hay solicitudes registradas para este cliente.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#001871]">
                    Caracterización
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Estado del formulario de conocimiento del cliente.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                  {completionPercentage}%
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold uppercase tracking-wide text-slate-400">
                      Estado
                    </span>
                    <span className="font-bold text-slate-700">
                      {caracterizacionStatus}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#00bfb3]"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  {formulario
                    ? `${answeredCount} de ${totalCount} campos obligatorios diligenciados.`
                    : "Formulario aún sin iniciar."}
                </p>

                <Link
                  href={`/clientes/${cliente.id}/caracterizacion`}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
                >
                  Gestionar caracterización
                </Link>
              </div>
            </section>

            <Link
              href={`/clientes/${cliente.id}/radicados?tipo=auditoria`}
              className="group block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-[#001871]">
                Formato de radicados
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Consulta consecutivos y documentos asociados a este cliente.
              </p>

              <div className="mt-5 text-xs font-bold uppercase tracking-wide text-[#001871] group-hover:underline">
                Ver formatos
              </div>
            </Link>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
