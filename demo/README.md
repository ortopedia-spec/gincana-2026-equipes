# Gincana 2026 · demonstração local

Esta pasta contém um protótipo independente para avaliar a interface. Usa a busca e os dados validados de **10 equipes e 588 profissionais** e o catálogo existente de **31 alimentos**. Não chama o Apps Script, a planilha nem o login de produção.

Na raiz do repositório, execute:

```powershell
python -m http.server 8000 --directory demo
```

Abra **http://127.0.0.1:8000/** no navegador. Não abra `index.html` por `file://`, pois a busca carrega `data/equipes.json`.

Pesquise um profissional, abra **Cadastrar doação** e escolha as quantidades. **Salvar doação** gera um protocolo com prefixo `SIM-2026-` e guarda o registro somente no `localStorage` deste navegador. O botão **Validar doações** usa apenas uma lista local com o e-mail de demonstração `servico.social.demo@exemplo.com`; digitá-lo não comprova identidade. As quantidades recebidas, os pontos confirmados e o histórico também são simulados. **Limpar dados de demonstração** remove apenas esses registros locais após confirmação.

O código desta pasta não deve ser copiado para `dist/` ou para a branch `gh-pages`. A integração real permanece em `dist/`, `backend/` e `cloud-proxy/` para uma etapa posterior.
