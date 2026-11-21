// Servidor Mathtrix: API + estaticos. HOST/PORT por entorno (hoy local; manana tunel publico).
import express from 'express';
import multer from 'multer';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { db, uno, todos, correr, json, DATA, RAIZ } from './db.js';
import { generarVideo, suscribir, trabajos } from './generador.js';
import { precalentar } from './motor.js';
import { claude, extraerJSON } from './ia.js';
import { SISTEMA_CLASE, promptClase } from './prompts.js';
import { recomendar, actualizarStats } from './recomendador.js';
import { analiticaLeccion, analiticaCurso } from './analitica.js';

const app = express();
app.use(express.json({ limit: '4mb' }));
const PORT = +process.env.PORT || 8110;
const HOST = process.env.HOST || '127.0.0.1';
const COLORES = ['#b6ff3b', '#ff4fd8', '#3bd1ff', '#ffb23b', '#9b7bff', '#3bffb0', '#ff6b5b'];

// ---------- auth ----------
const hash = (c) => { const s = randomBytes(12).toString('hex'); return s + ':' + scryptSync(c, s, 32).toString('hex'); };
const verificar = (c, h) => { const [s, k] = h.split(':'); const a = scryptSync(c, s, 32); return timingSafeEqual(a, Buffer.from(k, 'hex')); };
const publico = (u) => u && ({ id: u.id, rol: u.rol, nombre: u.nombre, email: u.email, color: u.color, curriculo: u.curriculo });
function sesion(u) { const t = randomBytes(24).toString('hex'); correr('INSERT INTO sesiones(token, usuario_id) VALUES(?,?)', t, u.id); return t; }
function auth(req, _res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
  req.u = t ? uno('SELECT u.* FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id WHERE s.token=?', t) : null;
  next();
}
const req = (rol) => (r, s, n) => (!r.u ? s.status(401).json({ error: 'Iniciá sesión' }) : rol && r.u.rol !== rol ? s.status(403).json({ error: 'Solo ' + rol }) : n());
app.use('/api', auth);

app.post('/api/registro', (r, s) => {
  const { nombre, email, clave, rol, curriculo } = r.body || {};
  if (!nombre || !email || !clave || !['alumno', 'profesor'].includes(rol)) return s.status(400).json({ error: 'Faltan datos' });
  if (uno('SELECT id FROM usuarios WHERE email=?', email.toLowerCase())) return s.status(409).json({ error: 'Ese correo ya tiene cuenta' });
  const res = correr('INSERT INTO usuarios(rol,nombre,email,clave,color,curriculo) VALUES(?,?,?,?,?,?)', rol, nombre.trim(), email.toLowerCase().trim(), hash(clave),
    COLORES[Math.floor(Math.random() * COLORES.length)], curriculo === 'general' ? 'general' : 'cnb');
  const u = uno('SELECT * FROM usuarios WHERE id=?', res.lastInsertRowid);
  s.json({ token: sesion(u), usuario: publico(u), perfil: null });
});
app.post('/api/login', (r, s) => {
  const u = uno('SELECT * FROM usuarios WHERE email=?', String(r.body?.email || '').toLowerCase().trim());
  if (!u || !verificar(String(r.body?.clave || ''), u.clave)) return s.status(401).json({ error: 'Correo o clave incorrectos' });
  s.json({ token: sesion(u), usuario: publico(u), perfil: json(uno('SELECT respuestas FROM perfiles WHERE usuario_id=?', u.id)?.respuestas) });
});
app.get('/api/yo', req(), (r, s) => s.json({ usuario: publico(r.u), perfil: json(uno('SELECT respuestas FROM perfiles WHERE usuario_id=?', r.u.id)?.respuestas) }));

app.post('/api/perfil', req(), (r, s) => {
  correr(`INSERT INTO perfiles(usuario_id, respuestas) VALUES(?,?) ON CONFLICT(usuario_id) DO UPDATE SET respuestas=excluded.respuestas, actualizado=datetime('now')`, r.u.id, JSON.stringify(r.body || {}));
  s.json({ ok: true });
});

