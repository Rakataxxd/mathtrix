// Videos demo con pregunta interactiva, uno por plantilla visual. Borra los videos de la cuenta de prueba t@t.
import { uno, todos, correr } from '../server/db.js';
import { generarVideo, suscribir } from '../server/generador.js';

const t = uno("SELECT id FROM usuarios WHERE email='t@t'");
if (t) { correr('DELETE FROM videos WHERE autor_id=?', t.id); correr('DELETE FROM usuarios WHERE id=?', t.id); }
const diego = uno("SELECT * FROM usuarios WHERE email='diego@demo.gt'");
const sofi = uno("SELECT * FROM usuarios WHERE email='sofi@demo.gt'");
const L = todos('SELECT * FROM lecciones WHERE curso_id=(SELECT id FROM cursos WHERE codigo=?) ORDER BY orden', 'MTX-3B0A');
const datos = (l) => ({ id: l.id, titulo: l.titulo, tema: l.tema, objetivo: l.objetivo, ejercicio: l.ejercicio, prompt: l.prompt });
const PEDIDOS = [
  [diego, L[1], 'vertical', 'tiza'], [sofi, L[3], 'vertical', 'cuaderno'], [diego, L[0], 'vertical', 'blueprint'],
  [sofi, L[2], 'vertical', 'neon'], [diego, L[2], 'horizontal', 'manim'], [sofi, L[0], 'horizontal', 'ilustrado'],
];
const esperar = (id, etiqueta) => new Promise((res) => suscribir(id, (ev) => {
  if (ev.etapa === 'listo') { console.log('✓', etiqueta, ev.video_id, (ev.ms / 1000).toFixed(1) + 's'); res(); }
  if (ev.etapa === 'error') { console.log('✗', etiqueta, ev.msg); res(); }
}));
for (let i = 0; i < PEDIDOS.length; i += 3) {
  await Promise.all(PEDIDOS.slice(i, i + 3).map(([u, l, f, e]) => esperar(generarVideo({ usuario: u, leccion: datos(l), formato: f, estilo: e }), `${u.nombre} ${l.titulo} ${f} ${e}`)));
}
const conPreg = todos("SELECT id, titulo FROM videos WHERE timeline LIKE '%\"pregunta\"%' ORDER BY id DESC LIMIT 6");
console.log('con pregunta:', conPreg.map((v) => v.id).join(', '));
process.exit(0);
