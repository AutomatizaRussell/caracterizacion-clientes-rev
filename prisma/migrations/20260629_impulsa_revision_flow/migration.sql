CREATE TABLE IF NOT EXISTS impulsa.sol_solicitud_adjunto_extraccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjunto_id UUID NOT NULL REFERENCES impulsa.sol_solicitud_portal_adjunto(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  extracted_text TEXT,
  extracted_metadata_json JSONB,
  error_message TEXT,
  extractor VARCHAR(80),
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sol_solicitud_adjunto_extraccion_adjunto_id_key UNIQUE (adjunto_id)
);

CREATE TABLE IF NOT EXISTS impulsa.sol_solicitud_adjunto_item_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES impulsa.sol_solicitud(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES impulsa.sol_solicitud_item(id) ON DELETE CASCADE,
  adjunto_id UUID NOT NULL REFERENCES impulsa.sol_solicitud_portal_adjunto(id) ON DELETE CASCADE,
  match_status VARCHAR(40) NOT NULL DEFAULT 'UNMATCHED',
  match_source VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
  confidence_score NUMERIC(5,4),
  ai_reason TEXT,
  ai_warnings_json JSONB,
  confirmed_by_empleado_id UUID REFERENCES core.ref_empleado(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  correction_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sol_solicitud_adjunto_item_match_solicitud_id_idx ON impulsa.sol_solicitud_adjunto_item_match(solicitud_id);
CREATE INDEX IF NOT EXISTS sol_solicitud_adjunto_item_match_item_id_idx ON impulsa.sol_solicitud_adjunto_item_match(item_id);
CREATE INDEX IF NOT EXISTS sol_solicitud_adjunto_item_match_adjunto_id_idx ON impulsa.sol_solicitud_adjunto_item_match(adjunto_id);
CREATE INDEX IF NOT EXISTS sol_solicitud_adjunto_item_match_match_status_idx ON impulsa.sol_solicitud_adjunto_item_match(match_status);

CREATE TABLE IF NOT EXISTS impulsa.sol_solicitud_item_revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES impulsa.sol_solicitud(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES impulsa.sol_solicitud_item(id) ON DELETE CASCADE,
  review_level VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer_empleado_id UUID REFERENCES core.ref_empleado(id) ON DELETE SET NULL,
  review_comment TEXT,
  rejected_reason TEXT,
  decided_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sol_solicitud_item_revision_item_level_key UNIQUE (item_id, review_level)
);

CREATE INDEX IF NOT EXISTS sol_solicitud_item_revision_solicitud_id_idx ON impulsa.sol_solicitud_item_revision(solicitud_id);
CREATE INDEX IF NOT EXISTS sol_solicitud_item_revision_status_idx ON impulsa.sol_solicitud_item_revision(status);
CREATE INDEX IF NOT EXISTS sol_solicitud_item_revision_review_level_idx ON impulsa.sol_solicitud_item_revision(review_level);

CREATE TABLE IF NOT EXISTS impulsa.sol_solicitud_revision_cierre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES impulsa.sol_solicitud(id) ON DELETE CASCADE,
  review_level VARCHAR(30) NOT NULL,
  closed_by_empleado_id UUID NOT NULL REFERENCES core.ref_empleado(id) ON DELETE RESTRICT,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary_json JSONB,
  email_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  email_recipients_json JSONB,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sol_solicitud_revision_cierre_solicitud_level_key UNIQUE (solicitud_id, review_level)
);

CREATE INDEX IF NOT EXISTS sol_solicitud_revision_cierre_solicitud_id_idx ON impulsa.sol_solicitud_revision_cierre(solicitud_id);
CREATE INDEX IF NOT EXISTS sol_solicitud_revision_cierre_review_level_idx ON impulsa.sol_solicitud_revision_cierre(review_level);
CREATE INDEX IF NOT EXISTS sol_solicitud_revision_cierre_email_status_idx ON impulsa.sol_solicitud_revision_cierre(email_status);
