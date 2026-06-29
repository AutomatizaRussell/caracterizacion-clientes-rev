import EquipoGraph from '@/components/equipo/EquipoGraph';

type PersonaEquipo = { id: string; nombreCompleto: string; cargoNombre: string | null; rolAplicacion: string };
type Props = { equipo: { socio: PersonaEquipo; gerente: PersonaEquipo; senior: PersonaEquipo; staffs: Array<{ id: string; staff: PersonaEquipo }> } | null };

export default function ClienteEquipoAsignadoCard({ equipo }: Props) {
  return <EquipoGraph title="Mapa de equipo" description="Responsables y asistentes asignados específicamente a este cliente." equipo={equipo} />;
}
