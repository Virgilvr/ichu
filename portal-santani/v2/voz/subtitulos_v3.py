"""Subtítulos "destacados" v3: bloques cortos (máx. 2 líneas) sincronizados con las palabras reales
de la locución aprobada (tiempos por palabra con Whisper). No toca el audio.
Agrega 'subsDestacados' a src/v3/datos_v3.json (no cambia los subtítulos existentes).
"""
import json, re
from pathlib import Path
from faster_whisper import WhisperModel

RAIZ = Path(__file__).resolve().parents[2]
LOC = RAIZ / 'v2/voz/locucion_v3'
DJ = RAIZ / 'src/v3/datos_v3.json'
datos = json.load(open(DJ))
MAXL = 20  # caracteres por línea

# cortes naturales (según las pausas de la locución); '|' = cambio de bloque, '/' = salto de línea
CORTES = [
    'Hay lugares que / no solamente se visitan… | se sienten.',
    'Santaní… | una ciudad con historia, / tradición | y un encanto / que permanece.',
    'Cuenta la leyenda / que quien se sumerge | en las aguas / del Tapiracuái… | queda hechizado | y siempre quiere volver.',
    'Y quizás sea por eso | que quienes conocen / Santaní… | siempre quieren / regresar.',
    'Y hoy, acá comienza / una nueva historia… | Portal de Santaní.',
    '650 lotes, | desde 360 m².',
    'Cuotas desde / 200 mil guaraníes, | hasta 130 meses… | o al contado.',
    'Recorré el proyecto / y elegí tu lote | en nuestro / Tour Virtual.',
    'Portal de Santaní… | un lugar para empezar / tu próxima historia.',
    '¿Querés conocer / los lotes disponibles? | Escribinos / por WhatsApp.',
]
m = WhisperModel('medium', device='cpu', compute_type='int8')
salida = []
for i, (fr, cortes) in enumerate(zip(datos['frases'], CORTES), 1):
    assert re.sub(r'\s*[|/]\s*', ' ', cortes) == fr['texto'].replace('  ', ' '), (cortes, fr['texto'])
    segs, _ = m.transcribe(str(LOC / f'{i:02d}.wav'), language='es', word_timestamps=True,
                           initial_prompt='Santaní, Tapiracuái, Portal de Santaní, guaraníes, escribinos, WhatsApp.')
    pal = [w for s in segs for w in s.words]
    bloques = [b.strip() for b in cortes.split('|')]
    nsub = [len(b.replace('/', ' ').split()) for b in bloques]
    N, M = sum(nsub), len(pal)
    idx = 0
    for k, b in enumerate(bloques):
        a = round(idx * M / N)
        z = max(a, round((idx + nsub[k]) * M / N) - 1)
        t0 = fr['desde'] + pal[a].start
        t1 = fr['desde'] + pal[z].end
        lineas = [x.strip() for x in b.split('/')]
        salida.append({'desde': round(t0 - 0.05, 2), 'hasta': round(t1 + 0.25, 2), 'lineas': lineas})
        idx += nsub[k]
# sin solapes: cada bloque termina cuando empieza el siguiente
for a, b in zip(salida, salida[1:]):
    a['hasta'] = round(min(a['hasta'], b['desde'] - 0.02), 2)
for x in salida:
    for l in x['lineas']:
        if len(l) > 24:
            print('AVISO línea larga:', l)
datos['subsDestacados'] = salida
json.dump(datos, open(DJ, 'w'), ensure_ascii=False, indent=2)
for x in salida:
    print(f"{x['desde']:6.2f}–{x['hasta']:6.2f}  {' / '.join(x['lineas'])}")
