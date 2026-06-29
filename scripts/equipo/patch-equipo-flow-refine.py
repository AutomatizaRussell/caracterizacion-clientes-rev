from pathlib import Path

path = Path('src/components/equipo/EquipoFlowClient.tsx')
text = path.read_text()

# 1) Más separación vertical. No se modifica separación horizontal.
text = text.replace('const levelGap = 280;', 'const levelGap = 340;')

# 2) Quitar animación/dash de edges activos. La animación añadía ruido visual y podía acentuar parpadeo.
text = text.replace("        animated: activeEdges.has(edge.id),\n", "")
text = text.replace("        type: 'smoothstep',", "        type: 'step',")

# 3) Líneas más tipo organigrama, no curvas. Si el archivo ya fue parcheado, no duplica nada.
text = text.replace("type: 'smoothstep',", "type: 'step',")

# 4) Evitar recenter automático después del primer montaje.
if 'const hasInitializedViewRef = useRef(false);' not in text:
    text = text.replace(
        "  const enterTimeoutRef = useRef<number | null>(null);\n  const leaveTimeoutRef = useRef<number | null>(null);",
        "  const enterTimeoutRef = useRef<number | null>(null);\n  const leaveTimeoutRef = useRef<number | null>(null);\n  const hasInitializedViewRef = useRef(false);",
        1,
    )

old_effect = """  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (currentNodeExists) {
        centerCurrentUser();
      } else {
        reactFlow.fitView({ padding: 0.22, duration: 500 });
      }
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [centerCurrentUser, currentNodeExists, reactFlow]);"""

new_effect = """  useEffect(() => {
    if (hasInitializedViewRef.current) {
      return;
    }

    hasInitializedViewRef.current = true;

    const timeout = window.setTimeout(() => {
      if (currentNodeExists) {
        centerCurrentUser();
      } else {
        reactFlow.fitView({ padding: 0.22, duration: 500 });
      }
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [centerCurrentUser, currentNodeExists, reactFlow]);"""

if old_effect in text:
    text = text.replace(old_effect, new_effect, 1)
elif 'hasInitializedViewRef.current = true;' not in text:
    raise SystemExit('No se encontró el useEffect de inicialización esperado. Revisa manualmente EquipoFlowClient.tsx.')

# 5) Ajustar texto de instrucciones para no sugerir que el mapa se recentra solo.
text = text.replace(
    'Arrastra para explorar · usa zoom para acercar',
    'Arrastra para explorar · usa zoom para acercar',
)

# 6) Hacer labels de nivel un poco más visibles si existen como levelLabel.
text = text.replace(
    'text-[#475569] shadow-sm ring-1 ring-slate-200',
    'text-[#041461] shadow-sm ring-1 ring-slate-300',
)

path.write_text(text)
print('[OK] EquipoFlowClient.tsx refinado: sin recenter forzado, más separación vertical y edges tipo organigrama.')
