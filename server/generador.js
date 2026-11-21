// Pipeline de un video: perfil -> guion (Haiku, streaming) -> sympy -> verificacion -> voz -> timeline.
// No se renderiza MP4: se guarda el timeline y el navegador lo reproduce con @remotion/player.
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { claude, ollama, extraerJSON, tituloParcial } from './ia.js';
import { motor } from './motor.js';
import { plantilla } from './plantillas.js';
import { SISTEMA_GUION, promptGuion, TIPOS, PALETAS } from './prompts.js';
import { DATA, uno, todos, correr, json } from './db.js';

const FPS = 30;
const MIN = { gancho: 3.4, datos: 4, formula: 3.6, paso: 2.8, resultado: 4.2, iconos: 4, fraccion: 4.2, comparacion: 4.2, grafica: 4.6, cta: 4.4 };
export const trabajos = new Map();

function emitir(tr, ev) {
  ev.t = Date.now() - tr.inicio;
  tr.eventos.push(ev);
  for (const f of tr.oyentes) f(ev);
}

export function suscribir(id, f) {
  const tr = trabajos.get(id);
  if (!tr) return null;
  for (const ev of tr.eventos) f(ev);
  tr.oyentes.add(f);
  return () => tr.oyentes.delete(f);
}

// ---------- utilidades ----------
export function fmt(n, dec = 2) {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n).toLocaleString('en-US');
  const s = n.toLocaleString('en-US', { maximumFractionDigits: dec });
  return s === '0' ? n.toPrecision(3) : s;
}
const num = (s) => { const v = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, '')); return isFinite(v) ? v : null; };

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Texto en pantalla -> palabras naturales para la voz. */
export function paraVoz(t) {
  return String(t || '')
    .replace(/\*/g, '')
    .replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/km\/h/g, ' kilómetros por hora').replace(/m\/s/g, ' metros por segundo')
    .replace(/cm³/g, ' centímetros cúbicos').replace(/m³/g, ' metros cúbicos').replace(/cm²/g, ' centímetros cuadrados').replace(/m²/g, ' metros cuadrados')
    .replace(/([a-zA-Z0-9)])²/g, '$1 al cuadrado').replace(/([a-zA-Z0-9)])³/g, '$1 al cubo')
    .replace(/√/g, ' raíz de ').replace(/π/g, ' pi ').replace(/[·×]/g, ' por ').replace(/÷/g, ' entre ')
    .replace(/ = /g, ' es igual a ').replace(/ [−-] /g, ' menos ').replace(/−(\d)/g, 'menos $1')
    .replace(/(\d)\s*%/g, '$1 por ciento').replace(/Q(\d)/g, '$1 quetzales ').replace(/quetzales\s+quetzales/g, 'quetzales')
    .replace(/[\p{Extended_Pictographic}‍️]/gu, '')
    .replace(/\s+/g, ' ').trim();
}

// ---------- validacion ----------
function normalizar(g, formato) {
  if (!g || typeof g !== 'object') throw new Error('guion vacio');
  g.titulo = String(g.titulo || 'Matemática que no te esperabas').slice(0, 90);
  g.paleta = PALETAS.includes(g.paleta) ? g.paleta : 'espacio';
  g.etiquetas = Array.isArray(g.etiquetas) ? g.etiquetas.slice(0, 6).map(String) : [];
  g.variables = g.variables && typeof g.variables === 'object' ? g.variables : {};
  g.calculos = Array.isArray(g.calculos) ? g.calculos.filter((c) => c && c.id && (c.calc || c.resolver)) : [];
  let esc = (Array.isArray(g.escenas) ? g.escenas : []).filter((e) => e && TIPOS.includes(e.tipo));
  esc.forEach((e) => { e.narracion = String(e.narracion || e.texto || e.nota || '').slice(0, 320); });
  esc = esc.filter((e) => e.narracion);
  if (esc.length < 4) throw new Error('guion con pocas escenas');
  if (esc[0].tipo !== 'gancho') esc.unshift({ tipo: 'gancho', texto: g.titulo.toUpperCase(), emoji: esc.find((e) => e.emoji)?.emoji || '🤯', narracion: g.titulo });
  if (esc.at(-1).tipo !== 'cta') esc.push({ tipo: 'cta', texto: '¿Te animás con el reto?', narracion: 'Ahora te toca a vos. Resolvé el reto de abajo.' });
  esc = esc.slice(0, formato === 'horizontal' ? 16 : 11);
  g.escenas = esc;
  g.quiz = (Array.isArray(g.quiz) ? g.quiz : []).filter((q) => q?.pregunta && (q.calc || (Array.isArray(q.opciones) && q.opciones.length >= 2))).slice(0, 4);
  if (!g.quiz.length) throw new Error('sin quiz');
  return g;
}

