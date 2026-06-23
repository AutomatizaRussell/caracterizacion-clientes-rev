import { prisma } from "@/lib/prisma";
import {
  ROLES,
  type PermissionCell,
  type PermissionModule,
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

export type PermissionMatrixMode = "full" | "decision";

export type SavePermissionMatrixResult = {
  ok: true;
  mode: PermissionMatrixMode;
  savedAt: string;
  updatedRules: number;
};

function assertValidPermissionMatrixMode(
  mode: string,
): asserts mode is PermissionMatrixMode {
  if (mode !== "full" && mode !== "decision") {
    throw new Error(`Modo de matriz de permisos inválido: ${mode}`);
  }
}

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

const dbAuthorizationToUi: Record<PermAuthorization, PermissionValue> = {
  [PermAuthorization.PERMITIDO]: "Permitido",
  [PermAuthorization.NO_PERMITIDO]: "No permitido",
  [PermAuthorization.EXCEPCIONAL]: "Excepcional",
  [PermAuthorization.NO_APLICA]: "No aplica",
};

function normalizeScopeList(scopes: ScopeValue[] | undefined): ScopeValue[] {
  const uniqueScopes = Array.from(new Set(scopes ?? []));

  if (uniqueScopes.includes("Toda la organización")) {
    return ["Toda la organización"];
  }

  return uniqueScopes;
}

function getDecisionActionCodes(): Set<string> {
  return new Set(
    DECISION_PERMISSION_MATRIX.flatMap((module) =>
      module.actions.map((action) => action.id),
    ),
  );
}

/**
 * Convierte el modelo visual de checkboxes a un único enum persistido.
 *
 * Regla:
 * - Toda la organización excluye cualquier otro alcance.
 * - Asignación propia + Línea jerárquica se guarda como un valor combinado.
 * - No permitido / No aplica siempre fuerzan scope = NO_APLICA.
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

function dbScopeToUiScopes(scope: PermScope): ScopeValue[] {
  switch (scope) {
    case PermScope.ASIGNACION_PROPIA:
      return ["Asignación propia"];
    case PermScope.LINEA_JERARQUICA:
      return ["Línea jerárquica"];
    case PermScope.ASIGNACION_PROPIA_Y_LINEA_JERARQUICA:
      return ["Asignación propia", "Línea jerárquica"];
    case PermScope.TODA_LA_ORGANIZACION:
      return ["Toda la organización"];
    case PermScope.NO_APLICA:
      return [];
    default:
      return [];
  }
}

function getCellScopes(cell: PermissionCell): ScopeValue[] {
  if (Array.isArray(cell.scopes)) {
    return normalizeScopeList(cell.scopes);
  }

  if (cell.scope) {
    return normalizeScopeList([cell.scope]);
  }

  return [];
}

function emptyDeniedCell(): PermissionCell {
  return {
    permission: "No permitido",
    scope: null,
    scopes: [],
  };
}

function toDbRuleInput(cell: PermissionCell) {
  const authorization = authorizationToDb[cell.permission];

  if (
    authorization === PermAuthorization.NO_PERMITIDO ||
    authorization === PermAuthorization.NO_APLICA
  ) {
    return {
      authorization,
      scope: PermScope.NO_APLICA,
    };
  }

  const scope = scopesToDb(getCellScopes(cell));

  if (scope === PermScope.NO_APLICA) {
    throw new Error(
      `La autorización "${cell.permission}" requiere al menos un alcance válido.`,
    );
  }

  return {
    authorization,
    scope,
  };
}

function assertDecisionPayloadIsAllowed(matrix: PermissionModule[]) {
  const allowedCodes = getDecisionActionCodes();

  const invalidCodes = matrix.flatMap((module) =>
    module.actions
      .map((action) => action.id)
      .filter((actionCode) => !allowedCodes.has(actionCode)),
  );

  if (invalidCodes.length > 0) {
    throw new Error(
      [
        "La matriz reducida intenta guardar acciones no permitidas:",
        ...invalidCodes.map((code) => `- ${code}`),
      ].join("\n"),
    );
  }
}

/**
 * Lee la matriz persistida desde DB y la devuelve en el mismo shape que usa
 * el editor React.
 *
 * No inventa acciones:
 * - full lee todas las acciones activas.
 * - decision filtra por la whitelist del dataset reducido.
 */
export async function getPermissionMatrixFromDb(
  mode: PermissionMatrixMode,
): Promise<PermissionModule[]> {
  assertValidPermissionMatrixMode(mode);

  const decisionCodes = getDecisionActionCodes();

  const modules = await prisma.permModule.findMany({
    where: {
      isActive: true,
    },
    include: {
      actions: {
        where:
          mode === "decision"
            ? {
                isActive: true,
                code: {
                  in: Array.from(decisionCodes),
                },
              }
            : {
                isActive: true,
              },
        include: {
          rules: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            code: "asc",
          },
        ],
      },
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  return modules
    .filter((permissionModule) => mode === "full" || permissionModule.actions.length > 0)
    .map((permissionModule) => ({
      id: permissionModule.code,
      title: permissionModule.title,
      description: permissionModule.description ?? "",
      actions: permissionModule.actions.map((action) => {
        const rulesByRole = new Map(
          action.rules.map((rule) => [rule.role, rule]),
        );

        const cells = ROLES.reduce(
          (accumulator, role) => {
            const dbRole = roleToDb[role];
            const rule = rulesByRole.get(dbRole);

            if (!rule) {
              accumulator[role] = emptyDeniedCell();
              return accumulator;
            }

            const permission = dbAuthorizationToUi[rule.authorization];

            accumulator[role] = {
              permission,
              scope: null,
              scopes: dbScopeToUiScopes(rule.scope),
            };

            return accumulator;
          },
          {} as Record<PermissionRole, PermissionCell>,
        );

        return {
          id: action.code,
          action: action.name,
          description: action.description ?? "",
          notes: action.notes ?? undefined,
          cells,
        };
      }),
    }));
}

/**
 * Guarda únicamente reglas por rol.
 *
 * No crea módulos ni acciones desde la UI. Eso evita que payloads de cliente
 * contaminen el catálogo estructural de permisos.
 *
 * Para crear/sincronizar módulos y acciones se usa el script:
 * scripts/sync-permission-matrix.ts
 */
export async function savePermissionMatrixRules(params: {
  mode: PermissionMatrixMode;
  matrix: PermissionModule[];
}): Promise<SavePermissionMatrixResult> {
  const { mode, matrix } = params;

  assertValidPermissionMatrixMode(mode);

  if (mode === "decision") {
    assertDecisionPayloadIsAllowed(matrix);
  }

  const actionCodes = Array.from(
    new Set(
      matrix.flatMap((module) => module.actions.map((action) => action.id)),
    ),
  );

  const persistedActions = await prisma.permAction.findMany({
    where: {
      code: {
        in: actionCodes,
      },
      isActive: true,
    },
    select: {
      id: true,
      code: true,
    },
  });

  const actionIdByCode = new Map(
    persistedActions.map((action) => [action.code, action.id]),
  );

  const missingCodes = actionCodes.filter((code) => !actionIdByCode.has(code));

  if (missingCodes.length > 0) {
    throw new Error(
      [
        "No existen acciones persistidas para algunos códigos:",
        ...missingCodes.map((code) => `- ${code}`),
      ].join("\n"),
    );
  }

  let updatedRules = 0;

  await prisma.$transaction(async (tx) => {
    for (const permissionModule of matrix) {
      for (const action of permissionModule.actions) {
        const actionId = actionIdByCode.get(action.id);

        if (!actionId) {
          throw new Error(`Acción no encontrada: ${action.id}`);
        }

        for (const role of ROLES) {
          const cell = action.cells[role];

          if (!cell) {
            throw new Error(`Celda faltante para ${action.id} / ${role}`);
          }

          const { authorization, scope } = toDbRuleInput(cell);

          await tx.permRoleRule.upsert({
            where: {
              actionId_role: {
                actionId,
                role: roleToDb[role],
              },
            },
            create: {
              actionId,
              role: roleToDb[role],
              authorization,
              scope,
            },
            update: {
              authorization,
              scope,
            },
          });

          updatedRules += 1;
        }
      }
    }
  });

  return {
    ok: true,
    mode,
    savedAt: new Date().toISOString(),
    updatedRules,
  };
}
