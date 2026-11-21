// Prueba por API del tutor (duda en el video), puntos y ranking. Uso: node scripts/api-tutor.mjs [videoId]
const BASE = process.env.BASE || 'http://127.0.0.1:8110';
const VID = process.argv[2] || 32;
const j = async (url, op = {}) => { const r = await fetch(BASE + url, op); if (!r.ok) throw new Error(url + ' ' + r.status + ' ' + await r.text()); return r.json(); };
const { token } = await j('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'diego@demo.gt', clave: 'mathtrix' }) });
const H = { 'content-type': 'application/json', authorization: 'Bearer ' + token };
const t0 = Date.now();
const r = await fetch(BASE + `/api/videos/${VID}/duda`, { method: 'POST', headers: H, body: JSON.stringify({ pregunta: 'No entendí de dónde salió ese número, explicámelo', t: 14 }) });
let primero = null, txt = '';
const dec = new TextDecoder();
for await (const c of r.body) { if (!primero) primero = Date.now() - t0; txt += dec.decode(c, { stream: true }); }
console.log(`DUDA primer texto ${(primero / 1000).toFixed(1)} s, total ${((Date.now() - t0) / 1000).toFixed(1)} s\n${txt}\n`);
const p = await j('/api/puntos', { headers: H });
console.log('PUNTOS', p.xp, 'XP · nivel', p.nivel.n, p.nivel.nombre, '· racha', p.racha, '· logros', p.logros.filter((l) => l.ok).map((l) => l.nombre).join(', '));
for (const [a, per] of [['clase', 'semana'], ['global', 'todo']]) {
  const k = await j(`/api/ranking?alcance=${a}&periodo=${per}`, { headers: H });
  console.log('RANKING', a, per, k.total, 'alumnos · top3', k.top.slice(0, 3).map((f) => `${f.pos}. ${f.nombre} ${f.xp}`).join(' | '), '· yo', k.yo?.pos, k.yo?.xp);
}
