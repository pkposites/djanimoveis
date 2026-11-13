# Briefing — LP Djan Imóveis (filtro antes do WhatsApp)

Cliente: **Djan Imóveis** (imobiliária em Duque de Caxias/RJ, Instagram @djanimoveis).
Objetivo: landing page de destino para leads de anúncios Meta (Click-to-WhatsApp hoje). A página **filtra o lead antes do WhatsApp**: só avança quem concordar com as condições de entrada e parcela.
Publicação: Netlify (site `djanimoveis`, URL https://djanimoveis.netlify.app). Siga o mesmo padrão técnico do repositório `pkposites/santorini`: `public/` estático + `netlify/functions` (esbuild) + variáveis de ambiente, `netlify.toml` com headers de segurança.

## REGRA DE OURO: não inventar
Use SÓ os fatos abaixo (tirados dos anúncios e do Instagram oficial). Não crie preços, metragens, prazos, nomes, depoimentos, números de lotes, endereço ou condições que não estejam aqui.

### Fatos permitidos
- Destaques do filtro (obrigatórios, sempre com estas palavras): **"Entrada em média de R$ 17 mil"** e **"Parcelas a partir de R$ 1.000"**.
- Empreendimento: **Residencial Jardim Europa**, no bairro **Parque Equitativa**, **Duque de Caxias** (região de Santa Cruz da Serra).
- Terrenos a partir de 200 m².
- Entrada facilitada. Parcelamento direto com a loteadora em até 204x. Opções de até 48x sem juros e sem correção. Sem consulta ao SPC e Serasa.
- Lazer completo: academia climatizada e espaço funcional; quadras esportivas e campo de futebol; salão de festas e quiosque com churrasqueira; pet place e playgrounds; pista de caminhada, áreas verdes e espaços de convivência; acesso controlado.
- Lançamento: 26 de novembro, às 8h.
- "Quem comprar com a Djan Imóveis ainda ganha um presentão da @djangrini" (pode citar assim, sem detalhar o presente).
- WhatsApp: (21) 92008-0568 → `5521920080568`.
- Rodapé: "Djan Imóveis · CRECI J-12048 · Duque de Caxias/RJ" e "Djan Plácido · CRECI 100113". Link Instagram https://www.instagram.com/djanimoveis/.
- Imagens: em `_incoming/*.webp.b64` (base64). Decodifique para `public/assets/` (`base64 -d`), depois **apague a pasta `_incoming/`** no mesmo commit. `foto-1` (portaria renderizada) e `foto-2` (pergolado renderizado) são **imagens ilustrativas** → legenda "Imagem ilustrativa". `criativo-204x` é a arte do anúncio. `foto-3..5` são miniaturas pequenas (311px) — use só pequenas ou não use. `logo.webp` é 151px (use até ~64px de altura).

## Estrutura da página (mobile-first, rápida, PT-BR)
1. Hero: logo, título sobre o terreno no Residencial Jardim Europa (Parque Equitativa, Duque de Caxias), selo "Lançamento 26/11 às 8h", e **card de condições** em destaque: "Entrada em média de R$ 17 mil" + "Parcelas a partir de R$ 1.000". CTA "Quero meu terreno" → rola até o filtro.
2. Por que é acessível: os itens de condição (200 m², 204x direto com a loteadora, 48x sem juros e sem correção, sem SPC/Serasa).
3. Lazer completo (lista + foto-1/foto-2 com "Imagem ilustrativa").
4. Presentão da @djangrini (uma linha).
5. **Filtro + formulário** (seção id="filtro"):
   - Repete as duas condições.
   - Pergunta obrigatória (radio): "A entrada média de R$ 17 mil e parcelas a partir de R$ 1.000 cabem no seu planejamento?" → "Sim, estou de acordo" / "Não no momento".
   - Se "Não no momento": NÃO mostra o botão do WhatsApp; mostra mensagem gentil ("Sem problema! Siga @djanimoveis para acompanhar novas oportunidades") e link do Instagram. Dispara `dataLayer.push({event:'lead_desqualificado'})`. Não envia ao Cadê o Lead.
   - Se "Sim": mostra Nome e WhatsApp (DDD obrigatório, validação BR) e checkbox de consentimento LGPD com link para a política. Botão "Falar com a Djan no WhatsApp".
   - Ao enviar (válido): `window.LeadHub?.identify({ name, phone })`; `window.LeadHub?.set({ "De acordo com entrada e parcela": "Sim", "Origem": "LP Djan" })`; `dataLayer.push({event:'generate_lead'})`; `fbq('track','Lead')` se fbq existir; POST para a function `/api/lead` (CAPI, ver abaixo, sem bloquear); depois abrir `const destino = window.LeadHub ? window.LeadHub.whatsappUrl(url) : url;` onde url = `https://wa.me/5521920080568?text=` + mensagem: "Olá! Vim pelo site e estou de acordo com a entrada média de R$ 17 mil e parcelas a partir de R$ 1.000. Quero saber mais sobre os terrenos no Residencial Jardim Europa."
   - **Não pode existir nenhum link direto para WhatsApp na página fora deste fluxo** (nem botão flutuante).
6. FAQ curto só com os fatos acima.
7. Rodapé com CRECIs, Instagram, link de privacidade e aviso: "Valores médios e condições sujeitos a análise e disponibilidade; consulte a Djan Imóveis. Imagens ilustrativas."

## Rastreamento / integrações
- Cadê o Lead no `<head>` (após pixel/GTM):
  `<script src="https://cadeolead.com.br/tracker.js" data-key="pk_7d54c6d55a084695b25df92ff4fd5c5f" data-consent="banner" async></script>`
- Política de privacidade: link https://cadeolead.com.br/privacidade/pk_7d54c6d55a084695b25df92ff4fd5c5f (abaixo do botão e no rodapé).
- Preserve `utm_*`, `fbclid`, `gclid` (não limpar a URL).
- Meta Pixel: carregar **só se** `META_PIXEL_ID` estiver definido. Como o site é estático, gere `public/config.js` no build (ex.: `netlify.toml` `[build] command = "node scripts/gen-config.mjs"`) lendo `process.env.META_PIXEL_ID` e `process.env.GTM_ID`; vazio = não carrega nada. Respeitar consentimento (`fbq('consent','revoke')` antes do init até aceitar, alinhado ao banner do Cadê o Lead).
- Function `netlify/functions/lead.mjs` (rota `/api/lead`): recebe {name, phone, event_id, fbp, fbc, url}, faz hash SHA-256 (telefone com 55, nome) e envia evento `Lead` para a CAPI **só se** `META_PIXEL_ID` e `META_CAPI_TOKEN` existirem (com `META_TEST_EVENT_CODE` opcional e `META_GRAPH_VERSION` default v23.0). Sem as variáveis, responde 200 `{ok:true, capi:"desligada"}`. Usar o mesmo `event_id` no `fbq` para deduplicar. Não guardar dados pessoais em logs.
- README com: variáveis (`META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE`, `META_GRAPH_VERSION`, `GTM_ID`) — todas opcionais, hoje vazias — e como testar.

## Qualidade
- HTML semântico, acessível (labels, contraste AA, foco visível), Lighthouse mobile ≥ 90, sem libs pesadas, imagens com width/height e `loading="lazy"` abaixo da dobra.
- `<meta name="robots" content="noindex">` (LP de anúncio).
- Paleta inspirada no logo (verde-oliva) e no criativo (verde + branco).
- Teste: sem marcar "Sim" não há como abrir o WhatsApp; "Não" mostra a mensagem; validação de telefone; build sem variáveis funciona.

## Entrega
Commit e push na branch `main` (sem force push). Responda com: hash do commit, lista de arquivos, e qualquer fato que você precisou deixar de fora.
