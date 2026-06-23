import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getClientesConAvanceParaEmpleado } from "@/server/caracterizacion";
import { formatEstadoCliente } from "@/features/clientes/clientes-dashboard.utils";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const clientes = await getClientesConAvanceParaEmpleado(empleado.id);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Clientes"
      pageDescription="Clientes visibles para tu usuario"
    >
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#001871]">Clientes</h1>
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {clientes.length} clientes
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.8fr_0.8fr_0.75fr_0.8fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
            <span>Cliente</span>
            <span>NIT</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>

          <div className="divide-y divide-slate-100">
            {clientes.map((cliente) => (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="group block transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001871]"
              >
                <div className="grid gap-4 px-5 py-5 text-sm xl:grid-cols-[1.8fr_0.8fr_0.75fr_0.8fr] xl:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-bold uppercase text-[#001871] group-hover:underline group-hover:underline-offset-4">
                      {cliente.razonSocial}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 xl:hidden">
                      NIT: {cliente.nit} · Estado:{" "}
                      {formatEstadoCliente(cliente.estado)}
                    </p>
                  </div>

                  <div className="hidden text-slate-600 xl:block">
                    {cliente.nit}
                  </div>

                  <div className="hidden text-slate-600 xl:block">
                    {formatEstadoCliente(cliente.estado)}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wide text-[#001871] group-hover:underline group-hover:underline-offset-4">
                    Abrir ficha 360
                  </div>
                </div>
              </Link>
            ))}

            {clientes.length === 0 && (
              <div className="px-6 py-14 text-center">
                <p className="text-lg font-bold text-slate-800">
                  No hay clientes visibles para este usuario.
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Revisa las asignaciones del equipo o valida el usuario
                  operativo activo.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
