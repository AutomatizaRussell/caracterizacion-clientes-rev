import { prisma } from '@/lib/prisma';

export type ClienteProgresoDocumentalAnual = {
  clienteId: string;
  year: number;
  planeadas: number;
  generadas: number;
  completadas: number;
  progressPercentage: number;
};

type PlaneacionProgressRow = {
  empresa_ref_id: string;
  planeadas: string | number | bigint;
  generadas: string | number | bigint;
  completadas: string | number | bigint;
};

function toNumber(value: string | number | bigint) {
  return Number(value);
}

export async function getClientesProgresoDocumentalAnual(params: {
  clienteIds: string[];
  year: number;
}) {
  const uniqueClientIds = Array.from(new Set(params.clienteIds));
  const result = new Map<string, ClienteProgresoDocumentalAnual>();

  for (const clienteId of uniqueClientIds) {
    result.set(clienteId, {
      clienteId,
      year: params.year,
      planeadas: 0,
      generadas: 0,
      completadas: 0,
      progressPercentage: 0,
    });
  }

  if (uniqueClientIds.length === 0) return result;

  const placeholders = uniqueClientIds.map((_, index) => `$${index + 2}`).join(', ');

  const rows = await prisma.$queryRawUnsafe<PlaneacionProgressRow[]>(
    `
      SELECT
        empresa_ref_id::text,
        COUNT(*) FILTER (WHERE activo = TRUE) AS planeadas,
        COUNT(*) FILTER (WHERE activo = TRUE AND generated_solicitud_id IS NOT NULL) AS generadas,
        COUNT(*) FILTER (WHERE activo = TRUE AND estado IN ('COMPLETADA', 'COMPLETED')) AS completadas
      FROM core.ref_cliente_planeacion
      WHERE year = $1
        AND empresa_ref_id IN (${placeholders})
      GROUP BY empresa_ref_id
    `,
    params.year,
    ...uniqueClientIds,
  );

  for (const row of rows) {
    const planeadas = toNumber(row.planeadas);
    const generadas = toNumber(row.generadas);
    const completadas = toNumber(row.completadas);

    result.set(row.empresa_ref_id, {
      clienteId: row.empresa_ref_id,
      year: params.year,
      planeadas,
      generadas,
      completadas,
      progressPercentage: planeadas > 0 ? Math.round((completadas / planeadas) * 100) : 0,
    });
  }

  return result;
}