// ---------- cursos y clases ----------
const codigo = () => 'MTX-' + randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
app.get('/api/cursos', req(), (r, s) => {
  const filas = r.u.rol === 'profesor'
    ? todos(`SELECT c.*, (SELECT COUNT(*) FROM inscripciones i WHERE i.curso_id=c.id) alumnos, (SELECT COUNT(*) FROM lecciones l WHERE l.curso_id=c.id) clases FROM cursos c WHERE profesor_id=? ORDER BY id DESC`, r.u.id)
    : todos(`SELECT c.*, u.nombre profesor, (SELECT COUNT(*) FROM lecciones l WHERE l.curso_id=c.id) clases FROM inscripciones i JOIN cursos c ON c.id=i.curso_id JOIN usuarios u ON u.id=c.profesor_id WHERE i.alumno_id=? ORDER BY i.creado DESC`, r.u.id);
  s.json(filas.map((c) => (r.u.rol === 'alumno' ? { ...c, cnb: undefined } : c)));
});
app.post('/api/cursos', req('profesor'), (r, s) => {
  const { titulo, descripcion, grado, cnb } = r.body || {};
  if (!titulo) return s.status(400).json({ error: 'Poné un título' });
  const res = correr('INSERT INTO cursos(profesor_id,titulo,descripcion,grado,codigo,cnb,color) VALUES(?,?,?,?,?,?,?)', r.u.id, titulo, descripcion || '', grado || '', codigo(),
    cnb === false || r.u.curriculo === 'general' && cnb !== true ? 0 : 1, COLORES[Math.floor(Math.random() * COLORES.length)]);
  s.json(uno('SELECT * FROM cursos WHERE id=?', res.lastInsertRowid));
});
app.post('/api/cursos/unirse', req('alumno'), (r, s) => {
  const c = uno('SELECT * FROM cursos WHERE codigo=?', String(r.body?.codigo || '').trim().toUpperCase());
  if (!c) return s.status(404).json({ error: 'No existe una clase con ese código' });
  correr('INSERT OR IGNORE INTO inscripciones(curso_id, alumno_id) VALUES(?,?)', c.id, r.u.id);
  s.json({ ok: true, curso_id: c.id });
});
function puedeVerCurso(u, c) {
  return c && (c.profesor_id === u.id || uno('SELECT 1 x FROM inscripciones WHERE curso_id=? AND alumno_id=?', c.id, u.id));
}
app.get('/api/cursos/:id', req(), (r, s) => {
  const c = uno('SELECT c.*, u.nombre profesor FROM cursos c JOIN usuarios u ON u.id=c.profesor_id WHERE c.id=?', r.params.id);
  if (!puedeVerCurso(r.u, c)) return s.status(404).json({ error: 'Curso no encontrado' });
  const lecciones = todos('SELECT id, titulo, tema, objetivo, ejercicio, analisis, prompt, creado FROM lecciones WHERE curso_id=? ORDER BY orden, id', c.id).map((l) => {
    const a = json(l.analisis, null);
    const mios = r.u.rol === 'alumno' ? todos('SELECT id, titulo, formato, timeline, creado FROM videos WHERE leccion_id=? AND autor_id=? ORDER BY id DESC', l.id, r.u.id).map(vRes) : undefined;
    const base = { ...l, analisis: a, mis_videos: mios, videos: uno('SELECT COUNT(*) n FROM videos WHERE leccion_id=?', l.id).n };
    if (r.u.rol === 'alumno') { delete base.prompt; if (base.analisis) base.analisis = { resumen: a.resumen, conceptos: a.conceptos }; }
    return base;
  });
  const alumnos = r.u.rol === 'profesor' ? todos('SELECT u.id, u.nombre, u.color FROM inscripciones i JOIN usuarios u ON u.id=i.alumno_id WHERE i.curso_id=? ORDER BY u.nombre', c.id) : undefined;
  s.json({ ...c, cnb: r.u.rol === 'alumno' ? undefined : c.cnb, lecciones, alumnos });
});
app.post('/api/cursos/:id/lecciones', req('profesor'), (r, s) => {
  const c = uno('SELECT * FROM cursos WHERE id=? AND profesor_id=?', r.params.id, r.u.id);
  if (!c) return s.status(404).json({ error: 'Curso no encontrado' });
  const { titulo, tema, objetivo, ejercicio } = r.body || {};
  if (!titulo || !tema) return s.status(400).json({ error: 'Título y tema son obligatorios' });
  const res = correr('INSERT INTO lecciones(curso_id,titulo,tema,objetivo,ejercicio,orden) VALUES(?,?,?,?,?,?)', c.id, titulo, tema, objetivo || '', ejercicio || '',
    uno('SELECT COUNT(*) n FROM lecciones WHERE curso_id=?', c.id).n);
  s.json(uno('SELECT * FROM lecciones WHERE id=?', res.lastInsertRowid));
});
function leccionDe(u, id) {
  const l = uno('SELECT l.*, c.profesor_id, c.titulo curso_titulo, c.grado, c.cnb FROM lecciones l JOIN cursos c ON c.id=l.curso_id WHERE l.id=?', id);
  return l && puedeVerCurso(u, { id: l.curso_id, profesor_id: l.profesor_id }) ? l : null;
}
app.put('/api/lecciones/:id', req('profesor'), (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l || l.profesor_id !== r.u.id) return s.status(404).json({ error: 'Clase no encontrada' });
  const b = r.body || {};
  correr('UPDATE lecciones SET titulo=?, tema=?, objetivo=?, ejercicio=?, prompt=? WHERE id=?', b.titulo ?? l.titulo, b.tema ?? l.tema, b.objetivo ?? l.objetivo, b.ejercicio ?? l.ejercicio, b.prompt ?? l.prompt, l.id);
  s.json({ ok: true });
});
app.get('/api/lecciones/:id', req(), (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l) return s.status(404).json({ error: 'Clase no encontrada' });
  const materiales = todos('SELECT id, nombre, tipo, length(texto) chars, creado FROM materiales WHERE leccion_id=?', l.id);
  const out = { ...l, analisis: json(l.analisis), materiales };
  if (r.u.rol === 'alumno') { delete out.prompt; delete out.materiales_texto; delete out.cnb; if (out.analisis) delete out.analisis.cnb; }
  s.json(out);
});

