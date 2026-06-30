from pathlib import Path

service_path = Path('src/server/revision/revision.service.ts')
text = service_path.read_text()

# 1) Importar enum de estado de item para no depender de strings sueltos.
if "EstadoSolicitudItem" not in text.split("\n", 10)[0:10]:
    text = text.replace(
        "import type { Prisma } from '@/generated/prisma/client';\n",
        "import type { Prisma } from '@/generated/prisma/client';\nimport { EstadoSolicitudItem } from '@/generated/prisma/enums';\n",
        1,
    )

old_items_block = """      items: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          categoryId: true,
          categoryTitle: true,
          text: true,
          status: true,
        },
      },"""

new_items_block = """      items: {
        /*
         * La asociación archivo-ítem solo debe ofrecer ítems que el cliente
         * marcó como cubiertos en el portal. Mostrar todos los ítems de la
         * solicitud vuelve inmanejable la vista y permite asociar soportes a
         * requerimientos que el cliente no declaró entregados.
         *
         * SUBMITTED es el estado que deja el portal cuando el cliente marca
         * el check. Se conservan estados posteriores para no perder el ítem si
         * en el futuro otro flujo actualiza estado durante revisión/cierre.
         */
        where: {
          status: {
            in: [
              EstadoSolicitudItem.SUBMITTED,
              EstadoSolicitudItem.UNDER_REVIEW,
              EstadoSolicitudItem.ACCEPTED,
              EstadoSolicitudItem.REJECTED,
            ],
          },
        },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          categoryId: true,
          categoryTitle: true,
          text: true,
          status: true,
        },
      },"""

if old_items_block not in text:
    raise SystemExit('No encontré el bloque items esperado en getVisibleSolicitudForRevision. Revisa si el archivo cambió.')

text = text.replace(old_items_block, new_items_block, 1)
service_path.write_text(text)
print('[OK] Asociación/revisión ahora cargan solo ítems marcados por el cliente en el portal.')

# 2) Ajustar textos de UI para que no diga total de solicitud si ahora es total revisable/marcado.
client_path = Path('src/components/revision/AssociationWorkspaceClient.tsx')
if client_path.exists():
    ui = client_path.read_text()
    ui = ui.replace('>Ítems</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{totalItems}</p>', '>Ítems marcados</p><p className="mt-2 text-2xl font-extrabold text-[#041461]">{totalItems}</p>')
    ui = ui.replace('const pendingItems = totalItems - matchedItemIds.size;', 'const pendingItems = Math.max(0, totalItems - matchedItemIds.size);')
    client_path.write_text(ui)
    print('[OK] Etiqueta de conteo ajustada a Ítems marcados.')
else:
    print('[WARN] No existe AssociationWorkspaceClient.tsx; se omitió ajuste visual.')
