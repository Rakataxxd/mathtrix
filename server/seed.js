// Datos demo: profe, alumnos, curso, clases y videos REALES generados por el pipeline.
// Los alumnos marcados demo=1 llevan eventos y tests sinteticos para que la analitica se vea con datos.
// Borrar todo: eliminar la carpeta data/.
import { randomBytes, scryptSync } from 'node:crypto';
import { db, uno, todos, correr, json } from './db.js';
import { generarVideo, suscribir } from './generador.js';
import { actualizarStats } from './recomendador.js';

const hash = (c) => { const s = randomBytes(12).toString('hex'); return s + ':' + scryptSync(c, s, 32).toString('hex'); };
const COL = ['#b6ff3b', '#ff4fd8', '#3bd1ff', '#ffb23b', '#9b7bff', '#3bffb0', '#ff6b5b'];
function usuario(rol, nombre, email, perfil, demo = 0) {
  let u = uno('SELECT * FROM usuarios WHERE email=?', email);
  if (!u) { correr('INSERT INTO usuarios(rol,nombre,email,clave,color,demo) VALUES(?,?,?,?,?,?)', rol, nombre, email, hash('mathtrix'), COL[Math.floor(Math.random() * COL.length)], demo); u = uno('SELECT * FROM usuarios WHERE email=?', email); }
  if (perfil) correr('INSERT OR REPLACE INTO perfiles(usuario_id,respuestas) VALUES(?,?)', u.id, JSON.stringify(perfil));
  return u;
}
correr("DELETE FROM usuarios WHERE email='t@t'");

const profe = usuario('profesor', 'Profa. Ana López', 'profe@demo.gt');
const diego = usuario('alumno', 'Diego Pérez', 'diego@demo.gt', { gustos: ['Autos', 'Fútbol', 'Videojuegos', 'Dinero y negocios'], idolos: ['Messi', 'Cristiano Ronaldo', 'MrBeast'], metas: ['Ser millonario', 'Comprar mi carro'], ambicion: 'Tener un Lamborghini antes de los 25 y comprarle casa a mi mamá', aprende: ['Con ejemplos visuales', 'Paso a paso y despacio'], complica: ['Ecuaciones', 'Fracciones'], grado: '1ro a 3ro básico', voz: 'Andres' });
const sofi = usuario('alumno', 'Sofía Morales', 'sofi@demo.gt', { gustos: ['Música', 'Moda y tenis', 'Redes sociales'], idolos: ['Bad Bunny', 'Karol G', 'Taylor Swift'], metas: ['Ser creador de contenido', 'Viajar por el mundo'], ambicion: 'Tener un millón de seguidores y llevar a mi familia a un concierto en Miami', aprende: ['Con historias', 'Con retos y competencia'], complica: ['Porcentajes', 'Probabilidad'], grado: '1ro a 3ro básico', voz: 'Marta' });

let curso = uno("SELECT * FROM cursos WHERE codigo='MTX-3B0A'");
if (!curso) { correr("INSERT INTO cursos(profesor_id,titulo,descripcion,grado,codigo,cnb,color) VALUES(?,?,?,?,?,1,'#b6ff3b')", profe.id, 'Matemática · 3ro Básico A', 'Unidad 3: geometría, álgebra y probabilidad', '3ro Básico', 'MTX-3B0A'); curso = uno("SELECT * FROM cursos WHERE codigo='MTX-3B0A'"); }

