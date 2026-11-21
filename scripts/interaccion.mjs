// Prueba de la pregunta if-else dentro del video y del reto final en overlay (headless, sin audio).
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
const VID = process.env.VID || 20;
const ESTILO = process.env.ESTILO || 'Pizarrón';
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(BASE);
const r = await p.evaluate(async () => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) })).json());
await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
const v = await p.evaluate(async ([id, t]) => (await fetch('/api/videos/' + id, { headers: { authorization: 'Bearer ' + t } })).json(), [VID, r.token]);
const pr = v.timeline.escenas.find((e) => e.tipo === 'pregunta');
await p.goto(BASE + '/ver/' + VID);
await p.waitForTimeout(2500);
await p.click('.pop .btn'); await p.locator('.pop-caja button', { hasText: ESTILO }).first().click();
// 1) pregunta: el video se pausa solo
await p.evaluate((f) => { window.__mtxPlayer.seekTo(f); window.__mtxPlayer.play(); }, pr.inicio + pr.q - 40);
await p.waitForSelector('.mtx-pregunta button', { timeout: 8000 });
await p.waitForTimeout(500);
await p.locator('.mtx-marco').screenshot({ path: OUT + 'int-1-pregunta.png' });
const mala = pr.correcta === 0 ? 1 : 0;
await p.locator('.mtx-pregunta button').nth(mala).click();
await p.waitForTimeout(1600);
await p.evaluate(() => window.__mtxPlayer.pause());
await p.locator('.mtx-marco').screenshot({ path: OUT + 'int-2-rama-mal.png' });
console.log('pregunta OK; respondida mal (opcion', mala, ') -> rama "No"');
// 2) reto final: al terminar aparece el overlay
await p.evaluate((f) => { window.__mtxPlayer.seekTo(f); window.__mtxPlayer.play(); }, v.timeline.duracion - 25);
await p.waitForSelector('.reto', { timeout: 8000 });
await p.waitForTimeout(500);
await p.locator('.mtx-marco').screenshot({ path: OUT + 'int-3-reto-intro.png' });
await p.locator('.reto .reto-btn').first().click();
for (let i = 0; i < v.quiz.length; i++) {
  await p.locator('.reto-op').first().click();
  await p.waitForSelector('.reto-fb');
  if (i === 0) { await p.waitForTimeout(300); await p.locator('.mtx-marco').screenshot({ path: OUT + 'int-4-reto-feedback.png' }); }
  await p.locator('.reto-fb .reto-btn').click();
}
await p.waitForSelector('.reto-titulo');
await p.waitForTimeout(400);
await p.locator('.mtx-marco').screenshot({ path: OUT + 'int-5-reto-fin.png' });
console.log('reto final OK:', await p.locator('.reto-titulo').innerText());
await p.waitForTimeout(4500); // deja que se envien los eventos
const ev = await p.evaluate(async ([id, t]) => (await fetch('/api/videos/' + id, { headers: { authorization: 'Bearer ' + t } })).json(), [VID, r.token]);
console.log('intento guardado:', JSON.stringify(ev.intento && { a: ev.intento.aciertos, t: ev.intento.total }));
console.log(errores.length ? 'ERRORES: ' + [...new Set(errores)].join(' | ') : 'sin errores');
await b.close();
