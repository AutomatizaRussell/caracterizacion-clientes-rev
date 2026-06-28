type PersonaEquipo = {
  id: string;
  nombreCompleto: string;
  cargoNombre: string | null;
  rolAplicacion: string;
};

type ClienteEquipoAsignadoCardProps = {
  equipo: {
    socio: PersonaEquipo;
    gerente: PersonaEquipo;
    senior: PersonaEquipo;
    staffs: Array<{
      id: string;
      staff: PersonaEquipo;
    }>;
  } | null;
};

function PersonaRow({
  label,
  persona,
}: {
  label: string;
  persona: PersonaEquipo;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-[#041461]">
        {persona.nombreCompleto}
      </p>

      <p className="mt-1 truncate text-xs text-slate-500">
        {persona.cargoNombre ?? persona.rolAplicacion}
      </p>
    </div>
  );
}

export default function ClienteEquipoAsignadoCard({
  equipo,
}: ClienteEquipoAsignadoCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Equipo asignado
          </p>

          <h2 className="mt-1 text-lg font-extrabold text-[#041461]">
            Responsables del cliente
          </h2>
        </div>
      </div>

      {!equipo ? (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
          Este cliente no tiene equipo activo asignado.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <PersonaRow label="Socio" persona={equipo.socio} />
            <PersonaRow label="Gerente" persona={equipo.gerente} />
            <PersonaRow label="Senior" persona={equipo.senior} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
              Staff / Asistentes
            </p>

            {equipo.staffs.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {equipo.staffs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
                  >
                    <p className="truncate text-sm font-bold text-slate-800">
                      {item.staff.nombreCompleto}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {item.staff.cargoNombre ?? item.staff.rolAplicacion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No hay asistentes asignados.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
