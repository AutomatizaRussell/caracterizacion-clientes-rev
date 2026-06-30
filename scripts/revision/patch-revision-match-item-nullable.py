from pathlib import Path

schema_path = Path('prisma/schema.prisma')
text = schema_path.read_text()

text = text.replace(
    '  itemId String        @map("item_id") @db.Uuid\n  item   SolicitudItem @relation(fields: [itemId], references: [id], onDelete: Cascade)',
    '  itemId String?        @map("item_id") @db.Uuid\n  item   SolicitudItem? @relation(fields: [itemId], references: [id], onDelete: Cascade)',
)

schema_path.write_text(text)
print('[OK] SolicitudAdjuntoItemMatch.itemId ahora es nullable en schema.prisma.')
