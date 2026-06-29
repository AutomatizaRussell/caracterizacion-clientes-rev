import EquipoPersonaCard from './EquipoPersonaCard';

type PersonaEquipo = { id: string; nombreCompleto: string; cargoNombre: string | null; rolAplicacion: string };
type EquipoGraphProps = {
  title?: string;
  description?: string;
  equipo: { socio: PersonaEquipo; gerente: PersonaEquipo; senior: PersonaEquipo; staffs: Array<{ id: string; staff: PersonaEquipo }> } | null;
};

function roleLabel(persona: PersonaEquipo) {
  return persona.cargoNombre ?? persona.rolAplicacion;
}

export default function EquipoGraph({ title = 'Mapa de equipo', description = 'Equipo responsable asociado al cliente.', equipo }: EquipoGraphProps) {
  return (
    <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Equipo asignado</p>
      <h2 className="mt-1 text-xl font-extrabold text-[#041461]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {!equipo ? (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">Este cliente no tiene equipo activo asignado.</div>
      ) : (
        <div className="mt-6 space-y-5 overflow-x-auto pb-2">
          <div className="mx-auto max-w-xs"><EquipoPersonaCard name={equipo.socio.nombreCompleto} role={roleLabel(equipo.socio)} variant="socio" /></div>
          <div className="mx-auto h-8 w-px bg-slate-300" />
          <div className="mx-auto max-w-xs"><EquipoPersonaCard name={equipo.gerente.nombreCompleto} role={roleLabel(equipo.gerente)} variant="gerente" /></div>
          <div className="mx-auto h-8 w-px bg-slate-300" />
          <div className="mx-auto max-w-xs"><EquipoPersonaCard name={equipo.senior.nombreCompleto} role={roleLabel(equipo.senior)} variant="senior" /></div>
          <div className="mx-auto h-8 w-px bg-slate-300" />
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Staff / Asistentes</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {equipo.staffs.map((item) => <EquipoPersonaCard key={item.id} name={item.staff.nombreCompleto} role={roleLabel(item.staff)} variant="staff" />)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
