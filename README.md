# Gincana 2026 · Consulta de equipes

Consulta pública de equipes da Sorri Bauru: **https://ortopedia-spec.github.io/gincana-2026-equipes/**. A interface é estática; os nomes e setores ficam em `dist/data/equipes.json`. A divulgação pública desses dados foi autorizada para a Gincana 2026.

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

## Repositório e hospedagem pública

O projeto está no repositório **público** [ortopedia-spec/gincana-2026-equipes](https://github.com/ortopedia-spec/gincana-2026-equipes), branch `main`. O GitHub Pages publica a raiz da branch `gh-pages`, que contém somente os arquivos de `dist`. O plano atual não permite Pages neste repositório enquanto ele é privado.

Para atualizações futuras, revise as alterações remotas, teste, publique os commits e então atualize a branch do site sem force push:

```powershell
git fetch origin
git status
npm test
git push origin main
$pagesCommit = git subtree split --prefix=dist
git push origin "${pagesCommit}:refs/heads/gh-pages"
```

A planilha original está excluída por `.gitignore` e não foi enviada. Não adicione credenciais, tokens ou dados adicionais sem autorização específica. O site e seus JSONs são públicos, sem login.

Se `git subtree split` for bloqueado pelo isolamento do terminal, execute o mesmo comando em um terminal Git com permissão normal. O [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) publica a branch escolhida na raiz do subdiretório `/gincana-2026-equipes/`; os caminhos da aplicação são relativos.

## Estrutura

- `dist/`: página, estilos, scripts, marcas locais e JSONs prontos para hospedagem.
- `scripts/`: importação e manutenção dos coordenadores.
- `tests/`: busca e conferência contra a planilha.
- `reports/`: totais e validação.

A composição visual usa elementos locais do [sistema de presenças do Simpósio 50 Anos](https://github.com/ortopedia-spec/controle-presencas-simposio50), sem copiar seu código operacional ou fazer chamadas à sua API.
