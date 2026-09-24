# Voz elegida para el video v2: prueba D

- Motor: VoxCPM2 (openbmb/VoxCPM2, Apache 2.0), CPU.
- Timbre: voz del usuario, clonada con su autorización expresa (dueño de la voz).
  Referencia local `referencia/voz_usuario_autorizada.wav` (NO se publica: repo público).
- Modo: `reference_wav_path` (solo timbre, sin transcripción) + indicación de estilo al inicio del texto:
  "(con alegría y entusiasmo controlado, como un vendedor que muestra con orgullo el proyecto,
  cálido y seguro, pausas naturales y énfasis en las palabras importantes)"
- Parámetros: cfg_value=2.0, inference_timesteps=12.
- Configuración exacta en `prueba_voz_clonada.py` (variante D).
