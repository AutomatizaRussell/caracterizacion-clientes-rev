"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

type DemoViewMode = "STAFF" | "SENIOR";

type ReviewStatus =
  | "PENDING_STAFF"
  | "APPROVED_STAFF"
  | "REJECTED_STAFF"
  | "PENDING_SENIOR"
  | "APPROVED_SENIOR"
  | "RETURNED_TO_STAFF"
  | "CLIENT_CORRECTION_REQUIRED";

type DemoAttachment = {
  id: string;
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
};

type DemoDeliverable = {
  id: string;
  category: string;
  checkLabel: string;
  clientMarked: boolean;
  clientResponseText: string | null;
  requiresFile: boolean;
  attachments: DemoAttachment[];
  linkedAttachmentId: string | null;
  status: ReviewStatus;
  staffComment: string | null;
  seniorComment: string | null;
};

const INITIAL_DELIVERABLES: DemoDeliverable[] = [
  {
    id: "item-001",
    category: "Información financiera",
    checkLabel: "Estados financieros comparativos 2024-2025",
    clientMarked: true,
    clientResponseText: null,
    requiresFile: true,
    attachments: [
      {
        id: "file-001",
        fileName: "Estados_financieros_2025.pdf",
        sizeLabel: "2.4 MB",
        uploadedAt: "2026-06-16 09:18",
      },
    ],
    linkedAttachmentId: "file-001",
    status: "PENDING_STAFF",
    staffComment: null,
    seniorComment: null,
  },
  {
    id: "item-002",
    category: "Impuestos",
    checkLabel: "Declaración de renta año gravable 2025",
    clientMarked: true,
    clientResponseText: null,
    requiresFile: true,
    attachments: [
      {
        id: "file-002",
        fileName: "Declaracion_renta_2025.pdf",
        sizeLabel: "1.1 MB",
        uploadedAt: "2026-06-16 09:21",
      },
      {
        id: "file-003",
        fileName: "Recibo_pago_renta_2025.pdf",
        sizeLabel: "430 KB",
        uploadedAt: "2026-06-16 09:22",
      },
    ],
    linkedAttachmentId: "file-002",
    status: "APPROVED_STAFF",
    staffComment: "Documento legible. Pendiente validación técnica del Senior.",
    seniorComment: null,
  },
  {
    id: "item-003",
    category: "Operación",
    checkLabel: "Detalle de software contable utilizado",
    clientMarked: true,
    clientResponseText: "Actualmente usamos Siigo y módulo interno de nómina.",
    requiresFile: false,
    attachments: [],
    linkedAttachmentId: null,
    status: "APPROVED_STAFF",
    staffComment: "Respuesta textual suficiente según checklist.",
    seniorComment: null,
  },
  {
    id: "item-004",
    category: "Legal",
    checkLabel: "Certificado de existencia y representación legal",
    clientMarked: true,
    clientResponseText: null,
    requiresFile: true,
    attachments: [
      {
        id: "file-004",
        fileName: "Camara_comercio_vencida.pdf",
        sizeLabel: "720 KB",
        uploadedAt: "2026-06-16 09:30",
      },
    ],
    linkedAttachmentId: "file-004",
    status: "REJECTED_STAFF",
    staffComment:
      "El certificado parece vencido. Solicitar versión actualizada al cliente.",
    seniorComment: null,
  },
  {
    id: "item-005",
    category: "Grupo económico",
    checkLabel: "Relación de vinculadas nacionales y del exterior",
    clientMarked: true,
    clientResponseText: null,
    requiresFile: true,
    attachments: [],
    linkedAttachmentId: null,
    status: "PENDING_STAFF",
    staffComment: null,
    seniorComment: null,
  },
];

function getStatusLabel(status: ReviewStatus) {
  switch (status) {
    case "PENDING_STAFF":
      return "Pendiente Staff";
    case "APPROVED_STAFF":
      return "Aprobado por Staff";
    case "REJECTED_STAFF":
      return "Rechazado por Staff";
    case "PENDING_SENIOR":
      return "Pendiente Senior";
    case "APPROVED_SENIOR":
      return "Aprobado por Senior";
    case "RETURNED_TO_STAFF":
      return "Devuelto a Staff";
    case "CLIENT_CORRECTION_REQUIRED":
      return "Corrección cliente";
    default:
      return status;
  }
}

