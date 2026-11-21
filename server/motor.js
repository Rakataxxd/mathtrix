// Puente al motor Python (sympy + edge-tts). Proceso ya cargado esperando trabajo.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { RAIZ } from './db.js';

let proc = null, buf = '', seq = 0, listo = null;
const pendientes = new Map();

function arrancar() {
  const py = process.env.MATHTRIX_PYTHON || 'python';
  proc = spawn(py, ['-u', join(RAIZ, 'motor', 'worker.py')], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  listo = new Promise((res) => {
    proc.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const linea = buf.slice(0, i); buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(linea); } catch { continue; }
        if (m.id === 'listo') { res(); continue; }
        const p = pendientes.get(m.id);
        if (p) { pendientes.delete(m.id); m.ok ? p.res(m.r) : p.rej(new Error(m.error)); }
      }
    });
  });
  proc.stderr.on('data', (d) => process.env.MATHTRIX_DEBUG && process.stderr.write('[motor] ' + d));
  proc.on('exit', () => {
    for (const p of pendientes.values()) p.rej(new Error('motor caido'));
    pendientes.clear(); proc = null;
  });
}

export async function motor(op, data, timeoutMs = 60000) {
  if (!proc) arrancar();
  await listo;
  const id = ++seq;
  return new Promise((res, rej) => {
    const to = setTimeout(() => { pendientes.delete(id); rej(new Error('motor: tiempo agotado ' + op)); }, timeoutMs);
    pendientes.set(id, { res: (r) => { clearTimeout(to); res(r); }, rej: (e) => { clearTimeout(to); rej(e); } });
    proc.stdin.write(JSON.stringify({ id, op, data }) + '\n');
  });
}

export function precalentar() { motor('ping', {}).catch(() => {}); }
