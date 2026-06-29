'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getEmpleadoById } from '@/server/queries';
import { closeReview, saveItemReviewDecision } from '@/server/revision/revision.service';
import { getReviewLevelForRole, type ItemReviewStatus } from '@/server/revision/revision-types';

async function getEmpleadoOrThrow() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get('empleado_id')?.value;
  if (!empleadoId) throw new Error('Sesión no válida.');
  const empleado = await getEmpleadoById(empleadoId);
  if (!empleado) throw new Error('Sesión no válida.');
  return empleado;
}

export async function guardarDecisionRevisionAction(solicitudId: string, formData: FormData) {
  const empleado = await getEmpleadoOrThrow();
  const reviewLevel = getReviewLevelForRole(empleado.rolAplicacion);
  if (!reviewLevel) throw new Error('El rol actual no tiene permiso para revisar.');

  const itemId = String(formData.get('itemId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as ItemReviewStatus;
  const comment = String(formData.get('comment') ?? '').trim();

  if (!itemId || !['APPROVED', 'REJECTED'].includes(status)) throw new Error('Decisión inválida.');

  await saveItemReviewDecision({ empleadoId: empleado.id, solicitudId, itemId, reviewLevel, status, comment });
  revalidatePath(`/revision/${solicitudId}`);
}

export async function cerrarRevisionAction(solicitudId: string) {
  const empleado = await getEmpleadoOrThrow();
  const reviewLevel = getReviewLevelForRole(empleado.rolAplicacion);
  if (!reviewLevel) throw new Error('El rol actual no tiene permiso para cerrar revisión.');

  await closeReview({ empleadoId: empleado.id, solicitudId, reviewLevel });
  revalidatePath(`/revision/${solicitudId}`);
  revalidatePath('/revision');
}
