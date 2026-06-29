import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getEmpleadoById } from '@/server/queries';
import { getRevisionInbox } from '@/server/revision/revision.service';

export const dynamic = 'force-dynamic';

export default async function RevisionInboxPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');

  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const solicitudes = await getRevisionInbox(empleado.id);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Revisión" pageDescription="Bandeja de solicitudes listas para asociación y revisión">
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Revisión</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#041461]">Bandeja de revisión</h1>
          <p className="mt-2 text-sm text-slate-500">Solicitudes con entregas del cliente pendientes de asociación, revisión o cierre.</p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {solicitudes.map((solicitud) => {
              const submittedItems = solicitud.items.filter((item) => item.status === 'SUBMITTED').length;
              return (
                <article key={solicitud.id} className="p-5 transition hover:bg-[#0ccba9]/5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-[#041461]">{solicitud.radicado.reference}</p>
                      <p className="mt-1 text-sm text-slate-600">{solicitud.empresa.razonSocial}</p>
                      <p className="mt-1 text-xs text-slate-500">{submittedItems}/{solicitud.items.length} ítems marcados · {solicitud.portalAdjuntos.length} archivos</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/revision/${solicitud.id}/asociacion`} className="rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">Continuar</Link>
                      <Link href={`/solicitudes/${solicitud.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461]">Detalle</Link>
                    </div>
                  </div>
                </article>
              );
            })}
            {solicitudes.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No hay solicitudes pendientes de revisión.</div> : null}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
