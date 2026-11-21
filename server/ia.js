// IA de guiones: Claude Haiku 5.5 por la suscripcion (claude -p, streaming).
// Respaldo: qwen3 en la RTX 5050 (Ollama por Tailscale). La IA nunca hace cuentas.
import { spawn, execSync } from 'node:child_process';

let CLAUDE = process.env.MATHTRIX_CLAUDE;
if (!CLAUDE) {
  try { CLAUDE = execSync('where claude', { encoding: 'utf8' }).split(/\r?\n/).find((l) => /\.exe$/i.test(l.trim()))?.trim(); } catch {}
  CLAUDE = CLAUDE || 'claude';
}
export const OLLAMA = (process.env.MATHTRIX_OLLAMA || 'http://100.91.193.93:11434,http://100.84.21.33:11434').split(',');
export const MODELO = process.env.MATHTRIX_MODELO || 'claude-haiku-5-5';

function entornoLimpio() {
  const env = { ...process.env, MAX_THINKING_TOKENS: '0', DISABLE_AUTOUPDATER: '1' };
  for (const k of Object.keys(env)) if (/^CLAUDE_?CODE|^CLAUDECODE$/.test(k)) delete env[k];
  return env;
}

/** Llama a Haiku. onTexto(acumulado) recibe el guion mientras se escribe. */
export function claude({ sistema, prompt, herramientas = '', cwd, onTexto, timeoutMs = 120000, modelo = MODELO }) {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--model', modelo, '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
      '--no-session-persistence', '--effort', process.env.MATHTRIX_EFFORT || 'low', '--setting-sources', '', '--system-prompt', sistema, '--tools', herramientas];
    if (herramientas) args.push('--allowedTools', herramientas);
    const p = spawn(CLAUDE, args, { cwd: cwd || process.cwd(), env: entornoLimpio(), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '', texto = '', final = null, err = '';
    const to = setTimeout(() => { p.kill(); reject(new Error('claude: tiempo agotado')); }, timeoutMs);
    p.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const linea = buf.slice(0, i); buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(linea); } catch { continue; }
        if (m.type === 'stream_event' && m.event?.type === 'content_block_delta' && m.event.delta?.type === 'text_delta') {
          texto += m.event.delta.text; onTexto?.(texto);
        } else if (m.type === 'result') {
          final = m.is_error ? null : (m.result ?? texto);
          if (m.is_error) err = m.result || 'error';
        }
      }
    });
    p.stderr.on('data', (d) => { err += d.toString(); });
    p.on('error', (e) => { clearTimeout(to); reject(e); });
    p.on('close', () => {
      clearTimeout(to);
      if (final != null) resolve(final);
      else if (texto) resolve(texto);
      else reject(new Error('claude fallo: ' + err.slice(0, 300)));
    });
    p.stdin.end(prompt);
  });
}

/** Respaldo en GPU: Ollama (qwen3:8b) en la 5050 o la 5070. */
export async function ollama({ sistema, prompt, onTexto, timeoutMs = 120000 }) {
  let ultimo;
  for (const base of OLLAMA) {
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), timeoutMs);
      const r = await fetch(base + '/api/chat', {
        method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: process.env.MATHTRIX_OLLAMA_MODELO || 'qwen3:8b', stream: true, think: false, format: 'json',
          options: { temperature: 0.8, num_ctx: 12288 },
          messages: [{ role: 'system', content: sistema }, { role: 'user', content: prompt + ' /no_think' }] }),
      });
      if (!r.ok) throw new Error('ollama ' + r.status);
      let texto = '', resto = '';
      const dec = new TextDecoder();
      for await (const chunk of r.body) {
        resto += dec.decode(chunk, { stream: true });
        let i;
        while ((i = resto.indexOf('\n')) >= 0) {
          const l = resto.slice(0, i); resto = resto.slice(i + 1);
          try { const m = JSON.parse(l); if (m.message?.content) { texto += m.message.content; onTexto?.(texto); } } catch {}
        }
      }
      clearTimeout(to);
      return texto;
    } catch (e) { ultimo = e; }
  }
  throw ultimo || new Error('sin ollama');
}

/** Saca el JSON aunque venga con ``` o texto alrededor. */
export function extraerJSON(txt) {
  if (!txt) throw new Error('vacio');
  let s = txt.replace(/```(?:json)?/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('sin JSON');
  s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch {}
  return JSON.parse(s.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"'));
}

/** Extrae el titulo apenas aparece en el streaming (para mostrarlo en vivo). */
export function tituloParcial(txt) {
  const m = /"titulo"\s*:\s*"([^"]{4,})"/.exec(txt || '');
  return m ? m[1] : null;
}
