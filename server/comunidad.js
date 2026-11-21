// Comunidad: cualquiera aporta videos usando SU Claude (CLI con su suscripcion o su API key).
// El servidor reparte "tareas" (tema x personaje x formato), recibe el guion que escribio la IA del aportante,
// lo valida (sympy verifica la cuenta, filtro de contenido) y le pone voz gratis. La plataforma no paga la IA.
import { randomBytes } from 'node:crypto';
import { uno, todos, correr } from './db.js';
import { SISTEMA_GUION, promptGuion } from './prompts.js';

export const TEMAS = [
  ['Suma de fracciones', 'Sumar fracciones con distinto denominador'], ['Resta de fracciones', 'Restar fracciones con denominador común y distinto'],
  ['Multiplicación de fracciones', 'Multiplicar fracciones y simplificar'], ['División de fracciones', 'Dividir fracciones multiplicando por el recíproco'],
  ['Porcentajes', 'Calcular el porcentaje de una cantidad'], ['Descuentos', 'Aplicar un descuento porcentual a un precio'],
  ['Regla de tres', 'Proporcionalidad directa con regla de tres'], ['Proporción inversa', 'Proporcionalidad inversa'],
  ['Ecuaciones de primer grado', 'Resolver ecuaciones lineales con una incógnita'], ['Sistemas de ecuaciones', 'Sistemas de 2 ecuaciones lineales'],
  ['Teorema de Pitágoras', 'Calcular la hipotenusa o un cateto'], ['Área de figuras', 'Área de rectángulos, triángulos y círculos'],
  ['Perímetro', 'Perímetro de figuras planas'], ['Volumen', 'Volumen de prismas, cilindros y esferas'],
  ['Probabilidad', 'Probabilidad clásica: favorables entre posibles'], ['Media y mediana', 'Medidas de tendencia central'],
  ['Potencias', 'Propiedades de las potencias'], ['Raíz cuadrada', 'Raíces cuadradas exactas y aproximadas'],
  ['Notación científica', 'Escribir números grandes y pequeños en notación científica'], ['Función lineal', 'Pendiente e intersección de y = mx + b'],
  ['Velocidad', 'Velocidad = distancia ÷ tiempo'], ['Interés simple', 'Interés simple: I = C · r · t'],
  ['Conversión de unidades', 'Convertir unidades de longitud, masa y tiempo'], ['Ángulos', 'Ángulos complementarios y suplementarios'],
  ['Números enteros', 'Operaciones con números negativos'], ['Mínimo común múltiplo', 'MCM y MCD'],
];
export const PERSONAS = [
  { nombre: 'Andrea', gustos: ['fútbol'], idolos: ['Messi'], metas: ['ser futbolista'] },
  { nombre: 'Kevin', gustos: ['música urbana'], idolos: ['Bad Bunny'], metas: ['ser productor'] },
  { nombre: 'Sofía', gustos: ['videojuegos', 'Minecraft'], idolos: ['AuronPlay'], metas: ['crear videojuegos'] },
  { nombre: 'Diego', gustos: ['autos', 'motos'], idolos: ['Checo Pérez'], metas: ['tener un Lamborghini'] },
  { nombre: 'Valeria', gustos: ['moda', 'TikTok'], idolos: ['Karol G'], metas: ['ser influencer'] },
  { nombre: 'Luis', gustos: ['básquet'], idolos: ['LeBron James'], metas: ['jugar en la NBA'] },
  { nombre: 'Camila', gustos: ['anime'], idolos: ['Goku'], metas: ['dibujar manga'] },
  { nombre: 'José', gustos: ['espacio'], idolos: ['la NASA'], metas: ['ser astronauta'] },
  { nombre: 'María', gustos: ['cocina', 'repostería'], idolos: ['un chef famoso'], metas: ['abrir una pastelería'] },
  { nombre: 'Pablo', gustos: ['negocios', 'dinero'], idolos: ['Elon Musk'], metas: ['ser millonario'] },
  { nombre: 'Fernanda', gustos: ['animales'], idolos: ['un veterinario de YouTube'], metas: ['ser veterinaria'] },
  { nombre: 'Daniel', gustos: ['boxeo', 'gimnasio'], idolos: ['Canelo Álvarez'], metas: ['ser campeón'] },
];
const PLANTILLAS = ['ilustrado', 'vector', 'cinetica', 'manim', 'tiza', 'neon', 'riso', 'blueprint', 'cuaderno'];
const PROHIBIDO = /\b(put[ao]s?|mierda|verga|pendej[oa]s?|cabr[oó]n|culer[oa]|maric[oó]n|coño|chinga|follar|porno|sexo|drogas?|coca[ií]na|marihuana|alcohol|cerveza|matar|suicid)/i;