// materiales: subir y escanear
const subir = multer({ dest: join(DATA, 'uploads'), limits: { fileSize: 25 * 1024 * 1024 } });
async function extraerTexto(f) {
  const ext = extname(f.originalname).toLowerCase();
  if (ext === '.pdf') {
    const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const d = await pdf(readFileSync(f.path));
    return d.text;
  }
  if (['.txt', '.md', '.csv', '.tex'].includes(ext)) return readFileSync(f.path, 'utf8');
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    const nombre = f.filename + ext;
    writeFileSync(join(DATA, 'uploads', nombre), readFileSync(f.path));
    return await claude({ sistema: 'Transcribís material de matemática. Respondés solo el texto transcrito, con fórmulas en texto plano.', herramientas: 'Read', cwd: join(DATA, 'uploads'),
      prompt: `Leé la imagen ./${nombre} y transcribí todo su contenido matemático (títulos, explicaciones, fórmulas, ejercicios y datos). Solo el texto.`, timeoutMs: 90000 });
  }
  return '';
}
app.post('/api/lecciones/:id/materiales', req('profesor'), subir.array('archivos', 8), async (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l || l.profesor_id !== r.u.id) return s.status(404).json({ error: 'Clase no encontrada' });
  const out = [];
  for (const f of r.files || []) {
    let texto = '';
    try { texto = (await extraerTexto(f)) || ''; } catch (e) { texto = ''; }
    correr('INSERT INTO materiales(leccion_id,nombre,tipo,ruta,texto) VALUES(?,?,?,?,?)', l.id, f.originalname, f.mimetype, f.path, texto);
    out.push({ nombre: f.originalname, chars: texto.length });
  }
  if (r.body?.texto) { correr('INSERT INTO materiales(leccion_id,nombre,tipo,texto) VALUES(?,?,?,?)', l.id, 'Notas del profesor', 'text/plain', r.body.texto); out.push({ nombre: 'Notas', chars: r.body.texto.length }); }
  const todo = todos('SELECT nombre, texto FROM materiales WHERE leccion_id=?', l.id).map((m) => `### ${m.nombre}\n${m.texto}`).join('\n\n');
  correr('UPDATE lecciones SET materiales_texto=? WHERE id=?', todo, l.id);
  s.json({ archivos: out });
});
app.post('/api/lecciones/:id/escanear', req('profesor'), async (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l || l.profesor_id !== r.u.id) return s.status(404).json({ error: 'Clase no encontrada' });
  try {
    const txt = await claude({ sistema: SISTEMA_CLASE, prompt: promptClase({ leccion: l, curso: { titulo: l.curso_titulo, grado: l.grado, cnb: l.cnb }, materiales: l.materiales_texto }) });
    const a = extraerJSON(txt);
    if (!l.cnb) a.cnb = null;
    correr('UPDATE lecciones SET analisis=?, prompt=? WHERE id=?', JSON.stringify(a), a.prompt || '', l.id);
    s.json(a);
  } catch (e) { s.status(500).json({ error: 'No se pudo analizar: ' + e.message }); }
});

