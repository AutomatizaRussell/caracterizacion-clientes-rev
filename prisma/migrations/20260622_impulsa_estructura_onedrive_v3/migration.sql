-- Impulsa OneDrive V3
-- Nueva estructura:
-- - Control Interno dentro de 1. Planeación.
-- - Solicitudes de información dentro de 5. Comunicaciones.
-- - Carpetas documentales persistidas estructuralmente.

ALTER TABLE "impulsa"."sol_solicitud"
  ADD COLUMN "onedrive_control_interno_folder_url" TEXT,
  ADD COLUMN "onedrive_control_interno_folder_id" VARCHAR(255),
  ADD COLUMN "onedrive_solicitudes_informacion_folder_url" TEXT,
  ADD COLUMN "onedrive_solicitudes_informacion_folder_id" VARCHAR(255);

CREATE TABLE "impulsa"."sol_solicitud_request_folder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "solicitud_id" UUID NOT NULL,

  "key" VARCHAR(180) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "folder_name" VARCHAR(255) NOT NULL,

  "folder_id" VARCHAR(255),
  "folder_url" TEXT,
  "folder_path" TEXT,

  "informacion_suministrada_folder_id" VARCHAR(255),
  "informacion_suministrada_folder_url" TEXT,
  "informacion_suministrada_folder_name" VARCHAR(255),
  "informacion_suministrada_folder_path" TEXT,

  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sol_solicitud_request_folder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sol_solicitud_request_folder_solicitud_id_key_key"
  ON "impulsa"."sol_solicitud_request_folder"("solicitud_id", "key");

CREATE INDEX "sol_solicitud_request_folder_solicitud_id_idx"
  ON "impulsa"."sol_solicitud_request_folder"("solicitud_id");

CREATE INDEX "sol_solicitud_request_folder_folder_id_idx"
  ON "impulsa"."sol_solicitud_request_folder"("folder_id");

CREATE INDEX "sol_solicitud_request_folder_info_sum_folder_id_idx"
  ON "impulsa"."sol_solicitud_request_folder"("informacion_suministrada_folder_id");

CREATE INDEX "sol_solicitud_onedrive_control_interno_folder_id_idx"
  ON "impulsa"."sol_solicitud"("onedrive_control_interno_folder_id");

CREATE INDEX "sol_solicitud_onedrive_solicitudes_info_folder_id_idx"
  ON "impulsa"."sol_solicitud"("onedrive_solicitudes_informacion_folder_id");

ALTER TABLE "impulsa"."sol_solicitud_request_folder"
  ADD CONSTRAINT "sol_solicitud_request_folder_solicitud_id_fkey"
  FOREIGN KEY ("solicitud_id")
  REFERENCES "impulsa"."sol_solicitud"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
