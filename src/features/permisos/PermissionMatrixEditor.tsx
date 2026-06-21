"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import {
  PERMISSION_OPTIONS,
  ROLES,
  SCOPE_OPTIONS,
  type PermissionCell,
  type PermissionModule,
  type PermissionRole,
  type PermissionValue,
  type ScopeValue,
} from "./permission-matrix.data";

type LegacyPermissionValue = PermissionValue | "Solo consulta";

type PermissionMatrixEditorProps = {
  storageKey: string;
  exportFileName: string;
  eyebrow: string;
  title: string;
  description: string;
  warning: string;
  defaultMatrix: PermissionModule[];
  children?: ReactNode;
};

function cloneMatrix(matrix: PermissionModule[]): PermissionModule[] {
  return structuredClone(matrix);
}

function isValidPermission(value: unknown): value is PermissionValue {
  return PERMISSION_OPTIONS.some((option) => option === value);
}

/**
 * Compatibilidad con matrices viejas guardadas en localStorage.
 *
 * Decisión:
 * - "Solo consulta" fue eliminado del modelo actual.
 * - Si una acción es de consulta, la acción se llama "Ver X" y su autorización
 *   correcta es "Permitido".
 */
function normalizeLegacyPermission(value: unknown): PermissionValue {
  if (isValidPermission(value)) {
    return value;
  }

  if ((value as LegacyPermissionValue) === "Solo consulta") {
    return "Permitido";
  }

  return "No permitido";
}

function permissionNeedsScope(permission: PermissionValue) {
  return permission === "Permitido" || permission === "Excepcional";
}

function isValidScope(value: unknown): value is ScopeValue {
  return SCOPE_OPTIONS.some((option) => option === value);
}

