# Backend de doações · Google Apps Script

Projeto Apps Script: [Gincana 2026 | Doações API](https://script.google.com/d/1jU8sMkLwy6PC3UBfLrCZlJ4pCxLd4HLWk02RDU4wrHhoqMNhflYAPdxT/edit). A base é a [planilha privada Gincana 2026 | Doações](https://docs.google.com/spreadsheets/d/1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8/edit). O projeto é independente da planilha; `Code.gs` abre somente a planilha pelo ID. O `Seed.gs` foi gerado dos 588 profissionais e 31 produtos com `node scripts/build_apps_script_seed.mjs`.

## Inicialização

1. No editor do Apps Script, habilite o **Serviço avançado Google Sheets API** (versão v4) e a Google Sheets API no projeto Cloud vinculado, se o editor solicitar. O manifesto já declara o serviço avançado e os escopos.
2. Execute `initialize` uma vez e autorize o script como proprietário. A rotina cria apenas abas e cabeçalhos ausentes, acrescenta profissionais e produtos por ID, e nunca modifica `Doacoes`, `Itens_Doacao` ou `Historico_Validacoes` existentes. Nesta planilha as seis abas e os registros iniciais já foram importados; a rotina deve retornar `inserted: 0`.
3. Confira 588 profissionais, 31 produtos e a aba `Validadores` sem contas inventadas.

## Login do Serviço Social

No Google Cloud, crie um projeto próprio da Gincana, configure a tela de consentimento OAuth e crie um **cliente OAuth do tipo Aplicativo da Web**. Cadastre `https://ortopedia-spec.github.io` como origem JavaScript autorizada. O fluxo usa o popup de **authorization code** do Google Identity Services, escopo `openid email`, com troca de código no servidor. O código de autorização é de uso único. O servidor recebe o ID token diretamente do endpoint de token Google via HTTPS, confere `aud`, `iss`, `exp`, `iat`, `email_verified`, `sub` e confirma `sub`/e-mail no endpoint `userinfo` com o access token. O navegador recebe apenas uma sessão aleatória de até uma hora; cada operação restrita confere novamente a sessão e a aba `Validadores`.

Nas **Propriedades do script**, defina:

| Nome | Valor |
| --- | --- |
| `GOOGLE_CLIENT_ID` | ID público do cliente OAuth Web |
| `GOOGLE_CLIENT_SECRET` | Segredo do cliente OAuth Web; manter **somente** nas propriedades do script |
| `PUBLIC_ORIGIN` | `https://ortopedia-spec.github.io` |
| `SPREADSHEET_ID` | `1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8` (opcional; já há fallback no código) |

Não coloque o segredo em `dist/`, no Git ou no chat. Adicione na aba privada `Validadores` uma linha com o e-mail Google real de cada profissional do Serviço Social, nome e `ativo = TRUE`. Para revogar, mude `ativo` para `FALSE` ou remova a linha; a próxima operação restrita será negada mesmo se a sessão estiver aberta. Compartilhe a planilha apenas com administradores que precisam editá-la; validadores comuns não precisam de acesso direto ao arquivo.

## Publicação

Implante como **Aplicativo da Web**, executar como **Eu**, acesso **Qualquer pessoa** (`ANYONE_ANONYMOUS` no manifesto). O acesso público é necessário para cadastro sem login; a autorização das operações administrativas é feita novamente em cada chamada de servidor. Copie o URL `/exec` para `dist/donations-config.js` e o ID público OAuth para `googleClientId`. Não use URL `/dev` em produção.

O frontend incorpora uma página do Apps Script em um iframe oculto. Após uma troca de mensagens com ID aleatório e verificação de origem, a página chama `google.script.run` e devolve a resposta ao site por `postMessage`. Isso evita depender de respostas CORS do Apps Script. Tokens e códigos seguem somente em mensagens HTTPS e não entram no URL. O catálogo estático da página é gerado de `backend/catalogo.json` por `node scripts/build_apps_script_seed.mjs`; os pontos oficiais são sempre recalculados no servidor.

O cadastro usa chave de idempotência enviada pelo navegador e verificada sob `LockService`; validações e correções usam `versao_registro` para impedir conflitos. Cada alteração relacionada é aplicada em uma única chamada atômica a `Sheets.Spreadsheets.batchUpdate`. Totais confirmados são derivados somente de doações `VALIDADA`, para evitar somar de novo após correção. Todos os valores de texto gravados pela API usam `stringValue`, sem interpretação como fórmula.

Valide o catálogo e as permissões com a implantação real. Use uma cópia de teste da planilha ou os testes sintéticos locais para exercitar gravações, validações e correções; não crie doações fictícias na planilha real. Rode `npm test` para os testes sintéticos locais.
