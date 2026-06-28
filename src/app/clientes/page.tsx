import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ClienteEquipoAsignadoCard from "@/components/clientes/ClienteEquipoAsignadoCard";
import { getEmpleadoById } from "@/server/queries";
import { getClienteConAvanceParaEmpleado } from "@/server/clientes-dashboard";
import { getClienteEquipoAsignadoParaEmpleado } from "@/server/clientes-equipo";
import {
  getSolicitudesClienteCounts,
  getSolicitudesClienteParaEmpleado,
} from "@/server/cliente-solicitudes";
import { canCreateInformacionSolicitud } from "@/server/permisos/solicitudes-permisos";
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

  const [solicitudesCounts, solicitudesRecientes, equipoAsignado] = await Promise.all([
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
    getClienteEquipoAsignadoParaEmpleado({
      empleadoId: empleado.id,
      clienteId: cliente.id,
    }),
  ]);

  const formulario = cliente.formularios[0] ?? null;

  const completionPercentage = formulario ? Number(formulario.completionPercentage) : 0;
  const answeredCount = formulario?.answeredCount ?? 0;
  const totalCount = formulario?.totalCount ?? 0;
  const caracterizacionStatus = formatCaracterizacionStatus(formulario?.status);
  const canCreateSolicitud = canCreateInformacionSolicitud(empleado.rolAplicacion);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle={cliente.razonSocial}
      pageDescription="Ficha 360 del cliente"
    >
      <section className="space-y-6">
        <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cliente</p>

              <h1 className="mt-2 truncate text-2xl font-extrabold text-[#041461]">
                {cliente.razonSocial}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                  NIT {formatNullableValue(cliente.nit)}
                </span>

                <span className="rounded-full bg-[#0ccba9]/10 px-3 py-1 text-[#079b85] ring-1 ring-[#0ccba9]/20">
                  {formatNullableValue(cliente.estado)}
                </span>

                {equipoAsignado?.cliente.tipoCliente ? (
                  <span className="rounded-full bg-[#830887]/10 px-3 py-1 text-[#830887] ring-1 ring-[#830887]/20">
                    Tipo {equipoAsignado.cliente.tipoCliente}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/clientes"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Volver a clientes
              </Link>

              {canCreateSolicitud ? (
                <Link
                  href={`/solicitudes/crear?clienteId=${cliente.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                >
                  Nueva solicitud
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]">
          <section className="space-y-6">
            <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Solicitudes de información
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-[#041461]">
                    Seguimiento documental
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Crea y consulta requerimientos documentales asociados a este cliente.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  href={`/clientes/${cliente.id}/solicitudes?filtro=todas`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#041461]">
                    {solicitudesCounts.todas}
                  </p>
                </Link>

                <Link
                  href={`/clientes/${cliente.id}/solicitudes?filtro=activas`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Activas</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#041461]">
                    {solicitudesCounts.activas}
                  </p>
                </Link>

                <Link
                  href={`/clientes/${cliente.id}/solicitudes?filtro=pendiente-cliente`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#df7e09] hover:bg-[#df7e09]/5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pendiente cliente
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[#df7e09]">
                    {solicitudesCounts.pendienteCliente}
                  </p>
                </Link>

                <Link
                  href={`/clientes/${cliente.id}/solicitudes?filtro=pendiente-revision`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pendiente revisión
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[#079b85]">
                    {solicitudesCounts.pendienteRevision}
                  </p>
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Últimas solicitudes
                  </p>

                  <Link
                    href={`/clientes/${cliente.id}/solicitudes`}
                    className="text-xs font-bold uppercase tracking-wide text-[#041461] underline-offset-4 hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {solicitudesRecientes.map((solicitud) => (
                    <Link
                      key={solicitud.id}
                      href={`/solicitudes/${solicitud.id}`}
                      className="block px-5 py-4 transition hover:bg-[#0ccba9]/5"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#041461]">
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
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      No hay solicitudes registradas para este cliente.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <ClienteEquipoAsignadoCard equipo={equipoAsignado?.equipo ?? null} />
          </section>

          <aside className="space-y-6">
            <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-[#041461]">Caracterización</h2>

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
                    <span className="font-bold uppercase tracking-wide text-slate-400">Estado</span>
                    <span className="font-bold text-slate-700">{caracterizacionStatus}</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0ccba9]"
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
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                >
                  Gestionar caracterización
                </Link>
              </div>
            </section>

            <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-extrabold text-[#041461]">Datos operativos</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sector</p>
                  <p className="mt-1 text-slate-700">
                    {formatNullableValue(equipoAsignado?.cliente.sector)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ERP</p>
                  <p className="mt-1 text-slate-700">
                    {formatNullableValue(equipoAsignado?.cliente.erp)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tipo cliente</p>
                  <p className="mt-1 text-slate-700">
                    {formatNullableValue(equipoAsignado?.cliente.tipoCliente)}
                  </p>
                </div>
              </div>
            </section>

            <Link
              href={`/clientes/${cliente.id}/radicados?tipo=auditoria`}
              className="group block rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-xl font-extrabold text-[#041461]">Formato de radicados</h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Consulta consecutivos y documentos asociados a este cliente.
              </p>

              <div className="mt-5 text-xs font-bold uppercase tracking-wide text-[#041461] group-hover:underline">
                Ver formatos
              </div>
            </Link>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
