import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import { getEmpleadoById } from "@/server/queries";
import { getOrCreateCaracterizacionCliente } from "@/server/caracterizacion";
import CaracterizacionFormClient from "./CaracterizacionFormClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClienteCaracterizacionPage({ params }: PageProps) {
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

  const data = await getOrCreateCaracterizacionCliente({
    clienteId: id,
    empleadoId: empleado.id,
  });

  if (!data || !data.formulario) {
    notFound();
  }

  const { empresa, formulario, sectores } = data;

  const respuestasPorSeccion = formulario.respuestas.reduce<
    Record<string, typeof formulario.respuestas>
  >((acc, respuesta) => {
    const section = respuesta.campo.section;

    if (!acc[section]) {
      acc[section] = [];
    }

    acc[section].push(respuesta);

    return acc;
  }, {});

  const seccionesFormulario = Object.entries(respuestasPorSeccion).map(
    ([section, respuestas]) => ({
      section,
      respuestas: respuestas.map((respuesta) => ({
        id: respuesta.id,
        valueText: respuesta.valueText,
        valueNumber:
          respuesta.valueNumber === null ? null : String(respuesta.valueNumber),
        valueDate:
          respuesta.valueDate === null
            ? null
            : respuesta.valueDate.toISOString(),
        valueJson: respuesta.valueJson,
        status: respuesta.status,
        campo: {
          code: respuesta.campo.code,
          label: respuesta.campo.label,
          section: respuesta.campo.section,
          helpText: respuesta.campo.helpText,
          fieldType: respuesta.campo.fieldType,
          isRequired: respuesta.campo.isRequired,
          hasInlineDetail: respuesta.campo.hasInlineDetail,
          inlineDetailLabel: respuesta.campo.inlineDetailLabel,
          inlineDetailRequiredWhenValue:
            respuesta.campo.inlineDetailRequiredWhenValue,
          dependsOnFieldCode: respuesta.campo.dependsOnFieldCode,
          dependsOnValue: respuesta.campo.dependsOnValue,
          unit: respuesta.campo.unit,
        },
      })),
    }),
  );

  const completionPercentage = Number(formulario.completionPercentage);

  return (
    <AppShell userName={empleado.nombreCompleto} userRole={empleado.rolAplicacion}>
      <section className="space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Caracterización
              </p>

              <h1
                className="mt-1 text-2xl font-extrabold"
                style={{ color: BRAND.navy }}
              >
                Caracterización de Clientes
              </h1>

              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {empresa.razonSocial}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                NIT: {empresa.nit} · Responsable: {empleado.nombreCompleto}
              </p>
            </div>

            <Link
              href={`/clientes/${empresa.id}`}
              className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#001871] transition hover:border-[#00bfb3] hover:bg-slate-50"
            >
              ← Volver al cliente
            </Link>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Avance</span>
            <span>{completionPercentage}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#001871] via-[#00bfb3] to-[#981d97]"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            {formulario.answeredCount} de {formulario.totalCount} campos
            obligatorios diligenciados · Estado: {formulario.status}
          </p>

          {formulario.status === "CONFIRMED" &&
            formulario.hasPostConfirmationChanges && (
              <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-[#ed8b00]">
                Confirmado con cambios posteriores
              </p>
            )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <CaracterizacionFormClient
            formularioId={formulario.id}
            clienteId={empresa.id}
            empleadoId={empleado.id}
            secciones={seccionesFormulario}
            sectores={sectores}
          />
        </section>
      </section>
    </AppShell>
  );
}