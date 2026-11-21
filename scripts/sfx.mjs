// Genera los efectos de sonido (WAV) por codigo: whoosh, pop, ding, error. Sin archivos de terceros.
import { writeFileSync, mkdirSync } from 'node:fs';
const SR = 44100;
const OUT = new URL('../web/public/sfx/', import.meta.url);
mkdirSync(OUT, { recursive: true });
function wav(nombre, muestras) {
  const n = muestras.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  const pico = Math.max(...muestras.map(Math.abs)) || 1;
  muestras.forEach((m, i) => buf.writeInt16LE(Math.round((m / pico) * 0.9 * 32767), 44 + i * 2));
  writeFileSync(new URL(nombre, OUT), buf);
  console.log(nombre, (n / SR).toFixed(2) + ' s');
}
let semilla = 7; const rnd = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
// whoosh: ruido filtrado con barrido de frecuencia y envolvente de campana
{
  const d = 0.42, n = Math.round(SR * d), out = [];
  let lp = 0, bp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, env = Math.sin(Math.PI * t) ** 2;
    const fc = 300 + 2600 * Math.sin(Math.PI * t);
    const a = Math.min(1, (2 * Math.PI * fc) / SR);
    lp += a * (rnd() - lp); bp += a * (lp - bp);
    out.push((lp - bp) * env);
  }
  wav('whoosh.wav', out);
}
// pop: seno con caida rapida de tono
{
  const d = 0.13, n = Math.round(SR * d), out = []; let fase = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; const f = 900 * Math.exp(-t * 28) + 180; fase += (2 * Math.PI * f) / SR; out.push(Math.sin(fase) * Math.exp(-t * 32)); }
  wav('pop.wav', out);
}
// ding: dos notas (acierto)
{
  const d = 0.75, n = Math.round(SR * d), out = [];
  for (let i = 0; i < n; i++) {
    const t = i / SR, n2 = t > 0.11 ? t - 0.11 : -1;
    let s = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 7) + 0.3 * Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 10);
    if (n2 >= 0) s += Math.sin(2 * Math.PI * 1318.5 * n2) * Math.exp(-n2 * 5) + 0.25 * Math.sin(2 * Math.PI * 2637 * n2) * Math.exp(-n2 * 8);
    out.push(s * Math.min(1, t * 200));
  }
  wav('ding.wav', out);
}
// error: dos tonos graves descendentes
{
  const d = 0.5, n = Math.round(SR * d), out = [];
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = t < 0.2 ? 220 : 165;
    const sq = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.5 + Math.sin(2 * Math.PI * f * t) * 0.5;
    out.push(sq * Math.exp(-((t % 0.2) * 9)) * (t < 0.45 ? 1 : (0.5 - t) / 0.05));
  }
  wav('error.wav', out);
}
