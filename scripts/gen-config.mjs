// Gera public/config.js a partir das variáveis de ambiente (todas opcionais).
import { writeFileSync, mkdirSync } from 'node:fs';

const clean = (v, re) => {
  const s = (v || '').trim();
  return re.test(s) ? s : '';
};
const cfg = {
  metaPixelId: clean(process.env.META_PIXEL_ID, /^\d{5,20}$/),
  gtmId: clean(process.env.GTM_ID, /^GTM-[A-Z0-9]{4,12}$/),
};
mkdirSync('public', { recursive: true });
writeFileSync('public/config.js', 'window.__LP_CONFIG=' + JSON.stringify(cfg) + ';\n');
console.log('config.js gerado:', cfg.metaPixelId ? 'Pixel ligado' : 'sem Pixel', '|', cfg.gtmId ? 'GTM ligado' : 'sem GTM');
