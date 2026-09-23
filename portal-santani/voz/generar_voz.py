"""Locución del Reel con Kokoro-82M (ONNX, CPU), voces masculinas españolas.

- Idioma de generación FORZADO a español latinoamericano (espeak-ng 'es-419':
  seseo, "conosé" y no "conoθé"). Nunca se usa en-us.
- Voces: em_alex y em_santa (únicas voces masculinas españolas de Kokoro).

Uso:
  python3 voz/generar_voz.py descargar     # baja modelo (325,5 MB) + 2 voces (0,5 MB c/u)
  python3 voz/generar_voz.py muestras      # muestra corta con cada voz
  python3 voz/generar_voz.py completo em_alex   # guion completo + tiempos por frase
"""
import json, sys, urllib.request
from pathlib import Path
import numpy as np
import soundfile as sf

BASE = Path(__file__).resolve().parent
MOD = BASE / 'modelos'
REPO = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231'
ARCHIVOS = {'model.onnx': 'onnx/model.onnx', 'em_alex.bin': 'voices/em_alex.bin', 'em_santa.bin': 'voices/em_santa.bin'}
IDIOMA = 'es-419'
VOCES = ['em_alex', 'em_santa']

MUESTRA = '¿Buscás un terreno en Santaní? Conocé Portal de Santaní, un nuevo loteamiento en San Estanislao, San Pedro.'

# Guion aprobado, una frase por bloque (sirve para sincronizar subtítulos).
# Números escritos como se dicen; "WhatsApp" escrito fonéticamente para español.
GUION = [
    '¿Buscás un terreno en Santaní?',
    'Conocé Portal de Santaní, un nuevo loteamiento en San Estanislao, San Pedro.',
    'Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados.',
    'Y lo mejor: cuotas desde doscientos mil guaraníes, hasta ciento treinta meses.',
    'Elegí tu lote y consultá toda la información directamente en nuestro Tour Virtual.',
    '¿Querés conocer los lotes disponibles?',
    'Escribinos por guatsap y recibí toda la información.',
    'Adolfo Castillo, Asesor Inmobiliario.',
]


def descargar():
    MOD.mkdir(parents=True, exist_ok=True)
    for local, remoto in ARCHIVOS.items():
        dest = MOD / local
        if dest.exists():
            continue
        print('descargando', remoto)
        urllib.request.urlretrieve(f'{REPO}/{remoto}', dest)


def motor():
    import espeakng_loader
    from kokoro_onnx import Kokoro, EspeakConfig
    voces_npz = MOD / 'voces.npz'
    if not voces_npz.exists():
        np.savez(voces_npz, **{v: np.fromfile(MOD / f'{v}.bin', dtype=np.float32).reshape(-1, 1, 256) for v in VOCES})
    cfg = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=espeakng_loader.get_data_path())
    return Kokoro(str(MOD / 'model.onnx'), str(voces_npz), espeak_config=cfg)


def muestras():
    k = motor()
    out = BASE / 'muestras'
    out.mkdir(exist_ok=True)
    for v in VOCES:
        audio, sr = k.create(MUESTRA, voice=v, speed=1.0, lang=IDIOMA)
        sf.write(out / f'muestra_{v}.wav', audio, sr)
        print(v, f'{len(audio) / sr:.1f} s')


def completo(voz, velocidad=1.0):
    k = motor()
    pausa = 0.35
    partes, tiempos, t = [], [], 0.0
    for frase in GUION:
        audio, sr = k.create(frase, voice=voz, speed=velocidad, lang=IDIOMA)
        partes += [audio, np.zeros(int(sr * pausa), dtype=np.float32)]
        tiempos.append({'desde': round(t, 2), 'hasta': round(t + len(audio) / sr, 2), 'texto': frase})
        t += len(audio) / sr + pausa
    sf.write(BASE / f'locucion_{voz}.wav', np.concatenate(partes), sr)
    json.dump(tiempos, open(BASE / f'locucion_{voz}.json', 'w'), ensure_ascii=False, indent=2)
    print(f'{voz}: {t:.1f} s')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'muestras'
    {'descargar': descargar, 'muestras': muestras}.get(cmd, lambda: completo(sys.argv[2]))()
