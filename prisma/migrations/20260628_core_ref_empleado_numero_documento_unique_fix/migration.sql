-- Prisma usa RefEmpleado.numeroDocumento como @unique para upsert.
-- Por eso PostgreSQL necesita un índice único normal compatible con:
-- ON CONFLICT (numero_documento).
--
-- El índice parcial previo:
--   WHERE numero_documento IS NOT NULL
-- no es compatible con el ON CONFLICT generado por Prisma.

DROP INDEX IF EXISTS core.ref_empleado_numero_documento_key;

CREATE UNIQUE INDEX IF NOT EXISTS ref_empleado_numero_documento_key
ON core.ref_empleado (numero_documento);
