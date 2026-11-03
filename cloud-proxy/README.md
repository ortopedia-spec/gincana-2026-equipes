# Ponte HTTP para o Google Apps Script

O GitHub Pages continua servindo a aplicação estática. Esta pequena API recebe chamadas HTTPS da origem `https://ortopedia-spec.github.io`, encaminha o corpo ao Apps Script e devolve JSON com CORS restrito à origem do site. Ela não guarda credenciais nem dados de doações. O Apps Script continua responsável por autorizar validadores, calcular pontos e gravar no Sheets.

## Publicação no Cloud Run

É necessário um projeto Google Cloud com faturamento ativo. Confirme antes os custos, limites e permissões da organização. Do diretório raiz do repositório, com o Google Cloud CLI autenticado na conta administradora:

```powershell
gcloud run deploy gincana-2026-doacoes-api --source ./cloud-proxy --project ID_DO_PROJETO --region southamerica-east1 --allow-unauthenticated --set-env-vars APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwvAVsgHtalUqkHTCmNKe4JvhHJgRUCH4OrJpf2qTuEGI3NvqktyqFhgik-VPKhwNOqLg/exec --min-instances 0 --max-instances 1 --memory 256Mi --cpu 1 --concurrency 40 --timeout 40s
```

Depois de obter o URL real do serviço, teste `GET /healthz`, `OPTIONS /api` e `POST /api` com `catalog` e uma origem autorizada. Configure `apiUrl` em `dist/donations-config.js` como `https://URL_DO_SERVICO/api`, execute `npm test` e publique `dist` na branch `gh-pages` sem force push. Faça testes de gravação com uma cópia da planilha, sem criar doações fictícias na base real.

O Cloud Run exige uma conta de faturamento mesmo dentro da faixa gratuita; Cloud Build e Artifact Registry também podem gerar custos. O serviço deve ficar com zero instâncias mínimas e limite de uma instância enquanto o tráfego esperado não for definido.
