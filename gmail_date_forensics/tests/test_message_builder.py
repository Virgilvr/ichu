"""Tests de construccion de mensajes y simulacion de recepcion."""

from datetime import datetime, timezone, timedelta

import pytest

from gmail_date_forensics.message_builder import (
    build_test_message,
    serialize_message,
    simulate_receipt,
    FECHA_OBJETIVO_DEFAULT,
    MARCA_SIMULADO,
)
from email import message_from_bytes
from email.utils import parsedate_to_datetime


def test_build_fija_date_objetivo_por_defecto():
    msg = build_test_message("a@gmail.example", "b@gmail.example", "s", "cuerpo")
    date = parsedate_to_datetime(msg["Date"])
    assert date.date().isoformat() == "2025-08-07"
    assert date == FECHA_OBJETIVO_DEFAULT


def test_build_acepta_fecha_personalizada():
    d = datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    msg = build_test_message("a@x", "b@x", "s", "c", declared_date=d)
    assert parsedate_to_datetime(msg["Date"]) == d


def test_build_rechaza_fecha_naive():
    with pytest.raises(ValueError):
        build_test_message("a@x", "b@x", "s", "c", declared_date=datetime(2025, 8, 7))


def test_build_tiene_message_id_y_marca_lab():
    msg = build_test_message("a@x", "b@x", "s", "c")
    assert msg["Message-ID"]
    assert msg["X-Lab-Origin"] == MARCA_SIMULADO


def test_serialize_devuelve_bytes_rfc5322():
    msg = build_test_message("a@x", "b@x", "s", "c")
    raw = serialize_message(msg)
    assert isinstance(raw, bytes)
    assert b"Date:" in raw
    reparsed = message_from_bytes(raw)
    assert reparsed["Subject"] == "s"


def test_simulate_receipt_agrega_received_con_hora_real():
    msg = build_test_message("a@x", "b@x", "s", "c")  # Date = 2025-08-07
    ahora = datetime(2026, 10, 13, 12, 0, 0, tzinfo=timezone.utc)
    recibido = simulate_receipt(msg, received_at=ahora)

    received_headers = recibido.get_all("Received")
    assert received_headers and len(received_headers) == 2
    # Todas las cabeceras de laboratorio llevan la marca.
    for r in received_headers:
        assert MARCA_SIMULADO in r
    # La hora del Received es la real (2026), no la declarada (2025).
    top = received_headers[0]
    dt = parsedate_to_datetime(top.rsplit(";", 1)[1].split("(")[0].strip())
    assert dt.year == 2026


def test_simulate_receipt_conserva_date_declarado():
    msg = build_test_message("a@x", "b@x", "s", "c")
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    assert parsedate_to_datetime(recibido["Date"]).date().isoformat() == "2025-08-07"


def test_simulate_receipt_incluye_dkim_y_auth_results():
    msg = build_test_message("a@x", "b@x", "s", "c")
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    assert recibido["DKIM-Signature"] is not None
    assert recibido["Authentication-Results"] is not None