// ---------- videos ----------
function vRes(v) {
  const tl = typeof v.timeline === 'string' ? json(v.timeline, {}) : v.timeline;
  const g = tl?.escenas?.[0] || {};
  return { id: v.id, titulo: v.titulo, formato: v.formato, estilo: tl?.estilo || 'ilustrado', creado: v.creado, duracion: v.duracion, vistas: v.vistas, tema: v.tema, autor: v.autor, autor_color: v.autor_color,
    likes: v.likes, etiquetas: json(v.etiquetas, []), motivo: v.motivo, poster: { paleta: tl?.paleta, emoji: tl?.emoji, texto: g.texto, extras: g.extras, estilo: tl?.estilo || 'ilustrado' } };
}
const SELECT_V = `SELECT v.*, u.nombre autor, u.color autor_color, (SELECT COUNT(*) FROM likes l WHERE l.video_id=v.id AND l.valor=1) likes FROM videos v LEFT JOIN usuarios u ON u.id=v.autor_id`;

app.get('/api/feed', req(), (r, s) => {
  const formato = r.query.formato === 'vertical' ? 'vertical' : r.query.formato === 'horizontal' ? 'horizontal' : null;
  const vids = todos(`${SELECT_V} WHERE v.publico=1 ${formato ? "AND v.formato='" + formato + "'" : ''} ORDER BY v.id DESC LIMIT 300`);
  const q = String(r.query.q || '').toLowerCase();
  const filtrados = q ? vids.filter((v) => (v.titulo + ' ' + v.tema + ' ' + v.etiquetas).toLowerCase().includes(q)) : vids;
  s.json(recomendar(r.u, filtrados).map(vRes));
});
app.get('/api/videos/:id', req(), (r, s) => {
  const v = uno(`${SELECT_V} WHERE v.id=?`, r.params.id);
  if (!v) return s.status(404).json({ error: 'Video no encontrado' });
  correr('UPDATE videos SET vistas=vistas+1 WHERE id=?', v.id);
  const quiz = json(v.quiz, []).map((q) => ({ pregunta: q.pregunta, opciones: q.opciones, tipo: q.tipo }));
  const mio = uno('SELECT valor FROM likes WHERE video_id=? AND usuario_id=?', v.id, r.u.id)?.valor || 0;
  const intento = uno('SELECT aciertos, total, respuestas FROM intentos WHERE video_id=? AND usuario_id=? ORDER BY id DESC LIMIT 1', v.id, r.u.id);
  const dislikes = uno('SELECT COUNT(*) n FROM likes WHERE video_id=? AND valor=-1', v.id).n;
  const leccion = v.leccion_id ? uno('SELECT l.id, l.titulo, c.titulo curso FROM lecciones l JOIN cursos c ON c.id=l.curso_id WHERE l.id=?', v.leccion_id) : null;
  s.json({ ...vRes(v), timeline: json(v.timeline), quiz, mi_like: mio, dislikes, intento: intento ? { ...intento, respuestas: json(intento.respuestas) } : null,
    motor: v.motor, ms_generacion: v.ms_generacion, leccion, verificado: !!v.verificado });
});
app.post('/api/videos/:id/like', req(), (r, s) => {
  const val = [1, -1, 0].includes(r.body?.valor) ? r.body.valor : 1;
  if (val === 0) correr('DELETE FROM likes WHERE video_id=? AND usuario_id=?', r.params.id, r.u.id);
  else correr('INSERT INTO likes(video_id,usuario_id,valor) VALUES(?,?,?) ON CONFLICT DO UPDATE SET valor=excluded.valor', r.params.id, r.u.id, val);
  correr('INSERT INTO eventos(usuario_id,video_id,tipo,extra) VALUES(?,?,?,?)', r.u.id, r.params.id, 'like', JSON.stringify({ valor: val }));
  s.json({ likes: uno('SELECT COUNT(*) n FROM likes WHERE video_id=? AND valor=1', r.params.id).n });
});
app.get('/api/videos/:id/comentarios', req(), (r, s) => s.json(todos('SELECT c.id, c.texto, c.creado, u.nombre, u.color, u.rol FROM comentarios c JOIN usuarios u ON u.id=c.usuario_id WHERE video_id=? ORDER BY c.id DESC', r.params.id)));
app.post('/api/videos/:id/comentarios', req(), (r, s) => {
  const t = String(r.body?.texto || '').trim().slice(0, 600);
  if (!t) return s.status(400).json({ error: 'Comentario vacío' });
  correr('INSERT INTO comentarios(video_id,usuario_id,texto) VALUES(?,?,?)', r.params.id, r.u.id, t);
  s.json({ ok: true });
});
// revisar una pregunta del reto final (feedback inmediato en el overlay)
app.post('/api/videos/:id/quiz/revisar', req(), (r, s) => {
  const v = uno('SELECT quiz FROM videos WHERE id=?', r.params.id);
  const q = json(v?.quiz, [])[+r.body?.i];
  if (!q) return s.status(404).json({ error: 'Pregunta no encontrada' });
  s.json({ ok: r.body?.eleccion === q.correcta, correcta: q.correcta, explicacion: q.explicacion });
});
app.post('/api/videos/:id/quiz', req(), (r, s) => {
  const v = uno('SELECT * FROM videos WHERE id=?', r.params.id);
  if (!v) return s.status(404).json({ error: 'Video no encontrado' });
  const quiz = json(v.quiz, []);
  const resp = Array.isArray(r.body?.respuestas) ? r.body.respuestas : [];
  const tiempos = Array.isArray(r.body?.tiempos) ? r.body.tiempos : [];
  const detalle = quiz.map((q, i) => ({ elegida: resp[i] ?? null, correcta: q.correcta, ok: resp[i] === q.correcta, ms: tiempos[i] || null, tipo: q.tipo }));
  const aciertos = detalle.filter((d) => d.ok).length;
  correr('INSERT INTO intentos(video_id,usuario_id,respuestas,aciertos,total,puntaje,ms) VALUES(?,?,?,?,?,?,?)', v.id, r.u.id, JSON.stringify(detalle), aciertos, quiz.length, aciertos / (quiz.length || 1), tiempos.reduce((a, b) => a + (b || 0), 0));
  actualizarStats(r.u.id);
  s.json({ aciertos, total: quiz.length, detalle, explicaciones: quiz.map((q) => ({ correcta: q.correcta, explicacion: q.explicacion })) });
});

