import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequestBuilder from "@/components/request-builder/RequestBuilder";
import { getEmpleadoById } from "@/server/queries";
import { getClientesOptionsParaEmpleado } from "@/server/clientes";
import type { CompanyOption } from "@/features/impulsa/request-types";

export const dynamic = "force-dynamic";

function getTodayDateOnlyInBogota() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

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

  const initialResponsible = {
    name: empleado.nombreCompleto,
    role: empleado.cargoNombre ?? empleado.rolAplicacion,
    firm: "Russell Bedford",
  };

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
      pageTitle="Crear solicitud"
      pageDescription="Generación de solicitud de información para cliente"
    >
      <RequestBuilder
        companies={companies}
        initialCompanyId={initialCompanyId}
        initialCutoffDate={getTodayDateOnlyInBogota()}
        initialResponsible={initialResponsible}
      />
    </AppShell>
  );
}
