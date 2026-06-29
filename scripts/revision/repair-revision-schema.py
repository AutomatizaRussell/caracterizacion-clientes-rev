from pathlib import Path
import re

schema_path = Path('prisma/schema.prisma')
text = schema_path.read_text()

revision_model_names = [
    'SolicitudAdjuntoExtraccion',
    'SolicitudAdjuntoItemMatch',
    'SolicitudItemRevision',
    'SolicitudRevisionCierre',
]

revision_models = """
model SolicitudAdjuntoExtraccion {
  id String @id @default(uuid()) @db.Uuid

  adjuntoId String                 @unique @map("adjunto_id") @db.Uuid
  adjunto   SolicitudPortalAdjunto @relation(fields: [adjuntoId], references: [id], onDelete: Cascade)

  status                String    @default("PENDING") @db.VarChar(30)
  extractedText         String?   @map("extracted_text")
  extractedMetadataJson Json?     @map("extracted_metadata_json")
  errorMessage          String?   @map("error_message")
  extractor             String?   @db.VarChar(80)
  extractedAt           DateTime? @map("extracted_at") @db.Timestamptz(6)

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("sol_solicitud_adjunto_extraccion")
  @@schema("impulsa")
}

model SolicitudAdjuntoItemMatch {
  id String @id @default(uuid()) @db.Uuid

  solicitudId String    @map("solicitud_id") @db.Uuid
  solicitud   Solicitud @relation(fields: [solicitudId], references: [id], onDelete: Cascade)

  itemId String        @map("item_id") @db.Uuid
  item   SolicitudItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  adjuntoId String                 @map("adjunto_id") @db.Uuid
  adjunto   SolicitudPortalAdjunto @relation(fields: [adjuntoId], references: [id], onDelete: Cascade)

  matchStatus String @default("UNMATCHED") @map("match_status") @db.VarChar(40)
  matchSource String @default("MANUAL") @map("match_source") @db.VarChar(40)

  confidenceScore Decimal? @map("confidence_score") @db.Decimal(5, 4)
  aiReason        String?  @map("ai_reason")
  aiWarningsJson  Json?    @map("ai_warnings_json")

  confirmedByEmpleadoId String?      @map("confirmed_by_empleado_id") @db.Uuid
  confirmedByEmpleado   RefEmpleado? @relation("AdjuntoItemMatchConfirmedBy", fields: [confirmedByEmpleadoId], references: [id], onDelete: SetNull)
  confirmedAt           DateTime?    @map("confirmed_at") @db.Timestamptz(6)

  correctionComment String? @map("correction_comment")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([solicitudId])
  @@index([itemId])
  @@index([adjuntoId])
  @@index([matchStatus])
  @@map("sol_solicitud_adjunto_item_match")
  @@schema("impulsa")
}

model SolicitudItemRevision {
  id String @id @default(uuid()) @db.Uuid

  solicitudId String    @map("solicitud_id") @db.Uuid
  solicitud   Solicitud @relation(fields: [solicitudId], references: [id], onDelete: Cascade)

  itemId String        @map("item_id") @db.Uuid
  item   SolicitudItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  reviewLevel String @map("review_level") @db.VarChar(30)
  status      String @default("PENDING_REVIEW") @db.VarChar(30)

  reviewerEmpleadoId String?      @map("reviewer_empleado_id") @db.Uuid
  reviewerEmpleado   RefEmpleado? @relation("ItemRevisionReviewer", fields: [reviewerEmpleadoId], references: [id], onDelete: SetNull)

  reviewComment  String?   @map("review_comment")
  rejectedReason String?   @map("rejected_reason")
  decidedAt      DateTime? @map("decided_at") @db.Timestamptz(6)
  lockedAt       DateTime? @map("locked_at") @db.Timestamptz(6)

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@unique([itemId, reviewLevel])
  @@index([solicitudId])
  @@index([status])
  @@index([reviewLevel])
  @@map("sol_solicitud_item_revision")
  @@schema("impulsa")
}

model SolicitudRevisionCierre {
  id String @id @default(uuid()) @db.Uuid

  solicitudId String    @map("solicitud_id") @db.Uuid
  solicitud   Solicitud @relation(fields: [solicitudId], references: [id], onDelete: Cascade)

  reviewLevel String @map("review_level") @db.VarChar(30)

  closedByEmpleadoId String      @map("closed_by_empleado_id") @db.Uuid
  closedByEmpleado   RefEmpleado @relation("RevisionCierreClosedBy", fields: [closedByEmpleadoId], references: [id], onDelete: Restrict)
  closedAt           DateTime    @default(now()) @map("closed_at") @db.Timestamptz(6)

  summaryJson         Json?     @map("summary_json")
  emailStatus         String    @default("PENDING") @map("email_status") @db.VarChar(30)
  emailRecipientsJson Json?     @map("email_recipients_json")
  emailSentAt         DateTime? @map("email_sent_at") @db.Timestamptz(6)
  emailError          String?   @map("email_error")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@unique([solicitudId, reviewLevel])
  @@index([solicitudId])
  @@index([reviewLevel])
  @@index([emailStatus])
  @@map("sol_solicitud_revision_cierre")
  @@schema("impulsa")
}
""".strip() + "\n\n"

