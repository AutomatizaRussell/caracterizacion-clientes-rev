import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
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
      pageTitle="Reportes"
      pageDescription="Indicadores y salidas operativas planificadas"
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-bold text-[#041461]">
          Reportes operativos
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Esta sección queda reservada para indicadores, exportaciones y vistas
          consolidadas cuando existan fuentes conectadas y reglas de negocio
          definidas.
        </p>
      </section>
    </AppShell>
  );
}
