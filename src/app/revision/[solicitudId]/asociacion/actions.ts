'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEmpleadoById } from '@/server/queries';
import {
  assignAttachmentToItem,
  confirmMatch,
  generateLocalAssociationSuggestions,
  ignoreAttachment,
} from '@/server/revision/revision.service';

async function getEmpleadoOrThrow() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) throw new Error('Sesión no válida.');
  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) throw new Error('Sesión no válida.');
  return empleado;
}

export async function generarSugerenciasAsociacionAction(solicitudId: string) {
  const empleado = await getEmpleadoOrThrow();
  await generateLocalAssociationSuggestions({ empleadoId: empleado.id, solicitudId });
  revalidatePath(`/revision/${solicitudId}/asociacion`);
}

export async function asociarArchivoItemAction(solicitudId: string, formData: FormData) {
  const empleado = await getEmpleadoOrThrow();
  const adjuntoId = String(formData.get('adjuntoId') ?? '').trim();
  const itemId = String(formData.get('itemId') ?? '').trim();
  const comment = String(formData.get('comment') ?? '').trim();

  if (!adjuntoId || !itemId) throw new Error('Debe seleccionar archivo e ítem.');

  await assignAttachmentToItem({ empleadoId: empleado.id, solicitudId, adjuntoId, itemId, comment });
  revalidatePath(`/revision/${solicitudId}/asociacion`);
}

export async function confirmarMatchAction(solicitudId: string, formData: FormData) {
  const empleado = await getEmpleadoOrThrow();
  const matchId = String(formData.get('matchId') ?? '').trim();
  if (!matchId) throw new Error('Match inválido.');
  await confirmMatch({ empleadoId: empleado.id, matchId });
  revalidatePath(`/revision/${solicitudId}/asociacion`);
}

export async function ignorarAdjuntoAction(solicitudId: string, formData: FormData) {
  const empleado = await getEmpleadoOrThrow();
  const adjuntoId = String(formData.get('adjuntoId') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (!adjuntoId || !reason) throw new Error('Debe indicar archivo y razón.');
  await ignoreAttachment({ empleadoId: empleado.id, solicitudId, adjuntoId, reason });
  revalidatePath(`/revision/${solicitudId}/asociacion`);
}

export async function continuarRevisionAction(solicitudId: string) {
  redirect(`/revision/${solicitudId}`);
}
