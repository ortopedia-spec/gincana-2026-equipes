# Validação da Gincana 2026

- Fonte: `Equipe gincana 2026.xlsx`, localizada em Downloads e lida sem alterar o arquivo.
- Resultado: **10 abas, 588 profissionais, 0 nomes repetidos após normalização**. As contagens por aba estão em `importacao.json`. Não havia abas ocultas nesta versão.
- Conferência independente: aba, linha, nome, segunda coluna e colunas adicionais foram comparados com o Excel; nenhuma divergência.
- Testes automatizados: 6 testes JavaScript aprovados, incluindo busca, duplicatas sintéticas e coordenador vazio/preenchido.
- Testes no Chrome local: equipe completa e contagem, opções para termo comum, escolha de pessoa, destaque, retorno e limpeza. Larguras de 360 e 390 px sem rolagem horizontal. Imagens e JSON carregados em subdiretório. JSON removido em cópia temporária exibiu erro amigável.
- Os arquivos da referência do Simpósio foram apenas lidos. A imagem de cabeçalho com texto do evento anterior não foi usada; o novo título é HTML.
- Publicação pública autorizada e concluída em `https://ortopedia-spec.github.io/gincana-2026-equipes/`, sem login. O plano da conta recusou GitHub Pages no repositório privado (HTTP 422); por isso, o repositório foi tornado público conforme autorização. A branch `gh-pages` contém somente os oito arquivos de `dist`.
- A API do GitHub confirmou Pages com status `built`, origem `gh-pages` na raiz e acesso público. Requisições sem credenciais retornaram HTTP 200 para HTML, CSS, JavaScript, as duas imagens e os dois JSONs. A base servida contém 10 equipes e 588 profissionais. No Chrome, a pesquisa por equipe exibiu a relação de 59 integrantes e a mensagem de coordenador não cadastrado.
