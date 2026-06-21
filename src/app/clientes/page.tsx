import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import { getClientesConAvanceParaEmpleado } from "@/server/caracterizacion";
import {
  formatEstadoCliente,
  getEstadoCaracterizacionVisual,
  getPorcentajeCaracterizacion,
  getResumenCaracterizacion,
} from "@/features/clientes/clientes-dashboard.utils";

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
    >
      <section className="space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Maestro
              </p>

              <h1
                className="mt-1 text-2xl font-extrabold"
                style={{ color: BRAND.navy }}
              >
                Clientes
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Listado completo de clientes visibles para el usuario actual.
                Haz clic sobre cualquier cliente para abrir su ficha 360.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#001871]">
                Listado de clientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                La caracterización resume estado y avance. Las solicitudes
                Impulsa se administrarán desde la ficha 360 del cliente y desde
                la vista global de solicitudes.
              </p>
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {clientes.length} clientes
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-[1.6fr_0.65fr_0.75fr_1.35fr_0.85fr] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
              <span>Cliente</span>
              <span>NIT</span>
              <span>Estado cliente</span>
              <span>Caracterización</span>
              <span>Siguiente acción</span>
            </div>

            <div className="divide-y divide-slate-100">
              {clientes.map((cliente) => {
                const estadoVisual = getEstadoCaracterizacionVisual(cliente);
                const porcentaje = getPorcentajeCaracterizacion(cliente);
                const resumen = getResumenCaracterizacion(cliente);

                return (
                  <Link
                    key={cliente.id}
                    href={`/clientes/${cliente.id}`}
                    className="group block transition hover:bg-slate-50 focus-visible:outline-none"
                  >
                    <div className="grid gap-4 px-5 py-5 text-sm xl:grid-cols-[1.6fr_0.65fr_0.75fr_1.35fr_0.85fr] xl:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-bold uppercase text-[#001871] group-hover:underline group-hover:underline-offset-4">
                          {cliente.razonSocial}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 xl:hidden">
                          NIT: {cliente.nit} · Estado:{" "}
                          {formatEstadoCliente(cliente.estado)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {resumen.answeredCount} de {resumen.totalCount} campos
                          obligatorios aplicables diligenciados.
                        </p>
                      </div>

                      <div className="hidden text-slate-600 xl:block">
                        {cliente.nit}
                      </div>

                      <div className="hidden text-slate-600 xl:block">
                        {formatEstadoCliente(cliente.estado)}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase ring-1 ${estadoVisual.className}`}
                          >
                            {estadoVisual.label}
                          </span>

                          <span className="text-xs font-bold text-slate-500">
                            {porcentaje}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${estadoVisual.progressClassName}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs font-bold uppercase tracking-wide text-[#001871] group-hover:underline group-hover:underline-offset-4">
                        Abrir ficha 360
                      </div>
                    </div>
                  </Link>
                );
              })}

              {clientes.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="text-lg font-bold text-slate-800">
                    No hay clientes visibles para este usuario.
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Revisa las asignaciones cargadas desde programación o
                    selecciona otro usuario operativo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}