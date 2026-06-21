
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function RadicadosPage() {
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
    <AppShell>
      <section className="space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Impulsa
          </p>

          <h1
            className="mt-1 text-2xl font-extrabold"
            style={{ color: BRAND.navy }}
          >
            Solicitudes de información
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Vista operativa tipo Smartsheet para seguimiento de requerimientos documentales.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Pendiente: tabla de solicitudes, filtros, estados, vencimientos y avance por cliente.
          </p>
        </section>
      </section>
    </AppShell>
  );
}