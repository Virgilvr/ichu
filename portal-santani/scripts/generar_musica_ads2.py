"""Pista instrumental original para anuncios cortos (estilo comercial/business moderno, 118 BPM, La menor → Do).
Uso: python generar_musica_ads2.py DUR   → public/ads2/musica_ads2.wav
Sintetizada por código (sin licencias de terceros): bombo en negras, palmas en 2 y 4, hi-hat en corcheas,
bajo sincopado, acordes "pluck" y un pad; golpe de apertura y final en el último compás.
"""
import sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import lfilter

SR = 48000
DUR = float(sys.argv[1]) + 0.6
N = int(SR * DUR)
BPM = 118
BEAT = 60 / BPM
rng = np.random.default_rng(21)
OUT = Path(__file__).resolve().parent.parent / 'public/ads2/musica_ads2.wav'
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    return lfilter([a], [1, a - 1], x)


def add(sig, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * g
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 35)) / SR) * np.exp(-t * 9)


def clap():
    n = int(0.25 * SR); t = np.arange(n) / SR
    x = rng.normal(size=n); x = x - lp(x, 900)
    env = np.exp(-t * 22) * (1 + 0.6 * (t < 0.012) + 0.4 * ((t > 0.012) & (t < 0.024)))
    return lp(x, 6000) * env


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); t = np.arange(n) / SR
    x = rng.normal(size=n); x = x - lp(x, 7000)
    return x * np.exp(-t * (18 if open_ else 70))


def pluck(nota, largo=0.5):
    n = int(largo * SR); t = np.arange(n) / SR; f = midi(nota)
    s = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 3 * k)) for k in range(1, 6))
    return s * np.minimum(1, t / 0.002)


PROG = [([57, 60, 64], 45), ([53, 57, 60], 41), ([48, 52, 55], 48), ([55, 59, 62], 43)]  # Am F C G
COMPAS = 4 * BEAT
T_FIN = DUR - 2.2

b = 0
while b * BEAT < DUR:
    t = b * BEAT
    c = PROG[int(t // COMPAS) % 4]
    fin = t >= T_FIN
    if not fin:
        add(kick(), t, g=0.55)
        if b % 2 == 1:
            add(clap(), t, pan=0.05, g=0.22)
        add(hat(), t + BEAT / 2, pan=0.3, g=0.07)
        add(hat(), t, pan=-0.3, g=0.04)
        if b % 4 == 3:
            add(hat(True), t + BEAT / 2, pan=0.35, g=0.05)
        # bajo sincopado
        for off, dur in ((0, 0.42), (0.75, 0.2)):
            n = int(dur * SR); tt = np.arange(n) / SR
            s = np.tanh(2.2 * np.sin(2 * np.pi * midi(c[1]) * tt)) * np.exp(-tt * 4)
            add(lp(s, 900), t + off * BEAT, g=0.22)
        # acordes pluck en corcheas (patrón de 8)
        for k, off in enumerate((0, 0.5, 1.5)):
            for nota in c[0]:
                add(pluck(nota + 12, 0.45), t + off * BEAT, pan=0.25 * (1 if k % 2 else -1), g=0.05)
    b += 1

# pad suave de fondo
for ci in range(int(DUR / COMPAS) + 1):
    t0 = ci * COMPAS
    notas, _ = PROG[ci % 4]
    n = int((COMPAS + 0.4) * SR); tt = np.arange(n) / SR
    s = sum(2 * ((tt * midi(x) * 2 ** (d / 12)) % 1) - 1 for x in notas for d in (-0.1, 0.1))
    s = lp(lp(s / 6, 1400), 1800) * np.minimum(1, tt / 0.3) * np.minimum(1, (n / SR - tt) / 0.3)
    add(s, t0, g=0.06)

# golpe de apertura y acorde final (Do mayor) que acompaña la placa
n = int(1.5 * SR); tt = np.arange(n) / SR
add(np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-tt * 10)) / SR) * np.exp(-tt * 3), 0.0, g=0.4)
n = int(2.4 * SR); tt = np.arange(n) / SR
acorde = sum(pluck(x, 2.4) for x in (48, 55, 60, 64, 67, 72))
add(acorde, T_FIN, g=0.12)
add(kick(), T_FIN, g=0.5)

# reverb corta estéreo
ir = rng.normal(size=int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 6)
ir /= np.sqrt(np.sum(ir ** 2))


def conv(x):
    m = len(x) + len(ir) - 1; nf = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[:len(x)]


L2, R2 = L + 0.18 * conv(L), R + 0.18 * conv(R)
fade = np.ones(N)
i0 = int((DUR - 1.2) * SR)
fade[i0:] = np.cos(np.linspace(0, np.pi / 2, N - i0))
est = np.stack([L2 * fade, R2 * fade], 1)
est *= 10 ** (-16 / 20) / np.sqrt(np.mean(est ** 2))
est = np.tanh(est * 1.2) / 1.2
est *= min(1.0, 0.93 / np.max(np.abs(est)))
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((est * 32767).astype(np.int16).tobytes())
print('música:', OUT, f'{DUR:.1f} s')
