// Prueba punta a punta headless (sin ventanas, sin audio, con GPU): capturas en data/capturas.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = new URL('../data/capturas/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true, executablePath: process.env.CHROME || 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errores = [];
async function sesion(email, w = 1440, h = 900) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(email + ': ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(email + ' console: ' + m.text().slice(0, 200)); });
  await p.goto(BASE);
  const r = await p.evaluate(async (email) => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, clave: 'mathtrix' }) })).json(), email);
  await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
  return p;
}
const shot = async (p, n) => { await p.waitForTimeout(1200); await p.screenshot({ path: OUT + n + '.png' }); console.log('captura', n); };
const pasos = (process.argv[2] || 'todo').split(',');
const quiere = (k) => pasos.includes('todo') || pasos.includes(k);

if (quiere('entrar')) { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto(BASE); await shot(p, '01-entrar'); }
const a = await sesion('diego@demo.gt');
if (quiere('inicio')) { await a.goto(BASE + '/'); await shot(a, '02-inicio'); }
if (quiere('ver')) {
  await a.goto(BASE + '/ver/' + (process.env.VID || 2));
  await a.waitForTimeout(1500);
  const frames = (process.env.FRAMES || '20,140,260,380,520,700,900,1100').split(',').map(Number);
  for (const f of frames) {
    await a.evaluate((f) => { const el = document.querySelector('.marco'); }, f);
    // salta al cuadro usando el teclado/api del player
    await a.evaluate(async (f) => { const r = window.__mtxPlayer; if (r) { r.seekTo(f); } }, f);
    await a.waitForTimeout(700);
    await a.locator('.marco').screenshot({ path: OUT + `03-video-f${f}.png` });
  }
  console.log('capturas video');
  await a.evaluate(() => window.scrollTo(0, 900)); await shot(a, '04-quiz');
}
if (quiere('shorts')) { const m = await sesion('sofi@demo.gt', 420, 860); await m.goto(BASE + '/shorts'); await m.waitForTimeout(1500); await m.click('.tocar').catch(() => {}); await m.waitForTimeout(2500); await shot(m, '05-shorts-movil'); }
if (quiere('aprender')) { await a.goto(BASE + '/aprender'); await shot(a, '06-aprender'); }
const pr = await sesion('profe@demo.gt');
if (quiere('profe')) {
  await pr.goto(BASE + '/curso/1'); await shot(pr, '07-curso');
  await pr.goto(BASE + '/leccion/1'); await pr.waitForTimeout(1500); await pr.screenshot({ path: OUT + '08-analitica.png', fullPage: true }); console.log('captura 08-analitica');
  await pr.goto(BASE + '/leccion/1?nueva=1'); await shot(pr, '09-contenido');
}
console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].join('\n') : 'sin errores de consola');
await b.close();
