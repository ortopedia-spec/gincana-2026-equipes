# Validação da Gincana 2026

- Fonte: `Equipe gincana 2026.xlsx`, localizada em Downloads e lida sem alterar o arquivo.
- Resultado: **10 abas, 588 profissionais, 0 nomes repetidos após normalização**. As contagens por aba estão em `importacao.json`. Não havia abas ocultas nesta versão.
- Conferência independente: aba, linha, nome, segunda coluna e colunas adicionais foram comparados com o Excel; nenhuma divergência.
- Testes automatizados: 5 testes aprovados para busca, duplicatas sintéticas, ordenação e totais da base. Conferência independente do JSON contra todas as células da planilha: aprovada.
- Testes no Chrome local: equipe completa e contagem, 88 opções para termo comum, escolha de pessoa, destaque de um integrante, retorno e limpeza. O bloco da pessoa selecionada e o botão de retorno saem da área visível durante a rolagem normal.
- Cabeçalho da equipe: permaneceu em `top: 0` no meio e no fim da lista no computador, em 360 px e em 390 px; ao voltar ao início, retornou à posição original. Nome longo em duas linhas no celular, sem rolagem horizontal ou `overflow` nos ancestrais. A página carrega apenas `equipes.json`.
- Testes anteriores preservados: imagens e JSON carregados em subdiretório; JSON removido em cópia temporária exibiu erro amigável.
- Os arquivos da referência do Simpósio foram apenas lidos. A imagem de cabeçalho com texto do evento anterior não foi usada; o novo título é HTML.
- Publicação pública autorizada e concluída em `https://ortopedia-spec.github.io/gincana-2026-equipes/`, sem login. O plano da conta recusou GitHub Pages no repositório privado (HTTP 422); por isso, o repositório foi tornado público conforme autorização. A branch `gh-pages` contém somente os arquivos de `dist`.
- A API do GitHub confirmou Pages com status `built`, origem `gh-pages` na raiz e acesso público. Requisições sem credenciais retornaram HTTP 200 para HTML, CSS, JavaScript, as duas imagens e o JSON de equipes. A base servida contém 10 equipes e 588 profissionais.
