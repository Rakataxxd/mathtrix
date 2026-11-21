// Capturas de las pantallas principales (headless, sin audio, con GPU). Uso: node scripts/capturas.mjs [pantallas]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
mkdirSync(OUT, { recursive: true });
const quiere = (process.argv[2] || 'landing,inicio,ver,shorts,movil,leccion,profe').split(',');
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errores = [];
async function pagina(email, w = 1440, h = 900) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('pageerror', (e) => errores.push((email || 'anon') + ': ' + e.message));
  await p.goto(BASE);
  if (email) {
    const r = await p.evaluate(async (e) => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: e, clave: 'mathtrix' }) })).json(), email);
    await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
  }
  return p;
}
const foto = async (p, n, full) => { await p.waitForTimeout(1800); await p.screenshot({ path: OUT + n + '.png', fullPage: !!full }); console.log('captura', n); };
if (quiere.includes('landing')) { const p = await pagina(null); await p.goto(BASE); await foto(p, 'n-landing'); await p.evaluate(() => window.scrollTo(0, 820)); await foto(p, 'n-landing2'); await p.click('text=Empezar'); await foto(p, 'n-auth'); }
const d = await pagina('diego@demo.gt');
if (quiere.includes('inicio')) { await d.goto(BASE + '/'); await foto(d, 'n-inicio'); }
if (quiere.includes('ver')) { await d.goto(BASE + '/ver/24'); await foto(d, 'n-ver'); await d.click('.pop .btn'); await foto(d, 'n-ver-estilo'); }
if (quiere.includes('shorts')) { await d.goto(BASE + '/shorts'); await d.waitForTimeout(2500); await foto(d, 'n-shorts'); await d.click('.reel-riel button[aria-label="Comentarios"]'); await foto(d, 'n-shorts-coment'); }
if (quiere.includes('movil')) { const m = await pagina('sofi@demo.gt', 400, 860); await m.goto(BASE + '/shorts'); await m.waitForTimeout(2500); await foto(m, 'n-movil-shorts'); await m.goto(BASE + '/'); await foto(m, 'n-movil-inicio'); }
if (quiere.includes('leccion')) { await d.goto(BASE + '/leccion/' + (process.env.LEC || 1)); await foto(d, 'n-leccion'); }
if (quiere.includes('profe')) { const p = await pagina('profe@demo.gt'); await p.goto(BASE + '/leccion/1'); await foto(p, 'n-profe'); }
if (quiere.includes('onb')) { const o = await pagina(null); await o.goto(BASE); const r = await o.evaluate(async () => (await fetch('/api/registro', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: 'Prueba Onb', email: 'onb' + Date.now() + '@x.gt', clave: '1234', rol: 'alumno' }) })).json()); await o.evaluate((t) => localStorage.setItem('mtx_token', t), r.token); await o.goto(BASE); await foto(o, 'n-onb1'); await o.click('text=Seguir'); await o.click('text=Seguir'); await foto(o, 'n-onb3', true); }
console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].join('\n') : 'sin errores');
await b.close();
