import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getDashboardOperativo } from "@/server/dashboard";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

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

function formatSolicitudStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    CREATED: "Creada",
    DOCUMENT_GENERATED: "Documento generado",
    SENT: "Enviada",
    CLIENT_OPENED: "Abierta por cliente",
    CLIENT_SUBMITTED: "Pendiente revisión",
    UNDER_REVIEW: "En revisión",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    FAILED: "Fallida",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function getStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-100";
    case "SENT":
    case "CLIENT_OPENED":
      return "bg-orange-50 text-orange-700 ring-orange-100";
    case "CLIENT_SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-[#00bfb3]/10 text-[#008b83] ring-[#00bfb3]/20";
    case "DOCUMENT_GENERATED":
    case "CREATED":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const dashboard = await getDashboardOperativo(empleado.id);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Dashboard"
      pageDescription="Resumen operativo de clientes y solicitudes"
    >
      <section className="space-y-5">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Indicadores basados en clientes visibles y solicitudes de
            información registradas.
          </p>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              Salir
            </button>
          </form>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/clientes"
            className="rounded-2xl bg-[#001871] p-5 text-white shadow-sm transition hover:opacity-95"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Clientes visibles
            </p>

            <p className="mt-3 text-3xl font-extrabold">
              {dashboard.totalClientes}
            </p>
          </Link>

          <Link
            href="/solicitudes?filtro=activas"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Solicitudes activas
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#001871]">
              {dashboard.solicitudesActivas}
            </p>
          </Link>

          <Link
            href="/solicitudes?filtro=pendiente-cliente"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Pendiente cliente
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#ed8b00]">
              {dashboard.pendientesCliente}
            </p>
          </Link>

          <Link
            href="/solicitudes?filtro=pendiente-revision"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Pendiente revisión
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#00bfb3]">
              {dashboard.pendientesRevision}
            </p>
          </Link>

          <Link
            href="/solicitudes?filtro=fallidas"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Fallidas
            </p>

            <p className="mt-3 text-3xl font-extrabold text-red-600">
              {dashboard.solicitudesFallidas}
            </p>
          </Link>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-[#001871]">
              Accesos rápidos
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/clientes"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">Clientes</p>
                <p className="mt-1 text-xs text-slate-500">
                  Consulta clientes visibles y abre su ficha 360.
                </p>
              </Link>

              <Link
                href="/solicitudes/crear"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">
                  Crear solicitud
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Genera una solicitud de información para un cliente.
                </p>
              </Link>

              <Link
                href="/solicitudes"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">
                  Solicitudes
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Revisa solicitudes generadas y su estado operativo.
                </p>
              </Link>

              <Link
                href="/revision-entregables-demo"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">Revisión</p>
                <p className="mt-1 text-xs text-slate-500">
                  Revisión interna de entregables recibidos.
                </p>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#001871]">
                  Últimas solicitudes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Solicitudes de información más recientes dentro de tu alcance.
                </p>
              </div>

              <Link
                href="/solicitudes"
                className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
              >
                Ver todas
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {dashboard.ultimasSolicitudes.map((solicitud) => (
                <Link
                  key={solicitud.id}
                  href={`/clientes/${solicitud.empresa.id}/solicitudes`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase text-[#001871]">
                        {solicitud.empresa.razonSocial}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {solicitud.radicado?.reference ?? "Sin radicado"} ·{" "}
                        {solicitud.requestTypeName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Fecha: {formatDate(solicitud.generationDate)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase ring-1 ${getStatusClass(
                        solicitud.status,
                      )}`}
                    >
                      {formatSolicitudStatus(solicitud.status)}
                    </span>
                  </div>
                </Link>
              ))}

              {dashboard.ultimasSolicitudes.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay solicitudes registradas dentro de tu alcance.
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