const LECCIONES = [
  { titulo: 'Volumen de la esfera', tema: 'Volumen de la esfera', objetivo: 'Calcular el volumen de una esfera a partir de su radio', ejercicio: 'V = 4/3 · π · r³ con r = 3 cm',
    a: { resumen: 'El alumno calcula el volumen de esferas con V = 4/3·π·r³ y entiende por qué el radio va al cubo.', conceptos: ['Esfera', 'Radio', 'Potencia al cubo', 'Unidades cúbicas'], formulas: ['V = 4/3·π·r³'], metodo: 'Sustitución directa y potencia antes de multiplicar', errores_comunes: ['Usar el diámetro en vez del radio', 'Elevar al cuadrado en vez de al cubo', 'Olvidar cm³'], ejercicio_base: 'r = 3 cm → V = 36π ≈ 113.1 cm³', nivel: 'intermedio', cnb: { area: 'Matemáticas', grado: '3ro Básico', competencia: 'Aplica modelos geométricos para resolver problemas de su entorno.', indicador: 'Calcula área y volumen de cuerpos geométricos usando fórmulas.' } } },
  { titulo: 'Ecuaciones de primer grado', tema: 'Ecuaciones lineales', objetivo: 'Despejar x en ecuaciones de la forma ax + b = c', ejercicio: '3x + 12 = 45',
    a: { resumen: 'Resolver ecuaciones lineales con transposición de términos: lo que suma pasa restando, lo que multiplica pasa dividiendo.', conceptos: ['Incógnita', 'Transposición', 'Operación inversa'], formulas: ['ax + b = c', 'x = (c − b) ÷ a'], metodo: 'Transposición de términos paso a paso', errores_comunes: ['Cambiar mal el signo', 'Dividir antes de restar'], ejercicio_base: '3x + 12 = 45 → x = 11', nivel: 'básico', cnb: { area: 'Matemáticas', grado: '3ro Básico', competencia: 'Utiliza el lenguaje algebraico para modelar situaciones.', indicador: 'Resuelve ecuaciones de primer grado con una incógnita.' } } },
  { titulo: 'Probabilidad clásica', tema: 'Probabilidad', objetivo: 'Calcular la probabilidad como casos favorables entre casos posibles', ejercicio: '',
    a: { resumen: 'Probabilidad clásica P = favorables/posibles, expresada como fracción y porcentaje.', conceptos: ['Experimento aleatorio', 'Casos favorables', 'Fracción y porcentaje'], formulas: ['P = f ÷ T'], metodo: 'Conteo de casos', errores_comunes: ['Invertir la fracción', 'Olvidar casos posibles'], ejercicio_base: 'Dado: P(6) = 1/6 ≈ 16.7 %', nivel: 'básico', cnb: { area: 'Matemáticas', grado: '3ro Básico', competencia: 'Aplica la estadística y la probabilidad en la toma de decisiones.', indicador: 'Calcula la probabilidad de eventos simples.' } } },
  { titulo: 'Porcentajes y descuentos', tema: 'Porcentajes', objetivo: 'Calcular descuentos y precios finales con porcentajes', ejercicio: '',
    a: { resumen: 'Calcular el porcentaje de una cantidad y aplicarlo en descuentos de compras reales.', conceptos: ['Porcentaje', 'Descuento', 'Precio final'], formulas: ['d = p · % ÷ 100', 'final = p − d'], metodo: 'Regla de tres y multiplicación por decimal', errores_comunes: ['Restar el porcentaje como número', 'No dividir entre 100'], ejercicio_base: 'Q800 con 25 % → Q600', nivel: 'básico', cnb: { area: 'Matemáticas', grado: '3ro Básico', competencia: 'Resuelve problemas de su entorno con razones y proporciones.', indicador: 'Aplica porcentajes en situaciones comerciales.' } } },
];
const lecs = LECCIONES.map((L, i) => {
  let l = uno('SELECT * FROM lecciones WHERE curso_id=? AND titulo=?', curso.id, L.titulo);
  if (!l) {
    correr('INSERT INTO lecciones(curso_id,titulo,tema,objetivo,ejercicio,analisis,prompt,orden) VALUES(?,?,?,?,?,?,?,?)', curso.id, L.titulo, L.tema, L.objetivo, L.ejercicio, JSON.stringify(L.a),
      `Usá ${L.a.formulas.join(' y ')}. Método: ${L.a.metodo}. Nivel ${L.a.nivel}, números sencillos. Mostrá explícitamente cómo evitar: ${L.a.errores_comunes.join('; ')}.`, i);
    l = uno('SELECT * FROM lecciones WHERE curso_id=? AND titulo=?', curso.id, L.titulo);
  }
  return l;
});

for (const u of [diego, sofi]) correr('INSERT OR IGNORE INTO inscripciones(curso_id,alumno_id) VALUES(?,?)', curso.id, u.id);
const NOMBRES = ['Andrea Gómez', 'Luis Hernández', 'Camila Ruiz', 'José Ramírez', 'Valeria Castillo', 'Kevin Ajú', 'María José Cifuentes', 'Pablo Xicay', 'Fernanda Ortiz', 'Daniel Coc'];
const GUSTOS = [['Fútbol', 'Videojuegos'], ['Música', 'Moda y tenis'], ['Anime', 'Arte y dibujo'], ['Autos', 'Dinero y negocios'], ['Redes sociales', 'Música'], ['Básquet', 'Gym'], ['Espacio', 'Tecnología'], ['Comida', 'Animales']];
const APRENDE = [['Con ejemplos visuales'], ['Paso a paso y despacio'], ['Con historias'], ['Con retos y competencia'], ['Rápido y directo']];
const sinteticos = NOMBRES.map((n, i) => {
  const u = usuario('alumno', n, `alumno${i + 1}@demo.gt`, { gustos: GUSTOS[i % GUSTOS.length], idolos: [], metas: ['Ir a la universidad'], aprende: APRENDE[i % APRENDE.length], complica: ['Ecuaciones'], grado: '1ro a 3ro básico', voz: 'Andres' }, 1);
  correr('INSERT OR IGNORE INTO inscripciones(curso_id,alumno_id) VALUES(?,?)', curso.id, u.id);
  return u;
});