function normalizeScopeList(scopes: ScopeValue[]): ScopeValue[] {
  const uniqueScopes = Array.from(new Set(scopes));

  if (uniqueScopes.includes("Toda la organización")) {
    return ["Toda la organización"];
  }

  return uniqueScopes;
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

function getScopesFromLegacyCell(
  cell: PermissionCell | undefined,
  role: PermissionRole,
  permission: PermissionValue,
): ScopeValue[] {
  if (!permissionNeedsScope(permission)) {
    return [];
  }

  if (Array.isArray(cell?.scopes)) {
    const validScopes = cell.scopes.filter(isValidScope);
    return normalizeScopeList(validScopes);
  }

  if (isValidScope(cell?.scope)) {
    if (cell.scope === "Toda la organización") {
      return ["Toda la organización"];
    }

    if (cell.scope === "Línea jerárquica") {
      return getDefaultScopesForRole(role);
    }

    return [cell.scope];
  }

  return getDefaultScopesForRole(role);
}

function getCellScopes(cell: PermissionCell, role: PermissionRole): ScopeValue[] {
  return getScopesFromLegacyCell(cell, role, cell.permission);
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

function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Normaliza matrices viejas guardadas en localStorage contra la matriz base
 * actual. Esto evita que una versión vieja o incompleta oculte acciones nuevas.
 */
function normalizeMatrix(
  rawMatrix: PermissionModule[],
  defaultMatrix: PermissionModule[],
): PermissionModule[] {
  return defaultMatrix.map((defaultModule) => {
    const rawModule = rawMatrix.find((module) => module.id === defaultModule.id);

    return {
      ...defaultModule,
      actions: defaultModule.actions.map((defaultAction) => {
        const rawAction = rawModule?.actions.find(
          (action) => action.id === defaultAction.id,
        );

        return {
          ...defaultAction,
          cells: ROLES.reduce(
            (accumulator, role) => {
              const rawCell = rawAction?.cells?.[role];
              const fallbackCell = defaultAction.cells[role];

              const permission = normalizeLegacyPermission(
                rawCell?.permission ?? fallbackCell.permission,
              );

              accumulator[role] = {
                permission,
                scope: null,
                scopes: getScopesFromLegacyCell(
                  rawCell ?? fallbackCell,
                  role,
                  permission,
                ),
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
  const currentScopes = getCellScopes(cell, role);
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
        Autorización
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
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-white/80 transition hover:bg-white"
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

export function PermissionMatrixEditor({
  storageKey,
  exportFileName,
  eyebrow,
  title,
  description,
  warning,
  defaultMatrix,
  children,
}: PermissionMatrixEditorProps) {
  const [matrix, setMatrix] = useState<PermissionModule[]>(() =>
    normalizeMatrix(cloneMatrix(defaultMatrix), defaultMatrix),
  );

  const [activeModuleId, setActiveModuleId] = useState(
    defaultMatrix[0]?.id ?? "",
  );

  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      setIsLoadedFromStorage(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as PermissionModule[];

      if (Array.isArray(parsedValue)) {
        setMatrix(normalizeMatrix(parsedValue, defaultMatrix));
      }
    } catch {
      /**
       * Si el JSON local está dañado, se ignora y se usa la matriz base.
       */
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, [defaultMatrix, storageKey]);

  useEffect(() => {
    if (!isLoadedFromStorage) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(matrix));
    setLastSavedAt(new Date());
  }, [isLoadedFromStorage, matrix, storageKey]);

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
                    ? getCellScopes(currentCell, params.role).length > 0
                      ? getCellScopes(currentCell, params.role)
                      : getDefaultScopesForRole(params.role)
                    : [],
                },
              },
            };
          }),
        };
      }),
    );
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
            const currentScopes = getCellScopes(currentCell, params.role);

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
  }

  async function copyMatrixToClipboard() {
    const json = JSON.stringify(matrix, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("JSON copiado al portapapeles.");
    } catch {
      setCopyStatus("No se pudo copiar. Usa Exportar JSON.");
    }

    window.setTimeout(() => {
      setCopyStatus(null);
    }, 2500);
  }

  function resetMatrix() {
    const confirmed = window.confirm(
      "Esto restaurará la matriz base y borrará los cambios guardados localmente. ¿Continuar?",
    );

    if (!confirmed) {
      return;
    }

    const defaultValue = normalizeMatrix(cloneMatrix(defaultMatrix), defaultMatrix);

    setMatrix(defaultValue);
    window.localStorage.setItem(storageKey, JSON.stringify(defaultValue));
  }

  if (!activeModule) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {eyebrow}
            </p>

            <h1
              className="mt-1 text-2xl font-extrabold"
              style={{ color: BRAND.navy }}
            >
              {title}
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadJson(exportFileName, matrix)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              Exportar JSON
            </button>

            <button
              type="button"
              onClick={() => void copyMatrixToClipboard()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              Copiar JSON
            </button>

            <button
              type="button"
              onClick={resetMatrix}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-700 transition hover:bg-red-100"
            >
              Restaurar base
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-bold">Advertencia:</span> {warning}
        </div>

        <div className="mt-3 flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {lastSavedAt
              ? `Guardado local: ${lastSavedAt.toLocaleTimeString()}`
              : "Sin cambios guardados todavía."}
          </p>

          {copyStatus && (
            <p className="normal-case tracking-normal text-[#001871]">
              {copyStatus}
            </p>
          )}
        </div>
      </header>

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
          <div className="max-h-[calc(100vh-300px)] overflow-auto">
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

                      {action.notes && (
                        <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-[11px] leading-4 text-slate-600">
                          {action.notes}
                        </p>
                      )}
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

                {action.notes && (
                  <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
                    {action.notes}
                  </p>
                )}
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

      {children}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-[#001871]">
          Leyenda operativa
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">Permitido</h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Puede ejecutar la acción normalmente dentro del alcance
              autorizado.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">Excepcional</h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Permitido por contingencia, reemplazo o soporte, pero no como
              responsabilidad normal.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Asignación propia
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Elementos asignados directamente al usuario.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Línea jerárquica
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Elementos propios y de personas bajo su cadena. Para Socio
              equivale a su rama.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Toda la organización
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Alcance global. Recomendado solo para Admin.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
