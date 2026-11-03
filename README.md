# Gincana 2026 · Consulta de equipes

Consulta local de equipes da Sorri Bauru. A interface é estática; os nomes e setores ficam em `dist/data/equipes.json`. **O diretório `dist` contém dados pessoais e exige controle de acesso no servidor.**

## Executar localmente

Requisitos: Python 3 com `openpyxl` para importar planilhas; Node.js para os testes e a atualização de coordenadores. A página em si não depende de instalação de pacotes.

```powershell
python -m http.server 8000 --directory dist
```

Abra `http://127.0.0.1:8000/`. Não abra `index.html` via `file://`, porque o navegador bloqueia a leitura dos JSONs nesse modo.

## Atualizar a planilha

```powershell
python scripts/importar_planilha.py "C:\caminho\Equipe.xlsx"
python tests/compare_excel.py "C:\caminho\Equipe.xlsx"
npm test
```

O importador lê todas as abas, inclusive ocultas, e considera a primeira linha como profissional. Ignora apenas linhas totalmente vazias. Se houver uma linha com setor mas sem nome, interrompe a importação para evitar perda silenciosa. Os nomes das equipes seguem exatamente os nomes das abas. Os registros repetidos permanecem na base e são listados em `reports/importacao.json`.

Os coordenadores existentes são mantidos quando o nome da aba não muda. O relatório indica abas removidas e novas, para revisar possíveis renomeações e o vínculo do coordenador. Confira esse alerta antes de publicar uma atualização.

## Cadastrar coordenadores

```powershell
node scripts/atualizar_coordenadores.mjs "Nome exato da equipe" "Nome do coordenador"
```

O comando altera apenas `dist/data/coordenadores.json`. Use `""` como segundo argumento para limpar um cadastro. A informação da coluna de setor, incluindo `COORD.` ou `SUPERVISÃO`, não é usada como coordenação da gincana.

## Testes

```powershell
npm test
python tests/compare_excel.py "C:\caminho\Equipe.xlsx"
```

O teste JavaScript cobre busca por nome, equipe e setor, normalização, duplicatas sintéticas, ordenação, ausência de resultados e coordenador vazio/preenchido. O teste Python confere cada linha e coluna da base contra o Excel.

## Repositório privado e hospedagem

O projeto está publicado no repositório **privado** [ortopedia-spec/gincana-2026-equipes](https://github.com/ortopedia-spec/gincana-2026-equipes), branch `main`. O remote `origin` já está configurado. Para atualizações futuras, revise as alterações remotas e publique seus commits sem force push:

```powershell
git fetch origin
git status
git push origin main
```

A planilha original está excluída por `.gitignore` e não foi enviada.

**O GitHub Pages está desativado.** Um repositório privado não torna o Pages privado. A [documentação do GitHub](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) informa que a publicação privada de Pages requer uma organização no GitHub Enterprise Cloud. Nesta conta, a hospedagem protegida não foi comprovada. Para uso institucional, publique `dist` atrás de autenticação no servidor, protegendo `/` e `/data/*.json`; teste o acesso anônimo a ambos antes de divulgar o endereço. Não use senha no JavaScript nem `noindex` como proteção.

## Estrutura

- `dist/`: página, estilos, scripts, marcas locais e JSONs prontos para hospedagem.
- `scripts/`: importação e manutenção dos coordenadores.
- `tests/`: busca e conferência contra a planilha.
- `reports/`: totais e validação.

A composição visual usa elementos locais do [sistema de presenças do Simpósio 50 Anos](https://github.com/ortopedia-spec/controle-presencas-simposio50), sem copiar seu código operacional ou fazer chamadas à sua API.
