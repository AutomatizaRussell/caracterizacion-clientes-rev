from pathlib import Path

paths = [
    Path('src/app/revision/[solicitudId]/asociacion/page.tsx'),
    Path('src/app/revision/[solicitudId]/page.tsx'),
    Path('src/app/equipo/page.tsx'),
]

for path in paths:
    if not path.exists():
        print(f'[SKIP] No existe: {path}')
        continue

    text = path.read_text()

    if 'defaultSidebarCollapsed' in text:
        print(f'[OK] Ya tiene defaultSidebarCollapsed: {path}')
        continue

    marker = 'pageDescription='
    idx = text.find(marker)
    if idx == -1:
        print(f'[WARN] No encontré pageDescription en {path}; parche manual requerido.')
        continue

    # Inserta props después de la línea pageDescription más cercana.
    line_end = text.find('\n', idx)
    if line_end == -1:
        print(f'[WARN] No encontré fin de línea pageDescription en {path}; parche manual requerido.')
        continue

    insertion = '\n      defaultSidebarCollapsed\n      wideContent'
    text = text[:line_end] + insertion + text[line_end:]
    path.write_text(text)
    print(f'[OK] Sidebar colapsada por defecto y ancho extendido en {path}')
