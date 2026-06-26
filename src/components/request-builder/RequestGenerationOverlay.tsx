import type { RequestGenerationPhase } from "./hooks/useRequestGeneration";

type RequestGenerationOverlayProps = {
  isVisible: boolean;
  phase: RequestGenerationPhase;
};

function getPhaseLabel(phase: RequestGenerationPhase) {
  switch (phase) {
    case "creating":
      return "Creando solicitud y asignando radicado...";
    case "sending":
      return "Generando documento, ejecutando automatización y enviando solicitud...";
    case "completed":
      return "Solicitud procesada.";
    case "failed":
      return "El proceso terminó con error.";
    default:
      return "Preparando proceso...";
  }
}

export default function RequestGenerationOverlay({
  isVisible,
  phase,
}: RequestGenerationOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0ccba9]/10">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#0ccba9]/20 border-t-[#0ccba9]" />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#041461]">
          Procesando solicitud
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {getPhaseLabel(phase)}
        </p>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
          No cierres esta ventana ni recargues la página.
        </p>
      </section>
    </div>
  );
}
