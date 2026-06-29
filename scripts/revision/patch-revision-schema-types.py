
from pathlib import Path
import re

schema = Path('prisma/schema.prisma')
text = schema.read_text()

models = {}
models['SolicitudAdjuntoExtraccion'] = """
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
"""
models['SolicitudAdjuntoItemMatch'] = """
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
"""
models['SolicitudItemRevision'] = """
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
"""
models['SolicitudRevisionCierre'] = """
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
"""

def replace_model(src: str, name: str, block: str) -> str:
    pattern = re.compile(rf'model\s+{name}\s+{{.*?\n}}\n', re.S)
    if pattern.search(src):
        return pattern.sub(block + '\n', src, count=1)
    marker = 'model DocumentoGenerado {'
    return src.replace(marker, block + '\n' + marker, 1)

for name, block in models.items():
    text = replace_model(text, name, block)

def add_relation(src: str, model: str, marker_line: str, addition: str) -> str:
    if addition.strip().split('\n')[0] in src:
        return src
    start = src.index(f'model {model} {{')
    end = src.index('\n}', start)
    body = src[start:end]
    marker = body.rfind(marker_line)
    if marker == -1:
        marker = body.rfind('@@')
    insert_at = start + marker
    return src[:insert_at] + addition + '\n' + src[insert_at:]

text = add_relation(text, 'SolicitudPortalAdjunto', '@@index', '  extraccion  SolicitudAdjuntoExtraccion?\n  itemMatches SolicitudAdjuntoItemMatch[]\n')
text = add_relation(text, 'SolicitudItem', '@@index', '  adjuntoMatches SolicitudAdjuntoItemMatch[]\n  revisiones      SolicitudItemRevision[]\n')
text = add_relation(text, 'Solicitud', '@@index', '  adjuntoItemMatches SolicitudAdjuntoItemMatch[]\n  itemRevisiones      SolicitudItemRevision[]\n  revisionCierres     SolicitudRevisionCierre[]\n')
text = add_relation(text, 'RefEmpleado', '@@map', '  adjuntoMatchesConfirmados SolicitudAdjuntoItemMatch[] @relation("AdjuntoItemMatchConfirmedBy")\n  itemRevisiones            SolicitudItemRevision[]     @relation("ItemRevisionReviewer")\n  revisionesCerradas        SolicitudRevisionCierre[]   @relation("RevisionCierreClosedBy")\n')

schema.write_text(text)
print('[OK] schema.prisma corregido para modelos de revisión.')

# Patch page type aliases that referenced nullable return types.
association_page = Path('src/app/revision/[solicitudId]/asociacion/page.tsx')
if association_page.exists():
    t = association_page.read_text()
    t = t.replace(
        "function groupItems(items: Awaited<ReturnType<typeof getAssociationWorkspace>>['solicitud']['items']) {",
        "type AssociationWorkspace = NonNullable<Awaited<ReturnType<typeof getAssociationWorkspace>>>;\ntype AssociationItem = AssociationWorkspace['solicitud']['items'][number];\n\nfunction groupItems(items: AssociationItem[]) {",
    )
    association_page.write_text(t)

review_page = Path('src/app/revision/[solicitudId]/page.tsx')
if review_page.exists():
    t = review_page.read_text()
    t = t.replace(
        "function groupItems(items: Awaited<ReturnType<typeof getReviewWorkspace>>['solicitud']['items']) {",
        "type ReviewWorkspace = NonNullable<Awaited<ReturnType<typeof getReviewWorkspace>>>;\ntype ReviewItem = ReviewWorkspace['solicitud']['items'][number];\n\nfunction groupItems(items: ReviewItem[]) {",
    )
    review_page.write_text(t)

print('[OK] pages de revisión parcheadas para tipos no nulos.')
