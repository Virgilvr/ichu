# PORTAL DE SANTANÍ — Informe de auditoría de recursos (Fase 1)

Fecha: 2026-09-23 · Estado: **auditoría terminada, render sin iniciar** (espera autorización)

---

## A. Inventario de archivos

| # | Recurso | Tipo | Contenido | Utilidad para el Reel | Verificado | Requiere procesamiento |
|---|---------|------|-----------|-----------------------|------------|------------------------|
| 1 | `santani.kmz` | Geográfico | **NO EXISTE en el repo ni en Google Drive** | Crítico (escenas 2, 3 y 7) | — | Sí: extraer KML → GeoJSON |
| 2 | Captura del proyecto (`captura-proyecto.png`) | Imagen | **NO EXISTE en el repo** | Referencia | — | — |
| 3 | Tour Virtual (web) | Página web | Datos comerciales + imagen principal + mapa Mapbox | Fuente de datos y marca | Sí (leído 23/09/2026) | Datos guardados en `referencias/tour-virtual.txt` |
| 4 | Imagen principal del proyecto (Cloudinary) | Foto/render | Imagen de portada del proyecto | Fondo de escenas 1, 4, 8 y portada | Existe en la web | Hay que descargarla y subirla (la red del entorno la bloquea) |
| 5 | Logo Trebol Loteadora (`trebol.png`, `isotipo1.png`) | Logo | Logo oficial publicado en la web | Cierre y marca de agua | Existe en la web | Hay que subirlo (bloqueado para descarga directa) |
| 6 | Link Google Maps | Referencia | Ruta Asunción → punto −24.6671226, −56.4653141 | Centro del zoom geográfico | Sí | Ya guardado en `referencias/google-maps.txt` |
| 7 | Fotos / videos / aéreas | — | **No existen** | — | — | — |
| 8 | Excel / CSV / PDF de lotes | — | **No existen** | — | — | — |
| 9 | Audio / música | — | **No existe** | — | — | — |
| 10 | Manual de marca | — | **No existe** | — | — | — |
| 11 | Número de WhatsApp | — | **No confirmado** → se usa `[WHATSAPP]` | CTA | — | — |

El repo solo tenía `README.md` y un workflow ajeno al proyecto. Se creó la estructura `portal-santani/` completa.

## B. Datos comerciales encontrados

| Dato | Fuente | Estado |
|------|--------|--------|
| Portal de Santaní — Trebol Loteadora | Tour Virtual | ✅ Verificado |
| San Estanislao, San Pedro | Tour Virtual | ✅ Verificado |
| Residencial · Venta activa | Tour Virtual | ✅ Verificado |
| Desde 360 m² | Tour Virtual | ✅ Verificado |
| Cuotas desde Gs 200.000 | Tour Virtual ("Precio desde"). Las fichas muestran cuota ~Gs 260–270 mil y contado ~Gs 20 M → Gs 200.000 solo puede ser cuota | ✅ Resuelto (actualización 1) |
| 650 lotes | Tour: 640 disp. + 3 vendidos + 7 reservados = 650 | ✅ Verificado |
| Agua · Energía eléctrica · Plaza/Área verde | Tour Virtual (atributos) | ✅ Está en la fuente — no incluido en el guion salvo que lo autorices |
| Hasta 130 meses · Opción contado | Fichas de lote del Tour (Plazo 130 meses + Precio contado) | ✅ Verificado |
| 700 m Ruta 3 · 2 min Ka'avo · 7 min centro | Tu brief | ⚠️ No verificable desde las fuentes accesibles |
| Seña por lote | No aparece en las fichas observadas | ❌ No se menciona en el Reel |
| Ficha por lote (estado, manzana, superficie, plazo, cuota, contado, WhatsApp) | Tour Virtual — ver `datos/lotes/` | ✅ Solo como referencia; valores variables |

## C. Datos geográficos (santani.kmz)

