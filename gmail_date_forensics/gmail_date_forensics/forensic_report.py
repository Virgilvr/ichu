"""
Generacion de informes forenses (JSON y texto).

El informe responde explicitamente a los criterios de la Fase 6:
- Que fecha contiene el campo Date.
- Que fechas figuran en los Received.
- Que registros adicionales estan disponibles (DKIM t=, internalDate, logs).
- Si el resultado coincide con la consigna (envio historico 2025-08-07).
- Que aspectos NO fue posible verificar solo con los encabezados.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .header_analyzer import HeaderAnalysis


def build_report(
    analysis: HeaderAnalysis,
    *,
    target_date_iso: str = "2025-08-07",
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Construye el diccionario del informe a partir de un ``HeaderAnalysis``."""

    declared = analysis.declared_date
    declared_matches_target = (
        declared is not None and declared.date().isoformat() == target_date_iso
    )

    # Veredicto: el mensaje prueba un envio historico?
    # Solo si la fecha declarada coincide con el objetivo Y el transporte la respalda
    # Y no son cabeceras de laboratorio.
    transporte_respalda = (
        analysis.delta_date_vs_received_seconds is not None
        and abs(analysis.delta_date_vs_received_seconds) <= 24 * 3600
    )
    prueba_envio_historico = bool(
        declared_matches_target
        and transporte_respalda
        and not analysis.backdated_suspected
        and not analysis.simulated_headers_present
    )

    verdict_text = _verdict_text(
        analysis=analysis,
        declared_matches_target=declared_matches_target,
        prueba_envio_historico=prueba_envio_historico,
    )

    report = {
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "consigna": {
            "fecha_objetivo": target_date_iso,
            "pregunta": (
                "Puede este mensaje demostrar que fue enviado el "
                f"{target_date_iso}?"
            ),
        },
        "contexto": context or {},
        "advertencia_laboratorio": (
            "Cabeceras de laboratorio/simuladas detectadas. Este informe NO "
            "constituye evidencia de un envio real."
            if analysis.simulated_headers_present
            else "No se detectaron marcas de laboratorio en este mensaje."
        ),
        "fechas": {
            "A_date_declarado": _iso(analysis.declared_date),
            "B_received": [_iso(d) for d in analysis.received_dates],
            "B_received_mas_antiguo": _iso(analysis.earliest_received),
            "B_received_mas_reciente": _iso(analysis.latest_received),
            "D_dkim_timestamp": _iso(analysis.dkim_timestamp),
        },
        "identificadores": {
            "message_id": analysis.message_id,
            "authentication_results": analysis.authentication_results,
        },
        "analisis": {
            "delta_date_vs_transporte_segundos": analysis.delta_date_vs_received_seconds,
            "date_coincide_con_objetivo": declared_matches_target,
            "retrodatado_sospechado": analysis.backdated_suspected,
            "cabeceras_simuladas_presentes": analysis.simulated_headers_present,
            "notas": analysis.notes,
        },
        "veredicto": {
            "prueba_envio_historico": prueba_envio_historico,
            "texto": verdict_text,
        },
        "no_verificable_solo_con_encabezados": [
            "C. La fecha exacta que muestra la INTERFAZ de Gmail (lista y vista "
            "de mensaje) — requiere inspeccion en el buzon receptor (Fase 4).",
            "internalDate de la Gmail API (epoch de aceptacion por Google).",
            "Registros administrativos / audit logs de Google Workspace.",
            "Validez criptografica real de la firma DKIM contra la clave publica "
            "vigente del dominio firmante.",
        ],
    }
    return report


