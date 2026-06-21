-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "caracterizacion";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateEnum
CREATE TYPE "caracterizacion"."EstadoCaracterizacion" AS ENUM ('DRAFT', 'COMPLETE', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "caracterizacion"."EstadoRespuesta" AS ENUM ('PENDING', 'OK', 'NOT_APPLICABLE_AUTO', 'MISSING_DETAIL', 'INVALID');

-- CreateEnum
CREATE TYPE "caracterizacion"."FuenteAuditoria" AS ENUM ('AUTOSAVE', 'MANUAL_SAVE', 'IMPORT', 'ADMIN_EDIT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "caracterizacion"."TipoCampo" AS ENUM ('TEXT', 'LONG_TEXT', 'INTEGER', 'DECIMAL', 'DATE', 'YES_NO_NA', 'SECTOR');

-- CreateEnum
CREATE TYPE "caracterizacion"."TipoExportacion" AS ENUM ('GLOBAL', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "caracterizacion"."car_campo" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "section" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "help_text" TEXT,
    "field_type" "caracterizacion"."TipoCampo" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "unit" VARCHAR(30),
    "export_column_name" VARCHAR(255),
    "depends_on_field_code" VARCHAR(100),
    "depends_on_value" VARCHAR(30),
    "has_inline_detail" BOOLEAN NOT NULL DEFAULT false,
    "inline_detail_label" VARCHAR(255),
    "inline_detail_required_when_value" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "car_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracterizacion"."car_export_log" (
    "id" UUID NOT NULL,
    "requested_by_empleado_id" UUID NOT NULL,
    "export_type" "caracterizacion"."TipoExportacion" NOT NULL,
    "scope" VARCHAR(50) NOT NULL,
    "filters_json" JSONB,
    "columns_json" JSONB,
    "included_drafts" BOOLEAN NOT NULL DEFAULT false,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "file_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_export_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracterizacion"."car_formulario_cliente" (
    "id" UUID NOT NULL,
    "empresa_ref_id" UUID NOT NULL,
    "general_empresa_id" BIGINT,
    "status" "caracterizacion"."EstadoCaracterizacion" NOT NULL DEFAULT 'DRAFT',
    "answered_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 38,
    "completion_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_by_empleado_id" UUID,
    "updated_by_empleado_id" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "has_post_confirmation_changes" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "car_formulario_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracterizacion"."car_respuesta" (
    "id" UUID NOT NULL,
    "formulario_id" UUID NOT NULL,
    "campo_id" UUID NOT NULL,
    "value_text" TEXT,
    "value_number" DECIMAL(20,2),
    "value_date" DATE,
    "value_json" JSONB,
    "status" "caracterizacion"."EstadoRespuesta" NOT NULL DEFAULT 'PENDING',
    "updated_by_empleado_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "car_respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracterizacion"."car_respuesta_audit" (
    "id" UUID NOT NULL,
    "respuesta_id" UUID NOT NULL,
    "old_value_json" JSONB,
    "new_value_json" JSONB,
    "changed_by_empleado_id" UUID,
    "source" "caracterizacion"."FuenteAuditoria" NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_respuesta_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ref_asignacion" (
    "id" UUID NOT NULL,
    "general_asignacion_id" BIGINT,
    "empresa_ref_id" UUID NOT NULL,
    "empleado_ref_id" UUID NOT NULL,
    "general_empresa_id" BIGINT,
    "general_empleado_id" INTEGER,
    "area_id" INTEGER,
    "rol" VARCHAR(25) NOT NULL,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "source" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ref_asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ref_empleado" (
    "id" UUID NOT NULL,
    "general_empleado_id" INTEGER,
    "correo_corporativo" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(300) NOT NULL,
    "area_id" INTEGER,
    "area_nombre" VARCHAR(100),
    "cargo_id" INTEGER,
    "cargo_nombre" VARCHAR(100),
    "estado" VARCHAR(20),
    "rol_aplicacion" VARCHAR(30) NOT NULL DEFAULT 'senior',
    "source" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ref_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ref_empleado_jerarquia" (
    "id" UUID NOT NULL,
    "empleado_ref_id" UUID NOT NULL,
    "jefe_ref_id" UUID NOT NULL,
    "general_empleado_id" INTEGER,
    "general_jefe_id" INTEGER,
    "tipo_relacion" VARCHAR(30) NOT NULL DEFAULT 'lineal',
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "source" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ref_empleado_jerarquia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ref_empresa" (
    "id" UUID NOT NULL,
    "general_empresa_id" BIGINT,
    "razon_social" VARCHAR(255) NOT NULL,
    "nit" VARCHAR(20) NOT NULL,
    "digito_verificacion" VARCHAR(1),
    "estado" VARCHAR(15),
    "source" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ref_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "car_campo_code_key" ON "caracterizacion"."car_campo"("code" ASC);

-- CreateIndex
CREATE INDEX "car_campo_depends_on_field_code_idx" ON "caracterizacion"."car_campo"("depends_on_field_code" ASC);

-- CreateIndex
CREATE INDEX "car_campo_order_index_idx" ON "caracterizacion"."car_campo"("order_index" ASC);

-- CreateIndex
CREATE INDEX "car_campo_section_idx" ON "caracterizacion"."car_campo"("section" ASC);

-- CreateIndex
CREATE INDEX "car_export_log_created_at_idx" ON "caracterizacion"."car_export_log"("created_at" ASC);

-- CreateIndex
CREATE INDEX "car_export_log_export_type_idx" ON "caracterizacion"."car_export_log"("export_type" ASC);

-- CreateIndex
CREATE INDEX "car_export_log_requested_by_empleado_id_idx" ON "caracterizacion"."car_export_log"("requested_by_empleado_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "car_formulario_cliente_empresa_ref_id_key" ON "caracterizacion"."car_formulario_cliente"("empresa_ref_id" ASC);

-- CreateIndex
CREATE INDEX "car_formulario_cliente_general_empresa_id_idx" ON "caracterizacion"."car_formulario_cliente"("general_empresa_id" ASC);

-- CreateIndex
CREATE INDEX "car_formulario_cliente_status_idx" ON "caracterizacion"."car_formulario_cliente"("status" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_campo_id_idx" ON "caracterizacion"."car_respuesta"("campo_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "car_respuesta_formulario_id_campo_id_key" ON "caracterizacion"."car_respuesta"("formulario_id" ASC, "campo_id" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_formulario_id_idx" ON "caracterizacion"."car_respuesta"("formulario_id" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_status_idx" ON "caracterizacion"."car_respuesta"("status" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_audit_changed_at_idx" ON "caracterizacion"."car_respuesta_audit"("changed_at" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_audit_changed_by_empleado_id_idx" ON "caracterizacion"."car_respuesta_audit"("changed_by_empleado_id" ASC);

-- CreateIndex
CREATE INDEX "car_respuesta_audit_respuesta_id_idx" ON "caracterizacion"."car_respuesta_audit"("respuesta_id" ASC);

-- CreateIndex
CREATE INDEX "ref_asignacion_empleado_ref_id_idx" ON "core"."ref_asignacion"("empleado_ref_id" ASC);

-- CreateIndex
CREATE INDEX "ref_asignacion_empresa_ref_id_idx" ON "core"."ref_asignacion"("empresa_ref_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ref_asignacion_general_asignacion_id_key" ON "core"."ref_asignacion"("general_asignacion_id" ASC);

-- CreateIndex
CREATE INDEX "ref_asignacion_general_empleado_id_idx" ON "core"."ref_asignacion"("general_empleado_id" ASC);

-- CreateIndex
CREATE INDEX "ref_asignacion_general_empresa_id_idx" ON "core"."ref_asignacion"("general_empresa_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ref_empleado_correo_corporativo_key" ON "core"."ref_empleado"("correo_corporativo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ref_empleado_general_empleado_id_key" ON "core"."ref_empleado"("general_empleado_id" ASC);

-- CreateIndex
CREATE INDEX "ref_empleado_jerarquia_empleado_ref_id_idx" ON "core"."ref_empleado_jerarquia"("empleado_ref_id" ASC);

-- CreateIndex
CREATE INDEX "ref_empleado_jerarquia_general_empleado_id_idx" ON "core"."ref_empleado_jerarquia"("general_empleado_id" ASC);

-- CreateIndex
CREATE INDEX "ref_empleado_jerarquia_general_jefe_id_idx" ON "core"."ref_empleado_jerarquia"("general_jefe_id" ASC);

-- CreateIndex
CREATE INDEX "ref_empleado_jerarquia_jefe_ref_id_idx" ON "core"."ref_empleado_jerarquia"("jefe_ref_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ref_empresa_general_empresa_id_key" ON "core"."ref_empresa"("general_empresa_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ref_empresa_nit_key" ON "core"."ref_empresa"("nit" ASC);

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_export_log" ADD CONSTRAINT "car_export_log_requested_by_empleado_id_fkey" FOREIGN KEY ("requested_by_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_formulario_cliente" ADD CONSTRAINT "car_formulario_cliente_empresa_ref_id_fkey" FOREIGN KEY ("empresa_ref_id") REFERENCES "core"."ref_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_respuesta" ADD CONSTRAINT "car_respuesta_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "caracterizacion"."car_campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_respuesta" ADD CONSTRAINT "car_respuesta_formulario_id_fkey" FOREIGN KEY ("formulario_id") REFERENCES "caracterizacion"."car_formulario_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_respuesta_audit" ADD CONSTRAINT "car_respuesta_audit_changed_by_empleado_id_fkey" FOREIGN KEY ("changed_by_empleado_id") REFERENCES "core"."ref_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracterizacion"."car_respuesta_audit" ADD CONSTRAINT "car_respuesta_audit_respuesta_id_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "caracterizacion"."car_respuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ref_asignacion" ADD CONSTRAINT "ref_asignacion_empleado_ref_id_fkey" FOREIGN KEY ("empleado_ref_id") REFERENCES "core"."ref_empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ref_asignacion" ADD CONSTRAINT "ref_asignacion_empresa_ref_id_fkey" FOREIGN KEY ("empresa_ref_id") REFERENCES "core"."ref_empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ref_empleado_jerarquia" ADD CONSTRAINT "ref_empleado_jerarquia_empleado_ref_id_fkey" FOREIGN KEY ("empleado_ref_id") REFERENCES "core"."ref_empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ref_empleado_jerarquia" ADD CONSTRAINT "ref_empleado_jerarquia_jefe_ref_id_fkey" FOREIGN KEY ("jefe_ref_id") REFERENCES "core"."ref_empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
