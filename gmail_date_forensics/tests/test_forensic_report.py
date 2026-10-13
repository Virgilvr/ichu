"""Tests de generacion de informes y del veredicto forense."""

import json
from datetime import datetime, timezone

from gmail_date_forensics.message_builder import build_test_message, simulate_receipt, serialize_message
from gmail_date_forensics.header_analyzer import analyze_headers
from gmail_date_forensics.forensic_report import build_report, write_json_report, write_text_report


def _analisis_retrodatado():
    msg = build_test_message("a@x", "b@x", "s", "c")  # Date 2025-08-07
    recibido = simulate_receipt(msg, received_at=datetime(2026, 10, 13, tzinfo=timezone.utc))
    return analyze_headers(serialize_message(recibido))


def test_veredicto_no_prueba_envio_historico_en_simulacion():
    analysis = _analisis_retrodatado()
    report = build_report(analysis, target_date_iso="2025-08-07")
    # Hay marcas de laboratorio -> nunca puede ser prueba real.
    assert report["veredicto"]["prueba_envio_historico"] is False
    assert "laboratorio" in report["advertencia_laboratorio"].lower()


def test_informe_registra_fechas_clave():
    analysis = _analisis_retrodatado()
    report = build_report(analysis, target_date_iso="2025-08-07")
    assert report["fechas"]["A_date_declarado"].startswith("2025-08-07")
    assert report["fechas"]["B_received_mas_reciente"].startswith("2026")
    assert report["analisis"]["date_coincide_con_objetivo"] is True
    assert report["analisis"]["retrodatado_sospechado"] is True


def test_lista_no_verificable_incluye_internaldate_y_ui():
    report = build_report(_analisis_retrodatado(), target_date_iso="2025-08-07")
    texto = " ".join(report["no_verificable_solo_con_encabezados"]).lower()
    assert "internaldate" in texto
    assert "interfaz" in texto


def test_escribe_json_y_txt(tmp_path):
    report = build_report(_analisis_retrodatado(), target_date_iso="2025-08-07")
    jp = write_json_report(report, tmp_path / "r.json")
    tp = write_text_report(report, tmp_path / "r.txt")
    assert jp.is_file() and tp.is_file()
    # El JSON es valido y reversible.
    data = json.loads(jp.read_text(encoding="utf-8"))
    assert data["consigna"]["fecha_objetivo"] == "2025-08-07"
    # El TXT contiene el veredicto.
    assert "VEREDICTO" in tp.read_text(encoding="utf-8")


def test_mensaje_coherente_sin_marca_lab_no_es_prueba_si_simulado():
    # Aunque Date y Received coincidan, si hay marca de laboratorio no es prueba.
    ahora = datetime(2026, 10, 13, 12, 0, 0, tzinfo=timezone.utc)
    msg = build_test_message("a@x", "b@x", "s", "c", declared_date=ahora)
    recibido = simulate_receipt(msg, received_at=ahora)
    analysis = analyze_headers(serialize_message(recibido))
    report = build_report(analysis, target_date_iso="2026-10-13")
    assert report["veredicto"]["prueba_envio_historico"] is False
