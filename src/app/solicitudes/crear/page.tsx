import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequestBuilder from "@/components/request-builder/RequestBuilder";
import { getEmpleadoById } from "@/server/queries";
import { getClientesOptionsParaEmpleado } from "@/server/clientes";
import type { CompanyOption } from "@/features/impulsa/request-types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    clienteId?: string;
  }>;
};

export default async function CrearSolicitudPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const clientes = await getClientesOptionsParaEmpleado(empleado.id);
  const resolvedSearchParams = await searchParams;

  const initialCompanyId = resolvedSearchParams?.clienteId ?? null;

  const companies = clientes.map(
    (cliente): CompanyOption => ({
      id: cliente.id,
      name: cliente.razonSocial,
      shortName: cliente.nit,
      contactEmail: null,
    }),
  );

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
    >
      <RequestBuilder
        companies={companies}
        initialCompanyId={initialCompanyId}
      />
    </AppShell>
  );
}