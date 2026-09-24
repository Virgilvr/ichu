"""Realce de la voz (más alegre y con energía) sin perder claridad ni identidad.
Cadena ffmpeg pensada para voz:
  - tono +0,5 semitonos (color más "sonriente")  ·  ritmo +7 % (atempo, sin artefactos de vocoder)
  - presencia +3 dB en 3 kHz y aire +2 dB en 8 kHz (brillo)  ·  compresión suave (más presencia)
Uso: python realce.py entrada.wav salida.wav [tempo] [semitonos]
"""
import subprocess, sys

src, dst = sys.argv[1], sys.argv[2]
tempo = float(sys.argv[3]) if len(sys.argv) > 3 else 1.07
semis = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
k = 2 ** (semis / 12)
filtros = (
    f'asetrate=48000*{k:.5f},aresample=48000,atempo={tempo / k:.5f},'
    'equalizer=f=3000:t=q:w=1.0:g=3,equalizer=f=8000:t=q:w=1.2:g=2,'
    'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2'
)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', filtros, '-ar', '48000', '-ac', '1', dst], check=True)
