import type { EquipoGraphNode, EquipoGraphRole } from '@/server/equipo';

type EquipoNodeCardProps = {
  node: EquipoGraphNode;
  isSelected: boolean;
  onSelect: () => void;
  incomingCount: number;
  outgoingCount: number;
};

const roleLabel: Record<EquipoGraphRole, string> = {
  socio: 'Socio',
  gerente: 'Gerente',
  senior: 'Senior',
  staff: 'Staff',
};

const roleClasses: Record<EquipoGraphRole, string> = {
  socio: 'bg-[#830887]/10 text-[#830887] ring-[#830887]/25',
  gerente: 'bg-[#041461]/10 text-[#041461] ring-[#041461]/25',
  senior: 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/25',
  staff: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export default function EquipoNodeCard({
  node,
  isSelected,
  onSelect,
  incomingCount,
  outgoingCount,
}: EquipoNodeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
        isSelected ? 'ring-[#0ccba9]' : 'ring-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ${roleClasses[node.role]}`}>
          {initials(node.nombreCompleto)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#041461]">{node.nombreCompleto}</p>
          <p className="truncate text-xs text-slate-500">{node.cargoNombre ?? node.rolAplicacion}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wide">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 ring-1 ring-slate-200">{roleLabel[node.role]}</span>
        <span className="rounded-full bg-[#0ccba9]/10 px-2 py-1 text-[#079b85] ring-1 ring-[#0ccba9]/20">{node.clientIds.length} clientes</span>
        {incomingCount > 0 ? <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-500 ring-1 ring-slate-200">{incomingCount} entradas</span> : null}
        {outgoingCount > 0 ? <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-500 ring-1 ring-slate-200">{outgoingCount} salidas</span> : null}
      </div>
    </button>
  );
}
