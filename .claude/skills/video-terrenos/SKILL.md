---
name: video-terrenos
description: Plantilla maestra para producir Reels publicitarios de loteamientos y terrenos (9:16, locución, música, subtítulos destacados, placa de contacto) para cualquier asesor inmobiliario y cualquier proyecto. Usar cuando el usuario diga "NUEVO VIDEO TERRENOS", pida un video/Reel de un loteamiento, o quiera rehacer/ajustar un video de un proyecto inmobiliario existente. Multi-asesor y multi-cliente con aislamiento estricto de datos entre proyectos.
---

# Video Terrenos — plantilla maestra multi-asesor / multi-cliente

Este Skill es un MÉTODO, no un proyecto. No contiene ningún asesor, número, voz, logo, loteadora ni
proyecto fijo. Todos esos datos viven únicamente en la carpeta de cada proyecto:
`proyectos/<slug>/proyecto.json` (+ sus materiales, voz y logo).

## 1. Regla de aislamiento (obligatoria)

- Cada proyecto tiene SUS PROPIOS: asesor, WhatsApp, voz, logo, datos comerciales, distancias y materiales.
- Nunca reutilizar automáticamente el nombre, WhatsApp, voz, logo o identidad comercial de otro proyecto,
  aunque esté en esta misma conversación, en el repo o en la memoria.
- Si falta un dato del proyecto nuevo, se PREGUNTA; nunca se completa con el de un proyecto anterior.
- La voz clonada de un asesor solo se usa en SU proyecto y con autorización registrada.
- Un logo de loteadora solo se usa si pertenece al proyecto nuevo y el cliente lo pide.
- Antes de cada render y antes de entregar: `python3 .claude/skills/video-terrenos/scripts/verificar_aislamiento.py <slug>`
  (debe terminar en OK). Además, revisar cuadros de la placa final del MP4 físico.

## 2. Inicio: "NUEVO VIDEO TERRENOS"

1. Pedir SOLO lo que falte. Mínimo obligatorio para crear el proyecto:
   - Nombre del proyecto
   - Nombre del asesor inmobiliario
   - Número de WhatsApp (formato `+595 9XX XXX XXX`)
2. Crear la carpeta:
   ```bash
   python3 .claude/skills/video-terrenos/scripts/nuevo_proyecto.py \
     --proyecto "<NOMBRE DEL PROYECTO>" --asesor "<NOMBRE DEL ASESOR>" --whatsapp "<NÚMERO>"
   ```
   Crea `proyectos/<slug>/` con `proyecto.json`, `material/`, `voz/`, `logo/`, `output/` y `.gitignore`.
3. Pedir después (solo si no se entregaron): materiales (fotos, videos, KMZ, Tour Virtual), datos
   comerciales (cantidad de lotes, superficie desde, cuota desde, plazo, contado), ubicación, logo si
   corresponde, y qué voz usar.

## 3. Flujo de producción

1. Crear carpeta del proyecto (paso 2).
2. Preguntar solo lo que realmente falta.
3. Completar `proyecto.json` con los datos entregados (campo `fuente` en cada dato).
4. Auditar archivos: inventario de material, calidad, qué sirve para cada escena.
5. Verificar datos: distancias con KMZ/OSM/Tour; nada inventado (ver §6).
6. Guion (frases cortas, voseo paraguayo, CTA a WhatsApp) → aprobación del usuario.
7. Storyboard con tiempos por escena → aprobación.
8. Voz (ver §4): muestra corta → aprobación → locución completa (solo audio) → aprobación.
   La locución aprobada NO se modifica después (solo se coloca en la línea de tiempo).
9. Video: escenas reales + satélite + KMZ + Tour, música instrumental original.
10. Versión subtitulada (estilo destacado, §5).
11. Versión sin subtítulos.
12. Versiones livianas (≤ 30 MB para adjuntar: `-crf 22 -maxrate 2600k`, AAC 192k, `+faststart`).
13. Verificar todo (§7).
14. Adjuntar los MP4 finales a la conversación (con nombres nuevos en cada revisión para evitar confusiones de caché).

## 4. Voz (independiente por proyecto)

- Si el cliente entrega una voz autorizada: usarla, registrar la autorización en
  `proyectos/<slug>/voz/AUTORIZACION.md` (quién autoriza, para qué proyecto, fecha, texto de la autorización)
  y guardar la referencia de audio dentro de `proyectos/<slug>/voz/` (nunca en el repo público).
- Si no entrega voz: PREGUNTAR qué voz usar (voz sintética genérica, grabación propia, etc.).
- Nunca usar la voz clonada de otro asesor u otro proyecto.
- Motor probado: VoxCPM2 en modo continuación (referencia de 10–15 s limpia + su transcripción);
  verificar cada frase con Whisper y el tono con pyin.

## 5. Estilo aprobado (se mantiene; los datos cambian)

- Placa final (componente `portal-santani/src/comun/PlacaCierre.tsx`), jerarquía:
  ```
  <NOMBRE DEL PROYECTO>
  ¿QUERÉS CONOCER LOS LOTES DISPONIBLES?
  <NOMBRE DEL ASESOR>
  ASESOR INMOBILIARIO
  ESCRIBINOS POR WHATSAPP
  <NÚMERO DE WHATSAPP>
  ```
  Los valores salen SOLO de `proyecto.json` → `proyecto.nombre`, `contacto.asesor`, `contacto.rol` (por defecto
  "Asesor Inmobiliario"; puede ser "Asesora Inmobiliaria" si el cliente lo indica),
  `contacto.whatsapp`. Sin logos de terceros junto al nombre del asesor (asesor independiente).
  La placa se sostiene ~3 s con música después del fin de la voz; fundido a negro en el último segundo.
- Subtítulos destacados: cápsula blanca 88 %, texto dorado oscuro (#B07A00) Montserrat 900 con contorno
  fino, bloques de 1–2 líneas (≤ 24 caracteres por línea), sincronizados por palabra (Whisper), zona segura.
- Música: instrumental original generada por código (sin licencias de terceros), baja bajo la voz.

## 6. Datos: nada inventado

- Solo datos entregados por el cliente o verificados (sitio oficial, KMZ, OSM, Tour Virtual).
- Precios por lote del Tour: se tapan (varían por lote); se usa solo la cuota "desde" confirmada.
- Distancias: solo medidas o mostradas por una fuente; si una fuente contradice otra, se avisa.
- Leyendas/tradiciones locales: presentarlas como "leyenda popular", con fuentes.
- Disponibilidad ("quedan pocos", etc.): prohibido salvo dato del cliente.

## 7. Verificación antes de entregar

- `verificar_aislamiento.py <slug>` → OK.
- Cuadros extraídos del MP4 FÍSICO (placa final 3 momentos): nombre, rol y WhatsApp correctos del proyecto
  actual; ningún dato de otro proyecto.
- Audio: locución completa (Whisper), fade final intacto, sin cortes; duración esperada.
- Archivos pesados (voz, material, MP4) fuera del repo público (`.gitignore` del proyecto).
