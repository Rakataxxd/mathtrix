// Algoritmo de recomendacion tipo YouTube + estadisticas de aprendizaje por alumno.
import { uno, todos, correr, json } from './db.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; }

const SINONIMOS = {
  futbol: ['gol', 'messi', 'cristiano', 'camisola', 'cancha', 'mundial', 'balon', 'futbol'],
  autos: ['lambo', 'lamborghini', 'carro', 'auto', 'ferrari', 'km/h', 'velocidad', 'moto'],
  musica: ['peso pluma', 'bad bunny', 'concierto', 'cancion', 'musica', 'reggaeton', 'corridos', 'taylor'],
  dinero: ['millon', 'dinero', 'quetzales', 'q', 'ahorr', 'diamante', 'invert', 'negocio', 'dolar'],
  videojuegos: ['fortnite', 'minecraft', 'roblox', 'partida', 'gamer', 'free fire', 'videojuego', 'consola'],
  moda: ['tenis', 'ropa', 'moda', 'outfit', 'zapat', 'marca'],
  redes: ['tiktok', 'youtube', 'seguidores', 'influencer', 'likes', 'stream', 'viral'],
  espacio: ['nasa', 'cohete', 'marte', 'planeta', 'espacio', 'luna'],
  comida: ['pizza', 'shuco', 'pollo', 'tacos', 'comida', 'pastel'],
  anime: ['anime', 'goku', 'naruto', 'one piece'],
  deportes: ['basket', 'nba', 'lebron', 'correr', 'gimnasio', 'box'],
};

export function interesesDe(perfil) {
  const base = [...(perfil?.gustos || []), ...(perfil?.idolos || []), ...(perfil?.metas || [])].map(norm);
  const claves = new Set(base);
  for (const b of base) for (const [k, v] of Object.entries(SINONIMOS)) if (b.includes(k) || v.some((x) => b.includes(x))) { claves.add(k); v.forEach((x) => claves.add(x)); }
  return [...claves].filter((x) => x.length > 2);
}

export function recomendar(u, vids) {
  const pf = uno('SELECT respuestas, stats FROM perfiles WHERE usuario_id=?', u.id);
  const perfil = json(pf?.respuestas, {});
  const st = json(pf?.stats, {});
  const intereses = interesesDe(perfil);
  const debiles = (st.debiles || []).map(norm);
  const vistos = new Set(todos(`SELECT DISTINCT video_id FROM eventos WHERE usuario_id=? AND tipo IN ('fin','latido')`, u.id).map((x) => x.video_id));
  const comp = new Map(todos(`SELECT video_id, SUM(tipo='fin')*1.0 / MAX(1, COUNT(DISTINCT sesion)) c FROM eventos WHERE tipo IN ('play','fin') GROUP BY video_id`).map((x) => [x.video_id, x.c]));
  const dia = new Date().toISOString().slice(0, 10);
  const ahora = Date.now();
  return vids.map((v) => {
    const txt = norm(v.titulo + ' ' + v.tema + ' ' + v.etiquetas);
    const hits = intereses.filter((i) => txt.includes(i));
    const match = Math.min(1, hits.length / 2);
    const need = debiles.some((d) => txt.includes(d)) ? 1 : 0;
    const calidad = Math.min(1, ((v.likes || 0) + 1) / ((v.vistas || 0) / 3 + 2)) * 0.6 + Math.min(1, comp.get(v.id) || 0) * 0.4;
    const horas = (ahora - new Date(v.creado + 'Z').getTime()) / 36e5;
    const fresco = Math.exp(-Math.max(0, horas) / 72);
    const explora = hash(v.id + dia + u.id);
    const propio = v.autor_id === u.id ? 0.08 : 0;
    const score = 0.36 * match + 0.2 * need + 0.18 * calidad + 0.14 * fresco + 0.12 * explora + propio - (vistos.has(v.id) ? 0.25 : 0);
    const motivo = need ? 'Refuerza un tema que se te complica' : hits.length ? `Porque te gusta ${hits[0]}` : calidad > 0.5 ? 'Tendencia en Mathtrix' : fresco > 0.7 ? 'Nuevo' : 'Para explorar';
    return { ...v, score, motivo };
  }).sort((a, b) => b.score - a.score);
}

/** Recalcula como aprende el alumno a partir de TODA su data. */
export function actualizarStats(uid) {
  if (!uno('SELECT 1 x FROM perfiles WHERE usuario_id=?', uid)) return;
  const intentos = todos('SELECT i.puntaje, v.tema, v.estilo FROM intentos i JOIN videos v ON v.id=i.video_id WHERE i.usuario_id=?', uid);
  const porTema = {}, porEstilo = {};
  for (const i of intentos) {
    (porTema[i.tema] ||= []).push(i.puntaje);
    if (i.estilo) (porEstilo[i.estilo] ||= []).push(i.puntaje);
  }
  const prom = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const temas = Object.fromEntries(Object.entries(porTema).map(([k, v]) => [k, +prom(v).toFixed(2)]));
  const estilos = Object.fromEntries(Object.entries(porEstilo).map(([k, v]) => [k, +prom(v).toFixed(2)]));
  const mejorEstilo = Object.entries(estilos).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const trabas = todos(`SELECT escena_tipo, COUNT(*) n FROM eventos WHERE usuario_id=? AND tipo IN ('pausa','rebobinar') AND escena_tipo IS NOT NULL GROUP BY escena_tipo ORDER BY n DESC LIMIT 2`, uid);
  const ses = uno(`SELECT COUNT(DISTINCT CASE WHEN tipo='play' THEN sesion END) p, COUNT(DISTINCT CASE WHEN tipo='fin' THEN sesion END) f FROM eventos WHERE usuario_id=?`, uid);
  const latidos = uno(`SELECT COUNT(*) n FROM eventos WHERE usuario_id=? AND tipo='latido'`, uid).n;
  const stats = {
    temas, estilos, mejorEstilo,
    debiles: Object.entries(temas).filter(([, v]) => v < 0.6).map(([k]) => k),
    fuertes: Object.entries(temas).filter(([, v]) => v >= 0.8).map(([k]) => k),
    rebobina: trabas.map((t) => t.escena_tipo),
    completa: ses.p ? Math.min(1, ses.f / ses.p) : null,
    minutos: Math.round(latidos * 5 / 60),
    promedio: intentos.length ? +prom(intentos.map((i) => i.puntaje)).toFixed(2) : null,
    intentos: intentos.length,
  };
  correr('UPDATE perfiles SET stats=? WHERE usuario_id=?', JSON.stringify(stats), uid);
  return stats;
}
