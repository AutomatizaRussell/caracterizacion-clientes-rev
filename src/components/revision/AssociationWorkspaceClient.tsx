'use client';

import { useMemo, useState, useTransition } from 'react';

type Item = {
  id: string;
  orderIndex: number;
  categoryId: string;
  categoryTitle: string;
  text: string;
  status: string;
};

type Attachment = {
  id: string;
  originalFileName: string;
  storedFileName: string | null;
  mimeType: string | null;
  sizeBytes: string | null;
  oneDriveUrl: string | null;
  oneDriveItemId: string | null;
  uploadedAt: string;
};

type Match = {
  id: string;
  itemId: string | null;
  adjuntoId: string;
  matchStatus: string;
  matchSource: string;
  confidenceScore: number | null;
  aiReason: string | null;
  aiWarningsJson: unknown;
  correctionComment: string | null;
};

type Workspace = {
  solicitud: {
    id: string;
    empresa: { razonSocial: string; nit: string };
    radicado: { reference: string };
    items: Item[];
    portalAdjuntos: Attachment[];
  };
  matches: Match[];
};

type AssociationWorkspaceClientProps = {
  workspace: Workspace;
  assignAction: (formData: FormData) => void | Promise<void>;
  confirmMatchAction: (formData: FormData) => void | Promise<void>;
  returnAttachmentAction: (formData: FormData) => void | Promise<void>;
  continueAction: () => void | Promise<void>;
};

