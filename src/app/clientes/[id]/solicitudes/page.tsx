import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import { getClienteConAvanceParaEmpleado } from "@/server/clientes-dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClienteSolicitudesPage({ params }: PageProps) {
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

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion}>
      <section className="space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cliente / Solicitudes
              </p>

              <h1
                className="mt-1 text-2xl font-extrabold"
                style={{ color: BRAND.navy }}
              >
                {cliente.razonSocial}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Solicitudes documentales asociadas al cliente.
              </p>
            </div>

            <Link
              href={`/clientes/${cliente.id}`}
              className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              Volver al cliente
            </Link>

            <Link
              href="/solicitudes/crear"
              className="w-fit rounded-xl bg-[#001871] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              Nueva solicitud
            </Link>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Pendiente: solicitudes generadas para este cliente.
          </p>
        </section>
      </section>
    </AppShell>
  );
}