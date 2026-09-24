"""Muestra de 20-25 s con la voz clonada de Adolfo Castillo (autorizada), estilo narración cinematográfica.
Referencia: 13,5 s de su narración en el anuncio de Trebol (voz aislada con Demucs), usada como
continuación (prompt_wav + transcripción exacta) + referencia de timbre.
"""
import os, time
from pathlib import Path
os.environ.setdefault('HF_HUB_OFFLINE', '1')
import numpy as np, soundfile as sf
from voxcpm import VoxCPM

B = Path(__file__).resolve().parent
REF = str(B / 'referencia_adolfo/ref_adolfo_13s.wav')
REF_TXT = (B / 'referencia_adolfo/ref_adolfo_13s.txt').read_text().strip()
OUT = B / 'muestra_tapiracuai'; OUT.mkdir(exist_ok=True)
FRASES = [
    'Hay lugares que no solamente se visitan… se sienten.',
    'Santaní… una ciudad con historia, tradición, y un encanto que permanece.',
    'Cuenta la leyenda que quien se sumerge en las aguas del Tapiracuái… queda hechizado, y siempre quiere volver.',
    'Y quizás sea por eso que quienes conocen Santaní… siempre quieren regresar.',
    'Y hoy, acá comienza una nueva historia… Portal de Santaní.',
]
PAUSAS = [0.7, 0.8, 0.9, 1.0, 0.0]
m = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = m.tts_model.sample_rate
partes = []
for i, (f, p) in enumerate(zip(FRASES, PAUSAS), 1):
    t0 = time.time()
    w = m.generate(text=f, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF, cfg_value=2.2, inference_timesteps=14)
    e = np.abs(w); idx = np.where(e > 10 ** (-40 / 20) * e.max())[0]; w = w[max(0, idx[0] - 1200): idx[-1] + 3000]
    sf.write(OUT / f'{i:02d}.wav', w, sr)
    partes += [w, np.zeros(int(p * sr), dtype=w.dtype)]
    print(f'{i:02d}: {len(w) / sr:.1f} s ({time.time() - t0:.0f} s)', flush=True)
x = np.concatenate(partes); x = x / np.max(np.abs(x)) * 0.9
sf.write(OUT / 'muestra_tapiracuai_adolfo.wav', x, sr)
print(f'total {len(x) / sr:.1f} s')
