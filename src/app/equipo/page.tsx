import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import EquipoGraphAgregadoClient from '@/components/equipo/EquipoGraphAgregadoClient';
import { getEquipoGraphParaEmpleado } from '@/server/equipo';
import { getEmpleadoById } from '@/server/queries';

export const dynamic = 'force-dynamic';

export default async function EquipoPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;

  if (!empleadoId) {
    redirect('/login');
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect('/login');
  }

  const graph = await getEquipoGraphParaEmpleado(empleado.id);

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Mi equipo"
      pageDescription="Grafo agregado de equipo basado en clientes asignados"
    >
      <section className="space-y-6">
        <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mi equipo</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#041461]">Mapa agregado de equipo</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Personas únicas, relaciones agregadas y clientes asociados por nodo o relación. Todo lo que puede converger, converge.
          </p>
        </section>

        {graph.nodes.length > 0 ? (
          <EquipoGraphAgregadoClient graph={graph} />
        ) : (
          <section className="rounded-[1.35rem] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-extrabold text-[#041461]">No hay equipo visible.</p>
            <p className="mt-2 text-sm text-slate-500">El usuario actual no tiene clientes asignados o no tiene permisos para consultar esta vista.</p>
          </section>
        )}
      </section>
    </AppShell>
  );
}
