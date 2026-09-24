# ichu — sistema de videos inmobiliarios (plantilla maestra multi-asesor / multi-cliente)

## Qué es este repo
- Producción de Reels publicitarios de loteamientos (9:16) con Remotion + locución + música generada.
- El método está en el Skill `.claude/skills/video-terrenos/SKILL.md`. Usarlo SIEMPRE que el usuario diga
  "NUEVO VIDEO TERRENOS" o pida un video de un proyecto inmobiliario.
- Motor de render: `portal-santani/` (app Remotion; componentes genéricos en `portal-santani/src/comun/`).
- Datos por proyecto: `proyectos/<slug>/proyecto.json` (+ material, voz, logo, output de ese proyecto).

## Reglas de aislamiento entre proyectos (obligatorias)
1. Ningún asesor, número de WhatsApp, voz, logo, loteadora ni proyecto es "el de siempre".
   El sistema no tiene datos de contacto por defecto.
2. Nuevo proyecto → pedir solo lo que falte; mínimo: nombre del proyecto, nombre del asesor, WhatsApp.
   Crear la carpeta con `python3 .claude/skills/video-terrenos/scripts/nuevo_proyecto.py`.
3. Nunca completar un dato faltante con el de otro proyecto (ni de esta conversación ni del repo).
4. La placa de cierre se arma solo con `proyecto.nombre`, `contacto.asesor`, `contacto.rol` y
   `contacto.whatsapp` del proyecto actual (componente `PlacaCierre`).
5. Voz: solo la autorizada para ese proyecto (registrada en `proyectos/<slug>/voz/AUTORIZACION.md`).
   Si no hay voz entregada, preguntar. Nunca reutilizar la voz clonada de otro asesor.
6. Logos: solo los del proyecto actual y si el cliente lo pide. Nunca junto al nombre de un asesor
   independiente de forma que sugiera relación laboral.
7. Antes de cada render y de cada entrega:
   `python3 .claude/skills/video-terrenos/scripts/verificar_aislamiento.py <slug>` debe dar OK, y revisar
   cuadros de la placa final del MP4 físico que se adjunta.

## Privacidad y repo público
- El repo es PÚBLICO: nunca subir audio de voces, referencias de clonación, fotos/videos del cliente ni MP4.
  Cada `proyectos/<slug>/.gitignore` los excluye. Sí se suben código, `proyecto.json` y la autorización (texto).
- Commits con las líneas de atribución que indique la sesión. No crear PR salvo pedido.

## Estilo del usuario
- Español, directo, resultados primero. No inventar datos (precios, distancias, disponibilidad).
- Entregables se ADJUNTAN a la conversación (MP4 livianos ≤ 30 MB); nombres nuevos en cada revisión.
