import { useState, useTransition } from "react";
import {
  crearSolicitudDesdeBuilderAction,
  generarYEnviarSolicitudAction,
  type CrearSolicitudDesdeBuilderPayload,
} from "@/app/solicitudes/crear/actions";

export type RequestGenerationPhase =
  | "idle"
  | "creating"
  | "sending"
  | "completed"
  | "failed";

export type GenerateRequestFolder = {
  key: string;
  title: string;
  folderName: string;
  folderUrl?: string;
  informacionSuministradaFolderUrl?: string;
};

export type GenerateResult = {
  solicitudId: string;
  radicadoId: string;
  radicadoReference: string;
  portalUrl: string;
  totalItems: number;
  n8nExecutionId?: string;
  htmlUrl?: string;
  pdfUrl?: string;
  controlInternoFolderUrl?: string;
  solicitudesInformacionFolderUrl?: string;
  requestFolders?: GenerateRequestFolder[];
  emailMessageId?: string;
};

export function useRequestGeneration() {
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [generationPhase, setGenerationPhase] =
    useState<RequestGenerationPhase>("idle");
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);

  function clearGenerationState() {
    setGenerateResult(null);
    setGenerateError(null);
    setGenerationPhase("idle");
  }

  function handleGenerateSolicitud(payload: CrearSolicitudDesdeBuilderPayload) {
    setGenerateError(null);
    setGenerateResult(null);
    setGenerationPhase("creating");

    startGeneratingTransition(async () => {
      const createResult = await crearSolicitudDesdeBuilderAction(payload);

      if (!createResult.ok) {
        setGenerateError(createResult.message);
        setGenerationPhase("failed");
        return;
      }

      setGenerationPhase("sending");

      const sendResult = await generarYEnviarSolicitudAction({
        solicitudId: createResult.solicitudId,
      });

      if (!sendResult.ok) {
        setGenerateResult({
          solicitudId: createResult.solicitudId,
          radicadoId: createResult.radicadoId,
          radicadoReference: createResult.radicadoReference,
          portalUrl: createResult.portalUrl,
          totalItems: createResult.totalItems,
        });

        setGenerateError(
          `La solicitud fue creada, pero falló la generación/envío por n8n: ${sendResult.message}`,
        );
        setGenerationPhase("failed");

        return;
      }

      setGenerateResult({
        solicitudId: createResult.solicitudId,
        radicadoId: createResult.radicadoId,
        radicadoReference: createResult.radicadoReference,
        portalUrl: createResult.portalUrl,
        totalItems: createResult.totalItems,
        n8nExecutionId: sendResult.executionId,
        htmlUrl: sendResult.htmlUrl,
        pdfUrl: sendResult.pdfUrl,
        controlInternoFolderUrl: sendResult.controlInternoFolderUrl,
        solicitudesInformacionFolderUrl:
          sendResult.solicitudesInformacionFolderUrl,
        requestFolders: sendResult.requestFolders,
        emailMessageId: sendResult.emailMessageId,
      });

      setGenerationPhase("completed");
    });
  }

  return {
    isGenerating,
    generationPhase,
    generateResult,
    generateError,
    clearGenerationState,
    handleGenerateSolicitud,
  };
}
