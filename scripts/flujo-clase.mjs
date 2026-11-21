// Abrir la clase = generar el video y abrirlo solo (sin clics).
import { chromium } from 'playwright-core';
const BASE = 'http://127.0.0.1:8110', OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.message));
await p.goto(BASE);
const r = await p.evaluate(async () => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) })).json());
await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
const t0 = Date.now();
await p.goto(BASE + '/leccion/' + (process.env.LEC || 4));
await p.waitForTimeout(6000);
await p.screenshot({ path: OUT + 'n-leccion-generando.png' });
await p.waitForURL(/\/ver\/\d+/, { timeout: 90000 });
console.log('se abrió solo:', p.url().replace(BASE, ''), ((Date.now() - t0) / 1000).toFixed(1) + 's');
await p.waitForTimeout(3000);
await p.screenshot({ path: OUT + 'n-leccion-listo.png' });
console.log(err.length ? 'ERRORES: ' + err.join(' | ') : 'sin errores');
await b.close();
