from pathlib import Path

path = Path("src/app/solicitudes/page.tsx")
text = path.read_text()

# 1) Progreso visible en porcentaje.
text = text.replace(
    '        <span className="shrink-0 text-slate-500">\n          {progress.primaryCount}/{progress.totalItems}\n        </span>',
    '        <span className="shrink-0 text-slate-500">\n          {Math.round(progress.percent)}%\n        </span>',
)

# 2) Los botones deben interceptar clicks para que la tarjeta no navegue al hacer click sobre ellos.
text = text.replace(
    '    <div className="relative z-30 grid w-full grid-cols-2 gap-2">',
    '    <div className="pointer-events-auto relative z-30 grid w-full grid-cols-2 gap-2">',
)

# 3) Tabla desktop: columnas más compactas y estables en zoom corporativo.
text = text.replace(
    'hidden grid-cols-[minmax(220px,1.15fr)_minmax(150px,0.75fr)_minmax(220px,1fr)_minmax(170px,0.75fr)_minmax(120px,0.55fr)_minmax(230px,1fr)] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid',
    'hidden grid-cols-[minmax(230px,1.15fr)_minmax(120px,0.58fr)_minmax(180px,0.9fr)_minmax(150px,0.72fr)_minmax(90px,0.45fr)_minmax(170px,0.82fr)] bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid',
)
text = text.replace(
    'group relative px-5 py-5 text-sm transition hover:bg-[#0ccba9]/5 xl:grid xl:grid-cols-[minmax(220px,1.15fr)_minmax(150px,0.75fr)_minmax(220px,1fr)_minmax(170px,0.75fr)_minmax(120px,0.55fr)_minmax(230px,1fr)] xl:items-center xl:gap-4',
    'group relative px-5 py-5 text-sm transition hover:bg-[#0ccba9]/5 xl:grid xl:grid-cols-[minmax(230px,1.15fr)_minmax(120px,0.58fr)_minmax(180px,0.9fr)_minmax(150px,0.72fr)_minmax(90px,0.45fr)_minmax(170px,0.82fr)] xl:items-center xl:gap-4',
)

# 4) Cliente desktop: ajustar texto en varias líneas, sin invadir radicado.
text = text.replace(
    'className="block max-w-full truncate font-bold uppercase text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"\n                    title={solicitud.empresa.razonSocial}\n                  >\n                    {solicitud.empresa.razonSocial}\n                  </Link>',
    'className="pointer-events-auto block max-w-full whitespace-normal break-words text-sm font-bold uppercase leading-5 text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"\n                    title={solicitud.empresa.razonSocial}\n                  >\n                    {solicitud.empresa.razonSocial}\n                  </Link>',
    1,
)

# 5) Solicitud desktop: ajustar texto en vez de truncar agresivamente.
text = text.replace(
    '<p className="truncate text-slate-700">\n                    {solicitud.requestTypeName}\n                  </p>',
    '<p className="whitespace-normal break-words leading-5 text-slate-700">\n                    {solicitud.requestTypeName}\n                  </p>',
    1,
)
text = text.replace(
    '<p className="mt-1 truncate text-xs text-slate-400">\n                      {solicitud.subject}\n                    </p>',
    '<p className="mt-1 line-clamp-2 whitespace-normal break-words text-xs leading-4 text-slate-400">\n                      {solicitud.subject}\n                    </p>',
    1,
)

# 6) Acciones desktop más compactas para evitar corte a la derecha.
text = text.replace(
    'className="relative z-30 hidden w-full max-w-[290px] justify-self-end xl:block"',
    'className="relative z-30 hidden w-full max-w-[240px] justify-self-end xl:block"',
)

# 7) Card responsive: toda la tarjeta debe ser clicable salvo cliente y botones.
# Desactiva eventos en contenido general para que el Link absoluto reciba click.
text = text.replace(
    'className="relative z-20 xl:hidden"',
    'className="pointer-events-none relative z-20 xl:hidden"',
)

# Reactiva click en nombre del cliente responsive.
text = text.replace(
    'className="block max-w-full truncate font-bold uppercase text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"\n                        title={solicitud.empresa.razonSocial}\n                      >\n                        {solicitud.empresa.razonSocial}\n                      </Link>',
    'className="pointer-events-auto block max-w-full whitespace-normal break-words font-bold uppercase leading-5 text-[#041461] underline-offset-4 hover:text-[#079b85] hover:underline"\n                        title={solicitud.empresa.razonSocial}\n                      >\n                        {solicitud.empresa.razonSocial}\n                      </Link>',
    1,
)

# Solicitud responsive con wrap.
text = text.replace(
    '<p className="truncate text-slate-700">\n                      {solicitud.requestTypeName}\n                    </p>',
    '<p className="whitespace-normal break-words text-slate-700">\n                      {solicitud.requestTypeName}\n                    </p>',
    1,
)
text = text.replace(
    '<p className="mx-auto mt-1 max-w-xl truncate text-xs text-slate-400">\n                        {solicitud.subject}\n                      </p>',
    '<p className="mx-auto mt-1 max-w-xl whitespace-normal break-words text-xs leading-4 text-slate-400">\n                        {solicitud.subject}\n                      </p>',
    1,
)

path.write_text(text)
print("[OK] /solicitudes: wrap defensivo, progreso en %, botones interactivos y card responsive clicable.")