type FileFilter = 'pending' | 'all' | 'associated' | 'returned';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatBytes(value: string | null) {
  if (!value) return 'Sin tamaño';
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return 'Sin tamaño';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getActiveMatches(matches: Match[]) {
  return matches.filter((match) => !['REJECTED_MATCH', 'IGNORED'].includes(match.matchStatus));
}

export default function AssociationWorkspaceClient({
  workspace,
  assignAction,
  confirmMatchAction,
  returnAttachmentAction,
  continueAction,
}: AssociationWorkspaceClientProps) {
  const [itemQuery, setItemQuery] = useState('');
  const [fileQuery, setFileQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<FileFilter>('pending');
  const [selectedItemId, setSelectedItemId] = useState(workspace.solicitud.items[0]?.id ?? null);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [returnAttachmentId, setReturnAttachmentId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const activeMatches = useMemo(() => getActiveMatches(workspace.matches), [workspace.matches]);
  const returnedMatches = useMemo(() => workspace.matches.filter((match) => match.matchStatus === 'IGNORED'), [workspace.matches]);

  const matchedAttachmentIds = useMemo(() => new Set(activeMatches.map((match) => match.adjuntoId)), [activeMatches]);
  const returnedAttachmentIds = useMemo(() => new Set(returnedMatches.map((match) => match.adjuntoId)), [returnedMatches]);
  const matchedItemIds = useMemo(() => new Set(activeMatches.map((match) => match.itemId).filter(Boolean)), [activeMatches]);

  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, Item[]>();
    for (const item of workspace.solicitud.items) {
      const haystack = normalize(`${item.orderIndex} ${item.categoryTitle} ${item.text}`);
      if (itemQuery && !haystack.includes(normalize(itemQuery))) continue;
      groups.set(item.categoryTitle, [...(groups.get(item.categoryTitle) ?? []), item]);
    }
    return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
  }, [itemQuery, workspace.solicitud.items]);

  const attachments = useMemo(() => {
    return workspace.solicitud.portalAdjuntos.filter((attachment) => {
      const haystack = normalize(attachment.originalFileName);
      if (fileQuery && !haystack.includes(normalize(fileQuery))) return false;
      if (fileFilter === 'pending') return !matchedAttachmentIds.has(attachment.id) && !returnedAttachmentIds.has(attachment.id);
      if (fileFilter === 'associated') return matchedAttachmentIds.has(attachment.id);
      if (fileFilter === 'returned') return returnedAttachmentIds.has(attachment.id);
      return true;
    });
  }, [fileFilter, fileQuery, matchedAttachmentIds, returnedAttachmentIds, workspace.solicitud.portalAdjuntos]);

  const selectedItem = workspace.solicitud.items.find((item) => item.id === selectedItemId) ?? null;
  const selectedAttachment = workspace.solicitud.portalAdjuntos.find((attachment) => attachment.id === selectedAttachmentId) ?? null;
  const returnAttachment = workspace.solicitud.portalAdjuntos.find((attachment) => attachment.id === returnAttachmentId) ?? null;

  const selectedItemMatches = selectedItem
    ? activeMatches.filter((match) => match.itemId === selectedItem.id)
    : [];

  const totalItems = workspace.solicitud.items.length;
  const totalFiles = workspace.solicitud.portalAdjuntos.length;
  const pendingItems = totalItems - matchedItemIds.size;

  function toggleCategory(title: string) {
    setCollapsedCategories((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function collapseAll() {
    setCollapsedCategories(new Set(itemsByCategory.map((category) => category.title)));
  }

  function expandAll() {
    setCollapsedCategories(new Set());
  }

  return (
    <section className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Ítems</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{totalItems}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Archivos</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{totalFiles}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Asociados</p><p className="mt-2 text-2xl font-extrabold text-[#079b85]">{matchedAttachmentIds.size}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-bold uppercase text-slate-400">Pendientes</p><p className="mt-2 text-2xl font-extrabold text-[#df7e09]">{pendingItems}</p></div>
      </section>

      <section className="grid min-h-[620px] gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(360px,1.15fr)_minmax(300px,0.9fr)]">
        <aside className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">Ítems</h2>
            <input value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder="Buscar ítem o categoría" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={expandAll} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold uppercase text-slate-600">Expandir</button>
              <button type="button" onClick={collapseAll} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold uppercase text-slate-600">Contraer</button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-26rem)] overflow-y-auto p-3">
            <div className="space-y-3">
              {itemsByCategory.map((category) => {
                const isCollapsed = collapsedCategories.has(category.title);
                const associatedInCategory = category.items.filter((item) => matchedItemIds.has(item.id)).length;
                return (
                  <section key={category.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <button type="button" onClick={() => toggleCategory(category.title)} className="flex w-full items-center justify-between gap-3 bg-slate-50 px-3 py-3 text-left">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-extrabold uppercase tracking-wide text-[#041461]">{category.title}</span>
                        <span className="mt-1 block text-[11px] text-slate-500">{associatedInCategory}/{category.items.length} asociados</span>
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">{isCollapsed ? '+' : '-'}</span>
                    </button>
                    {!isCollapsed ? (
                      <div className="divide-y divide-slate-100">
                        {category.items.map((item) => {
                          const isSelected = item.id === selectedItemId;
                          const isMatched = matchedItemIds.has(item.id);
                          return (
                            <button key={item.id} type="button" onClick={() => setSelectedItemId(item.id)} className={`block w-full px-3 py-3 text-left transition ${isSelected ? 'bg-[#0ccba9]/10' : 'hover:bg-slate-50'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-extrabold text-[#041461]">Ítem {item.orderIndex}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${isMatched ? 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/20' : 'bg-amber-50 text-amber-800 ring-amber-100'}`}>{isMatched ? 'Asociado' : 'Pendiente'}</span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.text}</p>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {selectedItem ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ítem seleccionado</p>
                <h2 className="mt-2 text-xl font-extrabold text-[#041461]">Ítem {selectedItem.orderIndex}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedItem.text}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{selectedItem.categoryTitle}</p>
              </div>

              <div className="grid flex-1 gap-5 p-5 lg:grid-cols-2">
                <section>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">Archivos asociados</h3>
                  <div className="mt-3 space-y-3">
                    {selectedItemMatches.map((match) => {
                      const attachment = workspace.solicitud.portalAdjuntos.find((file) => file.id === match.adjuntoId);
                      return attachment ? (
                        <article key={match.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-sm font-bold text-slate-800">{attachment.originalFileName}</p>
                          <p className="mt-1 text-xs text-slate-500">{match.matchSource} · {match.matchStatus}{match.confidenceScore ? ` · ${match.confidenceScore}` : ''}</p>
                          {match.aiReason ? <p className="mt-2 text-xs leading-5 text-slate-500">{match.aiReason}</p> : null}
                          {attachment.oneDriveUrl ? <a href={attachment.oneDriveUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[#041461] underline">Abrir archivo</a> : null}
                          {match.matchStatus === 'SUGGESTED_BY_AI' ? (
                            <form className="mt-3" action={confirmMatchAction}>
                              <input type="hidden" name="matchId" value={match.id} />
                              <button className="rounded-lg bg-[#0ccba9] px-3 py-1 text-[11px] font-bold uppercase text-white">Confirmar sugerencia</button>
                            </form>
                          ) : null}
                        </article>
                      ) : null;
                    })}
                    {selectedItemMatches.length === 0 ? <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">Este ítem todavía no tiene archivos asociados.</p> : null}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">Asociar archivo pendiente</h3>
                  <p className="mt-2 text-sm text-slate-500">Seleccione un archivo del panel derecho o use el botón “Elegir archivo”.</p>
                  {selectedAttachment ? (
                    <form className="mt-4 rounded-2xl bg-[#0ccba9]/5 p-4 ring-1 ring-[#0ccba9]/20" action={assignAction}>
                      <input type="hidden" name="adjuntoId" value={selectedAttachment.id} />
                      <input type="hidden" name="itemId" value={selectedItem.id} />
                      <p className="text-sm font-bold text-[#041461]">{selectedAttachment.originalFileName}</p>
                      <input name="comment" placeholder="Comentario opcional" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                      <button disabled={isPending} className="mt-3 w-full rounded-xl bg-[#041461] px-3 py-2 text-xs font-extrabold uppercase text-white disabled:opacity-50">Asociar a este ítem</button>
                    </form>
                  ) : <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">No hay archivo seleccionado.</p>}
                </section>
              </div>
            </div>
          ) : <div className="p-10 text-center text-sm text-slate-500">Seleccione un ítem para trabajar.</div>}
        </main>

        <aside className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#041461]">Archivos</h2>
            <input value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder="Buscar archivo" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase">
              {(['pending', 'all', 'associated', 'returned'] as FileFilter[]).map((filter) => (
                <button key={filter} type="button" onClick={() => setFileFilter(filter)} className={`rounded-lg px-2 py-1 ring-1 ${fileFilter === filter ? 'bg-[#041461] text-white ring-[#041461]' : 'bg-white text-slate-600 ring-slate-200'}`}>{filter === 'pending' ? 'Pendientes' : filter === 'all' ? 'Todos' : filter === 'associated' ? 'Asociados' : 'Devueltos'}</button>
              ))}
            </div>
          </div>

          <div className="max-h-[calc(100vh-26rem)] overflow-y-auto p-3">
            <div className="space-y-3">
              {attachments.map((attachment) => {
                const isSelected = attachment.id === selectedAttachmentId;
                const isAssociated = matchedAttachmentIds.has(attachment.id);
                const isReturned = returnedAttachmentIds.has(attachment.id);
                return (
                  <article key={attachment.id} className={`rounded-2xl p-3 ring-1 ${isSelected ? 'bg-[#0ccba9]/10 ring-[#0ccba9]/30' : 'bg-slate-50 ring-slate-200'}`}>
                    <button type="button" onClick={() => setSelectedAttachmentId(attachment.id)} className="block w-full text-left">
                      <p className="line-clamp-2 text-sm font-bold text-slate-800">{attachment.originalFileName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachment.oneDriveUrl ? <a href={attachment.oneDriveUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#041461]">Abrir</a> : null}
                      <button type="button" onClick={() => setSelectedAttachmentId(attachment.id)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">Elegir</button>
                      {!isAssociated && !isReturned ? <button type="button" onClick={() => setReturnAttachmentId(attachment.id)} className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">Devolver</button> : null}
                    </div>
                  </article>
                );
              })}
              {attachments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">No hay archivos para este filtro.</p> : null}
            </div>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur">
            <form action={continueAction}>
              <button className="w-full rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90">
                Continuar a revisión
              </button>
            </form>
          </div>
        </aside>
      </section>

      {returnAttachment ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setReturnAttachmentId(null)}>
          <form action={returnAttachmentAction} onSubmit={() => startTransition(() => setReturnAttachmentId(null))} onClick={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <input type="hidden" name="adjuntoId" value={returnAttachment.id} />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Devolver archivo</p>
            <h2 className="mt-2 text-xl font-extrabold text-[#041461]">{returnAttachment.originalFileName}</h2>
            <p className="mt-2 text-sm text-slate-500">Indique una razón clara para que el cliente pueda corregir la entrega.</p>
            <textarea name="reason" required className="mt-4 min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Razón de devolución" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setReturnAttachmentId(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase text-[#041461]">Cancelar</button>
              <button className="rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold uppercase text-white">Confirmar devolución</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
