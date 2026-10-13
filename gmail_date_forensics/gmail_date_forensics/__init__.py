"""
gmail_date_forensics
=====================

Laboratorio forense para analizar la diferencia entre la FECHA DECLARADA
(cabecera ``Date``, controlada por el emisor) y la FECHA REAL DE TRANSPORTE
(cabeceras ``Received`` e ``internalDate``, estampadas por los servidores).

Objetivo defensivo: demostrar, de forma reproducible, que una fecha de envio
historica NO se puede falsificar de manera indetectable y como un auditor lo
verifica en los encabezados.

El paquete funciona 100% offline en modo simulacion: construye mensajes MIME
de prueba SIN enviarlos y sin conectarse a Gmail.
"""

from .message_builder import build_test_message, serialize_message, simulate_receipt
from .header_analyzer import analyze_headers, HeaderAnalysis
from .forensic_report import build_report, write_json_report, write_text_report

__all__ = [
    "build_test_message",
    "serialize_message",
    "simulate_receipt",
    "analyze_headers",
    "HeaderAnalysis",
    "build_report",
    "write_json_report",
    "write_text_report",
]

__version__ = "1.0.0"
