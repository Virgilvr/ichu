"""Locución del anuncio "Vení a conocer" (Portal de Santaní) con la voz autorizada de Adolfo Castillo
(solo este proyecto; ver proyectos/portal-santani/voz/AUTORIZACION.md). Misma configuración que la v3 aprobada.
Genera 2 tomas por frase en ads2/ (fuera del repo)."""
import os
from pathlib import Path
os.environ.setdefault('HF_HUB_OFFLINE', '1')
import numpy as np, soundfile as sf
from voxcpm import VoxCPM
B = Path(__file__).resolve().parent
REF = str(B / 'referencia_adolfo/ref_adolfo_13s.wav')
REF_TXT = (B / 'referencia_adolfo/ref_adolfo_13s.txt').read_text().strip()
OUT = B / 'ads2'; OUT.mkdir(exist_ok=True)
FRASES = [
    'Vení a conocer Portal de Santaní,',
    'y llevá tu lote desde solo doscientos mil guaraníes al mes.',
    'Escribinos por guatsap.',
]
m = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = m.tts_model.sample_rate
for i, t in enumerate(FRASES, 1):
    for k in (1, 2):
        w = m.generate(text=t, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF, cfg_value=2.2, inference_timesteps=14)
        e = np.abs(w); idx = np.where(e > 10 ** (-40 / 20) * e.max())[0]; w = w[max(0, idx[0] - 1200): idx[-1] + 3000]
        sf.write(OUT / f'{i:02d}_{k}.wav', w, sr)
        print(f'{i:02d}_{k}: {len(w)/sr:.2f} s', flush=True)
