"""Prueba de voz CLONADA del usuario (dueño de la voz, con autorización expresa en el chat).

Referencia: v2/voz/referencia/voz_usuario_autorizada.wav (nota de voz de 13,7 s).
Se usa solo como referencia de timbre (reference_wav_path), sin transcripción,
porque la nota es habla informal y su texto no calza con el guion.

C = clonación directa · D = clonación + indicación de estilo comercial entusiasta.
"""
import os, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
REF = BASE / 'referencia/voz_usuario_autorizada.wav'
OUT = BASE / 'pruebas'
OUT.mkdir(exist_ok=True)

TEXTO = (
    '¿Buscás un lugar propio para tu familia? ... Vení, te llevo. '
    'Estamos llegando a Santaní... y acá está: ¡Portal de Santaní! '
    'Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados. '
    'Y lo mejor... ¡cuotas desde doscientos mil guaraníes!'
)
ESTILO = ('con alegría y entusiasmo controlado, como un vendedor que muestra con orgullo el proyecto, '
          'cálido y seguro, pausas naturales y énfasis en las palabras importantes')

modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
for k, texto in {'C': TEXTO, 'D': f'({ESTILO}){TEXTO}'}.items():
    t0 = time.time()
    wav = modelo.generate(text=texto, reference_wav_path=str(REF), cfg_value=2.0, inference_timesteps=12)
    sf.write(OUT / f'prueba_voz_clonada_{k}.wav', wav, sr)
    print(f'{k}: {len(wav) / sr:.1f} s de audio ({time.time() - t0:.0f} s de cómputo)', flush=True)
