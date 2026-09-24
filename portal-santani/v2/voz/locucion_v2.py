"""Locución completa v2 con la voz G (Adolfo Castillo, autorizada), versión más alegre.

Modo G: continuación de la nota real + referencia de timbre. Para levantar la energía se
antepone una indicación de estilo y se sube el cfg. Uso:
  python v2/voz/locucion_v2.py <modo: g|alegre> <salida> [indices...]
"""
import json, os, sys, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
REF = str(BASE / 'referencia/voz_usuario_autorizada.wav')
REF_TXT = (BASE / 'referencia/transcripcion.txt').read_text().strip()
ESTILO = '(muy alegre y entusiasmado, sonriendo mientras habla, con energía y realce de vendedor, voz radiante y segura)'

FRASES = [
    ('¿Buscás un lugar propio para tu familia?… ¡Vení, te llevo!', '¿Buscás un lugar propio para tu familia?… ¡Vení, te llevo!'),
    ('Estamos llegando a Santaní, en San Estanislao, San Pedro.', 'Estamos llegando a Santaní, en San Estanislao, San Pedro.'),
    ('Y acá está… ¡Portal de Santaní!', 'Y acá está… ¡Portal de Santaní!'),
    ('Mirá sus calles… sus lotes, uno al lado del otro.', 'Mirá sus calles… sus lotes, uno al lado del otro.'),
    ('¡Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados!', '¡650 lotes, desde 360 m²!'),
    ('A unos siete minutos del centro de Santaní.', 'A unos siete minutos del centro de Santaní.'),
    ('Y lo mejor… ¡cuotas desde doscientos mil guaraníes, hasta ciento treinta meses, o al contado!',
     'Y lo mejor… ¡cuotas desde 200 mil guaraníes, hasta 130 meses, o al contado!'),
    ('Elegí tu lote en nuestro Tour Virtual.', 'Elegí tu lote en nuestro Tour Virtual.'),
    ('¿Querés conocer los lotes disponibles? ¡Escribinos por guatsap!', '¿Querés conocer los lotes disponibles? ¡Escribinos por WhatsApp!'),
    ('¡Soy Adolfo Castillo!', 'Soy Adolfo Castillo.'),
]

modo, out = sys.argv[1], Path(sys.argv[2])
idx = [int(i) for i in sys.argv[3:]] or list(range(1, len(FRASES) + 1))
out.mkdir(parents=True, exist_ok=True)
modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
for i in idx:
    voz, _ = FRASES[i - 1]
    texto = f'{ESTILO}{voz}' if modo == 'alegre' else voz
    cfg = 2.8 if modo == 'alegre' else 2.4
    t0 = time.time()
    wav = modelo.generate(text=texto, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF,
                          cfg_value=cfg, inference_timesteps=12)
    sf.write(out / f'{i:02d}.wav', wav, sr)
    print(f'{i:02d}: {len(wav) / sr:.1f} s ({time.time() - t0:.0f} s)', flush=True)
json.dump([{'voz': v, 'sub': s} for v, s in FRASES], open(out / 'frases.json', 'w'), ensure_ascii=False, indent=2)
