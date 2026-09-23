"""Muestra de 10-15 s de la locución con VoxCPM2 (diseño de voz, sin clonar a nadie).

Ejecutar con el entorno de VoxCPM2:
  /home/user/venv-voxcpm/bin/python voz/muestra_voxcpm2.py
Salida: voz/muestras/muestra_voxcpm2_<n>.wav (48 kHz)
"""
import os, sys, time
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_XET', '1')  # descarga clásica por LFS (mismo criterio que VoiceStudio)
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
OUT = BASE / 'muestras'
OUT.mkdir(exist_ok=True)

# Diseño de voz: formato nativo de VoxCPM2 "(descripción)texto". Descripción en español
# para anclar el idioma y el acento latinoamericano.
DESCRIPCION = (
    'Hombre latinoamericano de unos 35 años, hablante nativo de español, acento neutro rioplatense suave, '
    'voz cálida, grave y confiable, locutor comercial de inmobiliaria, sonrisa en la voz, ritmo natural y pausado'
)

# Frases que contienen las palabras a controlar: Santaní, San Estanislao, guaraníes.
MUESTRA = (
    '¿Buscás un terreno en Santaní? '
    'Conocé Portal de Santaní, un nuevo loteamiento en San Estanislao, San Pedro. '
    'Y lo mejor: cuotas desde doscientos mil guaraníes.'
)

modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
n = sys.argv[1] if len(sys.argv) > 1 else '1'
t0 = time.time()
wav = modelo.generate(text=f'({DESCRIPCION}){MUESTRA}', cfg_value=2.0, inference_timesteps=10)
sr = modelo.tts_model.sample_rate
sf.write(OUT / f'muestra_voxcpm2_{n}.wav', wav, sr)
print(f'muestra_voxcpm2_{n}.wav: {len(wav) / sr:.1f} s de audio, generado en {time.time() - t0:.0f} s')
