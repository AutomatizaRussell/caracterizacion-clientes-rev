import { prisma } from '@/lib/prisma';
import { getClienteVisibilityWhere } from '@/server/clientes-visibilidad';

export type EquipoGraphRole = 'socio' | 'gerente' | 'senior' | 'staff';

export type EquipoGraphClient = {
  id: string;
  razonSocial: string;
  nit: string;
};

export type EquipoGraphNode = {
  id: string;
  role: EquipoGraphRole;
  nombreCompleto: string;
  cargoNombre: string | null;
  rolAplicacion: string;
  clientIds: string[];
};

export type EquipoGraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  fromRole: EquipoGraphRole;
  toRole: EquipoGraphRole;
  clientIds: string[];
};

export type EquipoGraphData = {
  nodes: EquipoGraphNode[];
  edges: EquipoGraphEdge[];
  clients: Record<string, EquipoGraphClient>;
};

type Persona = {
  id: string;
  nombreCompleto: string;
  cargoNombre: string | null;
  rolAplicacion: string;
};

function addNode(
  nodes: Map<string, EquipoGraphNode>,
  persona: Persona,
  role: EquipoGraphRole,
  clientId: string,
) {
  const current = nodes.get(persona.id);

  if (current) {
    current.clientIds = Array.from(new Set([...current.clientIds, clientId]));
    return;
  }

  nodes.set(persona.id, {
    id: persona.id,
    role,
    nombreCompleto: persona.nombreCompleto,
    cargoNombre: persona.cargoNombre,
    rolAplicacion: persona.rolAplicacion,
    clientIds: [clientId],
  });
}

function addEdge(params: {
  edges: Map<string, EquipoGraphEdge>;
  from: Persona;
  to: Persona;
  fromRole: EquipoGraphRole;
  toRole: EquipoGraphRole;
  clientId: string;
}) {
  const edgeId = `${params.from.id}->${params.to.id}`;
  const current = params.edges.get(edgeId);

  if (current) {
    current.clientIds = Array.from(new Set([...current.clientIds, params.clientId]));
    return;
  }

  params.edges.set(edgeId, {
    id: edgeId,
    fromId: params.from.id,
    toId: params.to.id,
    fromRole: params.fromRole,
    toRole: params.toRole,
    clientIds: [params.clientId],
  });
}

const roleOrder: Record<EquipoGraphRole, number> = {
  socio: 0,
  gerente: 1,
  senior: 2,
  staff: 3,
};

export async function getEquipoGraphParaEmpleado(empleadoId: string): Promise<EquipoGraphData> {
  const visibilityWhere = await getClienteVisibilityWhere(empleadoId);

  if (!visibilityWhere) {
    return { nodes: [], edges: [], clients: {} };
  }

  const clientes = await prisma.refEmpresa.findMany({
    where: visibilityWhere,
    orderBy: { razonSocial: 'asc' },
    select: {
      id: true,
      razonSocial: true,
      nit: true,
      equipos: {
        where: { activo: true },
        select: {
          socio: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          gerente: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          senior: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
          staffs: {
            where: { activo: true },
            select: {
              id: true,
              staff: { select: { id: true, nombreCompleto: true, cargoNombre: true, rolAplicacion: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  const nodes = new Map<string, EquipoGraphNode>();
  const edges = new Map<string, EquipoGraphEdge>();
  const clients: Record<string, EquipoGraphClient> = {};

  for (const cliente of clientes) {
    const equipo = cliente.equipos[0];

    if (!equipo) {
      continue;
    }

    clients[cliente.id] = {
      id: cliente.id,
      razonSocial: cliente.razonSocial,
      nit: cliente.nit,
    };

    addNode(nodes, equipo.socio, 'socio', cliente.id);
    addNode(nodes, equipo.gerente, 'gerente', cliente.id);
    addNode(nodes, equipo.senior, 'senior', cliente.id);

    addEdge({ edges, from: equipo.socio, to: equipo.gerente, fromRole: 'socio', toRole: 'gerente', clientId: cliente.id });
    addEdge({ edges, from: equipo.gerente, to: equipo.senior, fromRole: 'gerente', toRole: 'senior', clientId: cliente.id });

    for (const item of equipo.staffs) {
      addNode(nodes, item.staff, 'staff', cliente.id);
      addEdge({ edges, from: equipo.senior, to: item.staff, fromRole: 'senior', toRole: 'staff', clientId: cliente.id });
    }
  }

  return {
    nodes: Array.from(nodes.values()).sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.nombreCompleto.localeCompare(b.nombreCompleto)),
    edges: Array.from(edges.values()).sort((a, b) => roleOrder[a.fromRole] - roleOrder[b.fromRole] || a.id.localeCompare(b.id)),
    clients,
  };
}