// eventos del reproductor: play, pausa, salto, rebobinar, fin, latido, pestaña oculta, velocidad
app.post('/api/eventos', req(), (r, s) => {
  const evs = Array.isArray(r.body?.eventos) ? r.body.eventos.slice(0, 200) : [];
  const st = db.prepare('INSERT INTO eventos(usuario_id,video_id,sesion,tipo,t,escena,escena_tipo,extra) VALUES(?,?,?,?,?,?,?,?)');
  for (const e of evs) st.run(r.u.id, e.video_id ?? null, e.sesion ?? null, String(e.tipo).slice(0, 24), e.t ?? null, e.escena ?? null, e.escena_tipo ?? null, e.extra ? JSON.stringify(e.extra) : null);
  if (evs.some((e) => e.tipo === 'fin' || e.tipo === 'pausa')) actualizarStats(r.u.id);
  s.json({ ok: true, n: evs.length });
});

// ---------- generacion ----------
const pre = new Map(); // pre-generacion: usuario:leccion:formato -> trabajo
const ESTILOS = ['ilustrado', 'tiza', 'blueprint', 'manim', 'cuaderno', 'neon'];
const estiloOk = (x) => (ESTILOS.includes(x) ? x : undefined);
function lanzar(u, l, formato, estilo) {
  return generarVideo({ usuario: u, leccion: { id: l.id, titulo: l.titulo, tema: l.tema, objetivo: l.objetivo, ejercicio: l.ejercicio, prompt: l.prompt }, formato, estilo });
}
app.post('/api/lecciones/:id/generar', req(), (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l) return s.status(404).json({ error: 'Clase no encontrada' });
  const formato = r.body?.formato === 'horizontal' ? 'horizontal' : 'vertical';
  const estilo = estiloOk(r.body?.estilo);
  const k = `${r.u.id}:${l.id}:${formato}`;
  const p = pre.get(k);
  pre.delete(k);
  // la plantilla visual no cambia el guion: se reutiliza lo adelantado y solo se pinta distinto
  if (p && trabajos.get(p)?.estado !== 'error') { if (estilo) trabajos.get(p).estilo = estilo; return s.json({ trabajo: p, adelantado: true }); }
  s.json({ trabajo: lanzar(r.u, l, formato, estilo) });
});
// Truco: se arranca el guion mientras el alumno todavia esta eligiendo
app.post('/api/lecciones/:id/pregenerar', req('alumno'), (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l) return s.status(404).json({ error: 'Clase no encontrada' });
  const formato = r.body?.formato === 'horizontal' ? 'horizontal' : 'vertical';
  const k = `${r.u.id}:${l.id}:${formato}`;
  if (!pre.has(k) || !trabajos.has(pre.get(k))) pre.set(k, lanzar(r.u, l, formato));
  s.json({ ok: true });
});
app.post('/api/generar-libre', req(), (r, s) => {
  const tema = String(r.body?.tema || '').slice(0, 120);
  if (!tema) return s.status(400).json({ error: 'Escribí un tema' });
  s.json({ trabajo: generarVideo({ usuario: r.u, leccion: { titulo: tema, tema, objetivo: r.body?.detalle || '' }, formato: r.body?.formato === 'horizontal' ? 'horizontal' : 'vertical', estilo: estiloOk(r.body?.estilo) }) });
});
app.get('/api/trabajos/:id', (r, s) => {
  s.set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
  s.flushHeaders();
  const off = suscribir(r.params.id, (ev) => s.write(`data: ${JSON.stringify(ev)}\n\n`));
  if (!off) { s.write(`data: ${JSON.stringify({ etapa: 'error', msg: 'Trabajo no encontrado' })}\n\n`); return s.end(); }
  r.on('close', off);
});

