"""Locución completa del Reel con VoxCPM2, misma voz que la muestra aprobada.

La voz de diseño es aleatoria entre generaciones, así que para mantener EXACTAMENTE
la voz de la muestra se usa la propia muestra (voz sintética, no una persona real)
como referencia y como prompt de continuación en cada frase.

Ejecutar: /home/user/venv-voxcpm/bin/python voz/locucion_voxcpm2.py
Salida: voz/frases/NN.wav (48 kHz) + voz/frases/frases.json (duraciones)
"""
import json, os, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import numpy as np
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
REF = BASE / 'muestras/muestra_voxcpm2_1.wav'
REF_TEXTO = (
    '¿Buscás un terreno en Santaní? Conocé Portal de Santaní, un nuevo loteamiento en '
    'San Estanislao, San Pedro. Y lo mejor: cuotas desde doscientos mil guaraníes.'
)
OUT = BASE / 'frases'
OUT.mkdir(exist_ok=True)

# Guion aprobado. "voz" = lo que se pronuncia; "sub" = subtítulo en pantalla.
FRASES = [
    {'voz': '¿Buscás un terreno en Santaní?', 'sub': '¿Buscás un terreno en Santaní?'},
    {'voz': 'Conocé Portal de Santaní, un nuevo loteamiento en San Estanislao, San Pedro.',
     'sub': 'Conocé Portal de Santaní, un nuevo loteamiento en San Estanislao, San Pedro.'},
    {'voz': 'Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados.',
     'sub': '650 lotes desde 360 metros cuadrados.'},
    {'voz': 'Y lo mejor: cuotas desde doscientos mil guaraníes, hasta ciento treinta meses.',
     'sub': 'Y lo mejor: cuotas desde 200 mil guaraníes, hasta 130 meses.'},
    {'voz': 'Elegí tu lote y consultá toda la información directamente en nuestro Tour Virtual.',
     'sub': 'Elegí tu lote y consultá toda la información directamente en nuestro Tour Virtual.'},
    {'voz': '¿Querés conocer los lotes disponibles?', 'sub': '¿Querés conocer los lotes disponibles?'},
    {'voz': 'Escribinos por guatsap y recibí toda la información.',
     'sub': 'Escribinos por WhatsApp y recibí toda la información.'},
    {'voz': 'Adolfo Castillo, Asesor Inmobiliario.', 'sub': 'Adolfo Castillo, Asesor Inmobiliario.'},
]


def recortar(wav, sr, umbral_db=-42, margen=0.06):
    """Quita silencio al inicio y al final (deja un margen corto)."""
    env = np.abs(wav)
    lim = 10 ** (umbral_db / 20) * max(1e-6, env.max())
    idx = np.where(env > lim)[0]
    if not len(idx):
        return wav
    a = max(0, idx[0] - int(margen * sr))
    b = min(len(wav), idx[-1] + int(margen * sr))
    return wav[a:b]


modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
meta = []
for i, fr in enumerate(FRASES, 1):
    dest = OUT / f'{i:02d}.wav'
    if not dest.exists():
        t0 = time.time()
        wav = modelo.generate(
            text=fr['voz'],
            reference_wav_path=str(REF),
            prompt_wav_path=str(REF),
            prompt_text=REF_TEXTO,
            cfg_value=2.0,
            inference_timesteps=10,
        )
        sf.write(dest, recortar(wav, sr), sr)
        print(f'{dest.name}: {time.time() - t0:.0f} s de cómputo', flush=True)
    d, _ = sf.read(dest)
    meta.append({**fr, 'archivo': dest.name, 'dur': round(len(d) / sr, 3)})
json.dump(meta, open(OUT / 'frases.json', 'w'), ensure_ascii=False, indent=2)
print('listo', [m['dur'] for m in meta])
