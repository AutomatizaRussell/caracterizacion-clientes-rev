import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import EquipoFlowClient from '@/components/equipo/EquipoFlowClient';
import { getEquipoGraphParaEmpleado } from '@/server/equipo';
import { getEmpleadoById } from '@/server/queries';
import { isAdminRole } from '@/server/clientes-visibilidad';

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
      pageDescription="Equipo de trabajo y clientes relacionados"
    >
      <section className="space-y-6">
        {graph.nodes.length > 0 ? (
          <EquipoFlowClient
            graph={graph}
            currentEmpleadoId={empleado.id}
            isAdmin={isAdminRole(empleado.rolAplicacion)}
          />
        ) : (
          <section className="rounded-[1.35rem] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-extrabold text-[#041461]">No hay equipo visible.</p>
            <p className="mt-2 text-sm text-slate-500">
              El usuario actual no tiene clientes asignados o no tiene permisos para consultar esta vista.
            </p>
          </section>
        )}
      </section>
    </AppShell>
  );
}
