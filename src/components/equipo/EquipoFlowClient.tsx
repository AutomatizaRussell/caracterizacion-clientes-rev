
'use client';

import '@xyflow/react/dist/style.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react';
import type {
  EquipoGraphClient,
  EquipoGraphData,
  EquipoGraphNode,
  EquipoGraphRole,
} from '@/server/equipo';

type PersonNodeData = {
  node: EquipoGraphNode;
  clients: EquipoGraphClient[];
  isCurrentUser: boolean;
  label: string;
};

type BundleNodeData = {
  active: boolean;
};

type LevelLabelNodeData = {
  label: string;
};

type TooltipState = {
  nodeId: string;
  x: number;
  y: number;
} | null;

type PersonNode = Node<PersonNodeData, 'person'>;
type BundleNode = Node<BundleNodeData, 'bundle'>;
type LevelLabelNode = Node<LevelLabelNodeData, 'levelLabel'>;
type FlowNode = PersonNode | BundleNode | LevelLabelNode;

type EquipoFlowClientProps = {
  graph: EquipoGraphData;
  currentEmpleadoId: string;
  isAdmin: boolean;
};

const nodeWidth = 260;
const nodeHeight = 128;
const levelGap = 340;
const minNodeGap = 310;
const roleOrder: EquipoGraphRole[] = ['socio', 'gerente', 'senior', 'staff'];

const roleCopy: Record<
  EquipoGraphRole,
  {
    label: string;
    level: string;
    avatarClass: string;
    borderClass: string;
  }
> = {
  socio: {
    label: 'Socio',
    level: 'Socios',
    avatarClass: 'bg-[#830887]/10 text-[#830887] ring-[#830887]/25',
    borderClass: 'border-[#830887]/30',
  },
  gerente: {
    label: 'Gerente',
    level: 'Gerentes',
    avatarClass: 'bg-[#041461]/10 text-[#041461] ring-[#041461]/25',
    borderClass: 'border-[#041461]/20',
  },
  senior: {
    label: 'Senior',
    level: 'Seniors',
    avatarClass: 'bg-[#0ccba9]/10 text-[#079b85] ring-[#0ccba9]/25',
    borderClass: 'border-[#0ccba9]/30',
  },
  staff: {
    label: 'Staff',
    level: 'Staff / Asistentes',
    avatarClass: 'bg-slate-100 text-slate-600 ring-slate-200',
    borderClass: 'border-slate-200',
  },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';

  return `${first}${second}`.toUpperCase();
}

function roleLabel(node: EquipoGraphNode) {
  return node.cargoNombre ?? node.rolAplicacion ?? roleCopy[node.role].label;
}

function clientCounterLabel(params: {
  node: EquipoGraphNode;
  isCurrentUser: boolean;
  isAdmin: boolean;
}) {
  if (params.isAdmin) {
    return `${params.node.clientIds.length} clientes asociados`;
  }

  if (params.isCurrentUser) {
    return `${params.node.clientIds.length} clientes`;
  }

  return `${params.node.clientIds.length} clientes compartidos contigo`;
}

