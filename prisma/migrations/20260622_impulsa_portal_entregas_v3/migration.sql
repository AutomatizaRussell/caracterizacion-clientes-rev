CREATE TABLE "impulsa"."sol_solicitud_portal_entrega" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "solicitud_id" UUID NOT NULL,
  "token_id" UUID NOT NULL,
  "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sol_solicitud_portal_entrega_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "impulsa"."sol_solicitud_portal_adjunto" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "solicitud_id" UUID NOT NULL,
  "entrega_id" UUID NOT NULL,
  "uploaded_by_token_id" UUID,
  "original_file_name" VARCHAR(500) NOT NULL,
  "stored_file_name" VARCHAR(500),
  "mime_type" VARCHAR(150),
  "size_bytes" BIGINT,
  "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'onedrive',
  "onedrive_url" TEXT,
  "onedrive_item_id" VARCHAR(255),
  "informacion_suministrada_folder_id" VARCHAR(255),
  "informacion_suministrada_folder_url" TEXT,
  "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sol_solicitud_portal_adjunto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "impulsa"."sol_solicitud_item_entrega_cliente" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entrega_id" UUID NOT NULL,
  "solicitud_item_id" UUID NOT NULL,
  "token_id" UUID NOT NULL,
  "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sol_solicitud_item_entrega_cliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sol_solicitud_item_entrega_cliente_entrega_item_key"
  ON "impulsa"."sol_solicitud_item_entrega_cliente"("entrega_id", "solicitud_item_id");

CREATE INDEX "sol_solicitud_portal_entrega_solicitud_id_idx"
  ON "impulsa"."sol_solicitud_portal_entrega"("solicitud_id");

CREATE INDEX "sol_solicitud_portal_entrega_token_id_idx"
  ON "impulsa"."sol_solicitud_portal_entrega"("token_id");

CREATE INDEX "sol_solicitud_portal_entrega_submitted_at_idx"
  ON "impulsa"."sol_solicitud_portal_entrega"("submitted_at");

CREATE INDEX "sol_solicitud_portal_adjunto_solicitud_id_idx"
  ON "impulsa"."sol_solicitud_portal_adjunto"("solicitud_id");

CREATE INDEX "sol_solicitud_portal_adjunto_entrega_id_idx"
  ON "impulsa"."sol_solicitud_portal_adjunto"("entrega_id");

CREATE INDEX "sol_solicitud_portal_adjunto_uploaded_by_token_id_idx"
  ON "impulsa"."sol_solicitud_portal_adjunto"("uploaded_by_token_id");

CREATE INDEX "sol_solicitud_portal_adjunto_onedrive_item_id_idx"
  ON "impulsa"."sol_solicitud_portal_adjunto"("onedrive_item_id");

CREATE INDEX "sol_solicitud_portal_adjunto_uploaded_at_idx"
  ON "impulsa"."sol_solicitud_portal_adjunto"("uploaded_at");

CREATE INDEX "sol_solicitud_item_entrega_cliente_entrega_id_idx"
  ON "impulsa"."sol_solicitud_item_entrega_cliente"("entrega_id");

CREATE INDEX "sol_solicitud_item_entrega_cliente_solicitud_item_id_idx"
  ON "impulsa"."sol_solicitud_item_entrega_cliente"("solicitud_item_id");

CREATE INDEX "sol_solicitud_item_entrega_cliente_token_id_idx"
  ON "impulsa"."sol_solicitud_item_entrega_cliente"("token_id");

ALTER TABLE "impulsa"."sol_solicitud_portal_entrega"
  ADD CONSTRAINT "sol_solicitud_portal_entrega_solicitud_id_fkey"
  FOREIGN KEY ("solicitud_id")
  REFERENCES "impulsa"."sol_solicitud"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_portal_entrega"
  ADD CONSTRAINT "sol_solicitud_portal_entrega_token_id_fkey"
  FOREIGN KEY ("token_id")
  REFERENCES "impulsa"."sol_solicitud_token_cliente"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_portal_adjunto"
  ADD CONSTRAINT "sol_solicitud_portal_adjunto_solicitud_id_fkey"
  FOREIGN KEY ("solicitud_id")
  REFERENCES "impulsa"."sol_solicitud"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_portal_adjunto"
  ADD CONSTRAINT "sol_solicitud_portal_adjunto_entrega_id_fkey"
  FOREIGN KEY ("entrega_id")
  REFERENCES "impulsa"."sol_solicitud_portal_entrega"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_portal_adjunto"
  ADD CONSTRAINT "sol_solicitud_portal_adjunto_uploaded_by_token_id_fkey"
  FOREIGN KEY ("uploaded_by_token_id")
  REFERENCES "impulsa"."sol_solicitud_token_cliente"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_item_entrega_cliente"
  ADD CONSTRAINT "sol_solicitud_item_entrega_cliente_entrega_id_fkey"
  FOREIGN KEY ("entrega_id")
  REFERENCES "impulsa"."sol_solicitud_portal_entrega"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_item_entrega_cliente"
  ADD CONSTRAINT "sol_solicitud_item_entrega_cliente_solicitud_item_id_fkey"
  FOREIGN KEY ("solicitud_item_id")
  REFERENCES "impulsa"."sol_solicitud_item"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "impulsa"."sol_solicitud_item_entrega_cliente"
  ADD CONSTRAINT "sol_solicitud_item_entrega_cliente_token_id_fkey"
  FOREIGN KEY ("token_id")
  REFERENCES "impulsa"."sol_solicitud_token_cliente"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
