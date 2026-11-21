// Voz: ElevenLabs (Flash v2.5, voces latinas) con marcas de tiempo por palabra.
// Respaldo automatico: edge-tts es-GT si no hay key, se acaba el saldo o falla la red.
// Cache por frase en disco + deduplicacion en vuelo (nunca se paga dos veces la misma frase).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA } from './db.js';
import { motor } from './motor.js';

const DIR = join(DATA, 'media', 'tts');
const MODELO = process.env.ELEVEN_MODELO || 'eleven_flash_v2_5';
export const VOCES_ELEVEN = { Andres: process.env.ELEVEN_VOZ_H || '9F4C8ztpNUmXkdDDbz3J', Marta: process.env.ELEVEN_VOZ_M || 'rEVYTKPqwSMhytFPayIb' };
const VOCES_EDGE = { Andres: 'es-GT-AndresNeural', Marta: 'es-GT-MartaNeural' };
const MAX = +process.env.ELEVEN_CONCURRENCIA || 4;
let pausaHasta = 0, activos = 0;
const espera = [];
const enVuelo = new Map();
export const estadoVoz = { proveedor: () => (process.env.ELEVENLABS_API_KEY && Date.now() > pausaHasta ? 'elevenlabs' : 'edge-tts'), usados: 0, fallos: 0 };

const sha = (s) => createHash('sha1').update(s).digest('hex').slice(0, 22);
function leer(key) {
  const js = join(DIR, key + '.json');
  if (existsSync(js) && existsSync(join(DIR, key + '.mp3'))) { try { return JSON.parse(readFileSync(js, 'utf8')); } catch {} }
  return null;
}
async function turno() { if (activos < MAX) { activos++; return; } await new Promise((r) => espera.push(r)); activos++; }
function liberar() { activos--; espera.shift()?.(); }

function palabrasDe(al) {
  const out = []; let w = '', t0 = null, t1 = 0;
  const ch = al.characters, s = al.character_start_times_seconds, e = al.character_end_times_seconds;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) { if (w) out.push({ w, t: +t0.toFixed(3), d: +(t1 - t0).toFixed(3) }); w = ''; t0 = null; continue; }
    if (t0 === null) t0 = s[i];
    w += ch[i]; t1 = e[i];
  }
  if (w) out.push({ w, t: +t0.toFixed(3), d: +(t1 - t0).toFixed(3) });
  return out;
}

async function eleven(texto, voz, velocidad, key) {
  await turno();
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOCES_ELEVEN[voz] || VOCES_ELEVEN.Andres}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: texto, model_id: MODELO, language_code: 'es', voice_settings: { stability: 0.42, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: velocidad } }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) {
      const det = await r.text();
      // sin saldo o key invalida: se pasa a edge-tts por 15 minutos
      if (r.status === 401 || r.status === 402 || /quota|credits|limit/i.test(det)) pausaHasta = Date.now() + 15 * 60 * 1000;
      throw new Error(`elevenlabs ${r.status}: ${det.slice(0, 160)}`);
    }
    const d = await r.json();
    const audio = Buffer.from(d.audio_base64, 'base64');
    const al = d.alignment || d.normalized_alignment;
    const info = { audio: key + '.mp3', palabras: palabrasDe(al), duracion: +(Math.max(al.character_end_times_seconds.at(-1) + 0.12, audio.length * 8 / 128000)).toFixed(3), proveedor: 'elevenlabs' };
    writeFileSync(join(DIR, key + '.mp3'), audio);
    writeFileSync(join(DIR, key + '.json'), JSON.stringify(info));
    estadoVoz.usados += texto.length;
    return info;
  } finally { liberar(); }
}

/** frases: [{texto}] ya en palabras habladas. Devuelve [{audio, palabras, duracion}|{error}] en el mismo orden. */
export async function sintetizar(frases, { voz = 'Andres', vertical = true } = {}) {
  voz = voz === 'Marta' ? 'Marta' : 'Andres';
  const usarEleven = estadoVoz.proveedor() === 'elevenlabs';
  const velocidad = vertical ? 1.1 : 1.02;
  const rate = vertical ? '+14%' : '+8%';
  const res = new Array(frases.length);
  const paraEdge = [];
  await Promise.all(frases.map(async (f, i) => {
    const kEl = sha(`el|${MODELO}|${voz}|${velocidad}|${f.texto}`);
    const kEd = sha(`ed|${voz}|${rate}|${f.texto}`);
    const cache = leer(kEl) || leer(kEd);
    if (cache) { res[i] = cache; return; }
    if (usarEleven) {
      if (!enVuelo.has(kEl)) enVuelo.set(kEl, eleven(f.texto, voz, velocidad, kEl).finally(() => setTimeout(() => enVuelo.delete(kEl), 2000)));
      try { res[i] = await enVuelo.get(kEl); return; } catch (e) { estadoVoz.fallos++; estadoVoz.ultimoError = e.message; }
    }
    paraEdge.push({ i, key: kEd, texto: f.texto });
  }));
  if (paraEdge.length) {
    const pendientes = paraEdge.filter((p) => !enVuelo.has(p.key));
    const lote = pendientes.length ? motor('tts', { dir: DIR, frases: pendientes.map((p) => ({ key: p.key, texto: p.texto, voz: VOCES_EDGE[voz], rate })) }, 90000) : null;
    for (const p of pendientes) enVuelo.set(p.key, lote.then((r) => r[p.key]).finally(() => setTimeout(() => enVuelo.delete(p.key), 2000)));
    for (const p of paraEdge) { try { res[p.i] = (await enVuelo.get(p.key)) || { error: 'sin voz' }; } catch (e) { res[p.i] = { error: e.message }; } }
  }
  return res;
}
