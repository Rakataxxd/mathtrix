// Capturas de lo nuevo: modo claro, clases, progreso/ranking, globo de dudas, escena de revision, consecuencia,
// plantillas nuevas y movil. Headless, sin audio, con GPU. Uso: node scripts/capturas2.mjs [pantallas] (VID=40)
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
const VID = +(process.env.VID || 40);
const quiere = (process.argv[2] || 'landing,inicio,clases,curso,progreso,profe,revision,consecuencia,duda,plantillas,movil,oscuro').split(',');
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errores = [];
async function pagina(email, w = 1440, h = 900, tema) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 })).newPage();
  p.on('pageerror', (e) => errores.push((email || 'anon') + ': ' + e.message));
  await p.goto(BASE);
  if (tema) await p.evaluate((t) => localStorage.setItem('mtx_tema', t), tema);
  if (email) {
    const r = await p.evaluate(async (e) => (await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: e, clave: 'mathtrix' }) })).json(), email);
    await p.evaluate((t) => localStorage.setItem('mtx_token', t), r.token);
  }
  return p;
}
const foto = async (p, n, full) => { await p.waitForTimeout(1600); await p.screenshot({ path: OUT + n + '.png', fullPage: !!full }); console.log('captura', n); };
const marco = async (p, n) => { await p.waitForTimeout(700); await p.locator('.mtx-marco').first().screenshot({ path: OUT + n + '.png' }); console.log('captura', n); };
async function irA(p, fr) { await p.evaluate((f) => { window.__mtxPlayer.pause(); window.__mtxPlayer.seekTo(f); }, fr); }

if (quiere.includes('landing')) { const p = await pagina(null); await p.goto(BASE); await foto(p, 'c-landing'); }
const d = await pagina('diego@demo.gt');
if (quiere.includes('inicio')) { await d.goto(BASE + '/'); await foto(d, 'c-inicio'); }
if (quiere.includes('clases')) { await d.goto(BASE + '/clases'); await foto(d, 'c-clases'); }
if (quiere.includes('curso')) { await d.goto(BASE + '/curso/1'); await foto(d, 'c-curso'); }
if (quiere.includes('progreso')) { await d.goto(BASE + '/aprender'); await foto(d, 'c-progreso', true); }
if (quiere.includes('profe')) { const p = await pagina('profe@demo.gt'); await p.goto(BASE + '/curso/1'); await foto(p, 'c-profe-curso'); await p.goto(BASE + '/aprender'); await foto(p, 'c-profe-ranking'); await p.goto(BASE + '/leccion/1'); await p.waitForTimeout(1200); await p.evaluate(() => window.scrollTo(0, 700)); await foto(p, 'c-profe-dudas'); }
let v = null;
if (quiere.some((q) => ['revision', 'consecuencia', 'duda'].includes(q))) {
  v = await d.evaluate(async (id) => (await fetch('/api/videos/' + id, { headers: { authorization: 'Bearer ' + localStorage.getItem('mtx_token') } })).json(), VID);
}
if (quiere.includes('revision') && v) {
  await d.goto(BASE + '/ver/' + VID); await d.waitForTimeout(2500);
  const r = v.timeline.escenas.find((e) => e.tipo === 'revision');
  if (r) { await irA(d, r.inicio + Math.round(r.duracion * 0.75)); await marco(d, 'c-escena-revision'); }
}
if (quiere.includes('consecuencia') && v) {
  await d.goto(BASE + '/ver/' + VID); await d.waitForTimeout(2500);
  const pr = v.timeline.escenas.find((e) => e.tipo === 'pregunta');
  if (pr) {
    await d.evaluate((f) => { window.__mtxPlayer.seekTo(f); window.__mtxPlayer.play(); }, pr.inicio + pr.q - 30);
    await d.waitForSelector('.mtx-pregunta button', { timeout: 8000 });
    await d.locator('.mtx-pregunta button').nth(pr.correcta === 0 ? 1 : 0).click();
    await d.waitForTimeout(1500); await d.evaluate(() => window.__mtxPlayer.pause());
    await marco(d, 'c-escena-consecuencia');
  }
}
if (quiere.includes('duda') && v) {
  await d.goto(BASE + '/ver/' + VID); await d.waitForTimeout(2500);
  await irA(d, 300);
  await d.click('.mtx-duda-btn');
  await d.waitForSelector('.duda textarea');
  await d.fill('.duda textarea', '¿Por qué se resta el 6 y no se suma?');
  await d.keyboard.press('Enter');
  await d.waitForFunction(() => { const m = [...document.querySelectorAll('.duda-msg.tutor')].at(-1); return m && m.innerText.length > 80; }, null, { timeout: 60000 });
  await d.waitForTimeout(2500);
  await foto(d, 'c-duda');
}
if (quiere.includes('plantillas')) {
  await d.goto(BASE + '/ver/24'); await d.waitForTimeout(2500);
  for (const [nombre, k] of [['Vector luz', 'vector'], ['Cinética', 'cinetica'], ['Riso', 'riso']]) {
    await d.click('.pop .btn'); await d.locator('.pop-caja button').filter({ has: d.getByText(nombre, { exact: true }) }).first().click();
    await irA(d, 40); await marco(d, 'c-plantilla-' + k + '-a');
    await irA(d, 190); await marco(d, 'c-plantilla-' + k + '-b');
  }
}
if (quiere.includes('movil')) {
  const m = await pagina('sofi@demo.gt', 390, 844);
  await m.goto(BASE + '/'); await foto(m, 'c-movil-inicio');
  await m.goto(BASE + '/clases'); await foto(m, 'c-movil-clases');
  await m.goto(BASE + '/aprender'); await foto(m, 'c-movil-progreso');
  await m.goto(BASE + '/shorts'); await m.waitForTimeout(2500); await m.click('.reel-riel button[aria-label="Duda"]'); await m.waitForSelector('.duda'); await foto(m, 'c-movil-duda');
}
if (quiere.includes('oscuro')) { const o = await pagina('diego@demo.gt', 1440, 900, 'oscuro'); await o.goto(BASE + '/clases'); await foto(o, 'c-oscuro-clases'); }
console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].join('\n') : 'sin errores');
await b.close();
