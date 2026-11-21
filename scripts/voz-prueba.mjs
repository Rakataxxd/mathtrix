// Prueba de voz ElevenLabs (cuesta ~150 caracteres).
import { sintetizar, estadoVoz } from '../server/voz.js';
const t0 = Date.now();
const r = await sintetizar([{ texto: '¿Cuánto diamante lleva Peso Pluma en el cuello? Spoiler: es pura matemática.' }, { texto: 'Ahora vos: ¿y si fueran doscientos? Resolvelo en el reto.' }], { voz: process.argv[2] || 'Andres', vertical: true });
console.log(estadoVoz.proveedor(), Date.now() - t0, 'ms', JSON.stringify(r.map((x) => ({ a: x.audio, p: x.proveedor, d: x.duracion, w: x.palabras?.slice(0, 4), e: x.error }))), estadoVoz.ultimoError || '');
process.exit(0);
