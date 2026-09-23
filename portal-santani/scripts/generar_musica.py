"""Pista instrumental original (sin letra) para el Reel: cinematográfica/comercial, 92 BPM.

Sintetizada por código: sin licencias de terceros. Estructura pensada para el Reel de 40 s:
  0–8 s   intro: pad + arpegio de piano suave (viaje / ruta)
  8–15 s  entra percusión suave y bajo (llegada al proyecto)
  15 s    golpe en el precio; 15–34 s cuerpo completo con shaker
  34–40 s cierre: se abre, acorde final largo
Salida: public/audio/musica.wav (48 kHz estéreo, ~ -16 LUFS)
"""
import json, wave
from pathlib import Path
import numpy as np

SR = 48000
BPM = 92
BEAT = 60 / BPM
# Dura lo mismo que el video (+1 s de cola), leído de src/datos.json
_D = json.load(open(Path(__file__).resolve().parent.parent / 'src/datos.json'))
DUR = sum(e['dur'] for e in _D['escenas']) + 1.0
FIN = DUR - 4.5  # comienzo del acorde final
N = int(SR * DUR)
rng = np.random.default_rng(3)
OUT = Path(__file__).resolve().parent.parent / 'public/audio/musica.wav'

t_all = np.arange(N) / SR
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


# Progresión (Re mayor): Bm – G – D – A, un acorde por compás (4 tiempos)
ACORDES = [[59, 62, 66], [55, 59, 62], [62, 66, 69], [57, 61, 64]]
BAJOS = [47, 43, 50, 45]
COMPAS = 4 * BEAT
n_comp = int(np.ceil(DUR / COMPAS))

# Pad cálido: sierras desafinadas, filtradas, ataque lento
for c in range(n_comp):
    ch = ACORDES[c % 4]
    dur = COMPAS + 0.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nota in ch + [ch[0] - 12]:
        for det in (-0.12, 0.0, 0.11):
            f = midi(nota) * 2 ** (det / 12)
            s += 2 * ((t * f) % 1) - 1
    s = lowpass(s / 12, 900 + 500 * (c >= 4))
    s *= env_adsr(n, 0.8, 0.5, 0.85, 0.7)
    add(s, c * COMPAS, pan=-0.2 if c % 2 else 0.2, gain=0.22)

# Arpegio de "piano" (senoidal + armónicos con caída), corcheas
for k in range(int(DUR / (BEAT / 2))):
    tt = k * BEAT / 2
    if tt > FIN + 2:
        break
    ch = ACORDES[int(tt // COMPAS) % 4]
    patron = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12]
    nota = patron[k % 8]
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = midi(nota)
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 3.2)
    s *= np.minimum(1, t / 0.004)
    vel = 0.55 + 0.25 * (k % 2 == 0)
    add(s, tt, pan=0.35 * np.sin(k * 0.7), gain=0.09 * vel)

# Bajo sub desde 8 s
for c in range(n_comp):
    tt = c * COMPAS
    if tt < 8 * 0.98 or tt > FIN - 0.5:
        continue
    n = int(COMPAS * SR)
    t = np.arange(n) / SR
    f = midi(BAJOS[c % 4])
    s = np.tanh(1.5 * np.sin(2 * np.pi * f * t)) * env_adsr(n, 0.02, 0.3, 0.7, 0.4)
    add(s, tt, gain=0.20)

# Percusión suave: kick en 1 y 3 desde 8 s; shaker en corcheas desde 15 s
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = rng.normal(size=n)
    x = x - lowpass(x, 5000)
    return x * np.exp(-t * 45)


for b in range(int(DUR / BEAT)):
    tt = b * BEAT
    if 8 <= tt < FIN and b % 2 == 0:
        add(kick(), tt, gain=0.42)
    if 15 <= tt < FIN:
        add(shaker(), tt + BEAT / 2, pan=0.4, gain=0.05)
        add(shaker(), tt, pan=-0.3, gain=0.03)

# Subida antes del precio (13,5–15 s) y golpe con platillo invertido suave
n = int(1.5 * SR)
t = np.arange(n) / SR
riser = rng.normal(size=n)
riser = riser - lowpass(riser, 800)
add(riser * (t / 1.5) ** 2 * 0.12, 13.5)
n = int(2.5 * SR)
t = np.arange(n) / SR
boom = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 2.2)
add(boom, 15.0, gain=0.5)

# Acorde final largo (Re mayor)
n = int(5 * SR)
t = np.arange(n) / SR
fin = sum(np.sin(2 * np.pi * midi(x) * t) for x in (50, 57, 62, 66, 69, 74)) * np.exp(-t * 0.7) * np.minimum(1, t / 0.05)
add(fin / 6, FIN, gain=0.5)

# Reverb por convolución (IR de ruido con caída exponencial), estéreo
ir_n = int(2.2 * SR)
ti = np.arange(ir_n) / SR
irL = rng.normal(size=ir_n) * np.exp(-ti * 2.6)
irR = rng.normal(size=ir_n) * np.exp(-ti * 2.6)
irL /= np.sqrt(np.sum(irL ** 2))
irR /= np.sqrt(np.sum(irR ** 2))


def conv(x, ir):
    m = len(x) + len(ir) - 1
    nfft = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]


L2 = 0.75 * L + 0.35 * conv(L, irL)
R2 = 0.75 * R + 0.35 * conv(R, irR)

# Fade in/out y normalización aproximada a -16 LUFS (RMS) con techo de pico
fade = np.ones(N)
fade[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
fade[-int(2.0 * SR):] = np.linspace(1, 0, int(2.0 * SR))
L2 *= fade
R2 *= fade
est = np.stack([L2, R2], axis=1)
rms = np.sqrt(np.mean(est ** 2))
est *= 10 ** (-17 / 20) / rms
est = np.tanh(est * 1.1) / 1.1  # limitador suave
est *= 0.95 / max(1.0, np.max(np.abs(est)) / 0.95)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((est * 32767).astype(np.int16).tobytes())
print('música:', OUT, f'{DUR:.0f} s')
