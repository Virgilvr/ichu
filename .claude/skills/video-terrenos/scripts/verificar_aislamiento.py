"""Verifica que un proyecto no contenga datos de OTROS proyectos (asesor, WhatsApp, nombre de
proyecto, loteadora, voz o logo) y que su cierre use sus propios datos.

Uso: python3 .claude/skills/video-terrenos/scripts/verificar_aislamiento.py <slug>
Revisa: proyectos/<slug>/ (textos) y la carpeta de código declarada en proyecto.json → "codigo".
Termina con código 1 si encuentra mezcla o faltan datos de contacto.
"""
import hashlib, json, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
PROY = RAIZ / 'proyectos'
TEXTO = {'.json', '.md', '.txt', '.ts', '.tsx', '.js', '.mjs', '.py', '.srt', '.csv'}


def digitos(s):
    return re.sub(r'\D', '', s or '')


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest() if p and Path(p).is_file() else None


if len(sys.argv) != 2:
    sys.exit(__doc__)
slug = sys.argv[1]
todos = {pj.parent.name: json.load(open(pj)) for pj in PROY.glob('*/proyecto.json')}
if slug not in todos:
    sys.exit(f'No existe proyectos/{slug}/proyecto.json')
yo = todos.pop(slug)
errores = []

# 1. contacto propio completo
for campo in ('asesor', 'whatsapp'):
    if not yo['contacto'].get(campo):
        errores.append(f'Falta contacto.{campo} en proyectos/{slug}/proyecto.json (preguntar al usuario).')
if not yo['proyecto'].get('nombre'):
    errores.append('Falta proyecto.nombre.')

# 2. datos de otros proyectos que NO deben aparecer (salvo que coincidan con los propios)
propios = {yo['proyecto'].get('nombre'), yo['proyecto'].get('loteadora'), yo['contacto'].get('asesor')}
prohibidos, numeros, hashes = {}, {}, {}
for otro, d in todos.items():
    for t in (d['proyecto'].get('nombre'), d['proyecto'].get('loteadora'), d['contacto'].get('asesor')):
        if t and t not in propios and len(t) >= 4:
            prohibidos[t.lower()] = otro
    n = digitos(d['contacto'].get('whatsapp'))
    if n and n != digitos(yo['contacto'].get('whatsapp')):
        numeros[n[-9:]] = otro  # últimos 9 dígitos (con o sin +595)
    for k in (d['voz'].get('referencia'), d['logo'].get('archivo')):
        h = sha(RAIZ / k) if k else None
        if h:
            hashes[h] = f'{otro}:{k}'

carpetas = [PROY / slug]
if yo.get('codigo'):
    carpetas.append(RAIZ / yo['codigo'])
for c in carpetas:
    for f in c.rglob('*'):
        if not f.is_file() or 'node_modules' in f.parts:
            continue
        if f.suffix.lower() in TEXTO:
            txt = f.read_text(errors='ignore')
            low = txt.lower()
            for t, otro in prohibidos.items():
                if t in low:
                    errores.append(f'{f.relative_to(RAIZ)}: contiene "{t}" (dato del proyecto {otro})')
            dig = digitos(txt)
            for n, otro in numeros.items():
                if n in dig:
                    errores.append(f'{f.relative_to(RAIZ)}: contiene el WhatsApp del proyecto {otro}')
        elif f.stat().st_size < 200_000_000:
            h = sha(f)
            if h in hashes:
                errores.append(f'{f.relative_to(RAIZ)}: es el mismo archivo que {hashes[h]} (voz/logo de otro proyecto)')

# 3. voz: si es clonada debe tener autorización propia
if yo['voz'].get('tipo') == 'clonada' and not (PROY / slug / 'voz/AUTORIZACION.md').is_file():
    errores.append('Voz clonada sin proyectos/<slug>/voz/AUTORIZACION.md')

if errores:
    print('AISLAMIENTO: FALLA')
    for e in errores:
        print(' -', e)
    sys.exit(1)
print(f'AISLAMIENTO OK · {slug}: {yo["contacto"]["asesor"]} · {yo["contacto"]["whatsapp"]} · revisados {len(carpetas)} carpeta(s), {len(todos)} proyecto(s) de comparación')
