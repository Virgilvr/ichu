# Matriz comparativa de alternativas (Fase 2)

Objetivo contrastado: que un correo *aparente* fecha **7-ago-2025** enviándose hoy.
Leyenda viabilidad: ✅ funciona para lo que realmente permite · ⚠️ parcial/engañoso · ❌ no sirve / detectable.

| # | Alternativa | Viabilidad técnica | Herramientas | Limitaciones de Gmail | Evidencias a revisar | Riesgo de interpretación | Qué se puede demostrar REALMENTE |
|---|---|---|---|---|---|---|---|
| 1 | **Fijar `Date` histórico** y enviar por SMTP (`smtplib`) o Gmail API `messages.send` | ✅ para el campo `Date`; ❌ como "prueba histórica" | `email`, `smtplib` / Gmail API + OAuth | Gmail añade `Received` y firma DKIM con la hora **real**; no editables | `Received` (hora real), `DKIM t=`, `internalDate` | Alto: el `Date` de 2025 contradice los `Received` de hoy | Que el `Date` es manipulable; el envío real sigue siendo **hoy** |
| 2 | **`messages.import`** (Gmail API) a buzón propio controlando `internalDate` | ⚠️ solo dentro de tu propia cuenta | Gmail API + OAuth (scope sensible) | Añade su `Received`; no reescribe DKIM del dominio ajeno; marca de importación | `internalDate`, `Received` de importación, `X-Gmail-*` | Alto: parece "antiguo" en *tu* bandeja, pero no prueba recepción por un tercero en 2025 | Que **tú** colocaste un mensaje con `internalDate` pasado en tu propio buzón |
| 3 | **`messages.insert`** (Gmail API) | ⚠️ similar a #2 | Gmail API + OAuth | Igual que #2; inserta sin pasar por SMTP | `internalDate`, cabeceras añadidas | Alto | Lo mismo que #2 |
| 4 | **Editar un `.eml` a mano** (cambiar `Date`/`Received`) | ❌ | Editor de texto | Rompe/incoherencia DKIM; no concuerda con logs/backups | Firma DKIM inválida, saltos `Received` incoherentes | Muy alto si se presenta como real | Nada creíble; falsificación evidente |
| 5 | **Cliente de correo (IMAP/SMTP) con `Date` manual** | ✅ para `Date`; ❌ como prueba | Thunderbird, etc. | Igual que #1 | `Received`, `DKIM t=` | Alto | Igual que #1 |
| 6 | **Recuperar el original** realmente enviado en 2025 (Fase 5) | ✅ única vía legítima | Carpeta *Enviados*, `.eml`/MBOX export, Google Takeout, Vault/audit logs | Depende de retención/backups | `internalDate` ≈ ago-2025, `Received` ≈ ago-2025, DKIM válido de esa época | Bajo si la cadena de custodia es correcta | Que el correo **existió y se envió** en 2025 |

## Lectura de la matriz

- **Enviar ahora con `Date` pasado (1,5):** cambia un solo campo que el emisor controla; **todo lo demás** (trazas de transporte, firma, `internalDate`) apunta a hoy. Es la definición de retrodatado detectable.
- **Import/insert (2,3):** manipulan `internalDate` **en tu propia cuenta**. Útil para pruebas de laboratorio, inútil como prueba de que un tercero recibió algo en 2025; además dejan marcas de importación.
- **Editar `.eml` (4):** rompe la coherencia criptográfica; la peor opción.
- **Recuperar original (6):** lo único que respalda legítimamente "enviado el 7-ago-2025", y solo si el mensaje existió de verdad y se conserva con cadena de custodia.

## APIs / clientes: qué campos se admiten vs. se generan

| Campo | SMTP (`smtplib`) | Gmail API `send` | Gmail API `import`/`insert` | Cliente IMAP/SMTP |
|---|---|---|---|---|
| `Date` | Emisor | Emisor | Emisor | Emisor |
| `Message-ID` | Emisor o MSA | Emisor o Gmail | Emisor | Emisor o MSA |
| `Received` | **Servidores** (real) | **Servidores** (real) | Añade `Received` de import | **Servidores** (real) |
| `DKIM-Signature` `t=` | **Servidor firmante** (real) | **Gmail** (real) | No regenera DKIM ajeno válido | **Servidor** (real) |
| `Authentication-Results` | **Receptor** | **Receptor** | n/a (no hay recepción SMTP) | **Receptor** |
| `internalDate` | **Google** (aceptación) | **Google** (aceptación) | **Configurable** por el cliente al importar | **Google** |

> Resumen: el único valor realmente libre para el emisor es `Date` (y, en import/insert sobre cuenta propia, `internalDate`). Las trazas de transporte y la firma las controla la infraestructura.
