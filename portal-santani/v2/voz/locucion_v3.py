"""Locución completa v3 (solo audio) con la voz clonada de Adolfo Castillo (autorizada).
Misma configuración que la muestra del Tapiracuái: continuación de 13,5 s de su narración real
(voz aislada con Demucs) + referencia de timbre, cfg 2,2, 14 pasos.
Salida: locucion_v3/NN.wav y locucion_v3/locucion_v3_adolfo.wav (sin música).
"""
import json, os, time
from pathlib import Path
os.environ.setdefault('HF_HUB_OFFLINE', '1')
import numpy as np, soundfile as sf
from voxcpm import VoxCPM

B = Path(__file__).resolve().parent
REF = str(B / 'referencia_adolfo/ref_adolfo_13s.wav')
REF_TXT = (B / 'referencia_adolfo/ref_adolfo_13s.txt').read_text().strip()
OUT = B / 'locucion_v3'; OUT.mkdir(exist_ok=True)
# (texto hablado, subtítulo, pausa posterior en s)
FRASES = [
    ('Hay lugares que no solamente se visitan… se sienten.', 'Hay lugares que no solamente se visitan… se sienten.', 0.8),
    ('Santaní… una ciudad con historia, tradición, y un encanto que permanece.', 'Santaní… una ciudad con historia, tradición y un encanto que permanece.', 0.9),
    ('Cuenta la leyenda que quien se sumerge en las aguas del Tapiracuái… queda hechizado, y siempre quiere volver.',
     'Cuenta la leyenda que quien se sumerge en las aguas del Tapiracuái… queda hechizado y siempre quiere volver.', 0.9),
    ('Y quizás sea por eso que quienes conocen Santaní… siempre quieren regresar.', 'Y quizás sea por eso que quienes conocen Santaní… siempre quieren regresar.', 1.0),
    ('Y hoy, acá comienza una nueva historia… Portal de Santaní.', 'Y hoy, acá comienza una nueva historia… Portal de Santaní.', 1.6),
    ('Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados.', '650 lotes, desde 360 m².', 0.7),
    ('Cuotas desde doscientos mil guaraníes, hasta ciento treinta meses… o al contado.', 'Cuotas desde 200 mil guaraníes, hasta 130 meses… o al contado.', 1.2),
    ('Recorré el proyecto y elegí tu lote en nuestro Tour Virtual.', 'Recorré el proyecto y elegí tu lote en nuestro Tour Virtual.', 1.2),
    ('Portal de Santaní… un lugar para empezar tu próxima historia.', 'Portal de Santaní… un lugar para empezar tu próxima historia.', 0.9),
    ('¿Querés conocer los lotes disponibles? Escribinos por guatsap.', '¿Querés conocer los lotes disponibles? Escribinos por WhatsApp.', 0.0),
]
m = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = m.tts_model.sample_rate
partes, meta, t = [], [], 0.0
for i, (voz, sub, pausa) in enumerate(FRASES, 1):
    t0 = time.time()
    w = m.generate(text=voz, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF, cfg_value=2.2, inference_timesteps=14)
    e = np.abs(w); idx = np.where(e > 10 ** (-40 / 20) * e.max())[0]; w = w[max(0, idx[0] - 1200): idx[-1] + 3000]
    sf.write(OUT / f'{i:02d}.wav', w, sr)
    meta.append({'voz': voz, 'sub': sub, 'dur': round(len(w) / sr, 3), 'pausa': pausa})
    partes += [w, np.zeros(int(pausa * sr), dtype=w.dtype)]
    print(f'{i:02d}: {len(w) / sr:.1f} s ({time.time() - t0:.0f} s)', flush=True)
x = np.concatenate(partes); x = x / np.max(np.abs(x)) * 0.9
sf.write(OUT / 'locucion_v3_adolfo.wav', x, sr)
json.dump(meta, open(OUT / 'frases.json', 'w'), ensure_ascii=False, indent=2)
print(f'total {len(x) / sr:.1f} s')
