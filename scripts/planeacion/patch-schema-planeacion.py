from pathlib import Path

schema_path = Path('prisma/schema.prisma')
text = schema_path.read_text()

if 'planeaciones RefClientePlaneacion[]' not in text:
    text = text.replace(
        '  equipos      RefClienteEquipo[]\n  formularios  FormularioCliente[]',
        '  equipos      RefClienteEquipo[]\n  planeaciones RefClientePlaneacion[]\n  formularios  FormularioCliente[]',
        1,
    )

model = '''
model RefClientePlaneacion {
  id String @id @default(uuid()) @db.Uuid

  empresaRefId String     @map("empresa_ref_id") @db.Uuid
  empresa      RefEmpresa @relation(fields: [empresaRefId], references: [id], onDelete: Cascade)

  year            Int
  nombre          String  @db.VarChar(255)
  descripcion     String?
  requestTypeId   String? @map("request_type_id") @db.VarChar(150)
  requestTypeName String? @map("request_type_name") @db.VarChar(255)

  scheduledDate DateTime? @map("scheduled_date") @db.Date
  dueDate       DateTime? @map("due_date") @db.Date

  estado               String  @default("PLANEADA") @db.VarChar(30)
  generatedSolicitudId String? @map("generated_solicitud_id") @db.Uuid
  activo               Boolean @default(true)

  source    String   @default("manual") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([empresaRefId])
  @@index([year])
  @@index([estado])
  @@index([scheduledDate])
  @@index([generatedSolicitudId])
  @@map("ref_cliente_planeacion")
  @@schema("core")
}

'''

if 'model RefClientePlaneacion' not in text:
    marker = 'model CampoCaracterizacion {'
    if marker not in text:
        raise SystemExit('No se encontró model CampoCaracterizacion para insertar RefClientePlaneacion.')
    text = text.replace(marker, model + marker, 1)

schema_path.write_text(text)
print('[OK] schema.prisma actualizado con RefClientePlaneacion.')
