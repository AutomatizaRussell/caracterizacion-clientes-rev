import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getEmpleadoById } from '@/server/queries';
import { getAssociationWorkspace } from '@/server/revision/revision.service';
import AssociationWorkspaceClient from '@/components/revision/AssociationWorkspaceClient';
import {
  asociarArchivoItemAction,
  confirmarMatchAction,
  continuarRevisionAction,
  generarSugerenciasAsociacionAction,
  ignorarAdjuntoAction,
} from './actions';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ solicitudId: string }> };

type AssociationWorkspace = NonNullable<Awaited<ReturnType<typeof getAssociationWorkspace>>>;

type SerializableWorkspace = {
  solicitud: {
    id: string;
    requestTypeName: string;
    subject: string;
    status: string;
    empresa: { id: string; razonSocial: string; nit: string };
    radicado: { reference: string };
    items: Array<AssociationWorkspace['solicitud']['items'][number]>;
    portalAdjuntos: Array<{
      id: string;
      originalFileName: string;
      storedFileName: string | null;
      mimeType: string | null;
      sizeBytes: string | null;
      oneDriveUrl: string | null;
      oneDriveItemId: string | null;
      uploadedAt: string;
    }>;
  };
  matches: Array<{
    id: string;
    solicitudId: string;
    itemId: string | null;
    adjuntoId: string;
    matchStatus: string;
    matchSource: string;
    confidenceScore: number | null;
    aiReason: string | null;
    aiWarningsJson: unknown;
    correctionComment: string | null;
  }>;
};

function serializeWorkspace(workspace: AssociationWorkspace): SerializableWorkspace {
  return {
    solicitud: {
      id: workspace.solicitud.id,
      requestTypeName: workspace.solicitud.requestTypeName,
      subject: workspace.solicitud.subject,
      status: workspace.solicitud.status,
      empresa: workspace.solicitud.empresa,
      radicado: workspace.solicitud.radicado,
      items: workspace.solicitud.items,
      portalAdjuntos: workspace.solicitud.portalAdjuntos.map((adjunto) => ({
        ...adjunto,
        sizeBytes: adjunto.sizeBytes === null ? null : String(adjunto.sizeBytes),
        uploadedAt: adjunto.uploadedAt.toISOString(),
      })),
    },
    matches: workspace.matches.map((match) => ({
      id: match.id,
      solicitudId: match.solicitudId,
      itemId: match.itemId,
      adjuntoId: match.adjuntoId,
      matchStatus: match.matchStatus,
      matchSource: match.matchSource,
      confidenceScore: match.confidenceScore === null ? null : Number(match.confidenceScore),
      aiReason: match.aiReason,
      aiWarningsJson: match.aiWarningsJson,
      correctionComment: match.correctionComment,
    })),
  };
}

export default async function AsociacionRevisionPage({ params }: PageProps) {
  const { solicitudId } = await params;
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) redirect('/login');

  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) redirect('/login');

  const workspace = await getAssociationWorkspace({ empleadoId: empleado.id, solicitudId });
  if (!workspace) notFound();

  const serializedWorkspace = serializeWorkspace(workspace);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion} pageTitle="Revisión" pageDescription="Paso 1 de 2 · Asociación de archivos"
      defaultSidebarCollapsed
      wideContent
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Asociación archivo-ítem</p>
              <h1 className="mt-1 text-xl font-extrabold text-[#041461]">{workspace.solicitud.empresa.razonSocial}</h1>
              <p className="mt-1 text-sm text-slate-500">{workspace.solicitud.radicado.reference} · {workspace.solicitud.requestTypeName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generarSugerenciasAsociacionAction.bind(null, workspace.solicitud.id)}>
                <button className="rounded-xl bg-[#0ccba9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">Sugerir asociaciones</button>
              </form>
              <Link href={`/solicitudes/${workspace.solicitud.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461]">Detalle</Link>
            </div>
          </div>
        </section>

        <AssociationWorkspaceClient
          workspace={serializedWorkspace}
          assignAction={asociarArchivoItemAction.bind(null, workspace.solicitud.id)}
          confirmMatchAction={confirmarMatchAction.bind(null, workspace.solicitud.id)}
          returnAttachmentAction={ignorarAdjuntoAction.bind(null, workspace.solicitud.id)}
          continueAction={continuarRevisionAction.bind(null, workspace.solicitud.id)}
        />
      </section>
    </AppShell>
  );
}