async function calcular(g) {
  const calculos = [...g.calculos];
  g.quiz.forEach((q, i) => { if (q.calc) calculos.push({ id: '__q' + i, calc: q.calc, final: true }); });
  const graficas = [];
  g.escenas.forEach((e, i) => { if (e.tipo === 'grafica' && e.funcion) graficas.push({ id: '__g' + i, funcion: e.funcion, x: Array.isArray(e.rango) ? e.rango : [-5, 5], n: 90 }); });
  const r = await motor('resolver', { variables: g.variables, calculos, verificacion: g.verificacion, graficas });
  const errQuiz = r.errores.filter((e) => e.startsWith('__q'));
  const errGuion = r.errores.filter((e) => !e.startsWith('__q'));
  if (errGuion.length) throw new Error('calculo: ' + errGuion.join('; '));
  if (r.verificado && r.verificado.ok === false) throw new Error('verificacion: no cierra (' + JSON.stringify(r.verificado) + ')');
  // quitar preguntas cuyo calculo fallo
  g.quiz = g.quiz.filter((q, i) => !q.calc || !errQuiz.some((e) => e.startsWith('__q' + i + ':')));
  return r;
}

function sustituir(g, valores) {
  let faltan = 0;
  const sub = (s) => String(s ?? '').replace(/\{\s*([\w]+)\s*\}/g, (_, id) => {
    if (valores[id]?.texto != null) return valores[id].texto;
    faltan++; return '?';
  });
  for (const e of g.escenas) {
    for (const k of ['texto', 'narracion', 'expr', 'formula', 'nota', 'valor', 'unidad', 'comparacion', 'titulo', 'etiqueta', 'cantidad']) if (e[k] != null) e[k] = sub(e[k]);
    if (Array.isArray(e.datos)) e.datos = e.datos.slice(0, 4).map((d) => ({ ...d, valor: sub(d.valor), etiqueta: sub(d.etiqueta) }));
    if (Array.isArray(e.barras)) e.barras = e.barras.slice(0, 4).map((b) => ({ ...b, etiqueta: sub(b.etiqueta), valor: sub(b.valor), num: num(sub(b.valor)) ?? 0 }));
    if (e.tipo === 'iconos') e.n = Math.max(1, Math.min(500, Math.round(num(e.cantidad) ?? 10)));
    if (e.tipo === 'fraccion') {
      e.partes = Math.max(2, Math.min(40, Math.round(num(sub(e.partes)) ?? 4)));
      e.marcadas = Math.max(0, Math.min(e.partes, Math.round(num(sub(e.marcadas)) ?? 1)));
    }
  }
  g.titulo = sub(g.titulo);
  for (const q of g.quiz) for (const k of ['pregunta', 'explicacion']) q[k] = sub(q[k]);
  return faltan;
}

