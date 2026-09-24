"""Segunda ronda de pruebas con la voz del usuario (autorizada): más expresiva y con acento paraguayo.

E = continuación de la nota real (prompt_wav + prompt_text): hereda acento y entonación del usuario.
F = referencia de timbre + indicación explícita de acento paraguayo y expresividad, cfg más alto.
G = continuación + referencia + texto con más marcas expresivas.
"""
import os, time
from pathlib import Path

os.environ.setdefault('HF_HUB_OFFLINE', '1')
import soundfile as sf
from voxcpm import VoxCPM

BASE = Path(__file__).resolve().parent
REF = str(BASE / 'referencia/voz_usuario_autorizada.wav')
REF_TXT = (BASE / 'referencia/transcripcion.txt').read_text().strip()
OUT = BASE / 'pruebas'

TEXTO = (
    '¿Buscás un lugar propio para tu familia?... ¡Vení, te llevo! '
    'Estamos llegando a Santaní... ¡y acá está: Portal de Santaní! '
    '¡Seiscientos cincuenta lotes, desde trescientos sesenta metros cuadrados! '
    'Y lo mejor... ¡cuotas desde doscientos mil guaraníes!'
)
ESTILO = ('hablante nativo del Paraguay, acento paraguayo natural de Asunción, nada de acento extranjero, '
          'muy expresivo, alegre y cercano, como si le contara a un amigo, con entusiasmo real, '
          'sube y baja la entonación con naturalidad y remarca las palabras importantes')

modelo = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu')
sr = modelo.tts_model.sample_rate
casos = {
    'E': dict(text=TEXTO, prompt_wav_path=REF, prompt_text=REF_TXT, cfg_value=2.0),
    'F': dict(text=f'({ESTILO}){TEXTO}', reference_wav_path=REF, cfg_value=2.6),
    'G': dict(text=TEXTO, prompt_wav_path=REF, prompt_text=REF_TXT, reference_wav_path=REF, cfg_value=2.4),
}
for k, kw in casos.items():
    t0 = time.time()
    wav = modelo.generate(inference_timesteps=12, **kw)
    sf.write(OUT / f'prueba_voz_clonada_{k}.wav', wav, sr)
    print(f'{k}: {len(wav) / sr:.1f} s de audio ({time.time() - t0:.0f} s de cómputo)', flush=True)
