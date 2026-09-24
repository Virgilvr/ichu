"""Genera frases con la voz G definitiva (voz de Adolfo Castillo, autorizada).
Config G: continuación de la nota real (prompt_wav + prompt_text) + referencia de timbre, cfg 2.4, 12 pasos.
Uso: python v2/voz/frases_g.py salida_dir "frase 1" "frase 2" ...
"""
import os, sys, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
REF = str(BASE / 'referencia/voz_usuario_autorizada.wav')
REF_TXT = (BASE / 'referencia/transcripcion.txt').read_text().strip()
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
for i, frase in enumerate(sys.argv[2:], 1):
    t0 = time.time()
    wav = modelo.generate(text=frase, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF,
                          cfg_value=2.4, inference_timesteps=12)
    sf.write(out / f'{i:02d}.wav', wav, sr)
    print(f'{i:02d}: {len(wav) / sr:.1f} s ({time.time() - t0:.0f} s)', flush=True)
