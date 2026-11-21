// Flujo completo por API: profesor -> clase -> material -> brief IA -> alumno -> video -> test -> analitica.
const B = process.env.BASE || 'http://127.0.0.1:8110';
const j = async (r, o = {}, t) => {
  const x = await fetch(B + '/api' + r, { method: o.m || (o.b || o.f ? 'POST' : 'GET'), headers: { ...(t ? { authorization: 'Bearer ' + t } : {}), ...(o.b ? { 'content-type': 'application/json' } : {}) }, body: o.f || (o.b ? JSON.stringify(o.b) : undefined) });
  const d = await x.json(); if (!x.ok) throw new Error(r + ': ' + d.error); return d;
};
const n = Date.now();
const P = await j('/registro', { b: { nombre: 'Profe Prueba', email: `p${n}@x.gt`, clave: '1234', rol: 'profesor', curriculo: 'cnb' } });
const c = await j('/cursos', { b: { titulo: 'Mate 2do Básico', grado: '2do Básico' } }, P.token);
const l = await j(`/cursos/${c.id}/lecciones`, { b: { titulo: 'Teorema de Pitágoras', tema: 'Teorema de Pitágoras', objetivo: 'Calcular la hipotenusa', ejercicio: 'catetos 6 y 8' } }, P.token);
const fd = new FormData();
fd.append('texto', 'En un triángulo rectángulo c² = a² + b². La hipotenusa es el lado más largo. Ejemplo: a=3, b=4, c=5.');
fd.append('archivos', new Blob(['Guia: Pitagoras. Ejercicio 1: escalera de 5 m apoyada a 3 m de la pared, a que altura llega?'], { type: 'text/plain' }), 'guia.txt');
console.log('material', JSON.stringify(await j(`/lecciones/${l.id}/materiales`, { f: fd }, P.token)));
let t0 = Date.now();
const a = await j(`/lecciones/${l.id}/escanear`, { b: {} }, P.token);
console.log('brief', ((Date.now() - t0) / 1000).toFixed(1) + 's', '| CNB:', a.cnb?.competencia?.slice(0, 70), '| formulas:', a.formulas);
const A = await j('/registro', { b: { nombre: 'Ana Alumna', email: `a${n}@x.gt`, clave: '1234', rol: 'alumno' } });
await j('/perfil', { b: { gustos: ['Básquet', 'Videojuegos'], idolos: ['LeBron James'], metas: ['Ser gamer pro'], aprende: ['Con retos y competencia'], complica: ['Geometría'], voz: 'Marta' } }, A.token);
await j('/cursos/unirse', { b: { codigo: c.codigo } }, A.token);
t0 = Date.now();
await j(`/lecciones/${l.id}/pregenerar`, { b: { formato: 'vertical' } }, A.token);
await new Promise((r) => setTimeout(r, 4000));
const g = await j(`/lecciones/${l.id}/generar`, { b: { formato: 'vertical' } }, A.token);
console.log('adelantado:', !!g.adelantado);
const res = await fetch(B + '/api/trabajos/' + g.trabajo);
let buf = '', vid = null, fin = false;
const dec = new TextDecoder();
for await (const ch of res.body) {
  buf += dec.decode(ch, { stream: true });
  const evs = buf.split('\n\n'); buf = evs.pop();
  for (const e of evs) {
    const ev = JSON.parse(e.slice(6));
    if (ev.etapa !== 'escribiendo') console.log('  ', ev.t, ev.etapa, ev.msg || ev.titulo || '');
    if (ev.etapa === 'listo') vid = ev.video_id;
    if (ev.etapa === 'listo' || ev.etapa === 'error') fin = true;
  }
  if (fin) break;
}
console.log('espera tras el clic:', ((Date.now() - t0 - 4000) / 1000).toFixed(1) + 's');
const v = await j('/videos/' + vid, {}, A.token);
console.log('video', v.titulo, '|', v.timeline.escenas.map((e) => e.tipo).join(','), '| audio:', v.timeline.escenas.filter((e) => e.audio).length + '/' + v.timeline.escenas.length);
await j('/eventos', { b: { eventos: [{ video_id: vid, sesion: 'e2e', tipo: 'play', t: 0 }, { video_id: vid, sesion: 'e2e', tipo: 'pausa', t: 12, escena: 3, escena_tipo: 'paso' }, { video_id: vid, sesion: 'e2e', tipo: 'fin', t: v.duracion }] } }, A.token);
const q = await j(`/videos/${vid}/quiz`, { b: { respuestas: v.quiz.map(() => 0), tiempos: v.quiz.map(() => 5000) } }, A.token);
console.log('quiz', q.aciertos + '/' + q.total);
const an = await j(`/lecciones/${l.id}/analitica`, {}, P.token);
console.log('analitica', JSON.stringify(an.resumen), an.insights.map((i) => i.txt).join(' | '));
console.log('alumno ve prompt/CNB?', 'prompt' in (await j('/lecciones/' + l.id, {}, A.token)) ? 'SI (MAL)' : 'no');
console.log('E2E OK');
