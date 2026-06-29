type EquipoPersonaCardProps = {
  name: string;
  role: string;
  variant: 'socio' | 'gerente' | 'senior' | 'staff';
};

const variantClasses = {
  socio: 'bg-[#830887]/10 text-[#830887] ring-[#830887]/25',
  gerente: 'bg-[#041461]/10 text-[#041461] ring-[#041461]/25',
  senior: 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/25',
  staff: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export default function EquipoPersonaCard({ name, role, variant }: EquipoPersonaCardProps) {
  return (
    <article className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-extrabold ring-1 ${variantClasses[variant]}`}>
        {getInitials(name)}
      </div>
      <p className="mt-3 truncate text-sm font-extrabold text-[#041461]">{name}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{role}</p>
    </article>
  );
}
