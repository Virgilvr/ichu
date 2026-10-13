# Informe de viabilidad técnica — Fechas de correo y "retrodatado" en Gmail

**Ámbito:** investigación defensiva/forense sobre si un correo puede *aparentar* haber sido enviado el **7 de agosto de 2025** enviándose hoy, entre dos cuentas Gmail de prueba.
**Conclusión corta:** el campo `Date` se puede fijar a cualquier valor; la **fecha real de envío/recepción no se puede falsificar de forma indetectable**. Las trazas que estampan los servidores (`Received`, DKIM `t=`, `internalDate`) delatan el instante real.

---

## Fase 1 — Las cinco "fechas" NO son la misma

| | Fecha | Quién la fija | Se puede manipular por el emisor | Qué significa |
|---|---|---|---|---|
| **A** | `Date:` | El **emisor** (su cliente/librería MIME) | **Sí, totalmente** | Momento en que el creador *declara* que el mensaje quedó listo (RFC 5322 §3.6.1). Explícitamente **no** es la hora de transporte. |
| **B** | `Received:` | Cada **servidor** de tránsito (MTA), incluido el MX de Gmail | **No** (el emisor no controla los saltos siguientes) | Hora real a la que cada servidor recibió el mensaje. Se leen de abajo hacia arriba (RFC 5322 §3.6.7). |
| **C** | Fecha en la **interfaz** de Gmail | Cliente web/app de Gmail | No directamente | Lo que ve el usuario. Para correo recibido por SMTP, el orden en la bandeja sigue `internalDate` (hora de aceptación por Google), no el `Date`. |
| **D** | Registros de la cuenta: `internalDate` (API), audit logs, carpeta *Enviados* | **Google** | No | Hora real de aceptación/envío. Google documenta que `internalDate` es "**more reliable than the `Date` header**". |
| **E** | Mensaje histórico **original** (realmente enviado en 2025) | — | — | Tiene `Received`, DKIM `t=` e `internalDate` coherentes con agosto 2025, y existe en backups/logs de esa época. |

**Clave forense:** un `Date` retrodatado produce **A ≈ ago-2025** pero **B/D ≈ hoy**. Esa **inconsistencia** es la huella. Para falsificar también B/D habría que comprometer la infraestructura de Google (fuera de alcance y prohibido).

### Qué admite / modifica Gmail durante el transporte

- **`Date`** del emisor: Gmail lo **conserva** tal cual (lo pone el cliente). Enviando por SMTP/API con un `Date` de 2025, ese valor viaja intacto.
- **`Received`**: Gmail **añade los suyos** con la hora real; el emisor no puede evitarlo ni editarlos retroactivamente.
- **`Message-ID`**: si el emisor no lo pone, el MSA de Gmail lo **genera** (y suele incluir marca temporal real).
- **`DKIM-Signature`**: Gmail **firma al enviar**, con `t=` = instante de firma (hora real).
- **`Authentication-Results`**: el **receptor** (Gmail receptor) los añade al evaluar SPF/DKIM/DMARC en el momento de recepción.
- **`internalDate`**: lo fija **Google** al aceptar el mensaje; determina el orden en la bandeja.

---

## Fase 2 — Diagnóstico por alternativa

Ver la matriz completa en [`MATRIZ_COMPARATIVA.md`](./MATRIZ_COMPARATIVA.md). Resumen:

1. **Fijar `Date` (SMTP o Gmail API `messages.send`)** → viable y trivial, pero **no demuestra** envío histórico: los `Received`/DKIM del transporte real contradicen el `Date`.
2. **`messages.import` / `messages.insert` (Gmail API)** → permite controlar `internalDate` **al importar a un buzón propio**, pero: (a) añade su propio `Received` y marcas; (b) no reescribe DKIM del dominio ajeno; (c) el resultado queda en *tu* buzón, no demuestra que un tercero lo recibiera en 2025; (d) requiere OAuth con scope sensible sobre cuenta propia.
3. **Editar un `.eml` a mano** → cambia el texto, pero rompe la firma DKIM y no concuerda con ningún log/backup; detectable.
4. **Recuperar el original (Fase 5)** → la **única** vía legítima si el correo existió de verdad.

---

## Fase 6 — Criterios de éxito (qué debe decir el informe)

El informe generado por la herramienta responde explícitamente:

- **Qué fecha hay en `Date`** → campo A (`A_date_declarado`).
- **Qué fechas hay en `Received`** → campo B (lista + más antiguo/reciente).
- **Qué registros adicionales** → DKIM `t=`; y, en un caso real, `internalDate` y audit logs (fuera de los encabezados).
- **Si coincide con la consigna** → `veredicto.prueba_envio_historico` (en simulación: **siempre `False`**, por las marcas de laboratorio).
- **Qué no se pudo verificar** → sección `no_verificable_solo_con_encabezados` (interfaz de Gmail, `internalDate`, logs, validez criptográfica real de DKIM).

**Regla cumplida:** el informe **no** declara que un correo fue enviado en 2025 si los registros no lo respaldan.

---

## Riesgos de interpretación

- Un `Date` de 2025 en la bandeja **no** equivale a "enviado en 2025". Hay que mirar `Received`/`internalDate`.
- Un `.eml` **aislado** (sin trazas de transporte) no prueba cuándo se envió.
- Capturas de pantalla de la interfaz son **débiles**: la interfaz puede mostrar el `Date` declarado; lo que ancla la fecha real es el *original* completo con `Received`/DKIM y, si se dispone, `internalDate` vía API o audit logs.

## Límite legal

Fabricar un correo con fecha falsa para presentarlo como prueba ante un tercero (p. ej. un expediente administrativo o judicial) constituye falsificación. Este laboratorio es para **entender y detectar** esa manipulación, no para producirla.
