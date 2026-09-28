// Gera o PDF (1 página 16:9 por slide) e, opcionalmente, um PNG de cada slide
// para conferir o layout.
//
// Uso: node render.mjs apresentacao.html saida.pdf [pasta-png]
//
// - Carrega as fontes do Google Fonts antes de imprimir (sem elas o layout muda).
// - Usa o proxy de HTTPS_PROXY se existir (o Chromium não lê essa variável sozinho).
// - Para os PNGs, recarrega a página a cada slide: só trocar o #hash não re-renderiza.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function carregarPlaywright() {
  try { return await import('playwright'); } catch {}
  const raiz = execSync('npm root -g').toString().trim();
  return await import(pathToFileURL(path.join(raiz, 'playwright', 'index.mjs')).href);
}

const [html, pdf, pngDir] = process.argv.slice(2);
if (!html || !pdf) { console.error('uso: node render.mjs apresentacao.html saida.pdf [pasta-png]'); process.exit(1); }

const { chromium } = await carregarPlaywright();
const opts = { args: ['--ignore-certificate-errors'] };
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) opts.proxy = { server: proxy };
if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(opts);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const url = pathToFileURL(path.resolve(html)).href;

await page.goto(url, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(1500);
await page.evaluate(() => document.fonts.ready);
const fontes = await page.evaluate(() => [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))]);
if (!fontes.length) console.warn('AVISO: nenhuma fonte web carregou; o PDF vai sair com fontes substitutas.');
await page.pdf({ path: pdf, width: '1920px', height: '1080px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
const total = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`${pdf}: ${total} páginas; fontes: ${fontes.join(', ') || 'nenhuma'}`);

if (pngDir) {
  mkdirSync(pngDir, { recursive: true });
  await page.emulateMedia({ media: 'screen' });
  for (let n = 1; n <= total; n++) {
    await page.goto(`${url}#${n}`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(pngDir, `${String(n).padStart(2, '0')}.png`) });
  }
  console.log(`${total} PNGs em ${pngDir}`);
}
await browser.close();
