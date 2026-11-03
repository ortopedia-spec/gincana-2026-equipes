# Gincana 2026 · Consulta de equipes

Consulta pública de equipes da Sorri Bauru: **https://ortopedia-spec.github.io/gincana-2026-equipes/**. Os nomes e setores ficam em `dist/data/equipes.json`. A divulgação pública desses dados foi autorizada para a Gincana 2026.

## Módulo de doações

O código do cadastro e da validação está em `dist/donations.js` e `backend/`. A base privada já foi criada: [Gincana 2026 | Doações](https://docs.google.com/spreadsheets/d/1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8/edit), com 588 profissionais, 31 produtos e as abas `Validadores`, `Doacoes`, `Itens_Doacao` e `Historico_Validacoes`. O [projeto Apps Script](https://script.google.com/d/1jU8sMkLwy6PC3UBfLrCZlJ4pCxLd4HLWk02RDU4wrHhoqMNhflYAPdxT/edit) contém o backend. Veja [backend/README.md](backend/README.md) para inicialização, cliente OAuth, propriedades seguras, validadores e implantação.

**Acesso público:** a consulta de equipes e o cadastro de doações estão disponíveis no endereço acima, sem login para os profissionais. Os 31 produtos e sua pontuação são carregados junto da página a partir de `dist/catalog.js`; o Apps Script confere os itens e calcula os pontos novamente ao salvar. A conferência exige login Google com uma conta ativa em `Validadores`. O URL `/exec` e o ID público do cliente OAuth estão em `dist/donations-config.js`; o segredo OAuth permanece somente nas propriedades privadas do Apps Script.

## Executar localmente

Requisitos: Python 3 com `openpyxl` para importar planilhas; Node.js para os testes. A página em si não depende de instalação de pacotes.

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

O relatório indica abas removidas e novas para revisar possíveis renomeações de equipes. Confira esse alerta antes de publicar uma atualização. A segunda coluna é preservada como setor ou unidade, sem inferir qualquer função a partir de seu texto.

## Testes

```powershell
npm test
python tests/compare_excel.py "C:\caminho\Equipe.xlsx"
```

O teste JavaScript cobre busca por nome, equipe e setor, normalização, duplicatas sintéticas, ordenação e ausência de resultados. O teste Python confere cada linha e coluna da base contra o Excel. Na página, o cabeçalho da equipe permanece visível durante a rolagem normal da relação de integrantes.

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

A planilha original está excluída por `.gitignore` e não foi enviada. Não adicione credenciais, tokens ou dados adicionais sem autorização específica. O site e seu JSON de equipes são públicos, sem login.

Se `git subtree split` for bloqueado pelo isolamento do terminal, execute o mesmo comando em um terminal Git com permissão normal. O [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) publica a branch escolhida na raiz do subdiretório `/gincana-2026-equipes/`; os caminhos da aplicação são relativos.

## Estrutura

- `dist/`: página, estilos, scripts, marcas locais e JSON de equipes pronto para hospedagem.
- `scripts/`: importação da planilha.
- `tests/`: busca e conferência contra a planilha.
- `reports/`: totais e validação.

A composição visual usa elementos locais do [sistema de presenças do Simpósio 50 Anos](https://github.com/ortopedia-spec/controle-presencas-simposio50), sem copiar seu código operacional ou fazer chamadas à sua API.
