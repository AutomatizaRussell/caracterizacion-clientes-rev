-- Permisos mínimos de aplicación.
-- Crea enums y tablas en schema core.
-- No altera tablas existentes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "core"."PermRole" AS ENUM (
  'STAFF',
  'SENIOR',
  'GERENTE',
  'SOCIO',
  'ADMIN'
);

CREATE TYPE "core"."PermAuthorization" AS ENUM (
  'PERMITIDO',
  'NO_PERMITIDO',
  'EXCEPCIONAL',
  'NO_APLICA'
);

CREATE TYPE "core"."PermScope" AS ENUM (
  'ASIGNACION_PROPIA',
  'LINEA_JERARQUICA',
  'ASIGNACION_PROPIA_Y_LINEA_JERARQUICA',
  'TODA_LA_ORGANIZACION',
  'NO_APLICA'
);

CREATE TABLE "core"."perm_module" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(120) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "perm_module_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "perm_module_code_key"
  ON "core"."perm_module" ("code");

CREATE INDEX "perm_module_sort_order_idx"
  ON "core"."perm_module" ("sort_order");

CREATE INDEX "perm_module_is_active_idx"
  ON "core"."perm_module" ("is_active");

CREATE TABLE "core"."perm_action" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "module_id" UUID NOT NULL,
  "code" VARCHAR(180) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "notes" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "perm_action_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "perm_action_module_id_fkey"
    FOREIGN KEY ("module_id")
    REFERENCES "core"."perm_module"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "perm_action_code_key"
  ON "core"."perm_action" ("code");

CREATE INDEX "perm_action_module_id_idx"
  ON "core"."perm_action" ("module_id");

CREATE INDEX "perm_action_sort_order_idx"
  ON "core"."perm_action" ("sort_order");

CREATE INDEX "perm_action_is_active_idx"
  ON "core"."perm_action" ("is_active");

CREATE TABLE "core"."perm_role_rule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "action_id" UUID NOT NULL,
  "role" "core"."PermRole" NOT NULL,
  "authorization" "core"."PermAuthorization" NOT NULL,
  "scope" "core"."PermScope" NOT NULL,
  "notes" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "perm_role_rule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "perm_role_rule_action_id_fkey"
    FOREIGN KEY ("action_id")
    REFERENCES "core"."perm_action"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "perm_role_rule_action_id_role_key"
  ON "core"."perm_role_rule" ("action_id", "role");

CREATE INDEX "perm_role_rule_role_idx"
  ON "core"."perm_role_rule" ("role");

CREATE INDEX "perm_role_rule_authorization_idx"
  ON "core"."perm_role_rule" ("authorization");

CREATE INDEX "perm_role_rule_scope_idx"
  ON "core"."perm_role_rule" ("scope");
