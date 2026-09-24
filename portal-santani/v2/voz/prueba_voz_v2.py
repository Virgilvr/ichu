"""Prueba de voz NUEVA (v2) con VoxCPM2: voz original diseñada por descripción, sin referencia
de audio (no reutiliza la voz del Reel anterior ni clona a ninguna persona).

Uso: /home/user/venv-voxcpm/bin/python v2/voz/prueba_voz_v2.py
Genera dos variantes para elegir: A (grave y cálida) y B (más energía de vendedor).
"""
import os, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import soundfile as sf
from voxcpm import VoxCPM

OUT = Path(__file__).resolve().parent / 'pruebas'
OUT.mkdir(exist_ok=True)

TEXTO = (
    '¿Buscás un lugar propio para tu familia? ... Vení, te llevo. '
    'Estamos llegando a Santaní... y acá está: ¡Portal de Santaní! '
    'Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados. '
    'Y lo mejor... ¡cuotas desde doscientos mil guaraníes!'
)

VARIANTES = {
    'A': ('Hombre paraguayo de unos 40 años, hablante nativo de español latinoamericano con voseo, '
          'voz grave, cálida y segura, locutor comercial inmobiliario, sonriente y entusiasmado, '
          'habla como en una conversación, con pausas naturales y énfasis en las palabras importantes'),
    'B': ('Vendedor inmobiliario paraguayo de unos 35 años, hablante nativo de español latinoamericano con voseo, '
          'voz grave y atractiva, alegre y con mucha energía, entusiasmo contagioso pero controlado, '
          'cambia la intensidad con naturalidad y cierra las frases con fuerza'),
}

modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
for k, desc in VARIANTES.items():
    t0 = time.time()
    wav = modelo.generate(text=f'({desc}){TEXTO}', cfg_value=2.2, inference_timesteps=12)
    sf.write(OUT / f'prueba_voz_v2_{k}.wav', wav, sr)
    print(f'{k}: {len(wav) / sr:.1f} s de audio ({time.time() - t0:.0f} s de cómputo)', flush=True)
