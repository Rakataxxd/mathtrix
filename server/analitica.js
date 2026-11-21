// Analitica para el profesor: donde se quedan, donde pausan/rebobinan y si comprendieron.
import { uno, todos, json } from './db.js';

const NOMBRE_ESCENA = { gancho: 'Gancho', datos: 'Datos del problema', formula: 'Fórmula', paso: 'Pasos de resolución', resultado: 'Resultado', iconos: 'Visualización', fraccion: 'Fracción visual', comparacion: 'Comparación', grafica: 'Gráfica', cta: 'Reto final' };

function sesionesDe(videoIds) {
  if (!videoIds.length) return [];
  const ph = videoIds.map(() => '?').join(',');
  return todos(`SELECT e.sesion, e.usuario_id, e.video_id, MAX(e.t) tmax, SUM(e.tipo='pausa') pausas, SUM(e.tipo='rebobinar') rebob, SUM(e.tipo='fin') fin, SUM(e.tipo='latido') lat, v.duracion
    FROM eventos e JOIN videos v ON v.id=e.video_id WHERE e.video_id IN (${ph}) AND e.sesion IS NOT NULL GROUP BY e.sesion`, ...videoIds);
}

export function analiticaLeccion(l) {
  const alumnos = todos('SELECT u.id, u.nombre, u.color FROM inscripciones i JOIN usuarios u ON u.id=i.alumno_id WHERE i.curso_id=? ORDER BY u.nombre', l.curso_id);
  const videos = todos('SELECT id, autor_id, titulo, formato, duracion, estilo, timeline, ms_generacion, motor FROM videos WHERE leccion_id=?', l.id);
  const ids = videos.map((v) => v.id);
  const ses = sesionesDe(ids);
  const ph = ids.map(() => '?').join(',') || 'NULL';
  const intentos = ids.length ? todos(`SELECT i.*, u.nombre FROM intentos i JOIN usuarios u ON u.id=i.usuario_id WHERE i.video_id IN (${ph}) ORDER BY i.id`, ...ids) : [];

  // retencion: % de sesiones que llegan a cada punto del video (normalizado 0-100 %)
  const retencion = [];
  for (let p = 0; p <= 100; p += 5) {
    const n = ses.filter((s) => s.fin > 0 || (s.tmax || 0) / (s.duracion || 1) * 100 >= p).length;
    retencion.push({ p, v: ses.length ? Math.round(n / ses.length * 100) : 0 });
  }
  // donde pausan y rebobinan (por tipo de escena)
  const trabas = ids.length ? todos(`SELECT escena_tipo, SUM(tipo='pausa') pausas, SUM(tipo='rebobinar') rebobinar, SUM(tipo='salto') saltos FROM eventos WHERE video_id IN (${ph}) AND escena_tipo IS NOT NULL GROUP BY escena_tipo`, ...ids)
    .map((t) => ({ ...t, nombre: NOMBRE_ESCENA[t.escena_tipo] || t.escena_tipo })).sort((a, b) => (b.pausas + b.rebobinar) - (a.pausas + a.rebobinar)) : [];
  // abandono: en que escena se va la gente que no termina
  const abandono = {};
  for (const s of ses.filter((x) => !x.fin)) {
    const v = videos.find((x) => x.id === s.video_id); const tl = json(v?.timeline, {});
    const f = (s.tmax || 0) * (tl.fps || 30);
    const esc = tl.escenas?.find((e) => f >= e.inicio && f < e.inicio + e.duracion);
    if (esc) abandono[esc.tipo] = (abandono[esc.tipo] || 0) + 1;
  }
  // quiz
  const ultimoPorAlumno = new Map();
  for (const i of intentos) ultimoPorAlumno.set(i.usuario_id, i);
  const preguntas = { numerica: [0, 0], concepto: [0, 0] };
  for (const i of ultimoPorAlumno.values()) for (const d of json(i.respuestas, [])) { const k = d.tipo === 'concepto' ? 'concepto' : 'numerica'; preguntas[k][1]++; if (d.ok) preguntas[k][0]++; }
  const distrib = [0, 0, 0, 0];
  for (const i of ultimoPorAlumno.values()) distrib[Math.min(3, Math.round((i.puntaje || 0) * 3))]++;

  const filas = alumnos.map((a) => {
    const vs = videos.filter((v) => v.autor_id === a.id);
    const ss = ses.filter((s) => s.usuario_id === a.id);
    const it = ultimoPorAlumno.get(a.id);
    const visto = ss.length ? Math.round(Math.max(...ss.map((s) => (s.fin ? 1 : Math.min(1, (s.tmax || 0) / (s.duracion || 1))))) * 100) : 0;
    const pf = json(uno('SELECT respuestas, stats FROM perfiles WHERE usuario_id=?', a.id)?.respuestas, {});
    const st = json(uno('SELECT stats FROM perfiles WHERE usuario_id=?', a.id)?.stats, {});
    const estado = !vs.length ? 'sin_video' : it ? (it.puntaje >= 0.6 ? 'comprendio' : 'reforzar') : visto >= 90 ? 'vio' : 'viendo';
    return {
      ...a, videos: vs.length, video_id: vs[0]?.id, gancho: vs[0]?.titulo, visto, pausas: ss.reduce((x, s) => x + s.pausas, 0), rebobinadas: ss.reduce((x, s) => x + s.rebob, 0),
      minutos: +(ss.reduce((x, s) => x + s.lat, 0) * 5 / 60).toFixed(1), puntaje: it ? Math.round(it.puntaje * 100) : null, aciertos: it?.aciertos, total: it?.total,
      intentos: intentos.filter((i) => i.usuario_id === a.id).length, estado, aprende: pf.aprende || [], mejorEstilo: st.mejorEstilo, traba: st.rebobina?.[0] ? NOMBRE_ESCENA[st.rebobina[0]] : null,
    };
  });

  const conVideo = filas.filter((f) => f.videos);
  const resumen = {
    alumnos: alumnos.length, con_video: conVideo.length, videos: videos.length,
    terminaron: ses.length ? Math.round(ses.filter((s) => s.fin).length / ses.length * 100) : 0,
    promedio: ultimoPorAlumno.size ? Math.round([...ultimoPorAlumno.values()].reduce((x, i) => x + i.puntaje, 0) / ultimoPorAlumno.size * 100) : null,
    comprendieron: filas.filter((f) => f.estado === 'comprendio').length,
    gen_s: videos.length ? +(videos.reduce((x, v) => x + (v.ms_generacion || 0), 0) / videos.length / 1000).toFixed(1) : null,
  };
  // conclusiones automaticas para el profe
  const ins = [];
  if (trabas[0] && trabas[0].pausas + trabas[0].rebobinar > 0) ins.push({ tipo: 'traba', txt: `La mayoría se traba en «${trabas[0].nombre}»: ${trabas[0].pausas} pausas y ${trabas[0].rebobinar} rebobinadas. Conviene reforzarlo en clase.` });
  const ab = Object.entries(abandono).sort((a, b) => b[1] - a[1])[0];
  if (ab) ins.push({ tipo: 'abandono', txt: `${ab[1]} alumno(s) dejaron el video en «${NOMBRE_ESCENA[ab[0]] || ab[0]}».` });
  if (preguntas.numerica[1] && preguntas.concepto[1]) {
    const pn = preguntas.numerica[0] / preguntas.numerica[1], pc = preguntas.concepto[0] / preguntas.concepto[1];
    ins.push({ tipo: 'quiz', txt: Math.abs(pn - pc) < 0.1 ? `Rinden parejo en cálculo (${Math.round(pn * 100)} %) y en conceptos (${Math.round(pc * 100)} %).` : pn < pc ? `Entienden la idea (${Math.round(pc * 100)} % en conceptos) pero fallan al calcular (${Math.round(pn * 100)} %). Practiquen operaciones.` : `Calculan bien (${Math.round(pn * 100)} %) pero cuesta el concepto (${Math.round(pc * 100)} %). Expliquen el porqué.` });
  }
  const reforzar = filas.filter((f) => f.estado === 'reforzar').map((f) => f.nombre.split(' ')[0]);
  if (reforzar.length) ins.push({ tipo: 'alumnos', txt: `Necesitan refuerzo: ${reforzar.slice(0, 6).join(', ')}${reforzar.length > 6 ? '…' : ''}.` });
  const sin = filas.filter((f) => f.estado === 'sin_video').length;
  if (sin) ins.push({ tipo: 'pendiente', txt: `${sin} alumno(s) todavía no generan su video.` });
  const estilos = {};
  for (const v of videos) { const it = ultimoPorAlumno.get(v.autor_id); if (it && v.estilo) (estilos[v.estilo] ||= []).push(it.puntaje); }
  const mejor = Object.entries(estilos).map(([k, a]) => [k, a.reduce((x, y) => x + y, 0) / a.length]).sort((a, b) => b[1] - a[1])[0];
  if (mejor) ins.push({ tipo: 'estilo', txt: `Los ganchos de estilo «${mejor[0]}» dan mejores resultados en el test (${Math.round(mejor[1] * 100)} %).` });

  return { leccion: { id: l.id, titulo: l.titulo, tema: l.tema }, resumen, retencion, trabas, abandono, preguntas, distrib, alumnos: filas, insights: ins };
}

export function analiticaCurso(c) {
  const lecciones = todos('SELECT * FROM lecciones WHERE curso_id=? ORDER BY orden, id', c.id).map((l) => {
    const a = analiticaLeccion({ ...l, curso_id: c.id });
    return { id: l.id, titulo: l.titulo, tema: l.tema, ...a.resumen };
  });
  return { curso: { id: c.id, titulo: c.titulo }, lecciones };
}