**No disponible.** Sin él no hay perímetro, calles ni distribución real. Lo único verificado:
- Punto de destino del link de Maps: **−24.6671226, −56.4653141** (San Estanislao).
- Coherente con "aprox. 7 min del centro" (≈2–3 km del casco urbano).

No voy a dibujar lotes ni calles de fantasía.

## D. Recursos visuales disponibles

- En línea (no descargables desde este entorno): imagen principal, logo, isotipo.
- Imágenes satelitales: **bloqueadas** (Esri, OSM y Mapbox dan error de red). Si no las subís vos, el mapa será vectorial (fondo estilizado + geometría del KMZ).
- Tipografías: Google Fonts accesible (Montserrat/Poppins) ✅.
- Paleta: se toma del logo Trebol (verde) + blanco + acento dorado/amarillo para precio.

## E. Información que falta (ordenada por impacto)

1. **"Precio desde" vs "Cuota desde" Gs. 200.000** — la web dice *Precio desde*. Poner "CUOTAS DESDE" si en realidad es el precio total sería publicidad engañosa (y al revés, un lote de 360 m² a Gs. 200.000 total no es creíble). **Necesito que confirmes que es cuota mensual.**
2. **`santani.kmz`** — subirlo a `portal-santani/geo/` (o a Google Drive; lo puedo bajar desde ahí).
3. **Número de WhatsApp** de campaña. ¿El +595 972 330 000 de la web es WhatsApp? Si no, queda `[WHATSAPP]`.
4. **130 meses / contado** — confirmar que siguen vigentes (no aparecen en la página pública).
5. **Logo en alta** (PNG transparente) + **imagen principal** + fotos/videos reales del terreno o drone.
6. **Capturas satelitales** del proyecto (Google Earth: vista general Santaní, vista media, vista cercana) — 3 imágenes verticales bastan.
7. **Voz:** el entorno bloquea servicios de TTS online. Opciones: (a) grabás la locución con el celular leyendo el guion; (b) te genero la voz con Higgsfield y la paso por Drive; (c) versión sin voz, solo texto + música.
8. **Música:** sin pista disponible. Recomiendo subir una pista libre de derechos (Audio Library de YouTube/Instagram). Instagram permite agregar música al publicar, así que puedo entregar la pista vacía.
9. ¿Se mencionan **Agua / Energía eléctrica / Área verde**? Están en la fuente; suman valor, pero solo si confirmás que ya existen y no son promesas.

## F. Storyboard final (38 s, 1080×1920, 30 fps)

Zona segura: textos entre y=250 y y=1450 px, márgenes laterales de 90 px.