def _verdict_text(
    *,
    analysis: HeaderAnalysis,
    declared_matches_target: bool,
    prueba_envio_historico: bool,
) -> str:
    if analysis.simulated_headers_present:
        return (
            "NO PRUEBA NADA SOBRE UN ENVIO REAL. El mensaje contiene cabeceras de "
            "laboratorio simuladas. Demuestra unicamente que el campo Date se puede "
            "fijar a cualquier valor (aqui, la fecha objetivo), mientras que las "
            "trazas de transporte estampadas por el servidor delatan el instante real."
        )
    if prueba_envio_historico:
        return (
            "El Date coincide con la fecha objetivo y las trazas de transporte lo "
            "respaldan. Aun asi, confirme internalDate, la vista de Gmail y los logs "
            "antes de afirmar un envio historico (ver criterios Fase 6)."
        )
    if analysis.backdated_suspected:
        return (
            "RETRODATADO DETECTADO. El campo Date declara una fecha anterior, pero las "
            "cabeceras Received/DKIM estampadas por los servidores corresponden a un "
            "transporte muy posterior. Un Date retrodatado es sintacticamente valido "
            "(RFC 5322) pero NO prueba un envio historico; de hecho queda delatado por "
            "las trazas de transporte."
        )
    if declared_matches_target and analysis.earliest_received is None:
        return (
            "El Date coincide con la fecha objetivo, pero el mensaje no tiene trazas "
            "de transporte (Received/DKIM) que lo corroboren. Un mensaje aislado con "
            "solo el campo Date NO demuestra cuando fue enviado realmente."
        )
    return (
        "No se puede afirmar un envio historico con la evidencia presente. Revise las "
        "notas del analisis."
    )


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if isinstance(dt, datetime) else None


def write_json_report(report: dict[str, Any], path: str | Path) -> Path:
    """Escribe el informe en JSON."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def write_text_report(report: dict[str, Any], path: str | Path) -> Path:
    """Escribe el informe en texto legible."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    f = report["fechas"]
    a = report["analisis"]
    v = report["veredicto"]
    lines: list[str] = []
    lines.append("=" * 72)
    lines.append("INFORME FORENSE DE FECHAS DE CORREO")
    lines.append("=" * 72)
    lines.append(f"Generado: {report['generado_en']}")
    lines.append(f"Fecha objetivo (consigna): {report['consigna']['fecha_objetivo']}")
    lines.append("")
    lines.append(f"[!] {report['advertencia_laboratorio']}")
    lines.append("")
    lines.append("-" * 72)
    lines.append("FECHAS EXTRAIDAS")
    lines.append("-" * 72)
    lines.append(f"  A. Date declarado (emisor) : {f['A_date_declarado']}")
    lines.append(f"  B. Received (mas antiguo)  : {f['B_received_mas_antiguo']}")
    lines.append(f"  B. Received (mas reciente) : {f['B_received_mas_reciente']}")
    lines.append(f"  D. DKIM t= (firma)         : {f['D_dkim_timestamp']}")
    if f["B_received"]:
        lines.append("  Received (todas):")
        for r in f["B_received"]:
            lines.append(f"      - {r}")
    lines.append("")
    lines.append("-" * 72)
    lines.append("ANALISIS")
    lines.append("-" * 72)
    delta = a["delta_date_vs_transporte_segundos"]
    if delta is not None:
        lines.append(f"  Delta transporte - Date : {delta:.0f} s ({delta/86400:.1f} dias)")
    lines.append(f"  Date coincide objetivo  : {a['date_coincide_con_objetivo']}")
    lines.append(f"  Retrodatado sospechado  : {a['retrodatado_sospechado']}")
    lines.append(f"  Cabeceras simuladas     : {a['cabeceras_simuladas_presentes']}")
    if a["notas"]:
        lines.append("  Notas:")
        for n in a["notas"]:
            lines.append(f"      * {n}")
    lines.append("")
    lines.append("-" * 72)
    lines.append("VEREDICTO")
    lines.append("-" * 72)
    lines.append(f"  Prueba envio historico: {v['prueba_envio_historico']}")
    lines.append("")
    for chunk in _wrap(v["texto"], 70):
        lines.append(f"  {chunk}")
    lines.append("")
    lines.append("-" * 72)
    lines.append("NO VERIFICABLE SOLO CON ENCABEZADOS")
    lines.append("-" * 72)
    for item in report["no_verificable_solo_con_encabezados"]:
        for i, chunk in enumerate(_wrap(item, 68)):
            prefix = "  - " if i == 0 else "    "
            lines.append(f"{prefix}{chunk}")
    lines.append("=" * 72)

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def _wrap(text: str, width: int) -> list[str]:
    """Envoltura simple de texto por palabras."""
    words = text.split()
    out: list[str] = []
    current = ""
    for w in words:
        if len(current) + len(w) + 1 > width:
            out.append(current)
            current = w
        else:
            current = f"{current} {w}".strip()
    if current:
        out.append(current)
    return out or [""]