function esperar(id) {
  return new Promise((res) => suscribir(id, (ev) => {
    if (ev.etapa === 'listo') { console.log('  ✓', ev.video_id, (ev.ms / 1000).toFixed(1) + 's'); res(ev.video_id); }
    if (ev.etapa === 'error') { console.log('  ✗', ev.msg); res(null); }
  }));
}
const leccionDatos = (l) => ({ id: l.id, titulo: l.titulo, tema: l.tema, objetivo: l.objetivo, ejercicio: l.ejercicio, prompt: l.prompt });
const PEDIDOS = [
  [diego, lecs[0], 'vertical'], [sofi, lecs[0], 'vertical'], [diego, lecs[1], 'horizontal'],
  [sofi, lecs[3], 'vertical'], [diego, lecs[2], 'vertical'], [sofi, lecs[2], 'horizontal'],
];
if (!uno('SELECT COUNT(*) n FROM videos').n) {
  console.log('Generando videos reales (3 en paralelo)…');
  for (let i = 0; i < PEDIDOS.length; i += 3) {
    await Promise.all(PEDIDOS.slice(i, i + 3).map(([u, l, f]) => esperar(generarVideo({ usuario: u, leccion: leccionDatos(l), formato: f }))));
  }
}

// analitica sintetica para la clase 1 (volumen): copias de los videos reales a nombre de alumnos demo
const base = todos('SELECT * FROM videos WHERE leccion_id=? ORDER BY id', lecs[0].id);
if (base.length && !uno('SELECT 1 x FROM videos v JOIN usuarios u ON u.id=v.autor_id WHERE u.demo=1')) {
  const R = (() => { let s = 42; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const ins = db.prepare('INSERT INTO eventos(usuario_id,video_id,sesion,tipo,t,escena,escena_tipo,creado) VALUES(?,?,?,?,?,?,?,datetime(\'now\', ?))');
  sinteticos.forEach((u, k) => {
    if (k === 9) return; // uno sin video: aparece como pendiente
    const b = base[k % base.length];
    const r = correr('INSERT INTO videos(leccion_id,autor_id,titulo,tema,etiquetas,estilo,formato,timeline,quiz,duracion,motor,publico,ms_generacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,0,?)',
      b.leccion_id, u.id, b.titulo, b.tema, b.etiquetas, ['fama', 'dinero', 'reto', 'absurdo'][k % 4], b.formato, b.timeline, b.quiz, b.duracion, b.motor, b.ms_generacion);
    const vid = Number(r.lastInsertRowid);
    const tl = json(b.timeline); const fps = tl.fps;
    const ses = 's' + u.id + '-' + vid;
    const off = `-${Math.round(R() * 30 + 5)} minutes`;
    ins.run(u.id, vid, ses, 'play', 0, 0, 'gancho', off);
    const abandona = k === 7 || k === 8;
    for (const e of tl.escenas) {
      const t = (e.inicio + e.duracion / 2) / fps;
      for (let x = e.inicio / fps; x < (e.inicio + e.duracion) / fps; x += 5) ins.run(u.id, vid, ses, 'latido', x, e.i, e.tipo, off);
      const pesoTraba = e.tipo === 'paso' ? 0.55 : e.tipo === 'formula' ? 0.3 : 0.06;
      if (R() < pesoTraba) ins.run(u.id, vid, ses, 'pausa', t, e.i, e.tipo, off);
      if (R() < pesoTraba * 0.7) ins.run(u.id, vid, ses, 'rebobinar', t, e.i, e.tipo, off);
      if (abandona && e.tipo === 'paso') break;
    }
    if (!abandona) {
      ins.run(u.id, vid, ses, 'fin', tl.duracion / fps, tl.escenas.length - 1, 'cta', off);
      const quiz = json(b.quiz);
      const det = quiz.map((q) => { const ok = R() < (q.tipo === 'concepto' ? 0.8 : 0.55); return { elegida: ok ? q.correcta : (q.correcta + 1) % q.opciones.length, correcta: q.correcta, ok, ms: 8000 + Math.round(R() * 20000), tipo: q.tipo }; });
      const ac = det.filter((d) => d.ok).length;
      correr('INSERT INTO intentos(video_id,usuario_id,respuestas,aciertos,total,puntaje,ms) VALUES(?,?,?,?,?,?,?)', vid, u.id, JSON.stringify(det), ac, det.length, ac / det.length, det.reduce((a, d) => a + d.ms, 0));
    }
    actualizarStats(u.id);
  });
  const coms = ['¡Jajaja lo de la cadena está buenísimo! 💎', 'No entendí por qué el radio va al cubo, ¿alguien me explica?', 'Profe, ¿podemos hacer uno con pelotas de fútbol?', 'Ya le entendí mejor que en clase 🔥'];
  base.forEach((b) => coms.forEach((c, i) => correr('INSERT INTO comentarios(video_id,usuario_id,texto) VALUES(?,?,?)', b.id, sinteticos[i].id, c)));
  base.forEach((b) => sinteticos.slice(0, 6).forEach((u) => correr('INSERT OR IGNORE INTO likes(video_id,usuario_id,valor) VALUES(?,?,1)', b.id, u.id)));
  correr('INSERT INTO comentarios(video_id,usuario_id,texto) VALUES(?,?,?)', base[0].id, profe.id, 'Excelente. Fijense que el radio va AL CUBO: ahí es donde más se equivocan.');
}
console.log('Seed listo. Cuentas (clave: mathtrix): profe@demo.gt · diego@demo.gt · sofi@demo.gt · código de clase MTX-3B0A');
process.exit(0);