function PersonNodeComponent({ data }: NodeProps<PersonNode>) {
  const meta = roleCopy[data.node.role];

  return (
    <div
      className={`relative w-[260px] rounded-[1.35rem] border bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl ${meta.borderClass} ${
        data.isCurrentUser ? 'ring-2 ring-[#0ccba9]' : 'ring-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ${meta.avatarClass}`}
        >
          {initials(data.node.nombreCompleto)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-extrabold leading-5 text-[#041461]">
            {data.node.nombreCompleto}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{roleLabel(data.node)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wide">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 ring-1 ring-slate-200">
          {meta.label}
        </span>
        <span className="rounded-full bg-[#0ccba9]/10 px-2 py-1 text-[#079b85] ring-1 ring-[#0ccba9]/25">
          {data.label}
        </span>
        {data.isCurrentUser ? (
          <span className="rounded-full bg-[#041461] px-2 py-1 text-white">Tú</span>
        ) : null}
      </div>
    </div>
  );
}

function BundleNodeComponent({ data }: NodeProps<BundleNode>) {
  return (
    <div
      className={`relative h-4 w-4 rounded-full ring-2 ${
        data.active ? 'bg-[#0ccba9] ring-[#0ccba9]/30' : 'bg-slate-300 ring-slate-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
    </div>
  );
}

function LevelLabelNodeComponent({ data }: NodeProps<LevelLabelNode>) {
  return (
    <div className="pointer-events-none rounded-full bg-white px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#041461] shadow-md ring-1 ring-slate-300">
      {data.label}
    </div>
  );
}

const nodeTypes = {
  person: PersonNodeComponent,
  bundle: BundleNodeComponent,
  levelLabel: LevelLabelNodeComponent,
};

function getChildrenBySource(edges: EquipoGraphData['edges']) {
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    children.set(edge.fromId, [...(children.get(edge.fromId) ?? []), edge.toId]);
  }

  return children;
}

function getRoleNodes(graph: EquipoGraphData, role: EquipoGraphRole) {
  return graph.nodes
    .filter((node) => node.role === role)
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
}

function spreadAroundCenter(count: number) {
  const positions: number[] = [];
  const centerIndex = (count - 1) / 2;

  for (let index = 0; index < count; index += 1) {
    positions.push((index - centerIndex) * minNodeGap);
  }

  return positions;
}

function relaxLevelPositions(nodes: Array<{ id: string; x: number }>) {
  const sorted = [...nodes].sort((a, b) => a.x - b.x);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (current.x - previous.x < minNodeGap) {
      current.x = previous.x + minNodeGap;
    }
  }

  if (sorted.length > 0) {
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x;
    const center = (minX + maxX) / 2;

    for (const item of sorted) {
      item.x -= center;
    }
  }

  return new Map(sorted.map((item) => [item.id, item.x]));
}

function computeLayout(graph: EquipoGraphData, currentEmpleadoId: string) {
  const childrenBySource = getChildrenBySource(graph.edges);
  const xByNode = new Map<string, number>();

  for (const role of [...roleOrder].reverse()) {
    const roleNodes = getRoleNodes(graph, role);

    if (role === 'staff') {
      const ordered = [...roleNodes].sort((a, b) => {
        if (a.id === currentEmpleadoId) return -1;
        if (b.id === currentEmpleadoId) return 1;
        return a.nombreCompleto.localeCompare(b.nombreCompleto);
      });
      const positions = spreadAroundCenter(ordered.length);
      ordered.forEach((node, index) => xByNode.set(node.id, positions[index] ?? 0));
      continue;
    }

    const provisional = roleNodes.map((node) => {
      const childIds = childrenBySource.get(node.id) ?? [];
      const childXs = childIds
        .map((childId) => xByNode.get(childId))
        .filter((value): value is number => typeof value === 'number');

      const x = childXs.length > 0
        ? childXs.reduce((total, value) => total + value, 0) / childXs.length
        : 0;

      return { id: node.id, x };
    });

    const relaxed = relaxLevelPositions(provisional);

    for (const [nodeId, x] of relaxed.entries()) {
      xByNode.set(nodeId, x);
    }
  }

  const currentX = xByNode.get(currentEmpleadoId) ?? 0;

  for (const [nodeId, x] of xByNode.entries()) {
    xByNode.set(nodeId, x - currentX);
  }

  const nodes = graph.nodes.map((node) => {
    const roleIndex = roleOrder.indexOf(node.role);
    return {
      node,
      x: xByNode.get(node.id) ?? 0,
      y: roleIndex * levelGap,
    };
  });

  return { positioned: nodes };
}

function getRelatedEdgeIds(edges: EquipoGraphData['edges'], activeNodeId: string | null) {
  const relatedEdgeIds = new Set<string>();

  if (!activeNodeId) return relatedEdgeIds;

  const outgoingByNode = new Map<string, EquipoGraphData['edges']>();
  const incomingByNode = new Map<string, EquipoGraphData['edges']>();

  for (const edge of edges) {
    outgoingByNode.set(edge.fromId, [...(outgoingByNode.get(edge.fromId) ?? []), edge]);
    incomingByNode.set(edge.toId, [...(incomingByNode.get(edge.toId) ?? []), edge]);
  }

  const visitedDown = new Set<string>();
  const visitedUp = new Set<string>();

  function walkDown(nodeId: string) {
    if (visitedDown.has(nodeId)) return;
    visitedDown.add(nodeId);

    for (const edge of outgoingByNode.get(nodeId) ?? []) {
      relatedEdgeIds.add(edge.id);
      walkDown(edge.toId);
    }
  }

  function walkUp(nodeId: string) {
    if (visitedUp.has(nodeId)) return;
    visitedUp.add(nodeId);

    for (const edge of incomingByNode.get(nodeId) ?? []) {
      relatedEdgeIds.add(edge.id);
      walkUp(edge.fromId);
    }
  }

  walkDown(activeNodeId);
  walkUp(activeNodeId);

  return relatedEdgeIds;
}

function buildFlowModel(params: {
  graph: EquipoGraphData;
  currentEmpleadoId: string;
  activeNodeId: string | null;
  isAdmin: boolean;
}) {
  const layout = computeLayout(params.graph, params.currentEmpleadoId);
  const positionedById = new Map(layout.positioned.map((item) => [item.node.id, item]));
  const activeEdges = getRelatedEdgeIds(params.graph.edges, params.activeNodeId);

  const nodes: FlowNode[] = layout.positioned.map((item) => {
    const clients = item.node.clientIds
      .map((clientId) => params.graph.clients[clientId])
      .filter(Boolean);

    return {
      id: item.node.id,
      type: 'person',
      position: { x: item.x, y: item.y },
      data: {
        node: item.node,
        clients,
        isCurrentUser: item.node.id === params.currentEmpleadoId,
        label: clientCounterLabel({
          node: item.node,
          isCurrentUser: item.node.id === params.currentEmpleadoId,
          isAdmin: params.isAdmin,
        }),
      },
      draggable: false,
      selectable: true,
    } satisfies PersonNode;
  });

  for (const [index, role] of roleOrder.entries()) {
    const roleNodes = layout.positioned.filter((item) => item.node.role === role);
    const averageCenterX =
      roleNodes.length > 0
        ? roleNodes.reduce((total, item) => total + item.x + nodeWidth / 2, 0) /
          roleNodes.length
        : -10;

    /*
     * La etiqueta del nivel no debe quedar pegada al borde izquierdo del canvas
     * ni encima de nodos aleatorios. Se ubica cerca del centro del tronco visual
     * del nivel, ligeramente a la izquierda, y por encima de las conexiones.
     */
    nodes.push({
      id: `label:${role}`,
      type: 'levelLabel',
      position: { x: averageCenterX - 118, y: index * levelGap - 58 },
      data: { label: roleCopy[role].level },
      draggable: false,
      selectable: false,
      zIndex: 1000,
    } satisfies LevelLabelNode);
  }

  const edges: Edge[] = [];

  for (const source of layout.positioned) {
    const outgoing = params.graph.edges.filter((edge) => edge.fromId === source.node.id);

    if (outgoing.length === 0) continue;

    if (outgoing.length <= 1) {
      const edge = outgoing[0];
      const isActive = activeEdges.size === 0 || activeEdges.has(edge.id);
      edges.push({
        id: edge.id,
        source: edge.fromId,
        target: edge.toId,
        type: 'step',
        style: {
          stroke: activeEdges.has(edge.id) ? '#0ccba9' : '#a6b1c6',
          strokeWidth: activeEdges.has(edge.id) ? 3 : 1.5,
          opacity: isActive ? 0.72 : 0.08,
        },
      });
      continue;
    }

    const targets = outgoing
      .map((edge) => positionedById.get(edge.toId))
      .filter((target): target is NonNullable<typeof target> => Boolean(target));

    if (targets.length === 0) continue;

    const bundleId = `bundle:${source.node.id}`;
    const minTargetY = Math.min(...targets.map((target) => target.y));
    const bundleY = source.y + (minTargetY - source.y) / 2 + 95;
    const bundleActive = outgoing.some((edge) => activeEdges.has(edge.id));

    nodes.push({
      id: bundleId,
      type: 'bundle',
      position: { x: source.x + nodeWidth / 2 - 8, y: bundleY },
      data: { active: bundleActive },
      draggable: false,
      selectable: false,
    } satisfies BundleNode);

    edges.push({
      id: `${source.node.id}->${bundleId}`,
      source: source.node.id,
      target: bundleId,
      type: 'step',
      style: {
        stroke: bundleActive ? '#0ccba9' : '#a6b1c6',
        strokeWidth: bundleActive ? 3 : 1.5,
        opacity: activeEdges.size === 0 || bundleActive ? 0.55 : 0.08,
      },
    });

    for (const edge of outgoing) {
      const isActive = activeEdges.size === 0 || activeEdges.has(edge.id);
      edges.push({
        id: `${bundleId}->${edge.toId}`,
        source: bundleId,
        target: edge.toId,
        type: 'step',
        style: {
          stroke: activeEdges.has(edge.id) ? '#0ccba9' : '#a6b1c6',
          strokeWidth: activeEdges.has(edge.id) ? 3 : 1.5,
          opacity: isActive ? 0.62 : 0.08,
        },
      });
    }
  }

  return { nodes, edges };
}

function Tooltip({
  tooltip,
  graph,
  isAdmin,
  currentEmpleadoId,
}: {
  tooltip: TooltipState;
  graph: EquipoGraphData;
  isAdmin: boolean;
  currentEmpleadoId: string;
}) {
  if (!tooltip) return null;

  const node = graph.nodes.find((item) => item.id === tooltip.nodeId);
  if (!node) return null;

  const clients = node.clientIds.map((clientId) => graph.clients[clientId]).filter(Boolean);
  const label = clientCounterLabel({ node, isCurrentUser: node.id === currentEmpleadoId, isAdmin });

  return (
    <div
      className="pointer-events-none fixed z-[220] w-80 -translate-x-1/2 -translate-y-full rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-[#041461]">{node.nombreCompleto}</p>
      <div className="mt-3 space-y-1">
        {clients.slice(0, 5).map((client) => (
          <p key={client.id} className="truncate text-xs text-slate-600">
            {client.razonSocial}
          </p>
        ))}
        {clients.length > 5 ? <p className="text-xs font-bold text-slate-400">+{clients.length - 5} más</p> : null}
      </div>
    </div>
  );
}

function ClientsModal({
  node,
  clients,
  isAdmin,
  currentEmpleadoId,
  onClose,
}: {
  node: EquipoGraphNode;
  clients: EquipoGraphClient[];
  isAdmin: boolean;
  currentEmpleadoId: string;
  onClose: () => void;
}) {
  const title = node.id === currentEmpleadoId ? 'Tus clientes' : isAdmin ? 'Clientes asociados' : 'Clientes compartidos contigo';

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[1.35rem] bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#041461]">{node.nombreCompleto}</h2>
          <p className="mt-1 text-sm text-slate-500">{clients.length} clientes</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-6">
          <div className="space-y-2">
            {clients.map((client) => (
              <Link key={client.id} href={`/clientes/${client.id}`} className="block rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition hover:bg-[#0ccba9]/10">
                <p className="text-sm font-extrabold text-[#041461]">{client.razonSocial}</p>
                <p className="mt-1 text-xs text-slate-500">NIT {client.nit}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 text-right">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10">
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}

function EquipoFlowInner({ graph, currentEmpleadoId, isAdmin }: EquipoFlowClientProps) {
  const reactFlow = useReactFlow();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(currentEmpleadoId);
  const enterTimeoutRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);
  const hasInitializedViewRef = useRef(false);
  const hasAutoCenteredOnOpenRef = useRef(false);
  const userInteractedRef = useRef(false);
  const centerCurrentUserRef = useRef<() => void>(() => undefined);

  const currentNodeExists = graph.nodes.some((node) => node.id === currentEmpleadoId);

  const flowModel = useMemo(
    () =>
      buildFlowModel({
        graph,
        currentEmpleadoId,
        activeNodeId,
        isAdmin,
      }),
    [activeNodeId, currentEmpleadoId, graph, isAdmin],
  );

  const selectedNode = selectedNodeId ? graph.nodes.find((node) => node.id === selectedNodeId) ?? null : null;
  const selectedClients = selectedNode ? selectedNode.clientIds.map((clientId) => graph.clients[clientId]).filter(Boolean) : [];

  const centerCurrentUser = useCallback(() => {
    const currentNode = flowModel.nodes.find((node) => node.id === currentEmpleadoId);
    if (!currentNode) {
      reactFlow.fitView({ padding: 0.22, duration: 500 });
      return;
    }

    const isMobile = window.innerWidth < 768;
    reactFlow.setCenter(
      currentNode.position.x + nodeWidth / 2,
      currentNode.position.y + nodeHeight / 2,
      { zoom: isMobile ? 0.7 : 0.95, duration: 500 },
    );
  }, [currentEmpleadoId, flowModel.nodes, reactFlow]);

  useEffect(() => {
    centerCurrentUserRef.current = centerCurrentUser;
  }, [centerCurrentUser]);

  useEffect(() => {
    if (hasAutoCenteredOnOpenRef.current) {
      return;
    }

    hasAutoCenteredOnOpenRef.current = true;

    /*
     * Calls the exact same centering behavior used by the "Centrar en mí" button,
     * but only during the initial page opening. React Flow can need several frames
     * before the viewport has stable dimensions, so this retries briefly.
     *
     * If the user starts dragging, clicking, hovering or otherwise exploring the map,
     * later retries are ignored to avoid pulling the user back to the current node.
     */
    const delays = [250, 700, 1200, 2000];
    const timeouts = delays.map((delay) =>
      window.setTimeout(() => {
        if (!userInteractedRef.current) {
          centerCurrentUserRef.current();
        }
      }, delay),
    );

    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    if (hasInitializedViewRef.current) {
      return;
    }

    const currentNode = flowModel.nodes.find((node) => node.id === currentEmpleadoId);

    if (currentNodeExists && !currentNode) {
      return;
    }

    hasInitializedViewRef.current = true;

    /*
     * React Flow puede tardar un poco en tener el viewport y las dimensiones
     * internas listas, aunque los nodos ya estén calculados. Por eso el centrado
     * inicial se intenta varias veces en una ventana corta.
     *
     * Importante: esto solo ocurre al abrir la página. Después, el usuario puede
     * navegar libremente por el mapa y solo vuelve al nodo propio si usa el botón
     * "Centrar en mí".
     */
    const delays = [80, 220, 520];
    const timeouts = delays.map((delay) =>
      window.setTimeout(() => {
        if (currentNodeExists) {
          centerCurrentUser();
        } else {
          reactFlow.fitView({ padding: 0.22, duration: 500 });
        }
      }, delay),
    );

    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [
    centerCurrentUser,
    currentEmpleadoId,
    currentNodeExists,
    flowModel.nodes,
    reactFlow,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedNodeId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) window.clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) window.clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleNodeMouseEnter: NodeMouseHandler = (_event, node) => {
    userInteractedRef.current = true;

    if (node.type !== 'person') return;

    if (leaveTimeoutRef.current) window.clearTimeout(leaveTimeoutRef.current);
    if (enterTimeoutRef.current) window.clearTimeout(enterTimeoutRef.current);

    enterTimeoutRef.current = window.setTimeout(() => {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      const rect = element?.getBoundingClientRect();

      if (!rect) return;

      setActiveNodeId(node.id);
      setTooltip({ nodeId: node.id, x: rect.left + rect.width / 2, y: rect.top - 12 });
    }, 120);
  };

  const handleNodeMouseLeave: NodeMouseHandler = () => {
    if (enterTimeoutRef.current) window.clearTimeout(enterTimeoutRef.current);

    leaveTimeoutRef.current = window.setTimeout(() => {
      setTooltip(null);
      setActiveNodeId(selectedNodeId ?? (currentNodeExists ? currentEmpleadoId : null));
    }, 140);
  };

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    userInteractedRef.current = true;

    if (node.type !== 'person') return;

    if (enterTimeoutRef.current) window.clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) window.clearTimeout(leaveTimeoutRef.current);

    setTooltip(null);
    setSelectedNodeId(node.id);
    setActiveNodeId(node.id);
  };

  return (
    <section className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="relative h-[calc(100vh-12rem)] min-h-[680px] overflow-hidden rounded-[1.35rem] bg-slate-50 ring-1 ring-slate-200 touch-none">
        <ReactFlow
          nodes={flowModel.nodes}
          edges={flowModel.edges}
          nodeTypes={nodeTypes}
          fitView={false}
          minZoom={0.25}
          maxZoom={1.6}
          panOnDrag
          zoomOnPinch
          zoomOnScroll
          panOnScroll={false}
          selectionOnDrag={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onNodeClick={handleNodeClick}
          onMoveStart={() => {
            userInteractedRef.current = true;
          }}
          onPaneClick={() => {
            userInteractedRef.current = true;
            setTooltip(null);
            setSelectedNodeId(null);
            setActiveNodeId(currentNodeExists ? currentEmpleadoId : null);
          }}
        >
          <Background color="#dbe2ee" gap={26} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-600 shadow-sm ring-1 ring-slate-200">
          Arrastra para explorar · usa zoom para acercar
        </div>

        <div className="absolute right-4 top-4 z-20 flex flex-wrap gap-2">
          {currentNodeExists ? (
            <button type="button" onClick={centerCurrentUser} className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] shadow-sm hover:border-[#0ccba9] hover:bg-[#0ccba9]/10">
              Centrar en mí
            </button>
          ) : null}
          <button type="button" onClick={() => reactFlow.fitView({ padding: 0.18, duration: 500 })} className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] shadow-sm hover:border-[#0ccba9] hover:bg-[#0ccba9]/10">
            Ver todo
          </button>
        </div>
      </div>

      <Tooltip tooltip={tooltip} graph={graph} isAdmin={isAdmin} currentEmpleadoId={currentEmpleadoId} />

      {selectedNode ? (
        <ClientsModal
          node={selectedNode}
          clients={selectedClients}
          isAdmin={isAdmin}
          currentEmpleadoId={currentEmpleadoId}
          onClose={() => setSelectedNodeId(null)}
        />
      ) : null}
    </section>
  );
}

export default function EquipoFlowClient(props: EquipoFlowClientProps) {
  return (
    <ReactFlowProvider>
      <EquipoFlowInner {...props} />
    </ReactFlowProvider>
  );
}
