// Capturas de un mismo video en las 6 plantillas (headless, sin audio, con GPU).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
mkdirSync(OUT, { recursive: true });
const VID = process.env.VID;
const FRAMES = (process.env.FRAMES || '50').split(',').map(Number);
const ESTILOS = (process.env.ESTILOS || 'Ilustrado,Pizarrón,Blueprint,Manim,Cuaderno,Neón').split(',');
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(BASE);
const r = await p.evaluate(async () => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) })).json());
await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
await p.goto(BASE + '/ver/' + VID);
await p.waitForTimeout(2500);
for (const est of ESTILOS) {
  await p.locator('.chips .chip', { hasText: est }).first().click();
  await p.waitForTimeout(900);
  for (const f of FRAMES) {
    await p.evaluate((f) => window.__mtxPlayer?.seekTo(f), f);
    await p.waitForTimeout(1100);
    await p.locator('.mtx-marco').screenshot({ path: `${OUT}est-${est.normalize('NFD').replace(/[^\w]/g, '')}-f${f}.png` });
  }
  console.log('ok', est);
}
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores');
await b.close();
