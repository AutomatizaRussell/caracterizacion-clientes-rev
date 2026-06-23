import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import { getClientesConAvanceParaEmpleado } from "@/server/clientes-dashboard";
import { logout } from "../login/actions";
import {
  getClientesCompletos,
  getClientesConfirmados,
  getClientesEnProceso,
  getClientesQueRequierenAtencion,
  getClientesSinIniciar,
  getEstadoCaracterizacionVisual,
  getPorcentajeCaracterizacion,
} from "@/features/clientes/clientes-dashboard.utils";

export const dynamic = "force-dynamic";

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

  const clientes = await getClientesConAvanceParaEmpleado(empleado.id);

  const totalClientes = clientes.length;
  const sinIniciar = getClientesSinIniciar(clientes).length;
  const enProceso = getClientesEnProceso(clientes).length;
  const completos = getClientesCompletos(clientes).length;
  const confirmados = getClientesConfirmados(clientes).length;
  const clientesAtencion = getClientesQueRequierenAtencion(clientes);

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
                Centro de operación
              </p>

              <h1
                className="mt-1 text-2xl font-extrabold"
                style={{ color: BRAND.navy }}
              >
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Resumen operativo de clientes, caracterización y solicitudes documentales.
              </p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          <div
            className="rounded-2xl p-5 text-white shadow-sm"
            style={{ backgroundColor: BRAND.navy }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Clientes asignados
            </p>

            <p className="mt-3 text-3xl font-extrabold">{totalClientes}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Sin iniciar
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-500">
              {sinIniciar}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              En proceso
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#ed8b00]">
              {enProceso}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Completos
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#00bfb3]">
              {completos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Confirmados
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#001871]">
              {confirmados}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 opacity-70 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Alertas pendientes
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-400">0</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-[#001871]">
              Accesos rápidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Rutas principales de operación.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/clientes"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">Ver clientes</p>
                <p className="mt-1 text-xs text-slate-500">
                  Maestro de clientes asignados.
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
                  Constructor documental Impulsa.
                </p>
              </Link>

              <Link
                href="/solicitudes"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">
                  Ver solicitudes
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Vista operativa global.
                </p>
              </Link>

              <Link
                href="/radicados"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-[#00bfb3] hover:bg-slate-50"
              >
                <p className="text-sm font-bold text-[#001871]">Radicados</p>
                <p className="mt-1 text-xs text-slate-500">
                  Trazabilidad documental.
                </p>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#001871]">
                  Clientes que requieren atención
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Muestra máximo 5 clientes sin iniciar, en proceso o confirmados con cambios.
                </p>
              </div>

              <Link
                href="/clientes"
                className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#001871] underline-offset-4 hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {clientesAtencion.map((cliente) => {
                const estadoVisual = getEstadoCaracterizacionVisual(cliente);
                const porcentaje = getPorcentajeCaracterizacion(cliente);

                return (
                  <Link
                    key={cliente.id}
                    href={`/clientes/${cliente.id}`}
                    className="block px-4 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold uppercase text-[#001871]">
                          {cliente.razonSocial}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NIT: {cliente.nit} · Avance: {porcentaje}%
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase ring-1 ${estadoVisual.className}`}
                      >
                        {estadoVisual.label}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {clientesAtencion.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay clientes que requieran atención inmediata.
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