// ---------- aprender y analitica ----------
app.get('/api/aprender', req(), (r, s) => {
  const st = json(uno('SELECT stats FROM perfiles WHERE usuario_id=?', r.u.id)?.stats, {});
  const historial = todos(`SELECT v.id, v.titulo, v.tema, v.formato, v.timeline, i.aciertos, i.total, i.creado FROM intentos i JOIN videos v ON v.id=i.video_id WHERE i.usuario_id=? ORDER BY i.id DESC LIMIT 30`, r.u.id)
    .map((x) => ({ ...vRes(x), aciertos: x.aciertos, total: x.total, cuando: x.creado }));
  const pendientes = todos(`SELECT l.id, l.titulo, l.tema, c.titulo curso, c.id curso_id FROM inscripciones i JOIN lecciones l ON l.curso_id=i.curso_id JOIN cursos c ON c.id=i.curso_id
    WHERE i.alumno_id=? AND NOT EXISTS (SELECT 1 FROM intentos t JOIN videos v ON v.id=t.video_id WHERE t.usuario_id=i.alumno_id AND v.leccion_id=l.id) ORDER BY l.id LIMIT 12`, r.u.id);
  const vistos = uno(`SELECT COUNT(DISTINCT video_id) n FROM eventos WHERE usuario_id=? AND tipo='fin'`, r.u.id).n;
  const dias = todos(`SELECT DISTINCT date(creado) d FROM eventos WHERE usuario_id=? ORDER BY d DESC LIMIT 60`, r.u.id).map((x) => x.d);
  let racha = 0; const hoy = new Date();
  for (let i = 0; i < 60; i++) { const d = new Date(hoy - i * 864e5).toISOString().slice(0, 10); if (dias.includes(d)) racha++; else if (i > 0) break; }
  s.json({ stats: st, historial, pendientes, vistos, racha, xp: historial.reduce((a, h) => a + h.aciertos * 50, 0) + vistos * 20 });
});
app.get('/api/lecciones/:id/analitica', req('profesor'), (r, s) => {
  const l = leccionDe(r.u, r.params.id);
  if (!l || l.profesor_id !== r.u.id) return s.status(404).json({ error: 'Clase no encontrada' });
  s.json(analiticaLeccion(l));
});
app.get('/api/cursos/:id/analitica', req('profesor'), (r, s) => {
  const c = uno('SELECT * FROM cursos WHERE id=? AND profesor_id=?', r.params.id, r.u.id);
  if (!c) return s.status(404).json({ error: 'Curso no encontrado' });
  s.json(analiticaCurso(c));
});

