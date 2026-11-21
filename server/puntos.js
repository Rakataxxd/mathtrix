// Puntos (XP), niveles, logros y ranking. Todo sale de la data que ya se registra; no hay tabla aparte.
import { uno, todos } from './db.js';

export const XP = { visto: 20, acierto: 50, en_video: 15, duda: 5, revision: 30, reflexion: 5, racha: 10, creado: 10 };
export const NIVELES = ['Novato', 'Aprendiz', 'Calculador', 'Estratega', 'Maestro', 'Leyenda', 'Matrix'];
const umbral = (n) => 50 * n * (n - 1); // XP total para llegar al nivel n (1: 0, 2: 100, 3: 300, 4: 600, 5: 1000…)

export function nivelDe(xp) {
  let n = 1;
  while (xp >= umbral(n + 1)) n++;
  const desde = umbral(n), hasta = umbral(n + 1);
  return { n, nombre: NIVELES[Math.min(n - 1, NIVELES.length - 1)], desde, hasta, progreso: (xp - desde) / (hasta - desde) };
}

function racha(uid) {
  const dias = todos(`SELECT DISTINCT date(creado) d FROM eventos WHERE usuario_id=? ORDER BY d DESC LIMIT 60`, uid).map((x) => x.d);
  let r = 0; const hoy = Date.now();
  for (let i = 0; i < 60; i++) { const d = new Date(hoy - i * 864e5).toISOString().slice(0, 10); if (dias.includes(d)) r++; else if (i > 0) break; }
  return r;
}

const desde = (periodo) => (periodo === 'semana' ? "datetime('now','-7 day')" : "'1970-01-01'");

/** Conteos de cada fuente de XP por usuario (uno o todos). */
function conteos(ids, periodo) {
  if (!ids.length) return new Map();
  const IN = ids.map(Number).filter(Number.isFinite).join(',');
  const f = desde(periodo);
  const m = new Map(ids.map((id) => [Number(id), { visto: 0, acierto: 0, en_video: 0, duda: 0, revision: 0, reflexion: 0, creado: 0 }]));
  const sumar = (filas, k) => { for (const x of filas) if (m.has(x.u)) m.get(x.u)[k] = x.n || 0; };
  sumar(todos(`SELECT usuario_id u, COUNT(DISTINCT video_id) n FROM eventos WHERE tipo='fin' AND usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id`), 'visto');
  // mejor intento por video: repetir el mismo test no regala puntos
  sumar(todos(`SELECT u, SUM(m) n FROM (SELECT usuario_id u, video_id, MAX(aciertos) m FROM intentos WHERE usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id, video_id) GROUP BY u`), 'acierto');
  sumar(todos(`SELECT usuario_id u, COUNT(DISTINCT video_id || ':' || escena) n FROM eventos WHERE tipo='respuesta' AND json_extract(extra,'$.ok')=1 AND usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id`), 'en_video');
  sumar(todos(`SELECT usuario_id u, MIN(COUNT(*), 30) n FROM dudas WHERE usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id`), 'duda');
  sumar(todos(`SELECT usuario_id u, COUNT(*) n FROM revisiones WHERE usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id`), 'revision');
  sumar(todos(`SELECT usuario_id u, COUNT(DISTINCT video_id) n FROM eventos WHERE tipo='reflexion' AND usuario_id IN (${IN}) AND creado >= ${f} GROUP BY usuario_id`), 'reflexion');
  sumar(todos(`SELECT autor_id u, COUNT(*) n FROM videos WHERE autor_id IN (${IN}) AND creado >= ${f} GROUP BY autor_id`), 'creado');
  return m;
}
const total = (c, r = 0) => Object.entries(XP).reduce((a, [k, v]) => a + (k === 'racha' ? r * v : (c[k] || 0) * v), 0);

export function puntosDe(uid) {
  const c = conteos([uid], 'todo').get(Number(uid));
  const sem = conteos([uid], 'semana').get(Number(uid));
  const r = racha(uid);
  const xp = total(c, r);
  const perfecto = uno('SELECT COUNT(*) n FROM intentos WHERE usuario_id=? AND total>=3 AND aciertos=total', uid).n;
  const minutos = Math.round(uno(`SELECT COUNT(*) n FROM eventos WHERE usuario_id=? AND tipo='latido'`, uid).n * 5 / 60);
  const logros = [
    { id: 'primero', emoji: '🎬', nombre: 'Primer video', desc: 'Terminaste tu primer video', ok: c.visto >= 1 },
    { id: 'perfecto', emoji: '🎯', nombre: 'Reto perfecto', desc: 'Todas bien en un reto', ok: perfecto >= 1 },
    { id: 'racha3', emoji: '🔥', nombre: 'Racha de 3', desc: '3 días seguidos aprendiendo', ok: r >= 3 },
    { id: 'curioso', emoji: '🙋', nombre: 'Curioso', desc: 'Hiciste 3 preguntas al tutor', ok: c.duda >= 3 },
    { id: 'detective', emoji: '🔍', nombre: 'Detective', desc: 'Subiste tu ejercicio para revisarlo', ok: c.revision >= 1 },
    { id: 'imparable', emoji: '🚀', nombre: 'Imparable', desc: '10 videos terminados', ok: c.visto >= 10 },
    { id: 'creador', emoji: '✨', nombre: 'Creador', desc: 'Generaste 3 videos', ok: c.creado >= 3 },
    { id: 'maraton', emoji: '⏱️', nombre: 'Maratón', desc: '30 minutos de video', ok: minutos >= 30 },
  ];
  return { xp, semana: total(sem, 0), racha: r, desglose: Object.fromEntries(Object.keys(XP).map((k) => [k, { n: k === 'racha' ? r : c[k] || 0, xp: (k === 'racha' ? r : c[k] || 0) * XP[k] }])), nivel: nivelDe(xp), logros, minutos };
}

/** Ranking de la clase (compañeros de sus cursos) o global, de la semana o de siempre. */
export function ranking(u, alcance = 'clase', periodo = 'semana') {
  let alumnos;
  if (alcance === 'global') alumnos = todos(`SELECT id, nombre, color FROM usuarios WHERE rol='alumno'`);
  else if (u.rol === 'profesor') alumnos = todos(`SELECT DISTINCT u.id, u.nombre, u.color FROM inscripciones i JOIN cursos c ON c.id=i.curso_id JOIN usuarios u ON u.id=i.alumno_id WHERE c.profesor_id=?`, u.id);
  else alumnos = todos(`SELECT DISTINCT u.id, u.nombre, u.color FROM inscripciones i JOIN inscripciones yo ON yo.curso_id=i.curso_id JOIN usuarios u ON u.id=i.alumno_id WHERE yo.alumno_id=?`, u.id);
  if (u.rol === 'alumno' && !alumnos.some((a) => a.id === u.id)) alumnos.push({ id: u.id, nombre: u.nombre, color: u.color });
  const c = conteos(alumnos.map((a) => a.id), periodo);
  const filas = alumnos.map((a) => {
    const k = c.get(a.id) || {};
    return { id: a.id, nombre: a.nombre, color: a.color, xp: total(k, periodo === 'todo' ? racha(a.id) : 0), vistos: k.visto || 0, aciertos: k.acierto || 0, yo: a.id === u.id };
  }).sort((a, b) => b.xp - a.xp || b.aciertos - a.aciertos);
  filas.forEach((f, i) => { f.pos = i + 1; f.nivel = nivelDe(f.xp).n; });
  const mia = filas.find((f) => f.yo) || null;
  return { alcance, periodo, total: filas.length, top: filas.slice(0, 20), yo: mia };
}
