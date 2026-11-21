// Prueba: N videos a la vez (cada uno con su Haiku) y que todas las voces salgan de ElevenLabs.
// Uso: BASE=... N=3 node scripts/lote.mjs
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const N = +(process.env.N || 3);
const j = async (url, op = {}) => { const r = await fetch(BASE + url, op); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); };
const { token } = await j('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) });
const H = { 'content-type': 'application/json', authorization: 'Bearer ' + token };
const t0 = Date.now();
const { trabajos } = await j('/api/generar-libre', { method: 'POST', headers: H, body: JSON.stringify({ tema: 'suma de fracciones', cantidad: N }) });
const res = await Promise.all(trabajos.map(async (t) => {
  for (;;) {
    const r = await j(`/api/trabajos/${t}/eventos?desde=0`);
    const fin = r.eventos.find((e) => e.etapa === 'listo' || e.etapa === 'error');
    if (fin) return { ...fin, avisos: r.eventos.filter((e) => e.etapa === 'aviso').map((e) => e.msg), voz: r.eventos.find((e) => e.etapa === 'voz')?.msg };
    await new Promise((ok) => setTimeout(ok, 1500));
  }
}));
for (const r of res) {
  if (!r.video_id) { console.log('ERROR', r.msg); continue; }
  const v = await j('/api/videos/' + r.video_id, { headers: H });
  console.log(`${(r.ms / 1000).toFixed(1)}s | ${v.titulo} | ${r.voz} ${r.avisos.length ? '| AVISOS: ' + r.avisos.join(' / ') : ''}`);
}
console.log(`total ${N} videos en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
