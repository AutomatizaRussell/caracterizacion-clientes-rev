import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getClientesConAvanceParaEmpleado } from '@/server/clientes-dashboard';
import { getClientesProgresoDocumentalAnual } from '@/server/clientes-progreso-operativo';
import { getEmpleadoById } from '@/server/queries';
import { canCreateInformacionSolicitud } from '@/server/permisos/solicitudes-permisos';

export const dynamic = 'force-dynamic';

function formatNullableValue(value: string | null | undefined) { return value?.trim() ? value : 'Sin dato'; }

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');
  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const clientes = await getClientesConAvanceParaEmpleado(empleado.id);
  const year = new Date().getFullYear();
  const progresoByCliente = await getClientesProgresoDocumentalAnual({ clienteIds: clientes.map((cliente) => cliente.id), year });
  const canCreateSolicitud = canCreateInformacionSolicitud(empleado.rolAplicacion);
  const totalPlaneadas = Array.from(progresoByCliente.values()).reduce((total, item) => total + item.planeadas, 0);
  const totalCompletadas = Array.from(progresoByCliente.values()).reduce((total, item) => total + item.completadas, 0);
  const progresoPromedio = totalPlaneadas > 0 ? Math.round((totalCompletadas / totalPlaneadas) * 100) : 0;

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Clientes" pageDescription="Vista general de clientes visibles para el usuario">
      <section className="space-y-6">
        <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Clientes</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#041461]">Cartera visible</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Consulta los clientes asignados según el equipo activo. El avance corresponde a la planeación documental anual formal.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total clientes</p><p className="mt-2 text-3xl font-extrabold text-[#041461]">{clientes.length}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Planeadas {year}</p><p className="mt-2 text-3xl font-extrabold text-[#041461]">{totalPlaneadas}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Completadas</p><p className="mt-2 text-3xl font-extrabold text-[#079b85]">{totalCompletadas}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Avance anual</p><p className="mt-2 text-3xl font-extrabold text-[#830887]">{progresoPromedio}%</p></div>
          </div>
        </section>
        <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4"><h2 className="text-lg font-extrabold text-[#041461]">Listado de clientes</h2><p className="mt-1 text-sm text-slate-500">Selecciona un cliente para entrar a su ficha 360.</p></div>
          <div className="divide-y divide-slate-100">
            {clientes.map((cliente) => {
              const progreso = progresoByCliente.get(cliente.id);
              const progressPercentage = progreso?.progressPercentage ?? 0;
              const planeadas = progreso?.planeadas ?? 0;
              const completadas = progreso?.completadas ?? 0;
              return (
                <article key={cliente.id} className="px-6 py-5 transition hover:bg-[#0ccba9]/5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/clientes/${cliente.id}`} className="truncate text-base font-extrabold text-[#041461] underline-offset-4 hover:underline">{cliente.razonSocial}</Link>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">NIT {formatNullableValue(cliente.nit)}</span>
                        <span className="rounded-full bg-[#0ccba9]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#079b85] ring-1 ring-[#0ccba9]/20">{formatNullableValue(cliente.estado)}</span>
                      </div>
                      <div className="mt-3 max-w-2xl"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold uppercase tracking-wide text-slate-400">Progreso documental anual {year}</span><span className="font-bold text-slate-600">{completadas}/{planeadas} completadas · {progressPercentage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#0ccba9]" style={{ width: `${progressPercentage}%` }} /></div></div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10">Ficha 360</Link>
                      <Link href={`/clientes/${cliente.id}/solicitudes`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10">Solicitudes</Link>
                      {canCreateSolicitud ? <Link href={`/solicitudes/crear?clienteId=${cliente.id}`} className="inline-flex items-center justify-center rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90">Nueva solicitud</Link> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
