import Link from "next/link";
import type { GenerateResult } from "./hooks/useRequestGeneration";

type RequestGenerationResultProps = {
  result: GenerateResult | null;
  error: string | null;
  userRole?: string | null;
};

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

function SecondaryExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
    >
      {children}
    </a>
  );
}

export default function RequestGenerationResult({
  result,
  error,
  userRole,
}: RequestGenerationResultProps) {
  if (!result && !error) {
    return null;
  }

  const canSeeTechnicalDetails = isAdminRole(userRole);

  return (
    <section className="mt-4 space-y-3">
      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-2xl bg-[#0ccba9]/10 p-4 text-sm text-[#079b85] ring-1 ring-[#0ccba9]/20">
          <p className="font-extrabold text-[#041461]">
            Solicitud procesada.
          </p>

          <div className="mt-3 grid gap-3 rounded-xl bg-white/70 p-3 text-slate-700 ring-1 ring-[#0ccba9]/20">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Radicado
              </span>
              <span className="text-right font-extrabold text-[#041461]">
                {result.radicadoReference}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Ítems incluidos
              </span>
              <span className="font-extrabold text-[#041461]">
                {result.totalItems}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href={`/solicitudes/${result.solicitudId}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 sm:col-span-2"
            >
              Ver detalle de solicitud
            </Link>

            {result.pdfUrl ? (
              <SecondaryExternalLink href={result.pdfUrl}>
                Abrir PDF
              </SecondaryExternalLink>
            ) : null}

            {result.portalUrl ? (
              <SecondaryExternalLink href={result.portalUrl}>
                Abrir portal
              </SecondaryExternalLink>
            ) : null}

            {result.solicitudesInformacionFolderUrl ? (
              <SecondaryExternalLink
                href={result.solicitudesInformacionFolderUrl}
              >
                Carpeta solicitudes
              </SecondaryExternalLink>
            ) : null}

            {result.controlInternoFolderUrl ? (
              <SecondaryExternalLink href={result.controlInternoFolderUrl}>
                Control interno
              </SecondaryExternalLink>
            ) : null}
          </div>

          {canSeeTechnicalDetails ? (
            <details className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-slate-600 ring-1 ring-[#0ccba9]/20">
              <summary className="cursor-pointer font-bold uppercase tracking-wide text-[#041461]">
                Detalles técnicos
              </summary>

              <div className="mt-3 space-y-2 break-all">
                {result.n8nExecutionId ? (
                  <p>
                    <span className="font-bold">Ejecución n8n:</span>{" "}
                    {result.n8nExecutionId}
                  </p>
                ) : null}

                {result.emailMessageId ? (
                  <p>
                    <span className="font-bold">Message ID:</span>{" "}
                    {result.emailMessageId}
                  </p>
                ) : null}

                {result.htmlUrl ? (
                  <p>
                    <span className="font-bold">HTML:</span>{" "}
                    <a
                      href={result.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline underline-offset-4"
                    >
                      Abrir HTML
                    </a>
                  </p>
                ) : null}

                {result.requestFolders?.length ? (
                  <div>
                    <p className="font-bold">Carpetas internas:</p>

                    <ul className="mt-1 space-y-1">
                      {result.requestFolders.map((folder) => (
                        <li key={folder.key}>
                          <span className="font-semibold">
                            {folder.folderName}
                          </span>

                          {folder.informacionSuministradaFolderUrl ? (
                            <>
                              {" "}
                              —{" "}
                              <a
                                href={folder.informacionSuministradaFolderUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold underline underline-offset-4"
                              >
                                Información suministrada
                              </a>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
