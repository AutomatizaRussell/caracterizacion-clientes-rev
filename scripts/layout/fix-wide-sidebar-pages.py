from pathlib import Path
import re

TARGETS = [
    Path('src/app/revision/[solicitudId]/asociacion/page.tsx'),
    Path('src/app/revision/[solicitudId]/page.tsx'),
    Path('src/app/equipo/page.tsx'),
]

# El script anterior pudo dejar estas palabras como texto renderizado dentro del
# AppShell. Se eliminan primero y luego se insertan como props reales.
def remove_rendered_tokens(text: str) -> str:
    text = re.sub(r'\n\s*defaultSidebarCollapsed\s*\n\s*wideContent\s*\n', '\n', text)
    text = re.sub(r'\n\s*defaultSidebarCollapsed wideContent\s*\n', '\n', text)
    return text

def add_props_to_first_appshell(text: str) -> str:
    match = re.search(r'<AppShell\b[\s\S]*?>', text)
    if not match:
        return text

    tag = match.group(0)
    clean_tag = tag
    clean_tag = clean_tag.replace('defaultSidebarCollapsed', '')
    clean_tag = clean_tag.replace('wideContent', '')
    clean_tag = clean_tag.replace('\n      \n', '\n')

    insert = '\n      defaultSidebarCollapsed\n      wideContent'
    if clean_tag.endswith('>'):
        clean_tag = clean_tag[:-1].rstrip() + insert + '\n    >'

    return text[:match.start()] + clean_tag + text[match.end():]

for path in TARGETS:
    if not path.exists():
        print(f'[SKIP] No existe: {path}')
        continue

    text = path.read_text()
    text = remove_rendered_tokens(text)
    text = add_props_to_first_appshell(text)
    path.write_text(text)
    print(f'[OK] AppShell ancho/collapsed corregido en {path}')

# Ajuste específico para /equipo: el mapa no debe forzar scroll vertical innecesario
# por min-height excesivo cuando el sidebar ya está colapsado.
equipo_flow = Path('src/components/equipo/EquipoFlowClient.tsx')
if equipo_flow.exists():
    text = equipo_flow.read_text()
    text = text.replace(
        'h-[calc(100vh-12rem)] min-h-[680px]',
        'h-[calc(100vh-16rem)] min-h-[520px]',
    )
    text = text.replace(
        'md:h-[780px]',
        'md:h-[calc(100vh-14rem)]',
    )
    equipo_flow.write_text(text)
    print('[OK] Altura del mapa de equipo ajustada para reducir scroll innecesario.')
