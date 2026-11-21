// Prueba punta a punta de "Revisar mi ejercicio": dibuja una hoja con un error, la sube y espera el video.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const OUT = 'C:/Users/usuario/proyectos/mathtrix/data/capturas/';
const b = await chromium.launch({ headless: true, executablePath: 'C:/Users/usuario/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 900, height: 1100 } })).newPage();
// hoja de cuaderno escrita "a mano" con un error de signo en el paso 2
await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:#fbf8f1;background-image:repeating-linear-gradient(180deg,transparent 0 58px,#c9dcf2 58px 60px);font-family:Caveat;font-size:64px;color:#1d2b5a;padding:50px 90px;transform:rotate(-1.5deg)">
<div>Resolver: 2x + 6 = 14</div><div>2x = 14 + 6</div><div>2x = 20</div><div>x = 20 / 2</div><div>x = 10</div></body></html>`);
await p.waitForTimeout(1500);
await p.screenshot({ path: OUT + 'hoja-prueba.png' });
await b.close();
const j = async (url, op = {}) => { const r = await fetch(BASE + url, op); if (!r.ok) throw new Error(url + ' ' + r.status + ' ' + await r.text()); return r.json(); };
const { token } = await j('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) });
const form = new FormData();
form.append('foto', new Blob([readFileSync(OUT + 'hoja-prueba.png')], { type: 'image/png' }), 'hoja.png');
form.append('nota', 'no sé si está bien');
const t0 = Date.now();
const { trabajo } = await j('/api/revisar', { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: form });
const r = await fetch(BASE + '/api/trabajos/' + trabajo);
const dec = new TextDecoder(); let buf = '', fin = null;
for await (const c of r.body) {
  buf += dec.decode(c, { stream: true });
  let i;
  while ((i = buf.indexOf('\n\n')) >= 0) {
    const ev = JSON.parse(buf.slice(6, i)); buf = buf.slice(i + 2);
    const s = ((Date.now() - t0) / 1000).toFixed(1);
    if (ev.etapa === 'analisis') console.log(s + 's ANALISIS', ev.analisis.estado, '|', ev.analisis.problema, '|', ev.analisis.pasos.map((x) => x.texto + (x.ok ? ' ✓' : ' ✗')).join(' · '), '|', ev.analisis.primer_error?.que);
    else if (ev.etapa !== 'escribiendo') console.log(s + 's', ev.etapa, ev.msg || '');
    if (ev.etapa === 'listo' || ev.etapa === 'error') fin = ev;
  }
  if (fin) break;
}
if (fin?.video_id) {
  const v = await j('/api/videos/' + fin.video_id, { headers: { authorization: 'Bearer ' + token } });
  console.log('VIDEO', v.id, v.tipo, '|', v.titulo, '| escenas:', v.timeline.escenas.map((e) => e.tipo).join(','));
  const rev = v.timeline.escenas.find((e) => e.tipo === 'revision');
  console.log('REVISION', rev ? rev.pasos.map((x) => x.texto + (x.ok ? ' ✓' : ' ✗')).join(' · ') : 'SIN escena revision');
  const pr = v.timeline.escenas.find((e) => e.tipo === 'pregunta');
  console.log('PREGUNTA', pr?.opciones, 'correcta', pr?.correcta, 'consecuencia', JSON.stringify(pr?.consecuencia));
}
