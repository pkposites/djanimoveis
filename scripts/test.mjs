// Testa o fluxo do filtro com Playwright e a function lead.mjs sem variáveis.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' };
const srv = createServer((q, r) => {
  const p = q.url.split('?')[0]; const f = join('public', p === '/' ? 'index.html' : p);
  if (q.url.startsWith('/api/lead')) { r.end('{"ok":true}'); return; }
  if (!existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('content-type', types[extname(f)] || 'text/plain'); r.end(readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}`;

const b = await chromium.launch(); const pg = await b.newPage();
await pg.route(/cadeolead|facebook|googletagmanager|clarity/, r => r.abort());
let popups = 0; await pg.addInitScript(() => { window.__opened = []; window.open = u => (window.__opened.push(u), {}); });
await pg.goto(base + '/?utm_source=x&fbclid=y');
const opened = () => pg.evaluate(() => window.__opened.length);
const dl = () => pg.evaluate(() => window.dataLayer.map(e => e.event));

// 1) sem escolher nada: formulário de contato escondido, submit não abre nada
assert(!(await pg.locator('#painel-sim').isVisible()));
await pg.evaluate(() => document.getElementById('lead-form').requestSubmit());
assert.equal(await opened(), 0); assert(await pg.locator('#err-acordo').isVisible());
// 2) Não
await pg.check('input[value=nao]');
assert(await pg.locator('#painel-nao').isVisible()); assert(!(await pg.locator('#painel-sim').isVisible()));
assert((await dl()).includes('lead_desqualificado'));
await pg.evaluate(() => document.getElementById('lead-form').requestSubmit());
assert.equal(await opened(), 0);
// 3) Sim com dados inválidos
await pg.check('input[value=sim]');
await pg.fill('#nome', 'Maria'); await pg.fill('#tel', '123');
await pg.click('button.wa'); assert.equal(await opened(), 0); assert(await pg.locator('#err-tel').isVisible());
await pg.fill('#tel', '(21) 98888-7777'); await pg.click('button.wa');
assert.equal(await opened(), 0); assert(await pg.locator('#err-lgpd').isVisible());
// 4) válido
await pg.check('#lgpd'); await pg.click('button.wa');
assert.equal(await opened(), 1);
const url = await pg.evaluate(() => window.__opened[0]);
assert(url.startsWith('https://wa.me/5521920080568?text='));
assert((await dl()).includes('generate_lead'));
// 5) nenhum link wa.me direto no HTML
assert.equal((await pg.content()).match(/href="[^"]*wa\.me/g), null);
// 6) validação de telefone
const v = await pg.evaluate(() => ['21988887777','2133334444','(21) 3333-4444','+55 21 98888-7777','1288887777','21888887777','0198887777','2198888'].map(window.__lpTelValido));
assert.deepEqual(v, [true, true, true, true, false, false, false, false]);
await b.close(); srv.close();

// 7) function sem variáveis
const { default: h } = await import('../netlify/functions/lead.mjs');
const r = await h(new Request('http://x/api/lead', { method: 'POST', body: '{"name":"a","phone":"1"}' }));
assert.deepEqual(await r.json(), { ok: true, capi: 'desligada' });
console.log('TODOS OS TESTES OK');