| # | Tiempo | Visual | Texto en pantalla | Voz |
|---|--------|--------|-------------------|-----|
| 1 | 0–3 s | Imagen principal con push-in rápido, barrido de luz | "¿BUSCÁS UN TERRENO EN SANTANÍ?" → corte → "CONOCÉ PORTAL DE SANTANÍ" | "¿Buscás un terreno en Santaní? Conocé Portal de Santaní." |
| 2 | 3–7 s | Mapa: zoom de Paraguay → San Pedro → Santaní → pin en −24.6671, −56.4653; línea de Ruta 3 | "PORTAL DE SANTANÍ" / "A 700 m DE LA RUTA 3" | — |
| 3 | 7–12 s | Vista aérea; perímetro del KMZ que se dibuja + relleno de manzanas | "650 LOTES" / "DESDE 360 m²" (contador animado) | "650 lotes, con terrenos desde 360 metros cuadrados." |
| 4 | 12–17 s | Fondo verde marca, número gigante con conteo 0 → 200.000, golpe de sonido | "CUOTAS DESDE" / **"Gs. 200.000"** | "Cuotas desde 200 mil guaraníes…" |
| 5 | 17–21 s | Dos tarjetas que entran en diagonal | "HASTA 130 MESES" / "OPCIÓN CONTADO" | "…y planes de hasta 130 meses." |
| 6 | 21–26 s | Mapa con 3 marcadores y tiempos (Ruta 3, Ka'avo, centro) | "A 2 min. del almacén Ka'avo" / "Aprox. 7 min. del centro de Santaní" | "Aproximadamente a 700 metros de la Ruta 3, a 2 minutos del almacén Ka'avo y a unos 7 minutos del centro de Santaní." |
| 7 | 26–32 s | Recorrido de cámara sobre las manzanas del KMZ; resaltado de a una | "ELEGÍ TU LOTE" / "CONSULTÁ DISPONIBILIDAD" | "¿Querés conocer los lotes disponibles?" |
| 8 | 32–38 s | Fondo marca, burbuja de chat de WhatsApp que "escribe" SANTANÍ, logo Trebol | "¿QUERÉS VER LOS LOTES DISPONIBLES?" → "ESCRIBINOS **SANTANÍ** POR WHATSAPP" → "Te enviamos los lotes disponibles y sus cuotas." + `[WHATSAPP]` | "Escribinos SANTANÍ por WhatsApp y te enviamos las opciones y sus cuotas." |

Si no llega el KMZ: escenas 3 y 7 usan solo el pin + imagen principal con zoom, **sin dibujar lotes**. Pierde fuerza, pero no inventa nada.

## G. Recursos por escena

| Escena | Recursos |
|--------|----------|
| 1 | Imagen principal · tipografía Montserrat ExtraBold · whoosh |
| 2 | Captura satelital (si la subís) o mapa vectorial · coordenada de Maps · trazado de Ruta 3 (solo si viene en KMZ o captura) |
| 3 | `santani.kmz` (perímetro + manzanas) · captura satelital cercana |
| 4 | Paleta de marca · SFX "impacto" |
| 5 | Paleta de marca · SFX suave |
| 6 | Mapa de escena 2 · marcadores con datos del brief |
| 7 | `santani.kmz` · imágenes del tour/drone si existen · SFX "resaltado" |
| 8 | Logo Trebol · número WhatsApp o `[WHATSAPP]` · SFX notificación |
| Portada | Imagen principal + "PORTAL DE SANTANÍ" + "CUOTAS DESDE Gs. 200.000" |

## H. Herramientas

- **Remotion (React)** — composición 1080×1920, escenas parametrizadas en `src/config.ts` (duraciones y textos editables → cambiar a 30 o 45 s en una línea). Render MP4 H.264 + AAC con su FFmpeg incluido.
- **Python + fastkml/shapely** — lectura del KMZ, conversión a GeoJSON y proyección a coordenadas de pantalla sin alterar la geometría.
- **SVG animado** para perímetro y manzanas (trazo progresivo).
- **Subtítulos**: SRT generado del guion con tiempos, versión quemada en video.
- **Audio**: mezcla en Remotion (voz 100 %, música con ducking a ~20 %, SFX sintéticos generados localmente).

### Entregables previstos en `output/`
`portal-santani-reel.mp4` (voz) · `portal-santani-reel-subtitulado.mp4` · `portada-instagram.png` (1080×1920 y 1080×1350) · `guion.md` · `subtitulos.srt` · `inventario-recursos.md` · `fuentes.md`


---

# ACTUALIZACIÓN 1 — El Tour Virtual como argumento de venta

## Qué cambió
- **E-1 resuelto:** Gs. 200.000 es cuota (el contado ronda los Gs. 20 M).
- **E-4 resuelto:** 130 meses y opción contado aparecen en las fichas de lote.
- Se agrega una escena que demuestra cómo usar el Tour. Es el diferencial del Reel: el cliente ve **cómo** consultar su lote.
- Se agrega la frase **"Cada lote tiene su propia cuota y condición comercial."**
- Las dos fichas observadas (Mz 8 y Mz 14) quedan en `datos/lotes/` **solo como referencia**. No se muestran como oferta.

## Cómo se muestra la ficha sin inventar ni prometer
- **Opción A (recomendada): grabación real de pantalla** del Tour desde tu celular (vertical, 20–30 s): abrir el Tour, mover el mapa, tocar un lote y esperar a que abra la ficha. Le agrego zoom, resaltados y rótulos encima.
- **Opción B: simulación fiel** con tus capturas de la ficha (mapa + popup). Sin capturas no puedo copiar el diseño real: no vi la interfaz.
- En cualquiera de las dos, los **valores numéricos se desenfocan** y solo quedan nítidos los rótulos SUPERFICIE · CUOTA · PLAZO · CONTADO. Así la escena enseña *dónde mirar* y no parece una oferta. Además se ven los precios tachados de la promo, que no deben leerse como promoción general.
- Sobreimpreso fijo: *"Valores referenciales. Cada lote tiene su propia cuota y condición comercial."*

## Storyboard revisado (42 s)

| # | Tiempo | Visual | Texto en pantalla | Voz |
|---|--------|--------|-------------------|-----|
| 1 | 0–3 | Push-in sobre la imagen principal | ¿BUSCÁS UN TERRENO EN SANTANÍ? → CONOCÉ PORTAL DE SANTANÍ | "¿Buscás un terreno en Santaní? Conocé Portal de Santaní." |
| 2 | 3–7 | Zoom de mapa hasta el pin (−24.6671, −56.4653) | PORTAL DE SANTANÍ · A 700 m DE LA RUTA 3 | — |
| 3 | 7–11 | Perímetro y manzanas del KMZ dibujándose | 650 LOTES · DESDE 360 m² | "650 lotes, desde 360 metros cuadrados." |
| 4 | 11–15 | Número gigante en conteo | CUOTAS DESDE **Gs. 200.000** · *Cada lote tiene su propia cuota y condición comercial.* | "Cuotas desde 200 mil guaraníes." |
| 5 | 15–18 | Dos tarjetas | HASTA 130 MESES · OPCIÓN CONTADO | "Planes de hasta 130 meses u opción contado." |
| 6 | 18–22 | Mapa con 3 marcadores | A 2 min. del almacén Ka'avo · Aprox. 7 min. del centro de Santaní | "A 700 metros de la Ruta 3, a 2 minutos del almacén Ka'avo y a unos 7 del centro." |
| **7** | **22–34** | **Celular con el Tour:** ① entra al Tour ② recorre el mapa ③ toca un lote ④ se abre la ficha ⑤ se resaltan en secuencia SUPERFICIE → CUOTA → PLAZO → CONTADO ⑥ pulso en el botón WhatsApp | 1 · ENTRÁ AL TOUR VIRTUAL · 2 · ELEGÍ TU LOTE · 3 · MIRÁ SU SUPERFICIE, CUOTA Y CONTADO | "Entrá al Tour Virtual, recorré el proyecto y tocá el lote que te guste: ves su superficie, su cuota, el plazo y el precio contado." |
| 8 | 34–42 | Burbuja de WhatsApp escribiendo SANTANÍ + logo | ELEGÍ TU LOTE · CONSULTÁ SU CUOTA · ESCRIBINOS **SANTANÍ** POR WHATSAPP · Te enviamos los lotes disponibles y sus cuotas. · [WHATSAPP] | "¿Querés conocer los lotes disponibles? Escribinos SANTANÍ por WhatsApp y te enviamos las opciones y sus cuotas." |

La voz dura unos 36 s a ritmo comercial. Los 42 s entran en el rango de 30–45.

## Pendientes actualizados
1. `santani.kmz` (escenas 2, 3 y 6).
2. **Grabación de pantalla del Tour** o capturas de la ficha (escena 7).
3. Número de WhatsApp. ¿El +595 972 330 000 es WhatsApp?
4. Logo PNG, imagen principal y capturas de Google Earth.
5. Voz (grabada, IA o sin voz) y música.
6. ¿Link del Tour en pantalla? El video no es clickeable; recomiendo que lo envíe el WhatsApp como respuesta automática a "SANTANÍ".
