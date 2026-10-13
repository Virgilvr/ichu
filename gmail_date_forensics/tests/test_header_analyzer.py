"""Tests del analizador de encabezados."""

from datetime import datetime, timezone

from gmail_date_forensics.message_builder import build_test_message, simulate_receipt, serialize_message
from gmail_date_forensics.header_analyzer import analyze_headers, _parse_received_datetime, _parse_dkim_timestamp


def test_detecta_retrodatado_cuando_received_es_posterior():
    msg = build_test_message("a@x", "b@x", "s", "c")  # Date 2025-08-07
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    analysis = analyze_headers(serialize_message(recibido))

    assert analysis.declared_date.date().isoformat() == "2025-08-07"
    assert analysis.backdated_suspected is True
    assert analysis.delta_date_vs_received_seconds > 0
    assert analysis.simulated_headers_present is True


def test_coherente_cuando_date_y_received_cercanos():
    ahora = datetime(2026, 10, 13, 12, 0, 0, tzinfo=timezone.utc)
    msg = build_test_message("a@x", "b@x", "s", "c", declared_date=ahora)
    recibido = simulate_receipt(msg, received_at=ahora)
    analysis = analyze_headers(serialize_message(recibido))
    assert analysis.backdated_suspected is False
    assert abs(analysis.delta_date_vs_received_seconds) < 24 * 3600


def test_mensaje_aislado_sin_received():
    msg = build_test_message("a@x", "b@x", "s", "c")
    analysis = analyze_headers(serialize_message(msg))
    assert analysis.declared_date is not None
    assert analysis.received_dates == []
    assert analysis.earliest_received is None
    assert analysis.backdated_suspected is False


def test_parse_received_datetime_con_comentario():
    rec = "from x by y with ESMTPS id 1; Mon, 13 Oct 2025 10:00:00 +0000 (LAB-SIMULADO)"
    dt = _parse_received_datetime(rec)
    assert dt is not None and dt.year == 2025 and dt.month == 10


def test_parse_received_datetime_invalido():
    assert _parse_received_datetime("sin punto y coma") is None


def test_parse_dkim_timestamp():
    dkim = "v=1; a=rsa-sha256; d=gmail.com; s=sel; t=1760000000; h=from:to; b=XXXX"
    dt = _parse_dkim_timestamp(dkim)
    assert dt is not None
    assert dt.tzinfo == timezone.utc


def test_extrae_message_id_y_auth_results():
    msg = build_test_message("a@x", "b@x", "s", "c")
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    analysis = analyze_headers(serialize_message(recibido))
    assert analysis.message_id is not None
    assert len(analysis.authentication_results) == 1


def test_to_dict_serializa_datetimes():
    msg = build_test_message("a@x", "b@x", "s", "c")
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    d = analyze_headers(serialize_message(recibido)).to_dict()
    assert isinstance(d["declared_date"], str)
    assert all(isinstance(x, str) for x in d["received_dates"])