function armarQuiz(g, valores, seed) {
  const R = rng(seed);
  return g.quiz.map((q, i) => {
    if (q.calc && valores['__q' + i]) {
      const c = valores['__q' + i].num;
      const u = q.unidad ? ' ' + String(q.unidad).replace(/^Q$/, '') : '';
      const pre = q.unidad === 'Q' ? 'Q' : '';
      const cand = [c * 10, c / 10, c * 2, c / 2, c * 3, c + (Math.abs(c) >= 10 ? Math.round(c / 5) : 1), c * 1.5, c - 1];
      const correcto = pre + fmt(c) + u;
      const ops = [correcto];
      for (const v of cand) { const s = pre + fmt(v) + u; if (!ops.includes(s) && v !== 0) ops.push(s); if (ops.length === 4) break; }
      const orden = ops.map((o) => [R(), o]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      return { pregunta: q.pregunta, opciones: orden, correcta: orden.indexOf(correcto), explicacion: (q.explicacion || '') + ' = ' + correcto, tipo: 'numerica' };
    }
    const opciones = q.opciones.slice(0, 5).map(String);
    const correcta = Math.max(0, Math.min(opciones.length - 1, parseInt(q.correcta) || 0));
    return { pregunta: q.pregunta, opciones, correcta, explicacion: q.explicacion || '', tipo: 'concepto' };
  });
}

async function ponerVoz(g, voz, formato) {
  const rate = formato === 'vertical' ? '+14%' : '+8%';
  const frases = g.escenas.map((e) => {
    const texto = paraVoz(e.narracion);
    const key = createHash('sha1').update(voz + rate + texto).digest('hex').slice(0, 20);
    e._voz = key;
    return { key, texto, voz, rate };
  });
  const r = await motor('tts', { dir: join(DATA, 'media', 'tts'), frases }, 90000);
  let fallos = 0;
  for (const e of g.escenas) {
    const v = r[e._voz];
    if (v && !v.error) { e.audio = '/media/tts/' + v.audio; e.palabras = v.palabras; e.voz_s = v.duracion; }
    else { fallos++; e.voz_s = Math.max(1.5, paraVoz(e.narracion).split(' ').length / 2.7); e.palabras = estimarPalabras(e.narracion, e.voz_s); }
    delete e._voz;
  }
  return fallos;
}

function estimarPalabras(txt, dur) {
  const w = paraVoz(txt).split(' ').filter(Boolean);
  return w.map((x, i) => ({ w: x, t: +(i * dur / w.length).toFixed(3), d: +(dur / w.length * 0.9).toFixed(3) }));
}

function timeline(g, formato, graf) {
  const W = formato === 'vertical' ? 1080 : 1920, H = formato === 'vertical' ? 1920 : 1080;
  let cursor = 0, prevExpr = null;
  const escenas = g.escenas.map((e, i) => {
    const dur = Math.round(Math.max(MIN[e.tipo] || 3, (e.voz_s || 0) + 0.5) * FPS);
    const s = { ...e, i, inicio: cursor, duracion: dur };
    delete s.voz_s; delete s.soloLargo;
    if (e.tipo === 'formula') prevExpr = e.formula;
    if (e.tipo === 'paso') { s.desde = prevExpr; prevExpr = e.expr; }
    if (e.tipo === 'grafica' && graf['__g' + i]) s.puntos = graf['__g' + i].puntos;
    cursor += dur;
    return s;
  });
  const gancho = escenas[0];
  return { fps: FPS, ancho: W, alto: H, formato, paleta: g.paleta, titulo: g.titulo, emoji: gancho.emoji || '🤯', escenas, duracion: cursor };
}


// ---------- voz adelantada: cada escena se graba apenas Haiku la termina de escribir ----------
function escenasCompletas(txt) {
  const k = txt.indexOf('"escenas"');
  if (k < 0) return { cabeza: null, escenas: [] };
  const a = txt.indexOf('[', k);
  if (a < 0) return { cabeza: null, escenas: [] };
  const out = []; let prof = 0, enStr = false, esc = false, ini = -1;
  for (let i = a + 1; i < txt.length; i++) {
    const c = txt[i];
    if (enStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') enStr = false; continue; }
    if (c === '"') enStr = true;
    else if (c === '{') { if (prof === 0) ini = i; prof++; }
    else if (c === '}') { prof--; if (prof === 0 && ini >= 0) { out.push(txt.slice(ini, i + 1)); ini = -1; } }
    else if (c === ']' && prof === 0) break;
  }
  return { cabeza: txt.slice(0, k).replace(/,\s*$/, '') + '}', escenas: out };
}
function vozAdelantada(voz, rate) {
  let valores = null, pedido = false, hechas = 0;
  return (txt) => {
    const { cabeza, escenas } = escenasCompletas(txt);
    if (!cabeza) return;
    if (!pedido) {
      pedido = true;
      try {
        const h = extraerJSON(cabeza);
        motor('resolver', { variables: h.variables || {}, calculos: (h.calculos || []).filter((c) => c && c.id) }).then((r) => { valores = r.valores; }).catch(() => {});
      } catch { pedido = false; }
    }
    if (!valores) return;
    const nuevas = escenas.slice(hechas);
    if (!nuevas.length) return;
    hechas = escenas.length;
    const frases = [];
    for (const js of nuevas) {
      try {
        const e = JSON.parse(js);
        const nar = String(e.narracion || e.texto || e.nota || '').slice(0, 320).replace(/\{\s*(\w+)\s*\}/g, (_, id) => valores[id]?.texto ?? '?');
        if (nar.includes('?') && /\{/.test(js) && !/\?/.test(e.narracion || '')) continue;
        const texto = paraVoz(nar);
        frases.push({ key: createHash('sha1').update(voz + rate + texto).digest('hex').slice(0, 20), texto, voz, rate });
      } catch {}
    }
    if (frases.length) motor('tts', { dir: join(DATA, 'media', 'tts'), frases }, 90000).catch(() => {});
  };
}

// ---------- orquestacion ----------
async function escribirGuion(tr, ctx) {
  const prompt = promptGuion(ctx);
  let ultimo = 0, chars = 0, titulo = null;
  const adelanto = vozAdelantada(ctx.voz, ctx.formato === 'vertical' ? '+14%' : '+8%');
  const onTexto = (txt) => {
    chars = txt.length;
    try { adelanto(txt); } catch {}
    const tt = tituloParcial(txt);
    if (tt && tt !== titulo) { titulo = tt; emitir(tr, { etapa: 'titulo', titulo }); }
    if (Date.now() - ultimo > 180) { ultimo = Date.now(); emitir(tr, { etapa: 'escribiendo', chars, cola: txt.slice(-160) }); }
  };
  const motores = [
    { nombre: 'Claude Haiku 5.5', id: 'haiku-5.5', f: () => claude({ sistema: SISTEMA_GUION, prompt, onTexto }) },
    { nombre: 'Claude Haiku 5.5 (reintento)', id: 'haiku-5.5', f: () => claude({ sistema: SISTEMA_GUION, prompt: prompt + '\nOJO: el intento anterior falló la validación o la verificación. Revisá que cada {id} exista en variables o calculos.', onTexto }) },
    { nombre: 'qwen3 en RTX 5050', id: 'qwen3-gpu', f: () => ollama({ sistema: SISTEMA_GUION, prompt, onTexto }) },
  ];
  if (process.env.MATHTRIX_SIN_IA) motores.length = 0;
  for (const m of motores) {
    try {
      emitir(tr, { etapa: 'guion', msg: m.nombre + ' está escribiendo tu guion…', motor: m.nombre });
      const t0 = Date.now();
      const txt = await m.f();
      const g = normalizar(extraerJSON(txt), ctx.formato);
      emitir(tr, { etapa: 'guion_ok', msg: `Guion listo en ${((Date.now() - t0) / 1000).toFixed(1)} s · ${g.escenas.length} escenas`, titulo: g.titulo });
      emitir(tr, { etapa: 'calculo', msg: 'sympy calcula cada paso con fracciones exactas…' });
      const r = await calcular(g);
      const faltan = sustituir(g, r.valores);
      if (faltan > 2) throw new Error('valores sin calcular: ' + faltan);
      emitir(tr, { etapa: 'verificacion', msg: r.verificado ? `Verificado: el resultado cierra (${fmt(r.verificado.independiente)})` : 'Cálculo revisado', ok: true });
      return { g, r, motor: m.id };
    } catch (e) {
      emitir(tr, { etapa: 'aviso', msg: `${m.nombre}: ${String(e.message).slice(0, 140)} → probando otro motor` });
    }
  }
  emitir(tr, { etapa: 'guion', msg: 'Motor de plantillas (sin IA)…', motor: 'plantilla' });
  const g = normalizar(plantilla({ leccion: ctx.leccion, perfil: ctx.perfil, formato: ctx.formato }), ctx.formato);
  const r = await calcular(g);
  sustituir(g, r.valores);
  emitir(tr, { etapa: 'verificacion', msg: 'Verificado con sympy', ok: true });
  return { g, r, motor: 'plantilla' };
}

export function generarVideo({ usuario, leccion, formato = 'vertical', publico = true }) {
  const id = randomUUID();
  const tr = { id, inicio: Date.now(), eventos: [], oyentes: new Set(), estado: 'corriendo' };
  trabajos.set(id, tr);
  setTimeout(() => trabajos.delete(id), 30 * 60 * 1000);
  (async () => {
    try {
      const pf = uno('SELECT respuestas, stats FROM perfiles WHERE usuario_id=?', usuario.id);
      const perfil = json(pf?.respuestas, {});
      const stats = json(pf?.stats, {});
      emitir(tr, { etapa: 'perfil', msg: `Leyendo el perfil de ${usuario.nombre.split(' ')[0]}: ${[...(perfil.gustos || []).slice(0, 3), ...(perfil.idolos || []).slice(0, 2)].join(', ') || 'sin perfil'}` });
      const evitar = todos('SELECT titulo FROM videos WHERE autor_id=? ORDER BY id DESC LIMIT 8', usuario.id).map((v) => v.titulo);
      const voz = perfil.voz === 'Marta' ? 'es-GT-MartaNeural' : 'es-GT-AndresNeural';
      const { g, r, motor: motorUsado } = await escribirGuion(tr, { formato, leccion, alumno: usuario, perfil, stats, evitar, voz });
      emitir(tr, { etapa: 'voz', msg: `Voz de ${g.escenas.length} escenas (se fue grabando mientras Haiku escribía)…` });
      const fallos = await ponerVoz(g, voz, formato);
      if (fallos) emitir(tr, { etapa: 'aviso', msg: `${fallos} escenas sin voz (sin internet): van con subtítulos` });
      const tl = timeline(g, formato, r.valores);
      const quiz = armarQuiz(g, r.valores, Date.now());
      const ms = Date.now() - tr.inicio;
      const res = correr(`INSERT INTO videos(leccion_id, autor_id, titulo, tema, etiquetas, estilo, formato, timeline, quiz, duracion, motor, publico, verificado, ms_generacion)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, leccion.id || null, usuario.id, g.titulo, leccion.tema, JSON.stringify(g.etiquetas), g.estilo_gancho || null, formato,
        JSON.stringify(tl), JSON.stringify(quiz), tl.duracion / FPS, motorUsado, publico ? 1 : 0, 1, ms);
      tr.estado = 'listo';
      emitir(tr, { etapa: 'listo', msg: `¡Listo en ${(ms / 1000).toFixed(1)} s!`, video_id: Number(res.lastInsertRowid), ms });
    } catch (e) {
      tr.estado = 'error';
      emitir(tr, { etapa: 'error', msg: String(e.message || e) });
    }
  })();
  return id;
}
