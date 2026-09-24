"""Crea la carpeta de un proyecto nuevo de Video Terrenos (datos aislados por proyecto).

Uso:
  python3 .claude/skills/video-terrenos/scripts/nuevo_proyecto.py \
      --proyecto "Nombre del Proyecto" --asesor "Nombre Apellido" --whatsapp "+595 981 123 456"

Crea proyectos/<slug>/ con proyecto.json (solo con los datos recibidos; el resto queda en null
hasta que el cliente los entregue), material/, voz/, logo/, output/ y un .gitignore que deja
fuera del repo los archivos pesados o privados (audio, video, fotos, logos).
"""
import argparse, json, re, sys, unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
PROY = RAIZ / 'proyectos'
PLANTILLA = Path(__file__).resolve().parents[1] / 'plantilla/proyecto.json'


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def normalizar_wa(n):
    d = re.sub(r'\D', '', n)
    if d.startswith('0'):
        d = '595' + d[1:]
    if not d.startswith('595'):
        d = '595' + d
    if not re.fullmatch(r'5959\d{8}', d):
        sys.exit(f'WhatsApp inválido: "{n}" (se espera un celular paraguayo, ej. +595 981 123 456)')
    return f'+595 {d[3:6]} {d[6:9]} {d[9:]}'


a = argparse.ArgumentParser()
a.add_argument('--proyecto', required=True)
a.add_argument('--asesor', required=True)
a.add_argument('--whatsapp', required=True)
a.add_argument('--slug')
x = a.parse_args()

s = x.slug or slug(x.proyecto)
wa = normalizar_wa(x.whatsapp)
dest = PROY / s
if dest.exists():
    sys.exit(f'Ya existe proyectos/{s}/. Usar otro --slug o trabajar sobre ese proyecto.')

# Avisos de posible mezcla con proyectos anteriores
for pj in PROY.glob('*/proyecto.json'):
    o = json.load(open(pj))
    oc = o.get('contacto', {})
    if re.sub(r'\D', '', oc.get('whatsapp') or '') == re.sub(r'\D', '', wa) and oc.get('asesor') != x.asesor:
        print(f'AVISO: el número {wa} figura en {pj.parent.name} con otro asesor ({oc.get("asesor")}). Confirmar con el usuario.')

p = json.load(open(PLANTILLA))
p['proyecto']['nombre'] = x.proyecto
p['proyecto']['slug'] = s
p['contacto']['asesor'] = x.asesor
p['contacto']['whatsapp'] = wa
p['creado'] = date.today().isoformat()

for d in ('material/fotos', 'material/videos', 'material/geo', 'voz', 'logo', 'output'):
    (dest / d).mkdir(parents=True, exist_ok=True)
json.dump(p, open(dest / 'proyecto.json', 'w'), ensure_ascii=False, indent=2)
(dest / '.gitignore').write_text('material/\noutput/\nvoz/*\n!voz/AUTORIZACION.md\nlogo/*\n!logo/README.md\n')
(dest / 'logo/README.md').write_text('Logo propio de este proyecto (si el cliente lo entrega y pide mostrarlo). No copiar logos de otros proyectos.\n')
print(f'Proyecto creado: proyectos/{s}/')
print(json.dumps({'proyecto': x.proyecto, 'asesor': x.asesor, 'whatsapp': wa}, ensure_ascii=False))
print('Pendiente: materiales, datos comerciales, ubicación, voz (preguntar) y logo (si corresponde).')
