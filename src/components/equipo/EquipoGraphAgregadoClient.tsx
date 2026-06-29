'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { EquipoGraphData, EquipoGraphNode, EquipoGraphRole } from '@/server/equipo';

type EquipoGraphAgregadoClientProps = {
  graph: EquipoGraphData;
  currentEmpleadoId: string;
};


type PositionedNode = EquipoGraphNode & {
  x: number;
  y: number;
};

const roleMeta: Record<
  EquipoGraphRole,
  {
    label: string;
    avatarClass: string;
    borderClass: string;
    levelTitle: string;
  }
> = {
  socio: {
    label: 'Socio',
    levelTitle: 'Socios',
    avatarClass: 'bg-[#830887]/10 text-[#830887] ring-[#830887]/25',
    borderClass: 'border-[#830887]/25',
  },
  gerente: {
    label: 'Gerente',
    levelTitle: 'Gerentes',
    avatarClass: 'bg-[#041461]/10 text-[#041461] ring-[#041461]/25',
    borderClass: 'border-[#041461]/20',
  },
  senior: {
    label: 'Senior',
    levelTitle: 'Seniors',
    avatarClass: 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/25',
    borderClass: 'border-[#0ccba9]/25',
  },
  staff: {
    label: 'Staff',
    levelTitle: 'Staff / Asistentes',
    avatarClass: 'bg-slate-100 text-slate-600 ring-slate-200',
    borderClass: 'border-slate-200',
  },
};

const roleOrder: EquipoGraphRole[] = ['socio', 'gerente', 'senior', 'staff'];
const nodeWidth = 230;
const nodeHeight = 124;
const horizontalGap = 54;
const verticalGap = 112;
const topOffset = 86;
const leftOffset = 48;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';

  return `${first}${second}`.toUpperCase();
}

function getRoleLabel(node: EquipoGraphNode) {
  return node.cargoNombre ?? node.rolAplicacion ?? roleMeta[node.role].label;
}

function buildPositionedNodes(nodes: EquipoGraphNode[]) {
  const nodesByRole = new Map<EquipoGraphRole, EquipoGraphNode[]>();

  for (const role of roleOrder) {
    nodesByRole.set(
      role,
      nodes
        .filter((node) => node.role === role)
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    );
  }

  const maxNodesInLevel = Math.max(
    1,
    ...roleOrder.map((role) => nodesByRole.get(role)?.length ?? 0),
  );

  const width =
    leftOffset * 2 +
    maxNodesInLevel * nodeWidth +
    (maxNodesInLevel - 1) * horizontalGap;

  const height =
    topOffset * 2 +
    roleOrder.length * nodeHeight +
    (roleOrder.length - 1) * verticalGap;

  const positioned = new Map<string, PositionedNode>();

  for (const [roleIndex, role] of roleOrder.entries()) {
    const roleNodes = nodesByRole.get(role) ?? [];
    const levelWidth =
      roleNodes.length * nodeWidth +
      Math.max(0, roleNodes.length - 1) * horizontalGap;

    const startX = leftOffset + Math.max(0, (width - leftOffset * 2 - levelWidth) / 2);
    const y = topOffset + roleIndex * (nodeHeight + verticalGap);

    for (const [nodeIndex, node] of roleNodes.entries()) {
      const x = startX + nodeIndex * (nodeWidth + horizontalGap);
      positioned.set(node.id, { ...node, x, y });
    }
  }

  return { positioned, width, height };
}

function getPath(from: PositionedNode, to: PositionedNode) {
  const startX = from.x + nodeWidth / 2;
  const startY = from.y + nodeHeight;
  const endX = to.x + nodeWidth / 2;
  const endY = to.y;
  const controlOffset = Math.max(70, (endY - startY) / 2);

  return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
}

