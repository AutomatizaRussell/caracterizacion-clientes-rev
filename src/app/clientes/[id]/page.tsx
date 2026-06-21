import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import { getClienteConAvanceParaEmpleado } from "@/server/caracterizacion";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
    >
      <section className="space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Ficha 360 del cliente
              </p>

              <h1
                className="mt-1 text-2xl font-extrabold"
                style={{ color: BRAND.navy }}
              >
                {cliente.razonSocial}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                NIT: {cliente.nit} · Estado: {cliente.estado ?? "sin estado"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
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
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Avance caracterización
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#001871]">
              {completionPercentage}%
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {formulario
                ? `${formulario.answeredCount} de ${formulario.totalCount} campos obligatorios diligenciados.`
                : "Formulario aún sin iniciar."}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Estado formulario
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#981d97]">
              {formulario?.status ?? "SIN_INICIAR"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Estado actual del módulo de caracterización.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 opacity-70 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Solicitudes activas
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-400">0</p>

            <p className="mt-2 text-sm text-slate-500">
              Pendiente de integrar persistencia de Impulsa.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 opacity-70 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Alertas
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-400">0</p>

            <p className="mt-2 text-sm text-slate-500">
              Pendiente de reglas de seguimiento.
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href={`/clientes/${cliente.id}/caracterizacion`}
            className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-[#001871]">
              Caracterización
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Formulario de conocimiento del cliente, datos financieros,
              operativos, legales y de gobierno corporativo.
            </p>

            <div className="mt-5 text-xs font-bold uppercase tracking-wide text-[#001871] group-hover:underline">
              Abrir caracterización
            </div>
          </Link>

          <Link
            href={`/clientes/${cliente.id}/solicitudes`}
            className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-[#001871]">
              Solicitudes / Impulsa
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generación y seguimiento de requerimientos documentales asociados
              al cliente.
            </p>

            <div className="mt-5 text-xs font-bold uppercase tracking-wide text-[#001871] group-hover:underline">
              Abrir solicitudes
            </div>
          </Link>

          <div className="rounded-2xl bg-white p-5 opacity-60 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-400">
              Documentos y radicados
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Control documental, archivos recibidos y trazabilidad.
            </p>

            <div className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Pendiente
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-[#001871]">
            Actividad reciente
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Pendiente de conectar eventos de caracterización, solicitudes,
            documentos, alertas y portal cliente.
          </p>
        </section>
      </section>
    </AppShell>
  );
}