function getStatusClass(status: ReviewStatus) {
  switch (status) {
    case "PENDING_STAFF":
    case "PENDING_SENIOR":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "APPROVED_STAFF":
    case "APPROVED_SENIOR":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "REJECTED_STAFF":
    case "CLIENT_CORRECTION_REQUIRED":
      return "bg-red-50 text-red-700 ring-red-200";
    case "RETURNED_TO_STAFF":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function getStatusIcon(status: ReviewStatus) {
  if (status === "APPROVED_STAFF" || status === "APPROVED_SENIOR") {
    return <CheckCircle2 size={14} />;
  }

  if (status === "REJECTED_STAFF" || status === "CLIENT_CORRECTION_REQUIRED") {
    return <XCircle size={14} />;
  }

  if (status === "RETURNED_TO_STAFF") {
    return <RotateCcw size={14} />;
  }

  return <Clock3 size={14} />;
}

function getLinkedAttachment(item: DemoDeliverable) {
  return (
    item.attachments.find(
      (attachment) => attachment.id === item.linkedAttachmentId,
    ) ?? null
  );
}

function getStats(items: DemoDeliverable[], mode: DemoViewMode) {
  if (mode === "STAFF") {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING_STAFF").length,
      approved: items.filter((item) => item.status === "APPROVED_STAFF").length,
      rejected: items.filter((item) => item.status === "REJECTED_STAFF").length,
    };
  }

  const seniorItems = items.filter(
    (item) =>
      item.status === "APPROVED_STAFF" ||
      item.status === "PENDING_SENIOR" ||
      item.status === "APPROVED_SENIOR" ||
      item.status === "RETURNED_TO_STAFF",
  );

  return {
    total: seniorItems.length,
    pending: seniorItems.filter(
      (item) =>
        item.status === "APPROVED_STAFF" || item.status === "PENDING_SENIOR",
    ).length,
    approved: seniorItems.filter((item) => item.status === "APPROVED_SENIOR")
      .length,
    rejected: seniorItems.filter((item) => item.status === "RETURNED_TO_STAFF")
      .length,
  };
}

type DeliverableCardProps = {
  item: DemoDeliverable;
  mode: DemoViewMode;
  onApproveStaff: (id: string) => void;
  onRejectStaff: (id: string) => void;
  onApproveSenior: (id: string) => void;
  onReturnToStaff: (id: string) => void;
  onRequestClientCorrection: (id: string) => void;
  onLinkAttachment: (itemId: string, attachmentId: string | null) => void;
};

function DeliverableCard({
  item,
  mode,
  onApproveStaff,
  onRejectStaff,
  onApproveSenior,
  onReturnToStaff,
  onRequestClientCorrection,
  onLinkAttachment,
}: DeliverableCardProps) {
  const linkedAttachment = getLinkedAttachment(item);
  const hasNoFileButRequiresFile = item.requiresFile && item.attachments.length === 0;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {item.category}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase ring-1 ${getStatusClass(
                item.status,
              )}`}
            >
              {getStatusIcon(item.status)}
              {getStatusLabel(item.status)}
            </span>

            {item.requiresFile ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200">
                Requiere archivo
              </span>
            ) : (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">
                Puede ser respuesta textual
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-extrabold text-[#001871]">
            {item.checkLabel}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Check marcado por cliente:{" "}
            <span className="font-bold text-slate-700">
              {item.clientMarked ? "Sí" : "No"}
            </span>
          </p>

          {item.clientResponseText && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <MessageSquareText size={14} />
                Respuesta textual del cliente
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.clientResponseText}
              </p>
            </div>
          )}

          {hasNoFileButRequiresFile && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                <p>
                  El ítem requiere archivo, pero el cliente no cargó ningún
                  adjunto asociado.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 xl:w-72">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Paperclip size={14} />
              Archivos cargados
            </p>

            <div className="mt-3 space-y-2">
              {item.attachments.length === 0 && (
                <p className="text-sm text-slate-400">Sin archivos cargados.</p>
              )}

              {item.attachments.map((attachment) => {
                const isLinked = attachment.id === item.linkedAttachmentId;

                return (
                  <button
                    key={attachment.id}
                    type="button"
                    onClick={() =>
                      mode === "STAFF"
                        ? onLinkAttachment(
                            item.id,
                            isLinked ? null : attachment.id,
                          )
                        : undefined
                    }
                    className={[
                      "w-full rounded-lg border bg-white px-3 py-2 text-left transition",
                      isLinked
                        ? "border-[#00bfb3] ring-2 ring-[#00bfb3]/20"
                        : "border-slate-200 hover:border-[#00bfb3]",
                      mode === "SENIOR" ? "cursor-default" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 shrink-0 text-[#001871]" size={16} />

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {attachment.fileName}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {attachment.sizeLabel} · {attachment.uploadedAt}
                        </p>

                        {isLinked && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#001871]">
                            <Link2 size={12} />
                            Relacionado con el check
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {(item.staffComment || item.seniorComment) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {item.staffComment && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Observación Staff
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.staffComment}
              </p>
            </div>
          )}

          {item.seniorComment && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Observación Senior
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.seniorComment}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {mode === "STAFF"
            ? "Acciones de primera revisión"
            : "Acciones de revisión Senior"}
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === "STAFF" && (
            <>
              <button
                type="button"
                onClick={() => onApproveStaff(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={15} />
                Aprobar Staff
              </button>

              <button
                type="button"
                onClick={() => onRejectStaff(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
              >
                <XCircle size={15} />
                Rechazar al cliente
              </button>
            </>
          )}

          {mode === "SENIOR" && (
            <>
              <button
                type="button"
                onClick={() => onApproveSenior(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-700"
              >
                <UserCheck size={15} />
                Aprobar Senior
              </button>

              <button
                type="button"
                onClick={() => onReturnToStaff(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-orange-600"
              >
                <RotateCcw size={15} />
                Devolver a Staff
              </button>

              <button
                type="button"
                onClick={() => onRequestClientCorrection(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
              >
                <Send size={15} />
                Corrección cliente
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function RevisionEntregablesDemo() {
  const [mode, setMode] = useState<DemoViewMode>("STAFF");
  const [items, setItems] = useState<DemoDeliverable[]>(INITIAL_DELIVERABLES);

  const visibleItems = useMemo(() => {
    if (mode === "STAFF") {
      return items;
    }

    return items.filter(
      (item) =>
        item.status === "APPROVED_STAFF" ||
        item.status === "PENDING_SENIOR" ||
        item.status === "APPROVED_SENIOR" ||
        item.status === "RETURNED_TO_STAFF" ||
        item.status === "CLIENT_CORRECTION_REQUIRED",
    );
  }, [items, mode]);

  const stats = getStats(items, mode);

  function updateItem(id: string, patch: Partial<DemoDeliverable>) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function approveStaff(id: string) {
    updateItem(id, {
      status: "APPROVED_STAFF",
      staffComment:
        "Revisión Staff aprobada. El entregable queda pendiente de revisión Senior.",
    });
  }

  function rejectStaff(id: string) {
    updateItem(id, {
      status: "REJECTED_STAFF",
      staffComment:
        "Rechazado por Staff. Se debe enviar observación al cliente en el correo resumen.",
    });
  }

  function approveSenior(id: string) {
    updateItem(id, {
      status: "APPROVED_SENIOR",
      seniorComment: "Revisión Senior aprobada.",
    });
  }

  function returnToStaff(id: string) {
    updateItem(id, {
      status: "RETURNED_TO_STAFF",
      seniorComment:
        "Devuelto a Staff para validar relación archivo-check y observación inicial.",
    });
  }

  function requestClientCorrection(id: string) {
    updateItem(id, {
      status: "CLIENT_CORRECTION_REQUIRED",
      seniorComment:
        "Requiere corrección del cliente. Incluir en correo resumen al cierre de revisión.",
    });
  }

  function linkAttachment(itemId: string, attachmentId: string | null) {
    updateItem(itemId, {
      linkedAttachmentId: attachmentId,
    });
  }

  function resetDemo() {
    setItems(INITIAL_DELIVERABLES);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Demo funcional
            </p>

            <h1
              className="mt-1 text-2xl font-extrabold"
              style={{ color: BRAND.navy }}
            >
              Revisión de entregables del cliente
            </h1>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Ejemplo visual del flujo donde el cliente marca checks y carga
              archivos en lote. Staff realiza la primera revisión y Senior solo
              revisa lo aprobado por Staff.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("STAFF")}
              className={[
                "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                mode === "STAFF"
                  ? "bg-[#2d007f] text-white"
                  : "border border-slate-200 bg-white text-[#001871] hover:border-[#00bfb3]",
              ].join(" ")}
            >
              Vista Staff
            </button>

            <button
              type="button"
              onClick={() => setMode("SENIOR")}
              className={[
                "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                mode === "SENIOR"
                  ? "bg-[#2d007f] text-white"
                  : "border border-slate-200 bg-white text-[#001871] hover:border-[#00bfb3]",
              ].join(" ")}
            >
              Vista Senior
            </button>

            <button
              type="button"
              onClick={resetDemo}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
            >
              Restaurar demo
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Total visible
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#001871]">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Pendientes
          </p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Aprobados
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {stats.approved}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Observados
          </p>
          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {stats.rejected}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#001871]">
              {mode === "STAFF"
                ? "Bandeja de primera revisión Staff"
                : "Bandeja de revisión Senior"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {mode === "STAFF"
                ? "Staff ve todos los checks y archivos enviados por el cliente. Puede relacionar archivos, aprobar o rechazar con observaciones."
                : "Senior ve únicamente entregables aprobados por Staff o devueltos dentro del flujo de revisión."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            <p className="font-bold uppercase tracking-wide text-slate-600">
              Regla de correo demo
            </p>
            <p className="mt-1">
              No se envía correo por cada clic. Se envía un solo correo resumen
              al cerrar la revisión del nivel.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {visibleItems.map((item) => (
          <DeliverableCard
            key={item.id}
            item={item}
            mode={mode}
            onApproveStaff={approveStaff}
            onRejectStaff={rejectStaff}
            onApproveSenior={approveSenior}
            onReturnToStaff={returnToStaff}
            onRequestClientCorrection={requestClientCorrection}
            onLinkAttachment={linkAttachment}
          />
        ))}

        {visibleItems.length === 0 && (
          <section className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-bold text-slate-800">
              No hay entregables visibles para esta vista.
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              En la vista Senior solo aparecen entregables aprobados previamente
              por Staff.
            </p>
          </section>
        )}
      </div>
    </section>
  );
}