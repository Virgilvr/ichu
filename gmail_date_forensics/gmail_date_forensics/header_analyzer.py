"""
Analisis forense de encabezados.

Extrae y compara las distintas "fechas" de un mensaje:
  A. Date            -> declarada por el emisor (RFC 5322 3.6.1).
  B. Received[]      -> estampadas por cada servidor de transporte (RFC 5322 3.6.7).
  D. DKIM t=         -> instante de firma del servidor firmante.
  (C. fecha de la interfaz de Gmail y la D. de registros de cuenta se verifican
   fuera de los encabezados; ver docs/PROCEDIMIENTO_FASE4.md).

El objetivo es detectar la INCONSISTENCIA entre A y B/D, que es la huella que
delata un ``Date`` retrodatado.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from email import message_from_bytes, message_from_string
from email.message import Message
from email.utils import parsedate_to_datetime
from typing import Any

from .message_builder import MARCA_SIMULADO


# Umbral (segundos) a partir del cual la diferencia Date vs Received se considera
# significativa (no explicable por latencia normal de transporte). 1 dia.
UMBRAL_INCONSISTENCIA_SEG = 24 * 3600


@dataclass
class HeaderAnalysis:
    """Resultado estructurado del analisis de un mensaje."""

    declared_date: datetime | None = None          # A. cabecera Date
    received_dates: list[datetime] = field(default_factory=list)  # B. cada Received
    received_raw: list[str] = field(default_factory=list)
    message_id: str | None = None
    authentication_results: list[str] = field(default_factory=list)
    dkim_timestamp: datetime | None = None          # D. t= de DKIM-Signature
    simulated_headers_present: bool = False         # marca LAB-SIMULADO detectada

    # Derivados
    earliest_received: datetime | None = None
    latest_received: datetime | None = None
    delta_date_vs_received_seconds: float | None = None
    backdated_suspected: bool = False
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        # Serializar datetimes a ISO 8601.
        for key in ("declared_date", "earliest_received", "latest_received", "dkim_timestamp"):
            val = d.get(key)
            d[key] = val.isoformat() if isinstance(val, datetime) else None
        d["received_dates"] = [dt.isoformat() for dt in self.received_dates]
        return d


def _parse_received_datetime(received_value: str) -> datetime | None:
    """Extrae el datetime de una cabecera ``Received`` (texto tras el ultimo ';')."""
    if ";" not in received_value:
        return None
    date_part = received_value.rsplit(";", 1)[1].strip()
    # Quitar comentarios entre parentesis al final, p.ej. "(LAB-SIMULADO...)".
    if "(" in date_part:
        date_part = date_part.split("(", 1)[0].strip()
    try:
        dt = parsedate_to_datetime(date_part)
    except (TypeError, ValueError, IndexError):
        return None
    if dt is None:
        return None
    # Normalizar a aware (si viniera naive, asumir UTC solo para comparar).
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _parse_dkim_timestamp(dkim_value: str) -> datetime | None:
    """Extrae el ``t=`` (epoch) de una cabecera ``DKIM-Signature``."""
    for token in dkim_value.replace("\n", " ").split(";"):
        token = token.strip()
        if token.startswith("t="):
            raw = token[2:].strip().split()[0]
            try:
                return datetime.fromtimestamp(int(raw), tz=timezone.utc)
            except (ValueError, OverflowError):
                return None
    return None


def analyze_message(msg: Message) -> HeaderAnalysis:
    """Analiza un objeto ``email.message.Message`` y devuelve ``HeaderAnalysis``."""
    result = HeaderAnalysis()

    # A. Date declarado.
    raw_date = msg.get("Date")
    if raw_date:
        try:
            result.declared_date = parsedate_to_datetime(raw_date)
        except (TypeError, ValueError):
            result.notes.append("Cabecera Date presente pero no parseable.")

    # B. Received (todas).
    for rec in msg.get_all("Received", []):
        rec_str = str(rec)
        result.received_raw.append(rec_str)
        if MARCA_SIMULADO in rec_str:
            result.simulated_headers_present = True
        dt = _parse_received_datetime(rec_str)
        if dt is not None:
            result.received_dates.append(dt)

    # Message-ID.
    result.message_id = msg.get("Message-ID")

    # Authentication-Results.
    for ar in msg.get_all("Authentication-Results", []):
        ar_str = str(ar)
        result.authentication_results.append(ar_str)
        if MARCA_SIMULADO in ar_str:
            result.simulated_headers_present = True

    # D. DKIM t=.
    dkim = msg.get("DKIM-Signature")
    if dkim:
        if MARCA_SIMULADO in str(dkim):
            result.simulated_headers_present = True
        result.dkim_timestamp = _parse_dkim_timestamp(str(dkim))

    # Marca explicita de laboratorio.
    if msg.get("X-Lab-Origin") == MARCA_SIMULADO or msg.get("X-Lab-Simulated-Receipt"):
        result.simulated_headers_present = True

    _compute_derived(result)
    return result


def analyze_headers(raw: bytes | str) -> HeaderAnalysis:
    """Analiza un mensaje crudo (bytes o str, formato .eml)."""
    if isinstance(raw, bytes):
        msg = message_from_bytes(raw)
    else:
        msg = message_from_string(raw)
    return analyze_message(msg)


def _compute_derived(result: HeaderAnalysis) -> None:
    """Calcula minimos/maximos de Received y la sospecha de retrodatado."""
    if result.received_dates:
        result.earliest_received = min(result.received_dates)
        result.latest_received = max(result.received_dates)

    # Referencia de transporte real: preferimos DKIM t=, luego el Received mas antiguo.
    transporte = result.dkim_timestamp or result.earliest_received

    if result.declared_date is not None and transporte is not None:
        delta = (transporte - result.declared_date).total_seconds()
        result.delta_date_vs_received_seconds = delta
        # Si el transporte es MUY posterior al Date declarado -> retrodatado.
        if delta > UMBRAL_INCONSISTENCIA_SEG:
            result.backdated_suspected = True
            dias = delta / 86400.0
            result.notes.append(
                f"INCONSISTENCIA: el transporte (Received/DKIM) es {dias:.1f} dias "
                f"POSTERIOR al Date declarado. El Date esta retrodatado respecto al "
                f"envio real; no prueba un envio historico."
            )
        elif delta < -UMBRAL_INCONSISTENCIA_SEG:
            result.notes.append(
                "AVISO: el Date declarado es muy posterior al transporte (fecha futura)."
            )
        else:
            result.notes.append(
                "Date y transporte son coherentes (diferencia dentro de la latencia normal)."
            )
    elif result.declared_date is not None and transporte is None:
        result.notes.append(
            "Solo hay Date declarado y ninguna traza de transporte (Received/DKIM). "
            "No se puede corroborar la fecha de envio con este mensaje aislado."
        )
