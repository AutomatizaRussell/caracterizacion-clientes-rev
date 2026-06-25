import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getEmpleadoById } from "@/server/queries";
import { getSolicitudDetalleParaEmpleado } from "@/server/solicitudes-panel";
import {
  formatSolicitudStatusLabel,
  getSolicitudStatusBadgeClass,
} from "@/features/solicitudes/solicitud-status.ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SolicitudRevisionPage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const empleadoId = cookieStore.get("empleado_id")?.value;

  if (!empleadoId) {
    redirect("/login");
  }

  const empleado = await getEmpleadoById(empleadoId);

  if (!empleado) {
    redirect("/login");
  }

  const solicitud = await getSolicitudDetalleParaEmpleado({
    empleadoId: empleado.id,
    solicitudId: id,
  });

  if (!solicitud) {
    notFound();
  }

  const totalItems = solicitud.items.length;
  const submittedItems = solicitud.items.filter(
    (item) => item.status === "SUBMITTED",
  ).length;

  return (
    <AppShell
      userName={empleado.nombreCompleto}
      userRole={empleado.rolAplicacion}
      pageTitle="Revisión de solicitud"
      pageDescription={solicitud.radicado?.reference ?? "Solicitud sin radicado"}
    >
      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cliente
              </p>

              <h1 className="mt-1 truncate text-xl font-extrabold text-[#041461]">
                {solicitud.empresa.razonSocial}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                NIT: {solicitud.empresa.nit} ·{" "}
                {solicitud.radicado?.reference ?? "Sin radicado"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={`/solicitudes/${solicitud.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Volver al detalle
              </Link>

              <Link
                href={`/clientes/${solicitud.empresa.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
              >
                Ficha 360
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#041461]">
                  Preparación de revisión
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                  Esta vista será el punto de trabajo para asociar soportes a
                  ítems, revisar evidencias y cerrar la revisión. La asociación
                  podrá hacerse manualmente y, más adelante, con propuesta
                  automática asistida por IA.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getSolicitudStatusBadgeClass(
                  solicitud.status,
                )}`}
              >
                {formatSolicitudStatusLabel(solicitud.status)}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  1. Asociación
                </p>
                <h3 className="mt-2 font-bold text-[#041461]">
                  Archivo ↔ ítem
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Relacionar archivos suministrados por el cliente con los ítems
                  que realmente soportan.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  2. Revisión
                </p>
                <h3 className="mt-2 font-bold text-[#041461]">
                  Aprobar o rechazar
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Revisar los ítems asociados, registrar observaciones y marcar
                  resultado por ítem.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  3. Cierre
                </p>
                <h3 className="mt-2 font-bold text-[#041461]">
                  Resumen y trazabilidad
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Consolidar observaciones, cerrar revisión y preparar
                  comunicación resumen.
                </p>
              </section>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm font-bold text-slate-700">
                Pendiente de implementación funcional
              </p>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                El siguiente paso técnico es traer los archivos recibidos del
                portal, mostrar ítems marcados por el cliente y permitir
                asociación manual archivo–ítem. Después se podrá agregar un
                botón para sugerir asociaciones con IA.
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#041461]">Resumen</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Ítems solicitados</span>
                  <span className="font-bold text-[#041461]">{totalItems}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Marcados cliente</span>
                  <span className="font-bold text-[#041461]">
                    {submittedItems}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-[#041461]">
                IA futura
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                La asociación automática debe proponerse como ayuda, no como
                verdad absoluta. El usuario debe poder aceptar, corregir o
                descartar cada asociación.
              </p>
            </section>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
