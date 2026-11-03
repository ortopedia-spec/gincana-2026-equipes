"""Importa todas as abas de uma planilha de equipes sem remover duplicatas.

Uso: python scripts/importar_planilha.py "C:/caminho/Equipe.xlsx"
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "dist" / "data"
REPORTS = ROOT / "reports"


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", str(value))
    return re.sub(r"\s+", " ", "".join(c for c in value if unicodedata.category(c) != "Mn").casefold()).strip()


def as_text(value) -> str:
    return "" if value is None else str(value)


def stable_id(prefix: str, value: str) -> str:
    return prefix + "_" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def read_json(path: Path, fallback: dict) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else fallback


def import_workbook(source: Path) -> dict:
    workbook = load_workbook(source, read_only=True, data_only=True)
    old = read_json(DATA / "equipes.json", {"equipes": []})
    old_names = {team["nome"] for team in old.get("equipes", [])}
    teams, people, source_rows = [], [], []
    incomplete = []
    for sheet in workbook.worksheets:  # includes hidden sheets
        team_id = stable_id("eq", sheet.title)
        teams.append({"id": team_id, "nome": sheet.title})
        for row_number, values in enumerate(sheet.iter_rows(values_only=True), start=1):
            cells = [as_text(value) for value in values]
            if not any(cell.strip() for cell in cells):
                continue
            if not cells[0].strip():
                incomplete.append({"aba": sheet.title, "linha": row_number, "motivo": "nome vazio"})
                continue
            name = cells[0]
            sector = cells[1] if len(cells) > 1 else ""
            extra = cells[2:] if len(cells) > 2 else []
            people.append({
                "id": stable_id("pro", f"{sheet.title}\x1f{row_number}"),
                "nome": name,
                "equipeId": team_id,
                "informacoesComplementares": {"setorUnidade": sector, "outrasColunas": extra},
                "origemPlanilha": {"aba": sheet.title, "linha": row_number},
            })
            source_rows.append((sheet.title, row_number, name, sector, extra))
    if incomplete:
        raise ValueError(f"Há linhas com nome vazio e outros dados: {incomplete}")
    reconstructed = [(p["origemPlanilha"]["aba"], p["origemPlanilha"]["linha"], p["nome"], p["informacoesComplementares"]["setorUnidade"], p["informacoesComplementares"]["outrasColunas"]) for p in people]
    assert source_rows == reconstructed, "Divergência entre Excel e JSON"
    name_counts = Counter(normalize(p["nome"]) for p in people)
    duplicates = [{"nome": p["nome"], "aba": p["origemPlanilha"]["aba"], "linha": p["origemPlanilha"]["linha"]} for p in people if name_counts[normalize(p["nome"])] > 1]
    names = {team["nome"] for team in teams}
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    base = {"metadados": {"versao": 1, "atualizadoEm": now, "origemArquivo": source.name}, "equipes": teams, "profissionais": people}
    report = {
        "arquivo": source.name, "importadoEm": now,
        "abas": [{"nome": s.title, "estado": s.sheet_state, "profissionais": sum(p["origemPlanilha"]["aba"] == s.title for p in people)} for s in workbook.worksheets],
        "totalAbas": len(teams), "totalProfissionais": len(people),
        "duplicidadesPossiveis": duplicates,
        "conferenciaCelulaACelula": "aprovada",
        "abasRemovidasOuRenomeadas": sorted(old_names - names),
        "abasNovas": sorted(names - old_names),
        "alertaRenomeacao": bool(old_names - names and names - old_names),
    }
    DATA.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (DATA / "equipes.json").write_text(json.dumps(base, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (REPORTS / "importacao.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("planilha", type=Path)
    args = parser.parse_args()
    print(json.dumps(import_workbook(args.planilha), ensure_ascii=False, indent=2))
