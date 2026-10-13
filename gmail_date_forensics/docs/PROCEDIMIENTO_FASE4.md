# Procedimiento Fase 4 — Prueba entre dos cuentas Gmail propias

> **Estado: NO ejecutado.** Este documento describe cómo correr la prueba real entre **cuentas de prueba propias del usuario**. No se envía nada hasta que el usuario **autorice explícitamente** y **confirme las cuentas**. El repositorio no incluye código de envío activo.

## Propósito

Observar empíricamente, sobre infraestructura real de Gmail, qué ocurre cuando se envía un mensaje con `Date` retrodatado (7-ago-2025):
- Confirmar que Gmail **conserva** el `Date` declarado.
- Confirmar que Gmail **añade** `Received`/DKIM con la hora **real** y fija `internalDate` real.
- Documentar qué fecha muestra la **interfaz** (campo C) y qué dice la **API** (`internalDate`, campo D).

No busca engañar a nadie: busca **demostrar la detectabilidad** del retrodatado.

## Precondiciones (bloqueantes)

1. Autorización **explícita** del usuario, por escrito, para enviar.
2. Dos cuentas Gmail **propias de prueba** confirmadas (emisora y receptora).
3. Autenticación por **OAuth 2.0** (NO contraseñas en archivos; NO "contraseñas de aplicación" guardadas en el repo).
4. Credenciales fuera del repositorio (p. ej. variable de entorno apuntando a un `token.json` local, en `.gitignore`).

## Datos a presentar ANTES de transmitir (checklist de autorización)

Antes de cualquier envío se debe mostrar y confirmar:

- [ ] **Cuenta emisora:** `__________@gmail.com`
- [ ] **Cuenta receptora:** `__________@gmail.com`
- [ ] **Asunto:** `__________`
- [ ] **Contenido:** `__________`
- [ ] **Fecha declarada (`Date`):** `Thu, 07 Aug 2025 10:30:00 -0300`
- [ ] **Limitaciones conocidas:** el `Date` será 2025 pero `Received`/DKIM/`internalDate` serán de hoy; el mensaje **no** probará un envío histórico.

## Pasos

1. **Preparar el MIME** con `Date` = 7-ago-2025 usando `message_builder.build_test_message` (ya disponible, offline). No se envía todavía.
2. **Mostrar el checklist** anterior y **esperar autorización**.
3. **Autenticar con OAuth 2.0** (scope mínimo: `gmail.send` para enviar; `gmail.readonly` para recuperar). El flujo lo ejecuta el usuario en su navegador; el token queda en un archivo local no versionado.
4. **Enviar** con `users.messages.send` (Gmail API) desde la cuenta emisora a la receptora.
5. **Recuperar** desde la receptora el mensaje (`users.messages.get` con `format=raw` + `metadata`), obteniendo:
   - El `.eml` completo (con los `Received` reales).
   - El `internalDate` (epoch ms de aceptación por Google).
6. **Capturar la interfaz:** anotar la fecha que Gmail muestra en la lista y al abrir el mensaje (campo C).
7. **Analizar** el `.eml` recuperado con:
   ```bash
   PYTHONPATH=. python3 -m gmail_date_forensics.cli analyze recuperado.eml --objetivo 2025-08-07
   ```
8. **Preservar evidencias sin modificarlas** (guardar el `.eml` y el JSON de la API tal cual; registrar hashes SHA-256).
9. **Informe de diferencias:** contrastar A (`Date`) vs B (`Received`) vs C (interfaz) vs D (`internalDate`).

## Resultado esperado (hipótesis a confirmar empíricamente)

| Campo | Valor esperado |
|---|---|
| A. `Date` | 2025-08-07 (declarado) |
| B. `Received` | fecha de **hoy** (transporte real) |
| C. Interfaz Gmail | **a verificar**: para correo recibido, el orden sigue `internalDate` (hoy); la vista del mensaje puede mostrar el `Date` declarado |
| D. `internalDate` | epoch de **hoy** (aceptación por Google) |

> El punto C es exactamente lo que la Fase 6 pide verificar y lo que **no** se puede determinar solo con los encabezados: requiere mirar el buzón real. Documentar el comportamiento observado, sin asumirlo.

## Qué NO hacer

- No usar cuentas ajenas ni dominios de terceros.
- No almacenar contraseñas/cookies/tokens en el repositorio ni en logs.
- No presentar el resultado como prueba de un envío histórico: el propio experimento demuestra lo contrario.
