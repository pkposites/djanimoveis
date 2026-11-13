# Djan Imóveis — LP Residencial Jardim Europa

Landing page estática (`public/`) com filtro antes do WhatsApp, function Netlify (`netlify/functions/lead.mjs`, rota `/api/lead`) para a Conversions API da Meta e `netlify.toml` com headers de segurança.
Site: https://djanimoveis.netlify.app

## Variáveis de ambiente (todas opcionais, hoje vazias)
| Variável | Para quê |
|---|---|
| `META_PIXEL_ID` | Carrega o Meta Pixel (consentimento revogado até o aceite no formulário) e habilita a CAPI |
| `META_CAPI_TOKEN` | Token da CAPI; sem ele (ou sem o Pixel ID) a function responde `{ok:true, capi:"desligada"}` |
| `META_TEST_EVENT_CODE` | Código de evento de teste da CAPI |
| `META_GRAPH_VERSION` | Versão da Graph API (padrão `v23.0`) |
| `GTM_ID` | Carrega o Google Tag Manager (formato `GTM-XXXX`) |

O build (`node scripts/gen-config.mjs`) gera `public/config.js` a partir delas; vazias = nada é carregado.

## Como testar
- Local: `node scripts/gen-config.mjs && npx serve public` (ou `netlify dev` para testar `/api/lead`).
- Fluxo do filtro: sem marcar "Sim" não há botão nem envio; "Não no momento" mostra a mensagem e o link do Instagram (sem WhatsApp); "Sim" exige nome, WhatsApp com DDD válido e o aceite LGPD.
- CAPI: defina `META_PIXEL_ID`, `META_CAPI_TOKEN` e `META_TEST_EVENT_CODE`; confira em Gerenciador de Eventos > Testar eventos.
- Teste automatizado do fluxo: `node scripts/test.mjs` (requer Playwright instalado).
