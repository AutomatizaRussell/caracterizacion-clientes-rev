from pathlib import Path

path = Path('src/components/equipo/EquipoFlowClient.tsx')
text = path.read_text()

old_component = """function LevelLabelNodeComponent({ data }: NodeProps<LevelLabelNode>) {
  return (
    <div className=\"rounded-full bg-white/95 px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#041461] shadow-sm ring-1 ring-slate-300\">
      {data.label}
    </div>
  );
}"""

new_component = """function LevelLabelNodeComponent({ data }: NodeProps<LevelLabelNode>) {
  return (
    <div className=\"pointer-events-none rounded-full bg-white px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#041461] shadow-md ring-1 ring-slate-300\">
      {data.label}
    </div>
  );
}"""

if old_component not in text:
    raise SystemExit('No se encontró LevelLabelNodeComponent esperado. Revisa si el archivo cambió.')

text = text.replace(old_component, new_component, 1)

old_loop = """  for (const [index, role] of roleOrder.entries()) {
    nodes.push({
      id: `label:${role}`,
      type: 'levelLabel',
      position: { x: -90, y: index * levelGap - 52 },
      data: { label: roleCopy[role].level },
      draggable: false,
      selectable: false,
    } satisfies LevelLabelNode);
  }"""

new_loop = """  for (const [index, role] of roleOrder.entries()) {
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
  }"""

if old_loop not in text:
    raise SystemExit('No se encontró el loop de etiquetas de nivel esperado. Revisa si el archivo cambió.')

text = text.replace(old_loop, new_loop, 1)

path.write_text(text)
print('[OK] Etiquetas de nivel reposicionadas: centradas en el nivel, un poco a la izquierda del tronco y por encima de líneas.')
