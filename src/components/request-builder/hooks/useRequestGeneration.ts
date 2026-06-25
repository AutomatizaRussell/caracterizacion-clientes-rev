import { useState, useTransition } from "react";
import {
  crearSolicitudDesdeBuilderAction,
  generarYEnviarSolicitudAction,
  type CrearSolicitudDesdeBuilderPayload,
} from "@/app/solicitudes/crear/actions";

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
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);

  function clearGenerationState() {
    setGenerateResult(null);
    setGenerateError(null);
  }

  function handleGenerateSolicitud(payload: CrearSolicitudDesdeBuilderPayload) {
    setGenerateError(null);
    setGenerateResult(null);

    startGeneratingTransition(async () => {
      const createResult = await crearSolicitudDesdeBuilderAction(payload);

      if (!createResult.ok) {
        setGenerateError(createResult.message);
        return;
      }

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
    });
  }

  return {
    isGenerating,
    generateResult,
    generateError,
    clearGenerationState,
    handleGenerateSolicitud,
  };
}