export const nuevaClave = () => 'mtxk_' + randomBytes(18).toString('base64url');

/** Clave del usuario (una por cuenta). rotar=true la cambia. */
export function claveDe(uid, rotar = false) {
  const ya = uno('SELECT clave FROM claves_api WHERE usuario_id=?', uid);
  if (ya && !rotar) return ya.clave;
  const c = nuevaClave();
  if (ya) correr('UPDATE claves_api SET clave=?, creado=datetime(\'now\') WHERE usuario_id=?', c, uid);
  else correr('INSERT INTO claves_api(clave, usuario_id) VALUES(?,?)', c, uid);
  return c;
}
export const usuarioDeClave = (c) => (c ? uno('SELECT u.* FROM claves_api k JOIN usuarios u ON u.id=k.usuario_id WHERE k.clave=?', String(c)) : null);

// reservas en memoria: dos aportantes no hacen la misma tarea a la vez
const reservas = new Map();
const limpiar = () => { const t = Date.now(); for (const [k, r] of reservas) if (r.expira < t) reservas.delete(k); };

/** Reparte las combinaciones menos cubiertas (tema x personaje), con un poco de azar. */
export function tareas(usuario, n = 5, formato = 'mixto') {
  limpiar();
  const hechas = new Map(todos('SELECT tema, persona, COUNT(*) n FROM aportes GROUP BY tema, persona').map((x) => [x.tema + '|' + x.persona, x.n]));
  const ocupadas = new Set([...reservas.values()].map((r) => r.tema + '|' + r.persona));
  const combos = [];
  TEMAS.forEach((_, ti) => PERSONAS.forEach((_, pi) => {
    const k = TEMAS[ti][0] + '|' + PERSONAS[pi].nombre;
    combos.push({ ti, pi, peso: (hechas.get(k) || 0) + (ocupadas.has(k) ? 5 : 0) + Math.random() * 0.9 });
  }));
  combos.sort((a, b) => a.peso - b.peso);
  return combos.slice(0, Math.min(20, Math.max(1, n))).map(({ ti, pi }, k) => {
    const [titulo, tema] = TEMAS[ti];
    const persona = PERSONAS[pi];
    const f = formato === 'vertical' || formato === 'horizontal' ? formato : k % 3 === 2 ? 'vertical' : 'horizontal';
    const estilo = PLANTILLAS[Math.floor(Math.random() * PLANTILLAS.length)];
    const id = randomBytes(9).toString('base64url');
    reservas.set(id, { usuario: usuario.id, tema: titulo, persona: persona.nombre, formato: f, estilo, voz: Math.random() < 0.5 ? 'Andres' : 'Marta', expira: Date.now() + 20 * 60 * 1000 });
    const prompt = promptGuion({ formato: f, leccion: { titulo, tema, objetivo: tema }, alumno: { nombre: persona.nombre }, perfil: persona, stats: {}, estilo,
      nota: 'VIDEO PARA LA COMUNIDAD (público, para cualquier estudiante de Guatemala): gancho apto para todo público, números fáciles de seguir.' });
    return { id, formato: f, tema: titulo, persona: persona.nombre, sistema: SISTEMA_GUION, prompt };
  });
}
export const reserva = (id) => { limpiar(); return reservas.get(id) || null; };
export const soltar = (id) => reservas.delete(id);
export const contenidoProhibido = (txt) => PROHIBIDO.test(String(txt || ''));

// limite simple por clave: 150 aportes por hora
const ventana = new Map();
export function dentroDelLimite(uid) {
  const t = Date.now(), v = (ventana.get(uid) || []).filter((x) => t - x < 3600e3);
  if (v.length >= 150) return false;
  v.push(t); ventana.set(uid, v); return true;
}

export function rankingComunidad(uid) {
  const top = todos(`SELECT u.id, u.nombre, u.color, COUNT(*) videos FROM aportes a JOIN usuarios u ON u.id=a.usuario_id GROUP BY a.usuario_id ORDER BY videos DESC LIMIT 20`);
  const total = uno('SELECT COUNT(*) n FROM aportes').n;
  const mios = uid ? uno('SELECT COUNT(*) n FROM aportes WHERE usuario_id=?', uid).n : 0;
  const hoy = uno("SELECT COUNT(*) n FROM aportes WHERE creado >= datetime('now','-1 day')").n;
  return { total, hoy, mios, top, temas: TEMAS.length, personas: PERSONAS.length };
}
