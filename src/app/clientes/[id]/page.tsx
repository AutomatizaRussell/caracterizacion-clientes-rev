import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getClienteConAvanceParaEmpleado } from "@/server/clientes-dashboard";

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

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">
                Aún no hay listado de solicitudes conectado en esta ficha.
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Por ahora, la acción disponible es crear una nueva solicitud de
                información para este cliente. Cuando exista la consulta de
                solicitudes por cliente, este bloque debe mostrar el historial
                real.
              </p>

              <Link
                href={`/solicitudes/crear?clienteId=${cliente.id}`}
                className="mt-5 inline-flex rounded-xl bg-[#001871] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              >
                Crear solicitud
              </Link>
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
                  className="inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
                >
                  Gestionar caracterización
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#001871]">
                Documentos y radicados
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Acceso a trazabilidad documental cuando el módulo esté
                conectado a esta ficha.
              </p>

              <div className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
                No disponible todavía
              </div>
            </section>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
