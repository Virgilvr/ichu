"""v3: ubica la locución APROBADA (locucion_v3_adolfo_fadeout.wav) sin modificarla y arma los tiempos.

- Copia el WAV aprobado tal cual (bit a bit) a public/v3/voz_v3.wav.
- La voz arranca en VO segundos; el video dura hasta el final del fade de la voz + COLA de imagen/música.
- Escribe src/v3/datos_v3.json con frases y subtítulos (tiempos absolutos del video).
"""
import json, re, shutil, hashlib
from pathlib import Path
import soundfile as sf

RAIZ = Path(__file__).resolve().parents[2]
LOC = RAIZ / 'v2/voz/locucion_v3'
SRC = LOC / 'locucion_v3_adolfo_fadeout.wav'
DST = RAIZ / 'public/v3/voz_v3.wav'
VO = 0.8     # la imagen y la música abren antes de la primera palabra
COLA = 3.0   # imagen y música sostenidas después de que termina el fade de la voz

shutil.copyfile(SRC, DST)
h = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert h(SRC) == h(DST)
info = sf.info(DST)
fin_voz = VO + info.frames / info.samplerate
total = round(fin_voz + COLA, 2)

frases, t = [], 0.0
for f in json.load(open(LOC / 'frases.json')):
    frases.append({'desde': round(VO + t, 2), 'hasta': round(VO + t + f['dur'], 2), 'texto': f['sub']})
    t += f['dur'] + f['pausa']


def silabas(x):
    return max(1, len(re.findall(r'[aeiouáéíóúü]+', x.lower())) + 2 * len(re.findall(r'\d', x)))


def bloques(texto, maxc=34):
    if len(texto) <= maxc:
        return [texto]
    partes = re.split(r'(?<=[,:.?!…])\s+', texto)
    out, cur = [], ''
    for p in partes:
        if cur and len(cur) + 1 + len(p) > maxc:
            out.append(cur)
            cur = p
        else:
            cur = f'{cur} {p}'.strip()
    out.append(cur)
    return out


subs = []
for c in frases:
    bs = bloques(c['texto'])
    pesos = [silabas(b) for b in bs]
    t0, d = c['desde'], c['hasta'] - c['desde']
    for b, p in zip(bs, pesos):
        dt = d * p / sum(pesos)
        subs.append({'desde': round(t0, 2), 'hasta': round(t0 + dt, 2), 'texto': b})
        t0 += dt

datos = {'vo': VO, 'finVoz': round(fin_voz, 3), 'total': total, 'frases': frases, 'subtitulos': subs}
json.dump(datos, open(RAIZ / 'src/v3/datos_v3.json', 'w'), ensure_ascii=False, indent=2)
print(f'voz {VO}–{fin_voz:.2f} s · total {total} s · sha256 idéntico: sí')
for c in frases:
    print(f"  {c['desde']:6.2f}–{c['hasta']:6.2f}  {c['texto']}")
