import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getEmpleadoById } from '@/server/queries';
import { getAssociationWorkspace } from '@/server/revision/revision.service';
import {
  asociarArchivoItemAction,
  confirmarMatchAction,
  continuarRevisionAction,
  generarSugerenciasAsociacionAction,
  ignorarAdjuntoAction,
} from './actions';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ solicitudId: string }> };

type AssociationWorkspace = NonNullable<Awaited<ReturnType<typeof getAssociationWorkspace>>>;
type AssociationItem = AssociationWorkspace['solicitud']['items'][number];

function groupItems(items: AssociationItem[]) {
  const groups = new Map<string, typeof items>();
  for (const item of items) groups.set(item.categoryTitle, [...(groups.get(item.categoryTitle) ?? []), item]);
  return Array.from(groups.entries()).map(([title, categoryItems]) => ({ title, items: categoryItems }));
}

export default async function AsociacionRevisionPage({ params }: PageProps) {
  const { solicitudId } = await params;
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');

  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const workspace = await getAssociationWorkspace({ empleadoId: empleado.id, solicitudId });
  if (!workspace) notFound();

  const { solicitud, matches } = workspace;
  const activeMatches = matches.filter((match) => !['REJECTED_MATCH', 'IGNORED'].includes(match.matchStatus));
  const matchedAdjuntoIds = new Set(activeMatches.map((match) => match.adjuntoId));
  const matchedItemIds = new Set(activeMatches.map((match) => match.itemId));
  const unmatchedFiles = solicitud.portalAdjuntos.filter((adjunto) => !matchedAdjuntoIds.has(adjunto.id));
  const categories = groupItems(solicitud.items);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Revisión" pageDescription="Paso 1 de 2 · Asociación de archivos">
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Asociación archivo-ítem</p>
              <h1 className="mt-1 text-xl font-extrabold text-[#041461]">{solicitud.empresa.razonSocial}</h1>
              <p className="mt-1 text-sm text-slate-500">{solicitud.radicado.reference} · {solicitud.requestTypeName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generarSugerenciasAsociacionAction.bind(null, solicitud.id)}>
                <button className="rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">Sugerir asociaciones</button>
              </form>
              <Link href={`/solicitudes/${solicitud.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461]">Detalle</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Ítems</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{solicitud.items.length}</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Archivos</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{solicitud.portalAdjuntos.length}</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Asociados</p><p className="mt-2 text-2xl font-extrabold text-[#079b85]">{matchedAdjuntoIds.size}</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Pendientes</p><p className="mt-2 text-2xl font-extrabold text-[#df7e09]">{solicitud.items.length - matchedItemIds.size}</p></div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4">
            {categories.map((category) => (
              <section key={category.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">{category.title}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {category.items.map((item) => {
                    const itemMatches = activeMatches.filter((match) => match.itemId === item.id);
                    return (
                      <article key={item.id} className="p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-bold text-[#041461]">Ítem {item.orderIndex}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{item.text}</p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${itemMatches.length > 0 ? 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/20' : 'bg-amber-50 text-amber-800 ring-amber-100'}`}>{itemMatches.length > 0 ? `${itemMatches.length} archivo(s)` : 'Sin archivo'}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {itemMatches.map((match) => {
                            const adjunto = solicitud.portalAdjuntos.find((file) => file.id === match.adjuntoId);
                            return adjunto ? (
                              <div key={match.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs ring-1 ring-slate-200">
                                <p className="font-bold text-slate-700">{adjunto.originalFileName}</p>
                                <p className="mt-1 text-slate-500">{match.matchSource} · {match.matchStatus}{match.confidenceScore ? ` · ${Number(match.confidenceScore)}` : ''}</p>
                                {match.aiReason ? <p className="mt-1 text-slate-500">{match.aiReason}</p> : null}
                                {match.matchStatus === 'SUGGESTED_BY_AI' ? (
                                  <form className="mt-2" action={confirmarMatchAction.bind(null, solicitud.id)}>
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <button className="rounded-lg bg-[#0ccba9] px-3 py-1 text-[11px] font-bold uppercase text-white">Confirmar sugerencia</button>
                                  </form>
                                ) : null}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-extrabold text-[#041461]">Archivos sin asociar</h2>
              <div className="mt-4 space-y-3">
                {unmatchedFiles.map((adjunto) => (
                  <article key={adjunto.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="text-sm font-bold text-slate-800">{adjunto.originalFileName}</p>
                    {adjunto.oneDriveUrl ? <a href={adjunto.oneDriveUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-bold text-[#041461] underline">Abrir archivo</a> : null}
                    <form className="mt-3 space-y-2" action={asociarArchivoItemAction.bind(null, solicitud.id)}>
                      <input type="hidden" name="adjuntoId" value={adjunto.id} />
                      <select name="itemId" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                        <option value="">Seleccionar ítem...</option>
                        {solicitud.items.map((item) => <option key={item.id} value={item.id}>Ítem {item.orderIndex} · {item.text.slice(0, 80)}</option>)}
                      </select>
                      <input name="comment" placeholder="Comentario opcional" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                      <button className="w-full rounded-xl bg-[#041461] px-3 py-2 text-xs font-extrabold uppercase text-white">Asociar</button>
                    </form>
                    <form className="mt-2 space-y-2" action={ignorarAdjuntoAction.bind(null, solicitud.id)}>
                      <input type="hidden" name="adjuntoId" value={adjunto.id} />
                      <input name="reason" placeholder="Razón para devolver/ignorar" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                      <button className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold uppercase text-red-700">Marcar no relacionado</button>
                    </form>
                  </article>
                ))}
                {unmatchedFiles.length === 0 ? <p className="rounded-2xl bg-[#0ccba9]/10 p-4 text-sm text-[#079b85] ring-1 ring-[#0ccba9]/20">Todos los archivos están asociados o gestionados.</p> : null}
              </div>
            </section>

            <form action={continuarRevisionAction.bind(null, solicitud.id)}>
              <button className="w-full rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white">Continuar a revisión</button>
            </form>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
