# Backend de doações · Google Apps Script

Projeto Apps Script: [Gincana 2026 | Doações API](https://script.google.com/d/1jU8sMkLwy6PC3UBfLrCZlJ4pCxLd4HLWk02RDU4wrHhoqMNhflYAPdxT/edit). A base é a [planilha privada Gincana 2026 | Doações](https://docs.google.com/spreadsheets/d/1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8/edit). O projeto é independente da planilha; `Code.gs` abre somente a planilha pelo ID. O `Seed.gs` foi gerado dos 588 profissionais e 31 produtos com `node scripts/build_apps_script_seed.mjs`.

## Inicialização

1. No editor do Apps Script, habilite o **Serviço avançado Google Sheets API** (versão v4) e a Google Sheets API no projeto Cloud vinculado, se o editor solicitar. O manifesto já declara o serviço avançado e os escopos.
2. Execute `initialize` uma vez e autorize o script como proprietário. A rotina cria apenas abas e cabeçalhos ausentes, acrescenta profissionais e produtos por ID, e nunca modifica `Doacoes`, `Itens_Doacao` ou `Historico_Validacoes` existentes. Nesta planilha as seis abas e os registros iniciais já foram importados; a rotina deve retornar `inserted: 0`.
3. Confira 588 profissionais, 31 produtos e a aba `Validadores` sem contas inventadas. Não execute `initialize` apenas para trocar o login.

## Login do Serviço Social

O botão **Validar doações** solicita e-mail e senha. O Apps Script consulta a aba `Validadores` em cada entrada: coluna A (`email`), B (`nome`), C (`ativo`) e D (`senha`), a partir da linha 2. O e-mail é comparado sem diferenças de caixa e sem espaços nas extremidades; a senha é comparada exatamente com o texto exibido na célula D da mesma linha. Contas incompletas ou inativas não entram. O navegador recebe uma sessão aleatória de até uma hora, nunca a lista de contas ou senhas. Cada operação de conferência verifica a sessão e o estado ativo da conta. **Sair** invalida a sessão no servidor. O e-mail dessa sessão é gravado como responsável pela validação.

Configure a coluna D como **Texto simples** antes de cadastrar ou trocar senhas. Na inspeção de 03/11/2026, D2:D4 continham valores numéricos, sem formato de texto: zeros à esquerda já convertidos não podem ser recuperados pelo sistema. O backend usa `getDisplayValues()` e não tenta reconstruí-los. Corrija o formato e as senhas manualmente na planilha; o código não altera nenhuma célula da aba.

Nas **Propriedades do script**, defina:

| Nome | Valor |
| --- | --- |
| `PUBLIC_ORIGIN` | `https://ortopedia-spec.github.io` |
| `SPREADSHEET_ID` | `1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8` (opcional; já há fallback no código) |

As antigas propriedades OAuth podem permanecer no projeto privado, mas não são usadas nessa entrada. Não coloque senhas em `dist/`, no Git ou no chat. Para revogar uma conta, mude `ativo` para `FALSE` ou remova a linha; a próxima operação restrita será negada. Compartilhe a planilha apenas com administradores que precisam editá-la; validadores comuns não precisam de acesso direto ao arquivo.

## Publicação

Implante como **Aplicativo da Web**, executar como **Eu**, acesso **Qualquer pessoa** (`ANYONE_ANONYMOUS` no manifesto). O acesso público é necessário para cadastro sem login; a autorização das operações administrativas é feita novamente em cada chamada de servidor. Copie o URL `/exec` para `dist/donations-config.js`. Não use URL `/dev` em produção.

O frontend inclui uma ponte por iframe com `google.script.run`, mas a incorporação do Apps Script falhou no Chrome testado anteriormente. A alternativa preparada em `cloud-proxy/` recebe chamadas HTTPS do site e encaminha o corpo ao Apps Script; `doPost` devolve JSON quando `transport=json`. Senhas e tokens seguem somente no corpo HTTPS e não entram no URL. Essa ponte ainda não está hospedada; não publique a nova entrada como funcional antes de verificar a comunicação real sem serviço com faturamento. O catálogo estático da página é gerado de `backend/catalogo.json` por `node scripts/build_apps_script_seed.mjs`; os pontos oficiais são sempre recalculados no servidor.

O cadastro usa chave de idempotência enviada pelo navegador e verificada sob `LockService`; validações e correções usam `versao_registro` para impedir conflitos. Cada alteração relacionada é aplicada em uma única chamada atômica a `Sheets.Spreadsheets.batchUpdate`. Totais confirmados são derivados somente de doações `VALIDADA`, para evitar somar de novo após correção. Todos os valores de texto gravados pela API usam `stringValue`, sem interpretação como fórmula.

Valide a entrada com a implantação real após corrigir manualmente o formato e as senhas da coluna D. Rode `npm test` para os testes sintéticos locais. Não crie doações fictícias na planilha real.
