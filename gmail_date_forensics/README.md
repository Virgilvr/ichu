# gmail_date_forensics

Laboratorio **forense y defensivo** para analizar la diferencia entre la **fecha declarada** de un correo (cabecera `Date`, que controla el emisor) y la **fecha real de transporte** (cabeceras `Received`, `DKIM t=` e `internalDate`, que estampan los servidores).

## Qué demuestra (y qué NO)

**Pregunta de partida:** ¿se puede hacer que un correo *parezca* enviado el **7 de agosto de 2025** aunque se envíe hoy?

**Respuesta técnica verificada:**
- **SÍ** se puede fijar el campo `Date` a cualquier valor (es trivial con cualquier librería MIME y es sintácticamente válido según RFC 5322 §3.6.1).
- **NO** se puede falsificar de forma indetectable la **fecha real de envío/recepción**: los servidores de Gmail estampan `Received`, firman DKIM con `t=` y registran `internalDate` con la hora real. Esas trazas **delatan** cualquier `Date` retrodatado.

> El valor de este proyecto es **detectar** ese intento, no ejecutarlo. Un `Date` retrodatado **no prueba** un envío histórico.

## Requisitos

- Python 3.11+ (el núcleo usa solo la biblioteca estándar).
- `pytest` solo para las pruebas (`pip install -r requirements.txt`).

## Uso

Modo por defecto = **simulación offline** (no envía correo, no se conecta a Gmail):

```bash
cd gmail_date_forensics
PYTHONPATH=. python3 -m gmail_date_forensics.cli simulate --outdir salida
```

Genera en `salida/`:
- `01_mensaje_declarado.eml` — MIME con `Date: 7 Aug 2025` (sin enviar).
- `02_mensaje_con_received_simulado.eml` — el mismo mensaje con `Received`/DKIM **simulados** (marcados `LAB-SIMULADO`) a la hora real.
- `informe.json` / `informe.txt` — análisis y veredicto.

Analizar un `.eml` **real** exportado del buzón (Gmail → *Mostrar original* → *Descargar mensaje original*):

```bash
PYTHONPATH=. python3 -m gmail_date_forensics.cli analyze mensaje.eml --objetivo 2025-08-07 --outdir salida_analisis
```

> Para un `.eml` real de Gmail, la fecha de los `Received` corresponderá al transporte real. Si el `Date` dice 2025 y los `Received` dicen otra fecha, el informe marca **retrodatado**.

## Pruebas

```bash
PYTHONPATH=. python3 -m pytest -q
```

## Estructura

```
gmail_date_forensics/
├── gmail_date_forensics/
│   ├── message_builder.py   # construye MIME con Date historico; simula recepcion (sin red)
│   ├── header_analyzer.py   # extrae Date / Received / Message-ID / Auth-Results / DKIM t=
│   ├── forensic_report.py   # informe JSON + TXT y veredicto
│   └── cli.py               # subcomandos: simulate (def.) y analyze
├── tests/                   # 21 pruebas (pytest)
├── docs/
│   ├── INFORME_VIABILIDAD.md    # Fase 1-2 y 6: investigacion + criterios
│   ├── MATRIZ_COMPARATIVA.md    # Fase 2: matriz de alternativas
│   └── PROCEDIMIENTO_FASE4.md   # Fase 4: envio entre cuentas propias (requiere autorizacion)
├── requirements.txt
└── README.md
```

## Seguridad (reglas aplicadas)

- No envía correo ni abre conexiones de red en ningún modo de este repositorio.
- No solicita, almacena ni expone contraseñas, cookies, tokens ni credenciales.
- Las cabeceras que estamparía un servidor se generan solo en modo simulación y van marcadas `LAB-SIMULADO-NO-ES-EVIDENCIA-REAL`.
- La Fase 4 (envío real entre **cuentas propias de prueba**) está **documentada pero no implementada**: requiere autorización explícita, confirmación de cuentas y OAuth 2.0.
- **No** sirve para fabricar evidencia destinada a engañar a terceros. Hacerlo en un expediente administrativo o judicial es ilícito; este laboratorio precisamente demuestra por qué tal falsificación es detectable.

## Fuentes oficiales

- RFC 5322 §3.6.1 — *The Origination Date Field* (`Date` = fecha declarada por el creador, "specifically **not** intended to convey the time that the message is actually transported").
- RFC 5322 §3.6.7 — *Trace Fields* (`Received`, prepended por cada salto).
- RFC 5321 — SMTP (sellado de `Received` por los MTA).
- RFC 8601 — *Authentication-Results* (SPF/DKIM/DMARC).
- RFC 6376 — DKIM (`t=` instante de firma).
- Gmail API, `users.messages.internalDate`: "For normal SMTP-received email, this represents the time the message was originally accepted by Google, **which is more reliable than the `Date` header**."
