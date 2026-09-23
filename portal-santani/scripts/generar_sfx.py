"""Genera efectos de sonido suaves (sintetizados, sin licencias de terceros) en public/audio/sfx/."""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'public/audio/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def guardar(nombre, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    est = np.stack([x, x], axis=1)
    with wave.open(str(OUT / f'{nombre}.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())


def t(seg):
    return np.arange(int(SR * seg)) / SR


def pasabajos(x, a):
    y = np.zeros_like(x)
    for i in range(1, len(x)):
        y[i] = y[i - 1] + a[i] * (x[i] - y[i - 1])
    return y


# whoosh: ruido filtrado con barrido de corte y envolvente en campana
tt = t(0.6)
env = np.sin(np.pi * np.clip(tt / 0.6, 0, 1)) ** 2
corte = 0.02 + 0.25 * np.sin(np.pi * tt / 0.6) ** 2
guardar('whoosh', pasabajos(rng.normal(size=tt.size), corte) * env)

# impacto: golpe grave + transitorio
tt = t(1.2)
f = 90 * np.exp(-tt * 6) + 42
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4.5)
click = rng.normal(size=tt.size) * np.exp(-tt * 90) * 0.5
guardar('impacto', boom + click)

# pop: tono corto ascendente
tt = t(0.18)
guardar('pop', np.sin(2 * np.pi * np.cumsum(500 + 900 * tt / 0.18) / SR) * np.exp(-tt * 28))

# brillo: acorde agudo con trémolo, para el barrido de lotes
tt = t(1.4)
x = sum(np.sin(2 * np.pi * fr * tt) for fr in (1318.5, 1760, 2093)) * (1 - np.exp(-tt * 8)) * np.exp(-tt * 2.2)
guardar('brillo', x * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * tt)))

# tap: clic seco
tt = t(0.08)
guardar('tap', (np.sin(2 * np.pi * 1800 * tt) + rng.normal(size=tt.size) * 0.4) * np.exp(-tt * 70))

# notif: dos notas tipo mensaje
tt = t(0.5)
n1 = np.sin(2 * np.pi * 988 * tt) * np.exp(-tt * 9) * (tt < 0.25)
n2 = np.roll(np.sin(2 * np.pi * 1319 * tt) * np.exp(-tt * 7), int(0.12 * SR))
guardar('notif', n1 + n2)
print('SFX generados en', OUT)
