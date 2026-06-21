import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { PermissionDecisionMatrix } from "@/features/permisos-solicitudes/PermissionDecisionMatrix";
import { getEmpleadoById } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function PermisosDefinicionSolicitudesPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
    >
      <PermissionDecisionMatrix />
    </AppShell>
  );
}
