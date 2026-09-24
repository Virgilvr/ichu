"""Monta la locución v2 y genera los tiempos del video (src/v2/datos_v2.json).

1. Aplica realce.py (más alegre: tono +0,5 st, ritmo +7 %, brillo y compresión) a cada frase.
2. Recorta silencios y normaliza (~ -17 dBFS RMS).
3. Ubica cada frase en su escena; si una frase no entra, alarga SOLO esa escena.
4. Escribe public/v2/voz_v2.wav y src/v2/datos_v2.json (escenas, frases, subtítulos).
Ejecutar con el entorno de VoxCPM: /home/user/venv-voxcpm/bin/python v2/voz/montar_v2.py
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf

RAIZ = Path(__file__).resolve().parents[2]
LOC = RAIZ / 'v2/voz/locucion'
REAL = LOC / 'realce'
REAL.mkdir(exist_ok=True)
PY = sys.executable

# (escena, duración nominal)
ESCENAS = [('viaje', 5.0), ('llegada', 4.6), ('entrada', 3.6), ('recorrido', 8.6), ('lotes', 4.5),
           ('panoramica', 2.6), ('ubicacion', 3.4), ('oferta', 5.5), ('tour', 3.4), ('contacto', 4.5)]
# frase -> (escena, segundos desde el inicio de la escena); None = a continuación de la anterior
ANCLAS = [('viaje', 0.3), ('llegada', 0.2), ('entrada', 0.25), ('recorrido', 3.6), ('lotes', 1.3),
          ('ubicacion', 0.3), ('oferta', 0.2), ('tour', 0.3), ('contacto', 0.2), None]
TEMPO = sys.argv[1] if len(sys.argv) > 1 else '1.07'

frases = json.load(open(LOC / 'frases.json'))
wavs, sr = [], None
for i in range(1, len(frases) + 1):
    src, dst = LOC / f'{i:02d}.wav', REAL / f'{i:02d}.wav'
    subprocess.run([PY, str(RAIZ / 'v2/voz/realce.py'), str(src), str(dst), TEMPO], check=True)
    w, sr = sf.read(dst)
    e = np.abs(w)
    idx = np.where(e > 10 ** (-40 / 20) * e.max())[0]
    w = w[max(0, idx[0] - int(0.04 * sr)): idx[-1] + int(0.08 * sr)]
    wavs.append(w)

durs = [len(w) / sr for w in wavs]
nominal = dict(ESCENAS)
dur = dict(nominal)
# alargar escenas que no alcanzan
for k, (a, w) in enumerate(zip(ANCLAS, durs)):
    if a is None:
        continue
    esc, off = a
    extra = durs[k + 1] + 0.3 if k + 1 < len(ANCLAS) and ANCLAS[k + 1] is None else 0
    dur[esc] = max(dur[esc], round(off + w + extra + 0.35, 2))

inicio, t = {}, 0.0
for esc, _ in ESCENAS:
    inicio[esc] = round(t, 2)
    t += dur[esc]
total = round(t, 2)

colocadas, fin_prev = [], 0.0
for k, (fr, a, w) in enumerate(zip(frases, ANCLAS, durs)):
    t0 = fin_prev + 0.3 if a is None else max(inicio[a[0]] + a[1], fin_prev + 0.25)
    colocadas.append({'desde': round(t0, 2), 'hasta': round(t0 + w, 2), 'texto': fr['sub'], 'voz': fr['voz']})
    fin_prev = t0 + w

pista = np.zeros(int((total + 0.5) * sr))
for c, w in zip(colocadas, wavs):
    i = int(c['desde'] * sr)
    pista[i:i + len(w)] += w[: len(pista) - i]
act = np.abs(pista) > 1e-3
pista *= 10 ** (-17 / 20) / np.sqrt(np.mean(pista[act] ** 2))
sf.write(RAIZ / 'public/v2/voz_v2.wav', np.clip(pista, -0.97, 0.97), sr)


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
for c in colocadas:
    bs = bloques(c['texto'])
    pesos = [silabas(b) for b in bs]
    t0, d = c['desde'], c['hasta'] - c['desde']
    for b, p in zip(bs, pesos):
        dt = d * p / sum(pesos)
        subs.append({'desde': round(t0, 2), 'hasta': round(t0 + dt, 2), 'texto': b})
        t0 += dt

datos = {
    'total': total,
    'escenas': [{'id': e, 'desde': inicio[e], 'dur': dur[e]} for e, _ in ESCENAS],
    'frases': colocadas,
    'subtitulos': subs,
}
json.dump(datos, open(RAIZ / 'src/v2/datos_v2.json', 'w'), ensure_ascii=False, indent=2)
print(f'total {total} s')
for e, _ in ESCENAS:
    print(f'  {e:11s} {inicio[e]:6.2f}  {dur[e]:.2f} s' + ('  (alargada)' if dur[e] > nominal[e] else ''))
for c in colocadas:
    print(f"  {c['desde']:6.2f}–{c['hasta']:6.2f}  {c['texto']}")
