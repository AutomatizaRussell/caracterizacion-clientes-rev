from pathlib import Path
import re

schema_path = Path("prisma/schema.prisma")
text = schema_path.read_text()

# Corrige SOLO SolicitudItemRevision.
# SolicitudAdjuntoItemMatch.itemId debe seguir siendo nullable.
pattern = re.compile(
    r"(model\s+SolicitudItemRevision\s+{\n)(.*?)(\n})",
    re.S,
)

match = pattern.search(text)
if not match:
    raise SystemExit("No se encontró model SolicitudItemRevision.")

header, body, footer = match.groups()

body = body.replace(
    '  itemId String?        @map("item_id") @db.Uuid\n'
    '  item   SolicitudItem? @relation(fields: [itemId], references: [id], onDelete: Cascade)',
    '  itemId String        @map("item_id") @db.Uuid\n'
    '  item   SolicitudItem @relation(fields: [itemId], references: [id], onDelete: Cascade)',
)

text = text[:match.start()] + header + body + footer + text[match.end():]
schema_path.write_text(text)

# Corrige TS: matches en revisión pueden traer itemId nullable por el modelo de asociación.
review_page_path = Path("src/app/revision/[solicitudId]/page.tsx")
review_page = review_page_path.read_text()

review_page = review_page.replace(
    "for (const match of matches) matchesByItem.set(match.itemId, [...(matchesByItem.get(match.itemId) ?? []), match]);",
    """for (const match of matches) {
    if (!match.itemId) {
      continue;
    }

    matchesByItem.set(match.itemId, [
      ...(matchesByItem.get(match.itemId) ?? []),
      match,
    ]);
  }""",
)

review_page_path.write_text(review_page)

# Elimina warning: pendingFiles no se usa en AssociationWorkspaceClient.
association_client_path = Path("src/components/revision/AssociationWorkspaceClient.tsx")
association_client = association_client_path.read_text()

association_client = re.sub(
    r"\n\s*const pendingFiles = workspace\.solicitud\.portalAdjuntos\.filter\([\s\S]*?\)\.length;\n",
    "\n",
    association_client,
    count=1,
)

association_client_path.write_text(association_client)

print("[OK] Schema y tipos de revisión corregidos.")
