"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDecisionPermissionMatrixPublicAction,
  saveDecisionPermissionMatrixPublicAction,
} from "@/app/permisos/definicion-solicitudes/actions";
import {
  DECISION_PERMISSION_MATRIX,
} from "./permission-decision-matrix.data";
import {
  PERMISSION_OPTIONS,
  ROLES,
  SCOPE_OPTIONS,
  type PermissionCell,
  type PermissionModule,
  type PermissionRole,
  type PermissionValue,
  type ScopeValue,
} from "@/features/permisos/permission-matrix.data";

function cloneMatrix(matrix: PermissionModule[]): PermissionModule[] {
  return structuredClone(matrix);
}

function permissionNeedsScope(permission: PermissionValue) {
  return permission === "Permitido" || permission === "Excepcional";
}

function normalizeScopeList(scopes: ScopeValue[]): ScopeValue[] {
  const uniqueScopes = Array.from(new Set(scopes));

  if (uniqueScopes.includes("Toda la organización")) {
    return ["Toda la organización"];
  }

  return uniqueScopes;
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

function getDefaultScopesForRole(role: PermissionRole): ScopeValue[] {
  if (role === "Staff") {
    return ["Asignación propia"];
  }

  if (role === "Admin") {
    return ["Toda la organización"];
  }

  if (role === "Socio") {
    return ["Línea jerárquica"];
  }

  return ["Asignación propia", "Línea jerárquica"];
}

function getPermissionContainerClass(permission: PermissionValue) {
  switch (permission) {
    case "Permitido":
      return "border-emerald-200 bg-emerald-50";
    case "No permitido":
      return "border-red-200 bg-red-50";
    case "Excepcional":
      return "border-orange-200 bg-orange-50";
    case "No aplica":
      return "border-slate-200 bg-slate-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

function getPermissionTextClass(permission: PermissionValue) {
  switch (permission) {
    case "Permitido":
      return "text-emerald-800";
    case "No permitido":
      return "text-red-800";
    case "Excepcional":
      return "text-orange-800";
    case "No aplica":
      return "text-slate-500";
    default:
      return "text-slate-700";
  }
}

function normalizeMatrix(
  rawMatrix: PermissionModule[],
  defaultMatrix: PermissionModule[],
): PermissionModule[] {
  return defaultMatrix.map((defaultModule) => {
    const rawModule = rawMatrix.find((module) => module.id === defaultModule.id);

    return {
      ...defaultModule,
      ...rawModule,
      id: defaultModule.id,
      title: rawModule?.title ?? defaultModule.title,
      description: rawModule?.description ?? defaultModule.description,
      actions: defaultModule.actions.map((defaultAction) => {
        const rawAction = rawModule?.actions.find(
          (action) => action.id === defaultAction.id,
        );

        return {
          ...defaultAction,
          ...rawAction,
          id: defaultAction.id,
          action: rawAction?.action ?? defaultAction.action,
          description: rawAction?.description ?? defaultAction.description,
          notes: rawAction?.notes ?? defaultAction.notes,
          cells: ROLES.reduce(
            (accumulator, role) => {
              const rawCell = rawAction?.cells?.[role];
              const fallbackCell = defaultAction.cells[role];

              accumulator[role] = {
                permission: rawCell?.permission ?? fallbackCell.permission,
                scope: null,
                scopes:
                  rawCell?.scopes ??
                  (fallbackCell.scope ? [fallbackCell.scope] : []),
              };

              return accumulator;
            },
            {} as Record<PermissionRole, PermissionCell>,
          ),
        };
      }),
    };
  });
}

type CellEditorProps = {
  role: PermissionRole;
  cell: PermissionCell;
  onChangePermission: (value: PermissionValue) => void;
  onToggleScope: (value: ScopeValue) => void;
};

function CellEditor({
  role,
  cell,
  onChangePermission,
  onToggleScope,
}: CellEditorProps) {
  const currentScopes = getCellScopes(cell);
  const shouldShowScopes = permissionNeedsScope(cell.permission);

  return (
    <div
      className={[
        "rounded-xl border p-2 shadow-sm",
        getPermissionContainerClass(cell.permission),
      ].join(" ")}
    >
      <label
        className={[
          "block text-[10px] font-extrabold uppercase tracking-wide",
          getPermissionTextClass(cell.permission),
        ].join(" ")}
      >
        Permiso
      </label>

      <select
        value={cell.permission}
        onChange={(event) =>
          onChangePermission(event.target.value as PermissionValue)
        }
        className="mt-1 h-8 w-full rounded-lg border border-white/80 bg-white px-2 text-[11px] font-bold text-slate-800 outline-none transition focus:border-[#00bfb3] focus:ring-2 focus:ring-[#00bfb3]/20"
      >
        {PERMISSION_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {shouldShowScopes && (
        <div className="mt-3">
          <p
            className={[
              "mb-2 text-[10px] font-extrabold uppercase tracking-wide",
              getPermissionTextClass(cell.permission),
            ].join(" ")}
          >
            Alcance
          </p>

          <div className="space-y-1.5">
            {SCOPE_OPTIONS.map((scope) => {
              const checked = currentScopes.includes(scope);

              return (
                <label
                  key={scope}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/75 px-2 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-white/80 transition hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleScope(scope)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#2d007f] focus:ring-[#00bfb3]"
                  />

                  <span>{scope}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PermissionDecisionMatrix() {
  const [matrix, setMatrix] = useState<PermissionModule[]>(() =>
    normalizeMatrix(cloneMatrix(DECISION_PERMISSION_MATRIX), DECISION_PERMISSION_MATRIX),
  );
  const [activeModuleId, setActiveModuleId] = useState(
    DECISION_PERMISSION_MATRIX[0]?.id ?? "",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMatrix() {
      try {
        const dbMatrix = await getDecisionPermissionMatrixPublicAction();

        if (!isMounted) {
          return;
        }

        const normalized = normalizeMatrix(dbMatrix, DECISION_PERMISSION_MATRIX);
        setMatrix(normalized);
        setActiveModuleId(normalized[0]?.id ?? "");
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setStatus(
            "No fue posible cargar la información guardada. Se muestra la matriz base.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    void loadMatrix();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeModule = useMemo(() => {
    return matrix.find((module) => module.id === activeModuleId) ?? matrix[0];
  }, [activeModuleId, matrix]);

  function updateCellPermission(params: {
    moduleId: string;
    actionId: string;
    role: PermissionRole;
    permission: PermissionValue;
  }) {
    setMatrix((currentMatrix) =>
      currentMatrix.map((module) => {
        if (module.id !== params.moduleId) {
          return module;
        }

        return {
          ...module,
          actions: module.actions.map((action) => {
            if (action.id !== params.actionId) {
              return action;
            }

            const currentCell = action.cells[params.role];
            const needsScope = permissionNeedsScope(params.permission);

            return {
              ...action,
              cells: {
                ...action.cells,
                [params.role]: {
                  permission: params.permission,
                  scope: null,
                  scopes: needsScope
                    ? getCellScopes(currentCell).length > 0
                      ? getCellScopes(currentCell)
                      : getDefaultScopesForRole(params.role)
                    : [],
                },
              },
            };
          }),
        };
      }),
    );

    setHasUnsavedChanges(true);
    setStatus(null);
  }

  function toggleCellScope(params: {
    moduleId: string;
    actionId: string;
    role: PermissionRole;
    scope: ScopeValue;
  }) {
    setMatrix((currentMatrix) =>
      currentMatrix.map((module) => {
        if (module.id !== params.moduleId) {
          return module;
        }

        return {
          ...module,
          actions: module.actions.map((action) => {
            if (action.id !== params.actionId) {
              return action;
            }

            const currentCell = action.cells[params.role];
            const currentScopes = getCellScopes(currentCell);

            let nextScopes: ScopeValue[];

            if (params.scope === "Toda la organización") {
              nextScopes = currentScopes.includes("Toda la organización")
                ? []
                : ["Toda la organización"];
            } else {
              const withoutGlobal = currentScopes.filter(
                (scope) => scope !== "Toda la organización",
              );

              nextScopes = withoutGlobal.includes(params.scope)
                ? withoutGlobal.filter((scope) => scope !== params.scope)
                : [...withoutGlobal, params.scope];
            }

            return {
              ...action,
              cells: {
                ...action.cells,
                [params.role]: {
                  ...currentCell,
                  scope: null,
                  scopes: normalizeScopeList(nextScopes),
                },
              },
            };
          }),
        };
      }),
    );

    setHasUnsavedChanges(true);
    setStatus(null);
  }

  async function saveMatrix() {
    setIsSaving(true);
    setStatus(null);

    try {
      const result = await saveDecisionPermissionMatrixPublicAction(matrix);

      setHasUnsavedChanges(false);
      setStatus(`Guardado correctamente. Registros actualizados: ${result.updatedRules}.`);
    } catch (error) {
      console.error(error);
      setStatus("No fue posible guardar. Intente nuevamente o contacte al responsable de la plataforma.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!activeModule) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Definición de permisos
              </p>

              <h1 className="mt-1 text-2xl font-extrabold text-[#001871]">
                Solicitudes de información
              </h1>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Seleccione qué puede hacer cada rol y hasta dónde aplica ese permiso.
                La matriz contiene únicamente las acciones que requieren definición.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveMatrix()}
                disabled={isSaving || !isLoaded || !hasUnsavedChanges}
                className="rounded-xl bg-[#2d007f] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#001871] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar respuestas"}
              </button>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">
              Hay cambios sin guardar.
            </div>
          )}

          {status && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {status}
            </div>
          )}
        </header>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-bold text-[#001871]">
              Valores de permiso
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">Permitido</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  El rol puede ejecutar la acción dentro del alcance seleccionado.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">No permitido</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  El rol no puede ejecutar la acción.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">Excepcional</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  El rol solo puede ejecutar la acción en casos puntuales o autorizados.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">No aplica</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  La acción no corresponde al rol.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-bold text-[#001871]">
              Valores de alcance
            </h2>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">
                  Asignación propia
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Aplica únicamente a clientes, solicitudes o elementos asignados directamente al usuario.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">
                  Línea jerárquica
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Aplica a clientes, solicitudes o elementos bajo la responsabilidad del rol en su línea o rama asignada. No incluye asignación propia salvo que también se marque “Asignación propia”.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">
                  Toda la organización
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Aplica a todos los clientes y solicitudes de la organización. Normalmente corresponde a administración.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {matrix.map((module) => {
              const isActive = module.id === activeModule.id;

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModuleId(module.id)}
                  className={[
                    "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                    isActive
                      ? "bg-[#2d007f] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-[#001871]",
                  ].join(" ")}
                >
                  {module.title}
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-[#001871]">
              {activeModule.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {activeModule.description}
            </p>
          </div>

          <div className="hidden xl:block">
            <div className="max-h-[calc(100vh-330px)] overflow-auto">
              <table className="min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="sticky left-0 z-40 w-80 border-b border-slate-200 bg-slate-50 px-4 py-3">
                      Acción
                    </th>

                    {ROLES.map((role) => (
                      <th
                        key={role}
                        className="w-48 border-b border-slate-200 px-3 py-3 text-center"
                      >
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {activeModule.actions.map((action, rowIndex) => (
                    <tr
                      key={action.id}
                      className={
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }
                    >
                      <td className="sticky left-0 z-20 border-b border-slate-100 bg-inherit px-4 py-4 align-top">
                        <p className="text-xs font-extrabold text-slate-900">
                          {action.action}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {action.description}
                        </p>
                      </td>

                      {ROLES.map((role) => (
                        <td
                          key={`${action.id}-${role}`}
                          className="border-b border-slate-100 px-2 py-3 align-top"
                        >
                          <CellEditor
                            role={role}
                            cell={action.cells[role]}
                            onChangePermission={(permission) =>
                              updateCellPermission({
                                moduleId: activeModule.id,
                                actionId: action.id,
                                role,
                                permission,
                              })
                            }
                            onToggleScope={(scope) =>
                              toggleCellScope({
                                moduleId: activeModule.id,
                                actionId: action.id,
                                role,
                                scope,
                              })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 p-4 xl:hidden">
            {activeModule.actions.map((action) => (
              <article
                key={action.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-[#001871]">
                    {action.action}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {action.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ROLES.map((role) => (
                    <div key={`${action.id}-${role}`} className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {role}
                      </p>

                      <CellEditor
                        role={role}
                        cell={action.cells[role]}
                        onChangePermission={(permission) =>
                          updateCellPermission({
                            moduleId: activeModule.id,
                            actionId: action.id,
                            role,
                            permission,
                          })
                        }
                        onToggleScope={(scope) =>
                          toggleCellScope({
                            moduleId: activeModule.id,
                            actionId: action.id,
                            role,
                            scope,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
