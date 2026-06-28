ALTER TABLE core.ref_empleado
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS ref_empleado_numero_documento_key
ON core.ref_empleado (numero_documento)
WHERE numero_documento IS NOT NULL;

CREATE TABLE IF NOT EXISTS core.ref_cliente_equipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  empresa_ref_id UUID NOT NULL REFERENCES core.ref_empresa(id) ON DELETE CASCADE,

  socio_ref_id UUID NOT NULL REFERENCES core.ref_empleado(id) ON DELETE RESTRICT,
  gerente_ref_id UUID NOT NULL REFERENCES core.ref_empleado(id) ON DELETE RESTRICT,
  senior_ref_id UUID NOT NULL REFERENCES core.ref_empleado(id) ON DELETE RESTRICT,

  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  source VARCHAR(50) NOT NULL DEFAULT 'excel_estructura_jerarquica',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_empresa_ref_id_idx
ON core.ref_cliente_equipo (empresa_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_socio_ref_id_idx
ON core.ref_cliente_equipo (socio_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_gerente_ref_id_idx
ON core.ref_cliente_equipo (gerente_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_senior_ref_id_idx
ON core.ref_cliente_equipo (senior_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_activo_idx
ON core.ref_cliente_equipo (activo);

CREATE UNIQUE INDEX IF NOT EXISTS ref_cliente_equipo_one_active_per_empresa_idx
ON core.ref_cliente_equipo (empresa_ref_id)
WHERE activo = TRUE;

CREATE TABLE IF NOT EXISTS core.ref_cliente_equipo_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cliente_equipo_id UUID NOT NULL REFERENCES core.ref_cliente_equipo(id) ON DELETE CASCADE,
  staff_ref_id UUID NOT NULL REFERENCES core.ref_empleado(id) ON DELETE RESTRICT,

  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  source VARCHAR(50) NOT NULL DEFAULT 'excel_estructura_jerarquica',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_staff_cliente_equipo_id_idx
ON core.ref_cliente_equipo_staff (cliente_equipo_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_staff_staff_ref_id_idx
ON core.ref_cliente_equipo_staff (staff_ref_id);

CREATE INDEX IF NOT EXISTS ref_cliente_equipo_staff_activo_idx
ON core.ref_cliente_equipo_staff (activo);

CREATE UNIQUE INDEX IF NOT EXISTS ref_cliente_equipo_staff_one_active_idx
ON core.ref_cliente_equipo_staff (cliente_equipo_id, staff_ref_id)
WHERE activo = TRUE;
