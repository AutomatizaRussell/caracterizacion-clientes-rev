from pathlib import Path

path = Path('src/components/revision/AssociationWorkspaceClient.tsx')
text = path.read_text()

text = text.replace(
    'xl:grid-cols-[360px_minmax(0,1fr)_380px]',
    'lg:grid-cols-[minmax(280px,0.85fr)_minmax(360px,1.15fr)_minmax(300px,0.9fr)]',
)
text = text.replace('min-h-[760px]', 'min-h-[620px]')
text = text.replace('max-h-[680px]', 'max-h-[calc(100vh-26rem)]')

path.write_text(text)
print('[OK] Grid de asociación ajustado para zoom alto.')
