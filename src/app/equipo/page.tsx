import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import EquipoGraph from '@/components/equipo/EquipoGraph';
import { getMapaEquipoParaEmpleado } from '@/server/equipo';
import { getEmpleadoById } from '@/server/queries';

export const dynamic = 'force-dynamic';

export default async function EquipoPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');

  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const rows = await getMapaEquipoParaEmpleado(empleado.id);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Mi equipo" pageDescription="Mapa de equipo basado en clientes asignados">
      <section className="space-y-6">
        <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mi equipo</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#041461]">Mapa de equipo y clientes</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Vista read-only construida desde las asignaciones activas por cliente.</p>
        </section>
        {rows.map((row) => (
          <div key={row.cliente.id} className="space-y-3">
            <Link href={`/clientes/${row.cliente.id}`} className="inline-flex rounded-full bg-[#0ccba9]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#079b85] ring-1 ring-[#0ccba9]/20 hover:underline">
              {row.cliente.razonSocial}
            </Link>
            <EquipoGraph equipo={row.equipo} title="Mapa de equipo" description={`Equipo asignado para NIT ${row.cliente.nit}.`} />
          </div>
        ))}
        {rows.length === 0 ? <section className="rounded-[1.35rem] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200"><p className="text-lg font-extrabold text-[#041461]">No hay equipo visible.</p></section> : null}
      </section>
    </AppShell>
  );
}