relation_fields = {
    'RefEmpleado': [
        'adjuntoMatchesConfirmados SolicitudAdjuntoItemMatch[] @relation("AdjuntoItemMatchConfirmedBy")',
        'itemRevisiones            SolicitudItemRevision[]     @relation("ItemRevisionReviewer")',
        'revisionesCerradas        SolicitudRevisionCierre[]   @relation("RevisionCierreClosedBy")',
    ],
    'Solicitud': [
        'adjuntoItemMatches SolicitudAdjuntoItemMatch[]',
        'itemRevisiones      SolicitudItemRevision[]',
        'revisionCierres     SolicitudRevisionCierre[]',
    ],
    'SolicitudItem': [
        'adjuntoMatches SolicitudAdjuntoItemMatch[]',
        'revisiones      SolicitudItemRevision[]',
    ],
    'SolicitudPortalAdjunto': [
        'extraccion  SolicitudAdjuntoExtraccion?',
        'itemMatches SolicitudAdjuntoItemMatch[]',
    ],
}

# Remove every copy of revision models, including duplicate/corrupted ones.
for model_name in revision_model_names:
    text = re.sub(rf'\n*model\s+{model_name}\s+{{.*?\n}}\n*', '\n', text, flags=re.S)

# Remove relation fields that previous script inserted in wrong places.
relation_identifiers = [
    'adjuntoMatchesConfirmados', 'itemRevisiones', 'revisionesCerradas',
    'adjuntoItemMatches', 'revisionCierres', 'adjuntoMatches', 'revisiones',
    'extraccion', 'itemMatches',
]
for identifier in relation_identifiers:
    text = re.sub(rf'^\s*{identifier}\s+.*\n', '', text, flags=re.M)

# Insert revision models before DocumentoGenerado to keep schema organized.
marker = 'model DocumentoGenerado {'
if marker not in text:
    raise SystemExit('No se encontró model DocumentoGenerado como punto de inserción.')
text = text.replace(marker, revision_models + marker, 1)

def insert_fields_in_model(src: str, model_name: str, fields: list[str]) -> str:
    pattern = re.compile(rf'(model\s+{model_name}\s+{{\n)(.*?)(\n}})', re.S)
    match = pattern.search(src)
    if not match:
        raise SystemExit(f'No se encontró modelo {model_name}.')

    header, body, footer = match.group(1), match.group(2), match.group(3)
    body_lines = [line.rstrip() for line in body.splitlines()]

    while body_lines and body_lines[-1] == '':
        body_lines.pop()

    first_attribute_index = len(body_lines)
    for index, line in enumerate(body_lines):
      if line.strip().startswith('@@'):
          first_attribute_index = index
          break

    insertion = [''] + [f'  {field}' for field in fields]
    new_body = '\n'.join(body_lines[:first_attribute_index] + insertion + body_lines[first_attribute_index:])
    new_block = header + new_body + footer
    return src[:match.start()] + new_block + src[match.end():]

for model_name, fields in relation_fields.items():
    text = insert_fields_in_model(text, model_name, fields)

# Basic formatting cleanup.
text = re.sub(r'\n{3,}', '\n\n', text)
text = text.replace('\n@@', '\n  @@')

schema_path.write_text(text)
print('[OK] schema.prisma reparado: modelos de revisión deduplicados y relaciones correctas.')
