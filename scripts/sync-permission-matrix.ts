import "dotenv/config";

import {
  DEFAULT_PERMISSION_MATRIX,
  ROLES,
  type PermissionRole,
  type PermissionValue,
  type ScopeValue,
} from "@/features/permisos/permission-matrix.data";
import { DECISION_PERMISSION_MATRIX } from "@/features/permisos-solicitudes/permission-decision-matrix.data";
import {
  PermAuthorization,
  PermRole,
  PermScope,
} from "@/generated/prisma/enums";

type PrismaClientLike = Awaited<
  ReturnType<typeof import("@/lib/prisma")["prisma"]["$extends"]>
>;

/**
 * Mapea los nombres visibles de la UI a los enums persistidos.
 *
 * Decisión:
 * - La UI usa etiquetas humanas en español.
 * - PostgreSQL/Prisma usa enums técnicos estables.
 */
const roleToDb: Record<PermissionRole, PermRole> = {
  Staff: PermRole.STAFF,
  Senior: PermRole.SENIOR,
  Gerente: PermRole.GERENTE,
  Socio: PermRole.SOCIO,
  Admin: PermRole.ADMIN,
};

const authorizationToDb: Record<PermissionValue, PermAuthorization> = {
  Permitido: PermAuthorization.PERMITIDO,
  "No permitido": PermAuthorization.NO_PERMITIDO,
  Excepcional: PermAuthorization.EXCEPCIONAL,
  "No aplica": PermAuthorization.NO_APLICA,
};

function normalizeScopeList(scopes: ScopeValue[] | undefined): ScopeValue[] {
  const uniqueScopes = Array.from(new Set(scopes ?? []));

  if (uniqueScopes.includes("Toda la organización")) {
    return ["Toda la organización"];
  }

  return uniqueScopes;
}

/**
 * Convierte el modelo visual de checkboxes a un único alcance persistido.
 *
 * La base de datos guarda la decisión final como enum único para evitar
 * combinaciones inválidas:
 * - Toda la organización + Línea jerárquica
 * - No aplica + Asignación propia
 * - arrays vacíos con autorización Permitido
 */
function scopesToDb(scopes: ScopeValue[] | undefined): PermScope {
  const normalizedScopes = normalizeScopeList(scopes);

  if (normalizedScopes.length === 0) {
    return PermScope.NO_APLICA;
  }

  if (normalizedScopes.includes("Toda la organización")) {
    return PermScope.TODA_LA_ORGANIZACION;
  }

  const hasOwn = normalizedScopes.includes("Asignación propia");
  const hasLine = normalizedScopes.includes("Línea jerárquica");

  if (hasOwn && hasLine) {
    return PermScope.ASIGNACION_PROPIA_Y_LINEA_JERARQUICA;
  }

  if (hasOwn) {
    return PermScope.ASIGNACION_PROPIA;
  }

  if (hasLine) {
    return PermScope.LINEA_JERARQUICA;
  }

  return PermScope.NO_APLICA;
}

/**
 * Soporta tanto la forma vieja `scope` como la forma actual `scopes`.
 */
function getCellScopesFromCurrentShape(cell: {
  scope?: ScopeValue | null;
  scopes?: ScopeValue[];
}): ScopeValue[] {
  if (Array.isArray(cell.scopes)) {
    return normalizeScopeList(cell.scopes);
  }

  if (cell.scope) {
    return normalizeScopeList([cell.scope]);
  }

  return [];
}

function assertNoDuplicateCodes() {
  const moduleCodes = new Set<string>();
  const actionCodes = new Set<string>();

  for (const module of DEFAULT_PERMISSION_MATRIX) {
    if (moduleCodes.has(module.id)) {
      throw new Error(`Módulo duplicado en matriz completa: ${module.id}`);
    }

    moduleCodes.add(module.id);

    for (const action of module.actions) {
      if (actionCodes.has(action.id)) {
        throw new Error(`Acción duplicada en matriz completa: ${action.id}`);
      }

      actionCodes.add(action.id);
    }
  }

  const missingDecisionActions: string[] = [];

  for (const decisionModule of DECISION_PERMISSION_MATRIX) {
    for (const decisionAction of decisionModule.actions) {
      if (!actionCodes.has(decisionAction.id)) {
        missingDecisionActions.push(decisionAction.id);
      }
    }
  }

  if (missingDecisionActions.length > 0) {
    throw new Error(
      [
        "La matriz reducida contiene acciones que no existen en la matriz completa:",
        ...missingDecisionActions.map((code) => `- ${code}`),
      ].join("\n"),
    );
  }
}

