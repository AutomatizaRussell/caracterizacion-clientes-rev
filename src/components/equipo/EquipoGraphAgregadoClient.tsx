'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EquipoNodeCard from './EquipoNodeCard';
import type { EquipoGraphData, EquipoGraphNode, EquipoGraphRole } from '@/server/equipo';

type Selection =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string };

type EquipoGraphAgregadoClientProps = {
  graph: EquipoGraphData;
};

const columns: Array<{ role: EquipoGraphRole; title: string }> = [
  { role: 'socio', title: 'Socios' },
  { role: 'gerente', title: 'Gerentes' },
  { role: 'senior', title: 'Seniors' },
  { role: 'staff', title: 'Staff / Asistentes' },
];

function nodeRoleTitle(node?: EquipoGraphNode) {
  if (!node) return 'Selección';
  return `${node.nombreCompleto} · ${node.cargoNombre ?? node.rolAplicacion}`;
}

export default function EquipoGraphAgregadoClient({ graph }: EquipoGraphAgregadoClientProps) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const nodesById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const edgesById = useMemo(() => new Map(graph.edges.map((edge) => [edge.id, edge])), [graph.edges]);

  const selectedClientIds = useMemo(() => {
    if (!selection) return [];

    if (selection.type === 'node') {
      return nodesById.get(selection.id)?.clientIds ?? [];
    }

    return edgesById.get(selection.id)?.clientIds ?? [];
  }, [edgesById, nodesById, selection]);

  const selectedTitle = useMemo(() => {
    if (!selection) return 'Selecciona un nodo o relación';

    if (selection.type === 'node') {
      return nodeRoleTitle(nodesById.get(selection.id));
    }

    const edge = edgesById.get(selection.id);
    const from = edge ? nodesById.get(edge.fromId) : null;
    const to = edge ? nodesById.get(edge.toId) : null;

    return from && to ? `${from.nombreCompleto} → ${to.nombreCompleto}` : 'Relación';
  }, [edgesById, nodesById, selection]);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mi equipo</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#041461]">Grafo agregado por personas</h2>
          <p className="mt-1 text-sm text-slate-500">Los nodos de una misma persona convergen: si un Staff trabaja con varios Seniors, el Staff aparece una sola vez.</p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const columnNodes = graph.nodes.filter((node) => node.role === column.role);

            return (
              <div key={column.role} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{column.title}</p>
                <div className="space-y-3">
                  {columnNodes.map((node) => {
                    const incomingEdges = graph.edges.filter((edge) => edge.toId === node.id);
                    const outgoingEdges = graph.edges.filter((edge) => edge.fromId === node.id);

                    return (
                      <div key={node.id} className="space-y-2">
                        <EquipoNodeCard
                          node={node}
                          isSelected={selection?.type === 'node' && selection.id === node.id}
                          onSelect={() => setSelection({ type: 'node', id: node.id })}
                          incomingCount={incomingEdges.length}
                          outgoingCount={outgoingEdges.length}
                        />

                        {outgoingEdges.length > 0 ? (
                          <div className="space-y-1 pl-3">
                            {outgoingEdges.map((edge) => {
                              const target = nodesById.get(edge.toId);
                              return target ? (
                                <button
                                  key={edge.id}
                                  type="button"
                                  onClick={() => setSelection({ type: 'edge', id: edge.id })}
                                  className={`block w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold text-slate-600 ring-1 transition hover:bg-[#0ccba9]/10 ${selection?.type === 'edge' && selection.id === edge.id ? 'bg-[#0ccba9]/10 ring-[#0ccba9]/30' : 'bg-white ring-slate-200'}`}
                                >
                                  → {target.nombreCompleto} · {edge.clientIds.length} clientes
                                </button>
                              ) : null;
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {columnNodes.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">Sin nodos visibles</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:sticky xl:top-6 xl:self-start">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Detalle</p>
        <h2 className="mt-1 text-lg font-extrabold text-[#041461]">{selectedTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">Clientes asociados al nodo o a la relación seleccionada.</p>

        <div className="mt-5 space-y-2">
          {selectedClientIds.map((clientId) => {
            const client = graph.clients[clientId];
            return client ? (
              <Link key={client.id} href={`/clientes/${client.id}`} className="block rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition hover:bg-[#0ccba9]/10">
                <p className="text-sm font-extrabold text-[#041461]">{client.razonSocial}</p>
                <p className="mt-1 text-xs text-slate-500">NIT {client.nit}</p>
              </Link>
            ) : null;
          })}

          {selectedClientIds.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">Selecciona un nodo o una relación para ver clientes.</p> : null}
        </div>
      </aside>
    </section>
  );
}
