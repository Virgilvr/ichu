"""
Interfaz de linea de comandos.

Modos:
  simulate  (por defecto)  Construye un MIME con Date historico, SIMULA la
                           recepcion (Received con la hora real) y genera
                           informes JSON + TXT. 100% offline.
  analyze   <archivo.eml>  Analiza un .eml real exportado del buzon receptor
                           (p.ej. "Mostrar original" en Gmail). Sin red.

El modo de envio real (Fase 4) NO esta implementado aqui a proposito: requiere
autorizacion explicita, cuentas de prueba confirmadas y OAuth 2.0. Ver
docs/PROCEDIMIENTO_FASE4.md.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from .message_builder import (
    build_test_message,
    serialize_message,
    simulate_receipt,
    FECHA_OBJETIVO_DEFAULT,
)
from .header_analyzer import analyze_headers
from .forensic_report import build_report, write_json_report, write_text_report


def _cmd_simulate(args: argparse.Namespace) -> int:
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    declared = FECHA_OBJETIVO_DEFAULT
    if args.fecha:
        declared = datetime.fromisoformat(args.fecha)
        if declared.tzinfo is None:
            declared = declared.replace(tzinfo=timezone.utc)

    # 1. Construir mensaje con Date historico (sin enviar).
    msg = build_test_message(
        from_addr=args.from_addr,
        to_addr=args.to_addr,
        subject=args.subject,
        body=(
            "Mensaje de laboratorio para analisis forense de fechas.\n"
            "NO es evidencia de un envio real.\n"
        ),
        declared_date=declared,
    )
    eml_declarado = outdir / "01_mensaje_declarado.eml"
    eml_declarado.write_bytes(serialize_message(msg))

    # 2. Simular la recepcion por el servidor (estampa Received con la hora real).
    recibido = simulate_receipt(msg)
    eml_recibido = outdir / "02_mensaje_con_received_simulado.eml"
    eml_recibido.write_bytes(serialize_message(recibido))

    # 3. Analizar el mensaje "recibido".
    analysis = analyze_headers(serialize_message(recibido))

    # 4. Informes.
    report = build_report(
        analysis,
        target_date_iso=declared.date().isoformat(),
        context={
            "modo": "simulacion",
            "from": args.from_addr,
            "to": args.to_addr,
            "subject": args.subject,
            "nota": "Recepcion SIMULADA; sin conexion a Gmail ni envio real.",
        },
    )
    json_path = write_json_report(report, outdir / "informe.json")
    txt_path = write_text_report(report, outdir / "informe.txt")

    print(f"[ok] MIME declarado      : {eml_declarado}")
    print(f"[ok] MIME + Received sim. : {eml_recibido}")
    print(f"[ok] Informe JSON         : {json_path}")
    print(f"[ok] Informe TXT          : {txt_path}")
    print()
    print(txt_path.read_text(encoding="utf-8"))
    return 0


def _cmd_analyze(args: argparse.Namespace) -> int:
    path = Path(args.eml)
    if not path.is_file():
        print(f"[error] no existe el archivo: {path}", file=sys.stderr)
        return 2
    raw = path.read_bytes()
    analysis = analyze_headers(raw)
    report = build_report(
        analysis,
        target_date_iso=args.objetivo,
        context={"modo": "analisis", "archivo": str(path)},
    )
    outdir = Path(args.outdir)
    json_path = write_json_report(report, outdir / f"{path.stem}_informe.json")
    txt_path = write_text_report(report, outdir / f"{path.stem}_informe.txt")
    print(f"[ok] Informe JSON : {json_path}")
    print(f"[ok] Informe TXT  : {txt_path}")
    print()
    print(txt_path.read_text(encoding="utf-8"))
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="gmail-date-forensics",
        description=(
            "Laboratorio forense de fechas de correo. Demuestra la diferencia entre "
            "el Date declarado por el emisor y las trazas de transporte del servidor. "
            "No envia correo ni se conecta a Gmail."
        ),
    )
    sub = p.add_subparsers(dest="cmd", required=False)

    s = sub.add_parser("simulate", help="Genera y analiza un mensaje de laboratorio (offline).")
    s.add_argument("--from-addr", default="emisor.prueba@gmail.example")
    s.add_argument("--to-addr", default="receptor.prueba@gmail.example")
    s.add_argument("--subject", default="Prueba forense de fecha")
    s.add_argument("--fecha", default=None, help="ISO 8601 del Date declarado. Def: 2025-08-07.")
    s.add_argument("--outdir", default="salida_simulacion")
    s.set_defaults(func=_cmd_simulate)

    a = sub.add_parser("analyze", help="Analiza un .eml real (sin red).")
    a.add_argument("eml", help="Ruta a un archivo .eml (Gmail: Mostrar original -> descargar).")
    a.add_argument("--objetivo", default="2025-08-07", help="Fecha objetivo a contrastar.")
    a.add_argument("--outdir", default="salida_analisis")
    a.set_defaults(func=_cmd_analyze)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "cmd", None):
        # Sin subcomando: ejecutar simulacion por defecto.
        args = parser.parse_args(["simulate"])
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
