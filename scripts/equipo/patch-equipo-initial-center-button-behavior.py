from pathlib import Path

path = Path('src/components/equipo/EquipoFlowClient.tsx')
text = path.read_text()

# Add refs that isolate initial auto-centering from hover/click state changes.
needle = "  const hasInitializedViewRef = useRef(false);"
insert = """  const hasInitializedViewRef = useRef(false);
  const hasAutoCenteredOnOpenRef = useRef(false);
  const userInteractedRef = useRef(false);
  const centerCurrentUserRef = useRef<() => void>(() => undefined);"""
if needle in text and 'const centerCurrentUserRef = useRef<() => void>(() => undefined);' not in text:
    text = text.replace(needle, insert, 1)

# Add a one-shot delayed auto-center that calls the same function as the button,
# but cancels if the user starts interacting with the map.
needle = """  }, [currentEmpleadoId, flowModel.nodes, reactFlow]);"""
insert_after = """  }, [currentEmpleadoId, flowModel.nodes, reactFlow]);

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
  }, []);"""
if insert_after not in text and needle in text:
    text = text.replace(needle, insert_after, 1)

# Mark user interaction on hover/click/pane click. This prevents delayed retries from
# forcing the viewport back to the current user after the user has started navigating.
text = text.replace(
    "  const handleNodeMouseEnter: NodeMouseHandler = (_event, node) => {\n    if (node.type !== 'person') return;",
    "  const handleNodeMouseEnter: NodeMouseHandler = (_event, node) => {\n    userInteractedRef.current = true;\n\n    if (node.type !== 'person') return;",
)

text = text.replace(
    "  const handleNodeClick: NodeMouseHandler = (_event, node) => {\n    if (node.type !== 'person') return;",
    "  const handleNodeClick: NodeMouseHandler = (_event, node) => {\n    userInteractedRef.current = true;\n\n    if (node.type !== 'person') return;",
)

text = text.replace(
    "          onPaneClick={() => {\n            setTooltip(null);",
    "          onMoveStart={() => {\n            userInteractedRef.current = true;\n          }}\n          onPaneClick={() => {\n            userInteractedRef.current = true;\n            setTooltip(null);",
)

path.write_text(text)
print('[OK] Initial auto-center now calls the same centering function as the button, only while opening the page.')
