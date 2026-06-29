CREATE TABLE IF NOT EXISTS core.ref_cliente_planeacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_ref_id UUID NOT NULL REFERENCES core.ref_empresa(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  request_type_id VARCHAR(150),
  request_type_name VARCHAR(255),
  scheduled_date DATE,
  due_date DATE,
  estado VARCHAR(30) NOT NULL DEFAULT 'PLANEADA',
  generated_solicitud_id UUID,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_cliente_planeacion_empresa_ref_id_idx
ON core.ref_cliente_planeacion (empresa_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_planeacion_year_idx
ON core.ref_cliente_planeacion (year);

CREATE INDEX IF NOT EXISTS ref_cliente_planeacion_estado_idx
ON core.ref_cliente_planeacion (estado);

CREATE INDEX IF NOT EXISTS ref_cliente_planeacion_scheduled_date_idx
ON core.ref_cliente_planeacion (scheduled_date);

CREATE INDEX IF NOT EXISTS ref_cliente_planeacion_generated_solicitud_id_idx
ON core.ref_cliente_planeacion (generated_solicitud_id);

CREATE UNIQUE INDEX IF NOT EXISTS ref_cliente_planeacion_empresa_year_nombre_active_idx
ON core.ref_cliente_planeacion (empresa_ref_id, year, nombre)
WHERE activo = TRUE;
