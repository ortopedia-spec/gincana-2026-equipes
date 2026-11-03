# Validação da Gincana 2026

- Fonte: `Equipe gincana 2026.xlsx`, localizada em Downloads e lida sem alterar o arquivo.
- Resultado: **10 abas, 588 profissionais, 0 nomes repetidos após normalização**. As contagens por aba estão em `importacao.json`. Não havia abas ocultas nesta versão.
- Conferência independente: aba, linha, nome, segunda coluna e colunas adicionais foram comparados com o Excel; nenhuma divergência.
- Testes automatizados: 6 testes JavaScript aprovados, incluindo busca, duplicatas sintéticas e coordenador vazio/preenchido.
- Testes no Chrome local: equipe completa e contagem, opções para termo comum, escolha de pessoa, destaque, retorno e limpeza. Larguras de 360 e 390 px sem rolagem horizontal. Imagens e JSON carregados em subdiretório. JSON removido em cópia temporária exibiu erro amigável.
- Os arquivos da referência do Simpósio foram apenas lidos. A imagem de cabeçalho com texto do evento anterior não foi usada; o novo título é HTML.
- Publicação do código concluída em `ortopedia-spec/gincana-2026-equipes`, repositório **privado**, branch `main`. O login oficial do GitHub CLI foi renovado e o commit foi enviado sem force push. A API do GitHub confirmou `private: true` e `has_pages: false`.
- Acesso da aplicação pelo navegador pendente de hospedagem protegida. A privacidade do GitHub Pages não foi comprovada para a conta; a base real deve permanecer em ambiente autenticado.
