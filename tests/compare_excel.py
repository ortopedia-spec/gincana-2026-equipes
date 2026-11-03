"""Compara cada registro do JSON com a origem Excel, inclusive aba, linha e colunas."""
import json
import sys
from pathlib import Path
from openpyxl import load_workbook

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
base = json.loads((root / 'dist/data/equipes.json').read_text(encoding='utf-8'))
workbook = load_workbook(source, read_only=True, data_only=True)
expected = []
for sheet in workbook.worksheets:
    for row_number, row in enumerate(sheet.iter_rows(values_only=True), 1):
        values = ['' if value is None else str(value) for value in row]
        if not any(value.strip() for value in values):
            continue
        expected.append((sheet.title, row_number, values[0], values[1] if len(values)>1 else '', values[2:] if len(values)>2 else []))
actual = [(p['origemPlanilha']['aba'],p['origemPlanilha']['linha'],p['nome'],p['informacoesComplementares']['setorUnidade'],p['informacoesComplementares']['outrasColunas']) for p in base['profissionais']]
assert expected == actual, 'Divergência de linha, aba ou célula'
assert [sheet.title for sheet in workbook.worksheets] == [team['nome'] for team in base['equipes']]
print(f'Conferência independente aprovada: {len(workbook.worksheets)} abas, {len(expected)} profissionais, todas as células preservadas.')