function NodeCard({
  node,
  isCurrentUser,
  clients,
  onClick,
}: {
  node: PositionedNode;
  isCurrentUser: boolean;
  clients: Array<{ id: string; razonSocial: string; nit: string }>;
  onClick: () => void;
}) {
  const meta = roleMeta[node.role];
  const visibleClients = clients.slice(0, 5);
  const remainingClients = Math.max(0, clients.length - visibleClients.length);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group absolute rounded-[1.25rem] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${meta.borderClass} ${
        isCurrentUser ? 'ring-2 ring-[#0ccba9]' : 'ring-1 ring-slate-100'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: nodeWidth,
        minHeight: nodeHeight,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ${meta.avatarClass}`}
        >
          {getInitials(node.nombreCompleto)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-extrabold leading-5 text-[#041461]">
            {node.nombreCompleto}
          </p>
          <p className="mt-1 text-xs text-slate-500">{getRoleLabel(node)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wide">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 ring-1 ring-slate-200">
          {meta.label}
        </span>
        <span className="rounded-full bg-[#0ccba9]/10 px-2 py-1 text-[#079b85] ring-1 ring-[#0ccba9]/25">
          {clients.length} clientes
        </span>
        {isCurrentUser ? (
          <span className="rounded-full bg-[#041461] px-2 py-1 text-white">Tú</span>
        ) : null}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-30 hidden w-72 -translate-x-1/2 rounded-2xl bg-white p-4 text-left shadow-xl ring-1 ring-slate-200 group-hover:block">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
          Clientes relacionados
        </p>
        <p className="mt-1 text-sm font-extrabold text-[#041461]">
          {clients.length} clientes visibles
        </p>
        <div className="mt-3 space-y-1">
          {visibleClients.map((client) => (
            <p key={client.id} className="truncate text-xs text-slate-600">
              {client.razonSocial}
            </p>
          ))}
          {remainingClients > 0 ? (
            <p className="text-xs font-bold text-slate-400">+{remainingClients} más</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ClientsModal({
  node,
  clients,
  onClose,
}: {
  node: EquipoGraphNode;
  clients: Array<{ id: string; razonSocial: string; nit: string }>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[1.35rem] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Clientes relacionados
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#041461]">
            {node.nombreCompleto}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {roleMeta[node.role].label} · {clients.length} clientes visibles en el contexto actual.
          </p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-6">
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clientes/${client.id}`}
                className="block rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition hover:bg-[#0ccba9]/10"
              >
                <p className="text-sm font-extrabold text-[#041461]">{client.razonSocial}</p>
                <p className="mt-1 text-xs text-slate-500">NIT {client.nit}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}

export default function EquipoGraphAgregadoClient({
  graph,
  currentEmpleadoId,
}: EquipoGraphAgregadoClientProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { positioned, width, height } = useMemo(
    () => buildPositionedNodes(graph.nodes),
    [graph.nodes],
  );

  const selectedNode = selectedNodeId ? positioned.get(selectedNodeId) ?? null : null;

  const selectedClients = selectedNode
    ? selectedNode.clientIds.map((clientId) => graph.clients[clientId]).filter(Boolean)
    : [];

  return (
    <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Mi equipo
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-[#041461]">
          Mapa de equipo
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Pasa el cursor sobre una persona para ver un resumen. Haz clic para consultar sus clientes relacionados.
        </p>
      </div>

      <div className="mt-6 overflow-auto rounded-[1.35rem] bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="relative" style={{ width, height }}>
          {roleOrder.map((role, index) => (
            <div
              key={role}
              className="absolute left-0 right-0 text-center text-[11px] font-extrabold uppercase tracking-widest text-slate-400"
              style={{ top: topOffset + index * (nodeHeight + verticalGap) - 34 }}
            >
              {roleMeta[role].levelTitle}
            </div>
          ))}

          <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden="true">
            <defs>
              <marker id="arrow-equipo" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#94a3b8" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const from = positioned.get(edge.fromId);
              const to = positioned.get(edge.toId);

              if (!from || !to) return null;

              return (
                <path
                  key={edge.id}
                  d={getPath(from, to)}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  markerEnd="url(#arrow-equipo)"
                  opacity="0.8"
                />
              );
            })}
          </svg>

          {Array.from(positioned.values()).map((node) => {
            const clients = node.clientIds.map((clientId) => graph.clients[clientId]).filter(Boolean);

            return (
              <NodeCard
                key={node.id}
                node={node}
                clients={clients}
                isCurrentUser={node.id === currentEmpleadoId}
                onClick={() => setSelectedNodeId(node.id)}
              />
            );
          })}
        </div>
      </div>

      {selectedNode ? (
        <ClientsModal
          node={selectedNode}
          clients={selectedClients}
          onClose={() => setSelectedNodeId(null)}
        />
      ) : null}
    </section>
  );
}
