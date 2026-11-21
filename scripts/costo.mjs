// Mide tokens reales de Haiku por guion (y por duda) leyendo el "result" de claude -p.
import { spawn, execSync } from 'node:child_process';
import { SISTEMA_GUION, promptGuion, SISTEMA_DUDA } from '../server/prompts.js';
const CLAUDE = execSync('where claude', { encoding: 'utf8' }).split(/\r?\n/).find((l) => /\.exe$/i.test(l.trim())).trim();
function medir(sistema, prompt) {
  return new Promise((ok) => {
    const env = { ...process.env, MAX_THINKING_TOKENS: '0' };
    for (const k of Object.keys(env)) if (/^CLAUDE_?CODE|^CLAUDECODE$/.test(k)) delete env[k];
    const p = spawn(CLAUDE, ['-p', '--model', 'claude-haiku-5-5', '--output-format', 'stream-json', '--verbose', '--no-session-persistence', '--effort', 'low', '--setting-sources', '', '--system-prompt', sistema, '--tools', ''], { env, windowsHide: true });
    let buf = '', res = null;
    p.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(l); if (m.type === 'result') res = m; } catch {} } });
    p.on('close', () => ok(res));
    p.stdin.end(prompt);
  });
}
const leccion = { titulo: 'Suma de fracciones', tema: 'Suma de fracciones con distinto denominador' };
const perfil = { gustos: ['Música', 'Fútbol'], idolos: ['Messi', 'Bad Bunny'], metas: ['Ser ingeniero'], aprende: ['Paso a paso'] };
for (const formato of ['horizontal', 'vertical']) {
  const r = await medir(SISTEMA_GUION, promptGuion({ formato, leccion, alumno: { nombre: 'Diego' }, perfil, stats: {}, estilo: 'ilustrado' }));
  const u = r.usage;
  console.log(formato, JSON.stringify({ in: u.input_tokens, cache_w: u.cache_creation_input_tokens, cache_r: u.cache_read_input_tokens, out: u.output_tokens, costo: r.total_cost_usd, ms: r.duration_ms }));
}
const d = await medir(SISTEMA_DUDA, 'VIDEO: suma de fracciones. ESCENAS: [1] paso 1/4 + 1/3 = 3/12 + 4/12 ... DUDA: no entendí de dónde sale el 12');
console.log('duda', JSON.stringify({ in: d.usage.input_tokens, out: d.usage.output_tokens, costo: d.total_cost_usd }));