function countDefaultRows() {
  const moduleCount = DEFAULT_PERMISSION_MATRIX.length;
  const actionCount = DEFAULT_PERMISSION_MATRIX.reduce(
    (total, module) => total + module.actions.length,
    0,
  );
  const ruleCount = actionCount * ROLES.length;

  const decisionActionCount = DECISION_PERMISSION_MATRIX.reduce(
    (total, module) => total + module.actions.length,
    0,
  );

  return {
    moduleCount,
    actionCount,
    ruleCount,
    decisionActionCount,
  };
}

async function syncPermissionMatrix() {
  assertNoDuplicateCodes();

  const counts = countDefaultRows();
  const shouldApply = process.argv.includes("--apply");

  console.log("== Sync matriz de permisos ==");
  console.log(`Módulos matriz completa: ${counts.moduleCount}`);
  console.log(`Acciones matriz completa: ${counts.actionCount}`);
  console.log(`Reglas esperadas: ${counts.ruleCount}`);
  console.log(`Acciones matriz reducida validadas: ${counts.decisionActionCount}`);
  console.log();

  if (!shouldApply) {
    console.log("Modo dry-run. No se escribirá en base de datos.");
    console.log("Ejecuta con --apply para sincronizar.");
    return;
  }

  /**
   * Prisma se importa solo en modo escritura.
   *
   * Motivo:
   * - El dry-run no debe requerir DATABASE_URL.
   * - `src/lib/prisma.ts` valida DATABASE_URL al cargarse.
   */
  const { prisma } = await import("@/lib/prisma");

  await prisma.$transaction(async (tx) => {
    for (const [moduleIndex, module] of DEFAULT_PERMISSION_MATRIX.entries()) {
      const persistedModule = await tx.permModule.upsert({
        where: {
          code: module.id,
        },
        create: {
          code: module.id,
          title: module.title,
          description: module.description,
          sortOrder: moduleIndex,
          isActive: true,
        },
        update: {
          title: module.title,
          description: module.description,
          sortOrder: moduleIndex,
          isActive: true,
        },
      });

      for (const [actionIndex, action] of module.actions.entries()) {
        const persistedAction = await tx.permAction.upsert({
          where: {
            code: action.id,
          },
          create: {
            moduleId: persistedModule.id,
            code: action.id,
            name: action.action,
            description: action.description,
            notes: action.notes ?? null,
            sortOrder: actionIndex,
            isActive: true,
          },
          update: {
            moduleId: persistedModule.id,
            name: action.action,
            description: action.description,
            notes: action.notes ?? null,
            sortOrder: actionIndex,
            isActive: true,
          },
        });

        for (const role of ROLES) {
          const cell = action.cells[role];
          const authorization = authorizationToDb[cell.permission];

          const scope =
            authorization === PermAuthorization.NO_PERMITIDO ||
            authorization === PermAuthorization.NO_APLICA
              ? PermScope.NO_APLICA
              : scopesToDb(getCellScopesFromCurrentShape(cell));

          await tx.permRoleRule.upsert({
            where: {
              actionId_role: {
                actionId: persistedAction.id,
                role: roleToDb[role],
              },
            },
            create: {
              actionId: persistedAction.id,
              role: roleToDb[role],
              authorization,
              scope,
            },
            update: {
              authorization,
              scope,
            },
          });
        }
      }
    }
  });

  const [modules, actions, rules] = await Promise.all([
    prisma.permModule.count(),
    prisma.permAction.count(),
    prisma.permRoleRule.count(),
  ]);

  console.log("Sincronización completada.");
  console.log(`Módulos en DB: ${modules}`);
  console.log(`Acciones en DB: ${actions}`);
  console.log(`Reglas en DB: ${rules}`);

  await prisma.$disconnect();
}

syncPermissionMatrix().catch((error) => {
  console.error("ERROR sincronizando matriz de permisos:");
  console.error(error);
  process.exitCode = 1;
});
