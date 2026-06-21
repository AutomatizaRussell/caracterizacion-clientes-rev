-- CreateEnum
CREATE TYPE "impulsa"."EstadoSolicitud" AS ENUM ('DRAFT', 'CREATED', 'DOCUMENT_GENERATED', 'SENT', 'CLIENT_OPENED', 'CLIENT_SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "impulsa"."EstadoSolicitudItem" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "impulsa"."TipoSolicitudItem" AS ENUM ('BASE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "impulsa"."TipoSolicitudEvento" AS ENUM ('CREATED', 'ITEMS_CREATED', 'TOKEN_CREATED', 'DOCUMENT_GENERATED', 'ONEDRIVE_FOLDERS_CREATED', 'EMAIL_SENT', 'CLIENT_OPENED', 'CLIENT_ITEM_SUBMITTED', 'CLIENT_SUBMITTED', 'REVIEW_STARTED', 'ITEM_ACCEPTED', 'ITEM_REJECTED', 'COMPLETED', 'FAILED', 'CANCELLED', 'N8N_WEBHOOK_SENT', 'N8N_CALLBACK_RECEIVED');

-- CreateEnum
CREATE TYPE "impulsa"."TipoActorSolicitud" AS ENUM ('EMPLEADO', 'CLIENTE', 'SYSTEM', 'N8N');

-- CreateEnum
CREATE TYPE "impulsa"."TipoDocumentoGenerado" AS ENUM ('PDF', 'DOCX', 'HTML_SNAPSHOT', 'JSON_PAYLOAD');

-- CreateEnum
CREATE TYPE "impulsa"."EstadoDocumentoGenerado" AS ENUM ('PENDING', 'GENERATED', 'STORED', 'FAILED');

-- CreateTable
CREATE TABLE "impulsa"."rad_radicado_counter" (
    "id" UUID NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "scope" VARCHAR(50) NOT NULL DEFAULT 'global',
    "last_consecutive" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rad_radicado_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."rad_radicado" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(100) NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "consecutive" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "company_code" VARCHAR(80) NOT NULL,
    "empresa_ref_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rad_radicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_solicitud" (
    "id" UUID NOT NULL,
    "radicado_id" UUID NOT NULL,
    "empresa_ref_id" UUID NOT NULL,
    "created_by_empleado_id" UUID,
    "responsible_empleado_id" UUID,
    "request_type_id" VARCHAR(150) NOT NULL,
    "request_type_name" VARCHAR(255) NOT NULL,
    "template_file" VARCHAR(255),
    "subject" VARCHAR(500) NOT NULL,
    "cutoff_date" DATE NOT NULL,
    "generation_date" DATE NOT NULL,
    "client_contact_name" VARCHAR(255),
    "client_contact_email" VARCHAR(255),
    "responsible_name" VARCHAR(255) NOT NULL,
    "responsible_role" VARCHAR(255) NOT NULL,
    "responsible_firm" VARCHAR(255) NOT NULL,
    "status" "impulsa"."EstadoSolicitud" NOT NULL DEFAULT 'CREATED',
    "portal_url" TEXT,
    "onedrive_year_folder_url" TEXT,
    "onedrive_year_folder_id" VARCHAR(255),
    "onedrive_client_folder_url" TEXT,
    "onedrive_client_folder_id" VARCHAR(255),
    "onedrive_planeacion_folder_url" TEXT,
    "onedrive_planeacion_folder_id" VARCHAR(255),
    "onedrive_ejecucion_folder_url" TEXT,
    "onedrive_ejecucion_folder_id" VARCHAR(255),
    "onedrive_cierre_folder_url" TEXT,
    "onedrive_cierre_folder_id" VARCHAR(255),
    "onedrive_impuestos_folder_url" TEXT,
    "onedrive_impuestos_folder_id" VARCHAR(255),
    "onedrive_comunicaciones_folder_url" TEXT,
    "onedrive_comunicaciones_folder_id" VARCHAR(255),
    "onedrive_solicitud_comunicacion_folder_url" TEXT,
    "onedrive_solicitud_comunicacion_folder_id" VARCHAR(255),
    "n8n_execution_id" VARCHAR(255),
    "n8n_last_webhook_at" TIMESTAMPTZ(6),
    "n8n_last_callback_at" TIMESTAMPTZ(6),
    "n8n_last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "sol_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_solicitud_item" (
    "id" UUID NOT NULL,
    "solicitud_id" UUID NOT NULL,
    "category_id" VARCHAR(150) NOT NULL,
    "category_title" VARCHAR(255) NOT NULL,
    "template_item_id" VARCHAR(180),
    "item_mode" "impulsa"."TipoSolicitudItem" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "children_json" JSONB,
    "table_json" JSONB,
    "status" "impulsa"."EstadoSolicitudItem" NOT NULL DEFAULT 'PENDING',
    "client_response_text" TEXT,
    "client_submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "review_comment" TEXT,
    "rejected_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sol_solicitud_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_solicitud_item_archivo" (
    "id" UUID NOT NULL,
    "solicitud_item_id" UUID NOT NULL,
    "uploaded_by_token_id" UUID,
    "original_file_name" VARCHAR(500) NOT NULL,
    "stored_file_name" VARCHAR(500),
    "mime_type" VARCHAR(150),
    "size_bytes" BIGINT,
    "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'onedrive',
    "onedrive_url" TEXT,
    "onedrive_item_id" VARCHAR(255),
    "local_path" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sol_solicitud_item_archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_solicitud_token_cliente" (
    "id" UUID NOT NULL,
    "solicitud_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "client_name" VARCHAR(255),
    "client_email" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sol_solicitud_token_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_documento_generado" (
    "id" UUID NOT NULL,
    "solicitud_id" UUID NOT NULL,
    "generated_by_empleado_id" UUID,
    "document_type" "impulsa"."TipoDocumentoGenerado" NOT NULL,
    "status" "impulsa"."EstadoDocumentoGenerado" NOT NULL DEFAULT 'PENDING',
    "file_name" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(150),
    "size_bytes" BIGINT,
    "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'onedrive',
    "local_path" TEXT,
    "onedrive_url" TEXT,
    "onedrive_item_id" VARCHAR(255),
    "generated_at" TIMESTAMPTZ(6),
    "stored_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sol_documento_generado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impulsa"."sol_solicitud_evento" (
    "id" UUID NOT NULL,
    "solicitud_id" UUID NOT NULL,
    "event_type" "impulsa"."TipoSolicitudEvento" NOT NULL,
    "actor_type" "impulsa"."TipoActorSolicitud" NOT NULL DEFAULT 'SYSTEM',
    "actor_empleado_id" UUID,
    "message" VARCHAR(500),
    "payload_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sol_solicitud_evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rad_radicado_counter_prefix_year_scope_key" ON "impulsa"."rad_radicado_counter"("prefix", "year", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "rad_radicado_reference_key" ON "impulsa"."rad_radicado"("reference");

-- CreateIndex
CREATE INDEX "rad_radicado_empresa_ref_id_idx" ON "impulsa"."rad_radicado"("empresa_ref_id");

-- CreateIndex
CREATE INDEX "rad_radicado_year_idx" ON "impulsa"."rad_radicado"("year");

-- CreateIndex
CREATE INDEX "rad_radicado_prefix_year_idx" ON "impulsa"."rad_radicado"("prefix", "year");

-- CreateIndex
CREATE UNIQUE INDEX "rad_radicado_empresa_ref_id_prefix_year_consecutive_key" ON "impulsa"."rad_radicado"("empresa_ref_id", "prefix", "year", "consecutive");

-- CreateIndex
CREATE UNIQUE INDEX "sol_solicitud_radicado_id_key" ON "impulsa"."sol_solicitud"("radicado_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_empresa_ref_id_idx" ON "impulsa"."sol_solicitud"("empresa_ref_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_created_by_empleado_id_idx" ON "impulsa"."sol_solicitud"("created_by_empleado_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_responsible_empleado_id_idx" ON "impulsa"."sol_solicitud"("responsible_empleado_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_status_idx" ON "impulsa"."sol_solicitud"("status");

-- CreateIndex
CREATE INDEX "sol_solicitud_request_type_id_idx" ON "impulsa"."sol_solicitud"("request_type_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_created_at_idx" ON "impulsa"."sol_solicitud"("created_at");

-- CreateIndex
CREATE INDEX "sol_solicitud_generation_date_idx" ON "impulsa"."sol_solicitud"("generation_date");

-- CreateIndex
CREATE INDEX "sol_solicitud_empresa_ref_id_generation_date_idx" ON "impulsa"."sol_solicitud"("empresa_ref_id", "generation_date");

-- CreateIndex
CREATE INDEX "sol_solicitud_onedrive_solicitud_comunicacion_folder_id_idx" ON "impulsa"."sol_solicitud"("onedrive_solicitud_comunicacion_folder_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_solicitud_id_idx" ON "impulsa"."sol_solicitud_item"("solicitud_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_category_id_idx" ON "impulsa"."sol_solicitud_item"("category_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_item_mode_idx" ON "impulsa"."sol_solicitud_item"("item_mode");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_status_idx" ON "impulsa"."sol_solicitud_item"("status");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_archivo_solicitud_item_id_idx" ON "impulsa"."sol_solicitud_item_archivo"("solicitud_item_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_archivo_uploaded_by_token_id_idx" ON "impulsa"."sol_solicitud_item_archivo"("uploaded_by_token_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_item_archivo_uploaded_at_idx" ON "impulsa"."sol_solicitud_item_archivo"("uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "sol_solicitud_token_cliente_token_hash_key" ON "impulsa"."sol_solicitud_token_cliente"("token_hash");

-- CreateIndex
CREATE INDEX "sol_solicitud_token_cliente_solicitud_id_idx" ON "impulsa"."sol_solicitud_token_cliente"("solicitud_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_token_cliente_client_email_idx" ON "impulsa"."sol_solicitud_token_cliente"("client_email");

-- CreateIndex
CREATE INDEX "sol_solicitud_token_cliente_expires_at_idx" ON "impulsa"."sol_solicitud_token_cliente"("expires_at");

-- CreateIndex
CREATE INDEX "sol_documento_generado_solicitud_id_idx" ON "impulsa"."sol_documento_generado"("solicitud_id");

-- CreateIndex
CREATE INDEX "sol_documento_generado_generated_by_empleado_id_idx" ON "impulsa"."sol_documento_generado"("generated_by_empleado_id");

-- CreateIndex
CREATE INDEX "sol_documento_generado_document_type_idx" ON "impulsa"."sol_documento_generado"("document_type");

-- CreateIndex
CREATE INDEX "sol_documento_generado_status_idx" ON "impulsa"."sol_documento_generado"("status");

-- CreateIndex
CREATE INDEX "sol_documento_generado_created_at_idx" ON "impulsa"."sol_documento_generado"("created_at");

-- CreateIndex
CREATE INDEX "sol_solicitud_evento_solicitud_id_idx" ON "impulsa"."sol_solicitud_evento"("solicitud_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_evento_event_type_idx" ON "impulsa"."sol_solicitud_evento"("event_type");

-- CreateIndex
CREATE INDEX "sol_solicitud_evento_actor_empleado_id_idx" ON "impulsa"."sol_solicitud_evento"("actor_empleado_id");

-- CreateIndex
CREATE INDEX "sol_solicitud_evento_created_at_idx" ON "impulsa"."sol_solicitud_evento"("created_at");

-- AddForeignKey
ALTER TABLE "impulsa"."rad_radicado" ADD CONSTRAINT "rad_radicado_empresa_ref_id_fkey" FOREIGN KEY ("empresa_ref_id") REFERENCES "core"."ref_empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud" ADD CONSTRAINT "sol_solicitud_radicado_id_fkey" FOREIGN KEY ("radicado_id") REFERENCES "impulsa"."rad_radicado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud" ADD CONSTRAINT "sol_solicitud_empresa_ref_id_fkey" FOREIGN KEY ("empresa_ref_id") REFERENCES "core"."ref_empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud" ADD CONSTRAINT "sol_solicitud_created_by_empleado_id_fkey" FOREIGN KEY ("created_by_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud" ADD CONSTRAINT "sol_solicitud_responsible_empleado_id_fkey" FOREIGN KEY ("responsible_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_item" ADD CONSTRAINT "sol_solicitud_item_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "impulsa"."sol_solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_item_archivo" ADD CONSTRAINT "sol_solicitud_item_archivo_solicitud_item_id_fkey" FOREIGN KEY ("solicitud_item_id") REFERENCES "impulsa"."sol_solicitud_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_item_archivo" ADD CONSTRAINT "sol_solicitud_item_archivo_uploaded_by_token_id_fkey" FOREIGN KEY ("uploaded_by_token_id") REFERENCES "impulsa"."sol_solicitud_token_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_token_cliente" ADD CONSTRAINT "sol_solicitud_token_cliente_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "impulsa"."sol_solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_documento_generado" ADD CONSTRAINT "sol_documento_generado_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "impulsa"."sol_solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_documento_generado" ADD CONSTRAINT "sol_documento_generado_generated_by_empleado_id_fkey" FOREIGN KEY ("generated_by_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_evento" ADD CONSTRAINT "sol_solicitud_evento_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "impulsa"."sol_solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impulsa"."sol_solicitud_evento" ADD CONSTRAINT "sol_solicitud_evento_actor_empleado_id_fkey" FOREIGN KEY ("actor_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

