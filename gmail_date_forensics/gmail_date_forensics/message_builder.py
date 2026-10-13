"""
Construccion de mensajes MIME de laboratorio.

Reglas de seguridad aplicadas en codigo:
- NO envia correo. NO abre conexiones de red. NO maneja credenciales.
- Las cabeceras que un servidor estamparia (``Received``) se generan solo en
  ``simulate_receipt`` y quedan marcadas explicitamente como SIMULADAS para que
  nunca se confundan con evidencia real.

Referencias oficiales:
- RFC 5322 3.6.1 (campo ``Date`` = fecha de origen declarada por el creador).
- RFC 5321 4.4 / RFC 5322 3.6.7 (cabeceras de traza ``Received``, prepended).
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from email.utils import format_datetime, make_msgid


# Fecha objetivo de la consigna: 7 de agosto de 2025.
# Paraguay (America/Asuncion). Se deja configurable el offset; el valor por
# defecto no altera la conclusion forense.
FECHA_OBJETIVO_DEFAULT = datetime(2025, 8, 7, 10, 30, 0, tzinfo=timezone(timedelta(hours=-3)))

# Marca inequivoca para cabeceras generadas por el laboratorio.
MARCA_SIMULADO = "LAB-SIMULADO-NO-ES-EVIDENCIA-REAL"


def build_test_message(
    from_addr: str,
    to_addr: str,
    subject: str,
    body: str,
    declared_date: datetime | None = None,
    *,
    message_id_domain: str = "lab.local",
) -> EmailMessage:
    """Construye un ``EmailMessage`` de prueba con una fecha ``Date`` declarada.

    No se envia nada. El ``Date`` se fija a ``declared_date`` (por defecto la
    fecha objetivo 2025-08-07). Esto es trivial con cualquier libreria MIME y es
    sintacticamente valido segun RFC 5322: demuestra que el campo ``Date`` lo
    controla por completo el emisor y, por si solo, no prueba transporte.

    :param declared_date: datetime con tzinfo. Si es None usa FECHA_OBJETIVO_DEFAULT.
    """
    if declared_date is None:
        declared_date = FECHA_OBJETIVO_DEFAULT
    if declared_date.tzinfo is None:
        raise ValueError("declared_date debe incluir tzinfo (zona horaria explicita).")

    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg["Subject"] = subject
    # Campo clave del experimento: fecha declarada por el emisor.
    msg["Date"] = format_datetime(declared_date)
    # Message-ID generado localmente (en un envio real lo regenera el MSA de Gmail).
    msg["Message-ID"] = make_msgid(domain=message_id_domain)
    # Marca que identifica el mensaje como artefacto de laboratorio.
    msg["X-Lab-Origin"] = MARCA_SIMULADO
    msg.set_content(body)
    return msg


def serialize_message(msg: EmailMessage) -> bytes:
    """Serializa el mensaje a bytes RFC 5322 (equivalente a un .eml), sin enviarlo."""
    return msg.as_bytes()


def simulate_receipt(
    msg: EmailMessage,
    *,
    received_at: datetime | None = None,
    sending_server: str = "mail-sim-out.gmail.example (LAB)",
    receiving_server: str = "mx-sim.google.example (LAB)",
    add_simulated_auth_results: bool = True,
) -> EmailMessage:
    """Devuelve una COPIA del mensaje con cabeceras ``Received`` SIMULADAS.

    Emula lo que harian los servidores reales: estampar una cabecera ``Received``
    con la hora real de transporte (``received_at``, por defecto *ahora*). Las
    cabeceras de traza van prepended (al inicio), como exige RFC 5322 3.6.7.

    Todas las cabeceras generadas aqui llevan la marca ``LAB-SIMULADO`` para que
    el analisis forense pueda distinguirlas de un ``Received`` real de Gmail.
    En un experimento real (Fase 4) estas cabeceras las produce la infraestructura
    de Google y el emisor NO puede controlarlas ni retrodatarlas.
    """
    if received_at is None:
        received_at = datetime.now(timezone.utc)
    if received_at.tzinfo is None:
        raise ValueError("received_at debe incluir tzinfo.")

    # Reconstruimos un mensaje nuevo para controlar el orden (traza al inicio).
    received_msg = EmailMessage()

    # Received del MX receptor (el mas reciente, va primero / arriba).
    received_msg["Received"] = (
        f"from {sending_server} by {receiving_server} with ESMTPS "
        f"id sim-{int(received_at.timestamp())}; {format_datetime(received_at)} "
        f"({MARCA_SIMULADO})"
    )
    # Received del MSA emisor (ligeramente anterior al receptor).
    received_msg["Received"] = (
        f"from localhost by {sending_server} with ESMTPSA "
        f"id sim-out-{int(received_at.timestamp())}; "
        f"{format_datetime(received_at - timedelta(seconds=2))} "
        f"({MARCA_SIMULADO})"
    )

    if add_simulated_auth_results:
        received_msg["Authentication-Results"] = (
            f"mx-sim.google.example; dkim=pass (sim) header.i=@gmail.example; "
            f"spf=pass (sim) smtp.mailfrom=gmail.example; dmarc=pass (sim) "
            f"({MARCA_SIMULADO})"
        )
        # DKIM t= = instante de firma, estampado por el servidor firmante al enviar.
        received_msg["DKIM-Signature"] = (
            f"v=1; a=rsa-sha256; d=gmail.example; s=sim; t={int(received_at.timestamp())}; "
            f"h=from:to:subject:date; b=SIMULATED ({MARCA_SIMULADO})"
        )

    # Copiamos las cabeceras originales del emisor DESPUES de la traza.
    for key, value in msg.items():
        received_msg[key] = value

    # Copiamos el cuerpo.
    content = msg.get_content()
    received_msg.set_content(content)

    received_msg["X-Lab-Simulated-Receipt"] = format_datetime(received_at)
    return received_msg
