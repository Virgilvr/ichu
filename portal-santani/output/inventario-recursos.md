# Inventario de recursos (actualizado)

| Recurso | Ubicación | Estado | Uso |
|---|---|---|---|
| KMZ del proyecto | `geo/santani.kmz` | ✅ Recibido y procesado | Perímetro, calles, lotes (escenas 3, 4, 5, 7, portada) |
| Geometría procesada | `public/geo/proyecto.json` (`npm run geo`) | ✅ | Todas las escenas de mapa |
| Satélite regional 20 km | `public/sat/L0.jpg` | ✅ Georreferenciada | Gancho, cercanía |
| Satélite intermedio 5,7 km | `public/sat/L1.jpg` | ✅ | Ubicación, cercanía |
| Satélite cercano 2,9 km (1,4 m/px) | `public/sat/L2.jpg` | ✅ | Proyecto, precio, financiación, Tour |
| Ruta 3 + Ka'avo + centro (OSM) | `geo/osm_ruta3_poi.json` | ✅ | Ubicación, cercanía |
| Efectos de sonido | `public/audio/sfx/*.wav` (`npm run sfx`) | ✅ Sintetizados propios | Precio, mapa, lotes, tap, CTA |
| Fuente tipográfica | Montserrat (paquete @fontsource, OFL) | ✅ | Todo el texto |
| Datos de lotes (referencia) | `datos/lotes/` | ✅ Solo referencia | No aparece en video |
| Logo Trebol Loteadora | — | ❌ Falta | CTA (hoy va solo el texto "TREBOL LOTEADORA") |
| Locución | — | ❌ Falta | `public/audio/voz.mp3` |
| Música | — | ❌ Falta | `public/audio/musica.mp3` |
| Grabación del Tour | — | ⚪ Opcional | Reemplaza la simulación del celular |
| Número WhatsApp | `src/datos.json` | ✅ +595 976 557 380 (Adolfo Castillo, Asesor Inmobiliario) | CTA |
