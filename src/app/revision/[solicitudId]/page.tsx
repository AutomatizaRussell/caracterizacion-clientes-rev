import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getEmpleadoById } from '@/server/queries';
import { getReviewWorkspace } from '@/server/revision/revision.service';
import { cerrarRevisionAction, guardarDecisionRevisionAction } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ solicitudId: string }> };

type ReviewWorkspace = NonNullable<Awaited<ReturnType<typeof getReviewWorkspace>>>;
type ReviewItem = ReviewWorkspace['solicitud']['items'][number];

function groupItems(items: ReviewItem[]) {
  const groups = new Map<string, typeof items>();
  for (const item of items) groups.set(item.categoryTitle, [...(groups.get(item.categoryTitle) ?? []), item]);
  return Array.from(groups.entries()).map(([title, categoryItems]) => ({ title, items: categoryItems }));
}

export default async function RevisionPage({ params }: PageProps) {
  const { solicitudId } = await params;
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');

  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const workspace = await getReviewWorkspace({ empleadoId: empleado.id, solicitudId, rolAplicacion: empleado.rolAplicacion });
  if (!workspace) notFound();

  const { solicitud, reviewLevel, matches, revisions, closed } = workspace;
  const revisionsByItem = new Map(
    revisions
      .filter((revision) => revision.reviewLevel === reviewLevel)
      .map((revision) => [revision.itemId, revision]),
  );

  const matchesByItem = new Map<string, typeof matches>();
  for (const match of matches) {
    if (!match.itemId) {
      continue;
    }

    matchesByItem.set(match.itemId, [
      ...(matchesByItem.get(match.itemId) ?? []),
      match,
    ]);
  }

  // La revisión solo debe mostrar ítems con evidencia asociada.
  // Los ítems sin archivo pertenecen al paso de asociación/corrección,
  // no a la decisión de aprobar/rechazar.
  const reviewableItems = solicitud.items.filter(
    (item) => (matchesByItem.get(item.id)?.length ?? 0) > 0,
  );
  const categories = groupItems(reviewableItems);
  const isLocked = Boolean(closed);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Revisión" pageDescription="Paso 2 de 2 · Aprobar o rechazar ítems"
      defaultSidebarCollapsed
      wideContent
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Revisión de entregables</p>
              <h1 className="mt-1 text-xl font-extrabold text-[#041461]">{solicitud.empresa.razonSocial}</h1>
              <p className="mt-1 text-sm text-slate-500">{solicitud.radicado.reference} · Nivel {reviewLevel ?? 'sin permiso'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/revision/${solicitud.id}/asociacion`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461]">Asociación</Link>
              <Link href={`/solicitudes/${solicitud.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461]">Detalle</Link>
            </div>
          </div>
          {isLocked ? <p className="mt-4 rounded-xl bg-[#0ccba9]/10 px-4 py-3 text-sm font-bold text-[#079b85] ring-1 ring-[#0ccba9]/20">Revisión cerrada. Las decisiones están bloqueadas.</p> : null}
        </section>

        {!reviewLevel ? <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="font-bold text-slate-700">Tu rol no tiene permiso para ejecutar revisión.</p></section> : null}

        {reviewLevel ? (
          <section className="space-y-4">
            {categories.length === 0 ? (
              <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-lg font-extrabold text-[#041461]">No hay ítems listos para revisión.</p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Primero asocie archivos a los ítems desde el paso de asociación. La revisión solo muestra ítems que tienen evidencia asociada.
                </p>
                <a
                  href={`/revision/${solicitud.id}/asociacion`}
                  className="mt-5 inline-flex rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white"
                >
                  Ir a asociación
                </a>
              </section>
            ) : null}

            {categories.map((category) => (
              <section key={category.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3"><h2 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">{category.title}</h2></div>
                <div className="divide-y divide-slate-100">
                  {category.items.map((item) => {
                    const itemMatches = matchesByItem.get(item.id) ?? [];
                    const decision = revisionsByItem.get(item.id);
                    return (
                      <article key={item.id} className="p-5">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                          <div>
                            <p className="text-sm font-bold text-[#041461]">Ítem {item.orderIndex}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{item.text}</p>
                            <div className="mt-3 space-y-2">
                              {itemMatches.map((match) => {
                                const adjunto = solicitud.portalAdjuntos.find((file) => file.id === match.adjuntoId);
                                return adjunto ? <a key={match.id} href={adjunto.oneDriveUrl ?? '#'} target="_blank" rel="noreferrer" className="block rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-[#041461] ring-1 ring-slate-200">{adjunto.originalFileName}</a> : null;
                              })}
                              {itemMatches.length === 0 ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">Sin archivo asociado.</p> : null}
                            </div>
                          </div>
                          <form action={guardarDecisionRevisionAction.bind(null, solicitud.id)} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                            <input type="hidden" name="itemId" value={item.id} />
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Decisión</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button disabled={isLocked} name="status" value="APPROVED" className="rounded-xl bg-[#0ccba9] px-3 py-2 text-xs font-extrabold uppercase text-white disabled:opacity-50">Aprobar</button>
                              <button disabled={isLocked} name="status" value="REJECTED" className="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold uppercase text-white disabled:opacity-50">Rechazar</button>
                            </div>
                            <textarea name="comment" defaultValue={decision?.reviewComment ?? decision?.rejectedReason ?? ''} placeholder="Comentario. Obligatorio si rechaza." className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" disabled={isLocked} />
                            {decision ? <p className="mt-2 text-xs font-bold text-slate-500">Estado actual: {decision.status}</p> : <p className="mt-2 text-xs text-slate-400">Pendiente de decisión.</p>}
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <form action={cerrarRevisionAction.bind(null, solicitud.id)} className="rounded-2xl bg-white p-5 text-right shadow-sm ring-1 ring-slate-200">
              <button disabled={isLocked} className="rounded-xl bg-[#041461] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white disabled:opacity-50">Terminar revisión</button>
            </form>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