// ---------- estaticos ----------
app.use('/media', express.static(join(DATA, 'media'), { maxAge: '7d', immutable: true }));
// emojis animados de Noto: se bajan una vez y quedan en cache local (el wifi del evento falla)
app.get('/emoji/:cod', async (r, s) => {
  const cod = String(r.params.cod).replace(/[^0-9a-f_]/gi, '').toLowerCase().slice(0, 60);
  const archivo = join(DATA, 'media', 'emoji', cod + '.webp');
  const svg = archivo.replace(/\.webp$/, '.svg');
  s.set('cache-control', 'public, max-age=604800');
  if (existsSync(archivo)) return s.type('image/webp').send(readFileSync(archivo));
  if (existsSync(svg)) return s.type('image/svg+xml').send(readFileSync(svg));
  const variantes = [...new Set([cod, cod.replace(/_fe0f/g, ''), cod.split('_')[0]])];
  for (const [tipo, url, dest] of variantes.flatMap((c) => [['image/webp', `https://fonts.gstatic.com/s/e/notoemoji/latest/${c}/512.webp`, archivo], ['image/svg+xml', `https://fonts.gstatic.com/s/e/notoemoji/latest/${c}/emoji.svg`, svg]])) {
    try {
      const x = await fetch(url);
      if (x.ok) { const b = Buffer.from(await x.arrayBuffer()); writeFileSync(dest, b); return s.type(tipo).send(b); }
    } catch {}
  }
  s.status(404).end();
});
const dist = join(RAIZ, 'web', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api|media|emoji).*/, (_r, s) => s.sendFile(join(dist, 'index.html')));
}

app.listen(PORT, HOST, () => { console.log(`Mathtrix en http://${HOST}:${PORT}`); precalentar(); });
