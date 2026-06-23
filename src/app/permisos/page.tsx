import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { PermissionMatrix } from "@/features/permisos/PermissionMatrix";
import { getEmpleadoById } from "@/server/queries";

export const dynamic = "force-dynamic";

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

export default async function PermisosPage() {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  if (!isAdminRole(empleado.rolAplicacion)) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Roles y permisos"
      pageDescription="Administración de matriz de autorizaciones"
    >
      <PermissionMatrix />
    </AppShell>
  );
}
