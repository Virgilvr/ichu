# Portal de Santaní — Reel (Remotion)

Video 1080×1920 · 30 fps · 40 s. Toda la configuración está en **`src/datos.json`** (textos, tiempos, audio, WhatsApp, colores).

## Comandos
```bash
npm install            # una vez
npm run geo            # reprocesa geo/santani.kmz → public/geo/proyecto.json
npm run sfx            # regenera efectos de sonido
npm run qc             # control de calidad + output/subtitulos.srt
npm run studio         # vista previa interactiva
npm run render:todo    # QC + MP4 con voz + MP4 subtitulado + portadas
```

## Antes del render final
1. Voz → `public/audio/voz.mp3` y `"voz": "audio/voz.mp3"`.
2. Música → `public/audio/musica.mp3` y `"musica": "audio/musica.mp3"` (se atenúa sola bajo la voz).
3. Logo → `public/logo/logo.png` y `"marca.logo": "logo/logo.png"`.
4. WhatsApp → `"whatsapp": "+595 9xx xxx xxx"`.
5. (Opcional) Grabación del Tour → `public/tour/grabacion.mp4` y `"tour.grabacion": "tour/grabacion.mp4"`.

## Estructura
- `geo/`: KMZ original, datos OSM y script de procesamiento.
- `public/`: recursos que usa el render (satélite georreferenciado, geometría, audio).
- `src/`: composiciones (`Reel`, `ReelSubtitulado`, `Portada`, `PortadaFeed`), escenas y cámara aérea.
- `output/`: entregables (MP4, portadas, guion, SRT, fuentes, inventario).
