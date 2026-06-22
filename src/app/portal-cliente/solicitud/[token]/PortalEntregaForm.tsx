"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PortalItem = {
  id: string;
  orderIndex: number;
  status: string;
  itemMode: string;
  text: string;
  children: string[];
};

type PortalCategory = {
  id: string;
  title: string;
  items: PortalItem[];
};

type PortalEntregaFormProps = {
  categories: PortalCategory[];
  action: (formData: FormData) => void;
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    SUBMITTED: "Recibido",
    CREATED: "Creado",
    SENT: "Enviado",
    CLIENT_SUBMITTED: "Recibido",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    FAILED: "Fallido",
  };

  return labels[status] ?? status;
}

function getStatusClassName(status: string) {
  if (status === "SUBMITTED" || status === "CLIENT_SUBMITTED") {
    return "bg-[#00bfb3]/10 text-[#008b83] ring-[#00bfb3]/20";
  }

  if (status === "CANCELLED" || status === "FAILED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function getFileKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalEntregaForm({
  categories,
  action,
}: PortalEntregaFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);

  const totalItems = useMemo(() => {
    return categories.reduce(
      (total, category) => total + category.items.length,
      0,
    );
  }, [categories]);

  const selectedFileBytes = useMemo(() => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  }, [selectedFiles]);

  const canCheckItems = selectedFiles.length > 0;
  const canSubmit = selectedFiles.length > 0 && checkedItemIds.size > 0;

  const syncFilesToInput = useCallback((files: File[]) => {
    if (!inputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();

    for (const file of files) {
      dataTransfer.items.add(file);
    }

    inputRef.current.files = dataTransfer.files;
  }, []);

  const setFilesAndSync = useCallback(
    (files: File[]) => {
      setSelectedFiles(files);
      syncFilesToInput(files);

      if (files.length === 0) {
        setCheckedItemIds(new Set());
      }
    },
    [syncFilesToInput],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setSelectedFiles((currentFiles) => {
        const nextFilesByKey = new Map<string, File>();

        for (const file of currentFiles) {
          nextFilesByKey.set(getFileKey(file), file);
        }

        for (const file of files) {
          if (file.size > 0) {
            nextFilesByKey.set(getFileKey(file), file);
          }
        }

        const nextFiles = Array.from(nextFilesByKey.values());
        syncFilesToInput(nextFiles);

        return nextFiles;
      });
    },
    [syncFilesToInput],
  );

  function removeFile(fileToRemove: File) {
    const nextFiles = selectedFiles.filter(
      (file) => getFileKey(file) !== getFileKey(fileToRemove),
    );

    setFilesAndSync(nextFiles);
  }

  function clearFiles() {
    setFilesAndSync([]);
  }

  useEffect(() => {
    function eventHasFiles(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function handleWindowDragEnter(event: DragEvent) {
      if (!eventHasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingOverPage(true);
    }

    function handleWindowDragOver(event: DragEvent) {
      if (!eventHasFiles(event)) {
        return;
      }

      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }

      setIsDraggingOverPage(true);
    }

    function handleWindowDragLeave(event: DragEvent) {
      if (!eventHasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

      if (dragDepthRef.current === 0) {
        setIsDraggingOverPage(false);
      }
    }

    function handleWindowDrop(event: DragEvent) {
      if (!eventHasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingOverPage(false);
      addFiles(Array.from(event.dataTransfer?.files ?? []));
    }

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [addFiles]);

  return (
    <form action={action} className="mt-5 flex min-h-0 flex-1 flex-col">
      {isDraggingOverPage && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#001871]/25 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border-2 border-dashed border-white bg-[#001871]/95 px-8 py-12 text-center text-white shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/70">
              Adjuntar archivos
            </p>
            <p className="mt-3 text-3xl font-extrabold">
              Suelte aquí para agregar los archivos a la entrega
            </p>
            <p className="mt-3 text-sm text-white/80">
              Los archivos se adjuntarán a la lista actual. Luego marque los
              ítems cubiertos y finalice la entrega.
            </p>
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(460px,0.9fr)_minmax(620px,1.1fr)]">
        <section
          className={`flex min-h-[420px] flex-col rounded-3xl border-2 border-dashed p-6 transition ${
            selectedFiles.length > 0
              ? "border-[#00bfb3] bg-[#00bfb3]/5"
              : "border-slate-300 bg-slate-50"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(Array.from(event.dataTransfer.files ?? []));
          }}
        >
          <input
            ref={inputRef}
            type="file"
            name="attachments"
            multiple
            className="sr-only"
            onChange={(event) => {
              setFilesAndSync(Array.from(event.currentTarget.files ?? []));
            }}
          />

          <div className="flex flex-1 flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Adjuntos de la entrega
            </p>

            <h3 className="mt-3 text-2xl font-extrabold leading-tight text-[#001871] md:text-3xl">
              Arrastre archivos aquí o suéltelos en cualquier parte
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Los archivos no se cargarán hasta que finalice la entrega. Todos
              se guardarán en Información suministrada.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-xl bg-[#001871] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                onClick={() => inputRef.current?.click()}
              >
                Seleccionar archivos
              </button>

              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  onClick={clearFiles}
                >
                  Limpiar selección
                </button>
              )}
            </div>
          </div>

          {selectedFiles.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-700 ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-slate-800">
                  {selectedFiles.length} archivo(s)
                </p>
                <p className="text-xs font-bold text-slate-500">
                  Peso total: {formatBytes(selectedFileBytes)}
                </p>
              </div>

              <ul className="mt-3 max-h-48 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-100">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-700">
                      {file.name}
                    </span>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-slate-400">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        className="font-bold text-red-600 hover:underline"
                        onClick={() => removeFile(file)}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#001871]">
                  Checks rápidos
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Marque los ítems cubiertos por los archivos.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                  {checkedItemIds.size}/{totalItems} marcados
                </span>

                {!canCheckItems && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                    Adjunte archivos primero
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {categories.map((category) => (
                <section
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="sticky top-0 z-10 rounded-t-2xl border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#001871]">
                      {category.title}
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {category.items.map((item) => {
                      const checked = checkedItemIds.has(item.id);

                      return (
                        <label
                          key={item.id}
                          className={`grid cursor-pointer grid-cols-[auto_1fr] gap-3 px-3 py-2.5 transition ${
                            canCheckItems
                              ? "hover:bg-slate-50"
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="checkedItemIds"
                            value={item.id}
                            disabled={!canCheckItems}
                            checked={checked}
                            onChange={(event) => {
                              setCheckedItemIds((current) => {
                                const next = new Set(current);

                                if (event.currentTarget.checked) {
                                  next.add(item.id);
                                } else {
                                  next.delete(item.id);
                                }

                                return next;
                              });
                            }}
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-[#001871]"
                          />

                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#001871]/10 px-2 py-0.5 text-[11px] font-bold text-[#001871]">
                                Ítem {item.orderIndex}
                              </span>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${getStatusClassName(
                                  item.status,
                                )}`}
                              >
                                {getStatusLabel(item.status)}
                              </span>

                              {item.itemMode === "ADVANCED" && (
                                <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-bold text-fuchsia-700 ring-1 ring-fuchsia-100">
                                  Adicional
                                </span>
                              )}
                            </span>

                            <span className="mt-1 block text-sm leading-5 text-slate-800">
                              {item.text}
                            </span>

                            {item.children.length > 0 && (
                              <span className="mt-1 block truncate text-xs text-slate-500">
                                {item.children.join(" · ")}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="-mx-5 mt-4 shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-xl bg-[#001871] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finalizar entrega
        </button>

        <p className="mt-2 text-center text-xs text-slate-400">
          Para finalizar, debe adjuntar al menos un archivo y marcar al menos un
          ítem cubierto por la entrega.
        </p>
      </div>
    </form>
  );
}
