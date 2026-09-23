"""Arma la pista de voz del Reel y sincroniza subtítulos.

- Coloca cada frase (voz/frases/NN.wav) en su escena, sin superponerse.
- Normaliza la voz a ~ -16 LUFS aprox. (RMS) y escribe public/audio/voz.wav.
- Actualiza src/datos.json: audio.voz, audio.musica y locucion (subtítulos
  partidos en bloques cortos, con tiempos proporcionales a las sílabas).
- Si la última frase no entra, alarga SOLO la escena final (CTA) lo necesario.
"""
import json, re
from pathlib import Path
import numpy as np
import soundfile as sf

RAIZ = Path(__file__).resolve().parent.parent
FR = RAIZ / 'voz/frases'
DATOS = RAIZ / 'src/datos.json'

d = json.load(open(DATOS))
frases = json.load(open(FR / 'frases.json'))
inicio = {}
acc = 0.0
for e in d['escenas']:
    inicio[e['id']] = acc
    acc += e['dur']

# Ancla de cada frase: (escena, segundos dentro de la escena). None = a continuación de la anterior.
ANCLAS = [('gancho', 0.25), ('gancho', 2.0), ('proyecto', 0.3), ('precio', 0.2),
          ('tour', 0.15), ('cta', 0.15), None, None]
PAUSA = 0.3

sr = sf.info(FR / frases[0]['archivo']).samplerate
colocadas = []
fin_prev = 0.0
for fr, ancla in zip(frases, ANCLAS):
    t = fin_prev + PAUSA if ancla is None else max(inicio[ancla[0]] + ancla[1], fin_prev + PAUSA)
    colocadas.append({**fr, 'desde': round(t, 2), 'hasta': round(t + fr['dur'], 2)})
    fin_prev = t + fr['dur']

# La escena CTA debe cubrir la última frase + 1 s de respiro
cta = next(e for e in d['escenas'] if e['id'] == 'cta')
necesario = fin_prev + 1.0 - inicio['cta']
if necesario > cta['dur']:
    cta['dur'] = round(np.ceil(necesario * 2) / 2, 1)
total = sum(e['dur'] for e in d['escenas'])

# Pista de voz completa
pista = np.zeros(int((total + 0.5) * sr), dtype=np.float32)
for c in colocadas:
    w, _ = sf.read(FR / c['archivo'], dtype='float32')
    if w.ndim > 1:
        w = w.mean(axis=1)
    i = int(c['desde'] * sr)
    pista[i:i + len(w)] += w[: len(pista) - i]
activo = np.abs(pista) > 1e-3
rms = np.sqrt(np.mean(pista[activo] ** 2))
pista *= 10 ** (-17 / 20) / rms
pista = np.clip(pista, -0.97, 0.97)
(RAIZ / 'public/audio').mkdir(parents=True, exist_ok=True)
sf.write(RAIZ / 'public/audio/voz.wav', pista, sr)


def silabas(s):
    # los números se dicen en letras: ~2 sílabas por dígito
    return max(1, len(re.findall(r'[aeiouáéíóúü]+', s.lower())) + 2 * len(re.findall(r'\d', s)))


def bloques(texto, maxc=42):
    """Parte el subtítulo en bloques cortos por puntuación, sin cortar palabras."""
    if len(texto) <= maxc:
        return [texto]
    partes = re.split(r'(?<=[,:.?])\s+', texto)
    out, cur = [], ''
    for p in partes:
        if cur and len(cur) + 1 + len(p) > maxc:
            out.append(cur)
            cur = p
        else:
            cur = f'{cur} {p}'.strip()
    out.append(cur)
    final = []
    for b in out:  # si un bloque sigue largo, se parte por palabras a la mitad
        if len(b) > maxc + 12:
            w = b.split()
            m = len(w) // 2
            final += [' '.join(w[:m]), ' '.join(w[m:])]
        else:
            final.append(b)
    return final


loc = []
for c in colocadas:
    bs = bloques(c['sub'])
    # el peso usa la frase hablada (números escritos en letras) repartida por bloque
    pesos = [silabas(b) for b in bs]
    dur = c['hasta'] - c['desde']
    t = c['desde']
    for b, p in zip(bs, pesos):
        dt = dur * p / sum(pesos)
        loc.append({'desde': round(t, 2), 'hasta': round(t + dt, 2), 'texto': b})
        t += dt

d['locucion'] = loc
d['audio']['voz'] = 'audio/voz.wav'
d['audio']['musica'] = 'audio/musica.wav'
json.dump(d, open(DATOS, 'w'), ensure_ascii=False, indent=2)
json.dump(colocadas, open(FR / 'colocadas.json', 'w'), ensure_ascii=False, indent=2)
print(f'duración video: {total} s · CTA: {cta["dur"]} s')
for c in colocadas:
    print(f"{c['desde']:6.2f}–{c['hasta']:6.2f}  {c['sub']}")
