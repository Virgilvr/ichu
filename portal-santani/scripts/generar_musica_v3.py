"""[v3] Pista instrumental original, emotiva y cinematográfica (Re mayor, 72 BPM).
Uso: python generar_musica_v3.py  (lee src/v3/datos_v3.json)

Sintetizada por código: sin licencias de terceros. Secciones sincronizadas con el guion v3:
  0 – 13,2 s   viaje y Santaní: piano suave + colchón de cuerdas (D – Bm – G – A)
  13,2 – 20,6  leyenda del Tapiracuái: más íntimo y misterioso (Bm – G – Em – F#)
  20,6 – 30,3  crece hacia "Portal de Santaní" (G – D – Em – A) con subida
  30,3         golpe suave + se abre: vista 360 y proyecto (D – A – Bm – G), pulso grave
  50,4         cierre emocional (G – A – Bm – G), menos percusión
  56,5 → fin   acorde final de Re mayor largo; la música sostiene la placa y se desvanece
Salida: public/v3/musica_v3.wav (48 kHz estéreo)
"""
import json, wave
from pathlib import Path
import numpy as np
from scipy.signal import lfilter

RAIZ = Path(__file__).resolve().parent.parent
D = json.load(open(RAIZ / 'src/v3/datos_v3.json'))
SR = 48000
DUR = D['total'] + 0.5
N = int(SR * DUR)
T_LEY, T_CRECE, T_PORTAL, T_CIERRE, T_FIN = 13.2, 20.6, 30.3, 50.4, 56.5
BPM = 72
BEAT = 60 / BPM
rng = np.random.default_rng(11)
OUT = RAIZ / 'public/v3/musica_v3.wav'
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def lp(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    return lfilter([a], [1, a - 1], x)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


# acordes (MIDI) y bajos
CH = {
    'D': ([62, 66, 69], 38), 'Bm': ([59, 62, 66], 35), 'G': ([55, 59, 62], 43), 'A': ([57, 61, 64], 45),
    'Em': ([55, 59, 64], 40), 'F#': ([54, 58, 61], 42), 'D/F#': ([54, 62, 66], 42),
}
SECC = [
    (0.0, T_LEY, ['D', 'Bm', 'G', 'A']),
    (T_LEY, T_CRECE, ['Bm', 'G', 'Em', 'F#']),
    (T_CRECE, T_PORTAL, ['G', 'D/F#', 'Em', 'A']),
    (T_PORTAL, T_CIERRE, ['D', 'A', 'Bm', 'G']),
    (T_CIERRE, T_FIN, ['G', 'A', 'Bm', 'G']),
]
# compases: cada sección se divide en compases de ~2 tiempos*... (duración pareja dentro de la sección)
BARS = []
for a, b, prog in SECC:
    n = max(2, round((b - a) / (4 * BEAT * 0.75)))
    d = (b - a) / n
    for k in range(n):
        BARS.append((a + k * d, d, prog[k % 4]))


def seccion(t):
    for i, (a, b, _) in enumerate(SECC):
        if a <= t < b:
            return i
    return len(SECC)


# 1) colchón de cuerdas: sierras desafinadas, filtro que se abre según la sección
for (t0, d, c) in BARS:
    notas, _ = CH[c]
    sec = seccion(t0 + 0.01)
    n = int((d + 1.2) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nota in notas + [notas[0] - 12, notas[2] + 12 if sec >= 3 else notas[1]]:
        for det in (-0.09, 0.0, 0.08):
            f = midi(nota) * 2 ** (det / 12)
            s += 2 * ((t * f + rng.random()) % 1) - 1
    fc = [700, 600, 900, 1500, 1100][sec]
    if sec == 2:  # crece dentro de la sección
        fc = 800 + 900 * (t0 - T_CRECE) / (T_PORTAL - T_CRECE)
    s = lp(lp(s / 15, fc), fc * 1.4)
    s *= env(n, 0.9 if sec != 3 else 0.35, 1.1)
    g = [0.20, 0.17, 0.22, 0.26, 0.21][sec]
    add(s, t0, pan=0.25 * (1 if (t0 * 3) % 2 < 1 else -1), gain=g)

# 2) piano: arpegio en corcheas (negras en la leyenda), con caída natural
def piano(nota, largo=2.4, brillo=1.0):
    n = int(largo * SR)
    t = np.arange(n) / SR
    f = midi(nota)
    s = (np.sin(2 * np.pi * f * t) + 0.4 * brillo * np.sin(4 * np.pi * f * t) * np.exp(-t * 2)
         + 0.15 * brillo * np.sin(6 * np.pi * f * t) * np.exp(-t * 4)) * np.exp(-t * 1.6)
    return s * np.minimum(1, t / 0.003)


for (t0, d, c) in BARS:
    if t0 >= T_FIN:
        break
    notas, _ = CH[c]
    sec = seccion(t0 + 0.01)
    paso = BEAT if sec == 1 else BEAT / 2
    patron = [notas[0], notas[1] + 12, notas[2], notas[0] + 12, notas[1] + 12, notas[2], notas[0] + 12, notas[2] + 12]
    k, tt = 0, t0
    while tt < t0 + d - 0.05:
        vel = (0.55 + 0.3 * (k % 4 == 0)) * (0.8 if sec == 1 else 1.0)
        add(piano(patron[k % 8]), tt, pan=0.3 * np.sin(k * 0.9), gain=0.075 * vel)
        k += 1
        tt += paso

# 3) melodía de piano (motivo simple, registro medio‑alto) en la parte principal y el cierre
MOTIVO = [(0, 74, 1.0), (1, 73, 0.5), (1.5, 71, 0.5), (2, 69, 1.5), (4, 71, 1.0), (5, 69, 0.5), (5.5, 66, 0.5), (6, 69, 2.0)]
for base in (T_PORTAL + 2 * BEAT, T_PORTAL + 10 * BEAT + 0.4, T_CIERRE + 0.3):
    for b, nota, _ in MOTIVO:
        add(piano(nota, 3.0, 1.2), base + b * BEAT, pan=0.1, gain=0.11)

# 4) bajo grave desde la subida
for (t0, d, c) in BARS:
    if t0 < T_CRECE - 0.01 or t0 >= T_FIN:
        continue
    _, bajo = CH[c]
    n = int(d * SR)
    t = np.arange(n) / SR
    s = np.tanh(1.3 * np.sin(2 * np.pi * midi(bajo) * t)) * env(n, 0.05, 0.5)
    add(s, t0, gain=0.16 if t0 < T_PORTAL else 0.2)

# 5) pulso cinematográfico (tambor grave) en la parte principal
def tambor():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 42 + 55 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    ruido = lp(rng.normal(size=n), 900) * np.exp(-t * 25) * 0.4
    return body + ruido


b = 0
while T_PORTAL + b * BEAT < T_CIERRE:
    tt = T_PORTAL + b * BEAT
    if b % 2 == 0:
        add(tambor(), tt, gain=0.30 if b % 4 == 0 else 0.2)
    b += 1

# 6) brillo de "agua" en la leyenda (campanitas agudas, lentas)
for k in range(9):
    tt = T_LEY + 0.4 + k * 0.8
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    nota = [78, 81, 83, 86, 81, 78, 83, 85, 81][k]
    s = np.sin(2 * np.pi * midi(nota) * t) * np.exp(-t * 2.5) * np.minimum(1, t / 0.01)
    add(s, tt, pan=0.6 * np.sin(k), gain=0.035)

# 7) subida y golpe en "Portal de Santaní"; golpe suave en el cierre
n = int(3.0 * SR)
t = np.arange(n) / SR
riser = rng.normal(size=n)
riser = riser - lp(riser, 700)
add(riser * (t / 3.0) ** 2.5 * 0.10, T_PORTAL - 3.0, gain=1.0)
n = int(3.5 * SR)
t = np.arange(n) / SR
boom = np.sin(2 * np.pi * np.cumsum(36 + 50 * np.exp(-t * 10)) / SR) * np.exp(-t * 1.6)
add(boom, T_PORTAL, gain=0.5)
add(boom, T_CIERRE, gain=0.25)

# 8) acorde final largo (Re mayor) + notas sueltas de piano que acompañan el cierre y la placa
n = int((DUR - T_FIN) * SR)
t = np.arange(n) / SR
fin = np.zeros(n)
for nota in (38, 50, 57, 62, 66, 69, 74):
    for det in (-0.06, 0.06):
        fin += np.sin(2 * np.pi * midi(nota) * 2 ** (det / 12) * t)
fin = fin / 14 * np.minimum(1, t / 1.2) * np.exp(-t * 0.12)
add(fin, T_FIN, gain=0.45)
for k, nota in enumerate([74, 69, 66, 62, 69, 74, 78, 74]):
    add(piano(nota, 3.5), T_FIN + 0.2 + k * BEAT * 1.0, pan=0.2 * np.sin(k), gain=0.085)

# reverb por convolución estéreo
ir_n = int(2.8 * SR)
ti = np.arange(ir_n) / SR
irL = rng.normal(size=ir_n) * np.exp(-ti * 2.2)
irR = rng.normal(size=ir_n) * np.exp(-ti * 2.2)
irL /= np.sqrt(np.sum(irL ** 2))
irR /= np.sqrt(np.sum(irR ** 2))


def conv(x, ir):
    m = len(x) + len(ir) - 1
    nfft = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]


L2 = 0.7 * L + 0.42 * conv(L, irL)
R2 = 0.7 * R + 0.42 * conv(R, irR)

# fundidos: entra en 1 s; se desvanece en los últimos 3 s del video (sin corte)
fade = np.ones(N)
fade[: int(1.0 * SR)] = np.linspace(0, 1, int(1.0 * SR)) ** 2
i0, i1 = int((D['total'] - 3.0) * SR), int(D['total'] * SR)
fade[i0:i1] = np.cos(np.linspace(0, np.pi / 2, i1 - i0))
fade[i1:] = 0
L2 *= fade
R2 *= fade
est = np.stack([L2, R2], axis=1)
act = np.abs(est).max(1) > 1e-4
est *= 10 ** (-18 / 20) / np.sqrt(np.mean(est[act] ** 2))
est = np.tanh(est * 1.1) / 1.1
est *= min(1.0, 0.93 / np.max(np.abs(est)))
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((est * 32767).astype(np.int16).tobytes())
print('música:', OUT, f'{DUR:.1f} s')
