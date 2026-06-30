 from pathlib import Path

# -----------------------------------------------------------------------------
# 1) Asociación: botón Continuar a revisión más visible/sticky.
# -----------------------------------------------------------------------------
association_client_path = Path('src/components/revision/AssociationWorkspaceClient.tsx')
association_client = association_client_path.read_text()

old_footer = """          <div className=\"border-t border-slate-200 p-4\">
            <form action={continueAction}>
              <button className=\"w-full rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white\">Continuar a revisión</button>
            </form>
          </div>"""

new_footer = """          <div className=\"sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur\">
            <form action={continueAction}>
              <button className=\"w-full rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90\">
                Continuar a revisión
              </button>
            </form>
          </div>"""

if old_footer in association_client:
    association_client = association_client.replace(old_footer, new_footer, 1)
else:
    print('[WARN] No se encontró footer exacto en AssociationWorkspaceClient.tsx; no se modificó el botón sticky.')

association_client_path.write_text(association_client)

# -----------------------------------------------------------------------------
# 2) Revisión: mostrar solo ítems con archivos asociados.
# -----------------------------------------------------------------------------
review_page_path = Path('src/app/revision/[solicitudId]/page.tsx')
review_page = review_page_path.read_text()

old_block = """  const { solicitud, reviewLevel, matches, revisions, closed } = workspace;
  const categories = groupItems(solicitud.items);
  const revisionsByItem = new Map(revisions.filter((revision) => revision.reviewLevel === reviewLevel).map((revision) => [revision.itemId, revision]));
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
  const isLocked = Boolean(closed);"""

new_block = """  const { solicitud, reviewLevel, matches, revisions, closed } = workspace;
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
  const isLocked = Boolean(closed);"""

if old_block in review_page:
    review_page = review_page.replace(old_block, new_block, 1)
else:
    print('[WARN] No se encontró bloque exacto de inicialización en revision page. Revisa manualmente si no cambia.')

old_anchor = """            {categories.map((category) => ("""
new_anchor = """            {categories.length === 0 ? (
              <section className=\"rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200\">
                <p className=\"text-lg font-extrabold text-[#041461]\">No hay ítems listos para revisión.</p>
                <p className=\"mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500\">
                  Primero asocie archivos a los ítems desde el paso de asociación. La revisión solo muestra ítems que tienen evidencia asociada.
                </p>
                <a
                  href={`/revision/${solicitud.id}/asociacion`}
                  className=\"mt-5 inline-flex rounded-xl bg-[#0ccba9] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white\"
                >
                  Ir a asociación
                </a>
              </section>
            ) : null}

            {categories.map((category) => ("""

if old_anchor in review_page:
    review_page = review_page.replace(old_anchor, new_anchor, 1)
else:
    print('[WARN] No se encontró categories.map para estado vacío.')

review_page_path.write_text(review_page)

# -----------------------------------------------------------------------------
# 3) Servicio: cerrar revisión solo exige decisiones sobre ítems con archivo.
# -----------------------------------------------------------------------------
service_path = Path('src/server/revision/revision.service.ts')
service = service_path.read_text()

old_service_block = """  const matchedItemIds = new Set(matches.map((match) => match.itemId).filter(Boolean));
  const missingItems = solicitud.items.filter((item) => !matchedItemIds.has(item.id));

  if (missingItems.length > 0) {
    throw new Error(`Hay ${missingItems.length} ítem(s) sin archivo asociado.`);
  }

  const revisionByItem = new Map(revisions.map((revision) => [revision.itemId, revision]));
  const pendingItems = solicitud.items.filter((item) => !revisionByItem.get(item.id) || revisionByItem.get(item.id)?.status === 'PENDING_REVIEW');

  if (pendingItems.length > 0) {
    throw new Error(`Hay ${pendingItems.length} ítem(s) sin decisión de revisión.`);
  }"""

new_service_block = """  const matchedItemIds = new Set(matches.map((match) => match.itemId).filter(Boolean));
  const reviewableItems = solicitud.items.filter((item) => matchedItemIds.has(item.id));

  if (reviewableItems.length === 0) {
    throw new Error('No hay ítems con archivo asociado para cerrar revisión.');
  }

  const revisionByItem = new Map(revisions.map((revision) => [revision.itemId, revision]));
  const pendingItems = reviewableItems.filter(
    (item) =>
      !revisionByItem.get(item.id) ||
      revisionByItem.get(item.id)?.status === 'PENDING_REVIEW',
  );

  if (pendingItems.length > 0) {
    throw new Error(`Hay ${pendingItems.length} ítem(s) con archivo asociado sin decisión de revisión.`);
  }"""

if old_service_block in service:
    service = service.replace(old_service_block, new_service_block, 1)
else:
    print('[WARN] No se encontró bloque closeReview exacto en revision.service.ts.')

service = service.replace('total: solicitud.items.length,', 'total: reviewableItems.length,')
service_path.write_text(service)

print('[OK] Refinamiento aplicado: botón sticky, revisión solo de ítems asociados y cierre ajustado.')
