#!/usr/bin/env node
// Mathtrix · aportá videos de mate a la comunidad usando TU Claude (Claude Code con tu suscripción o tu API key).
// Tu compu escribe los guiones con Claude Haiku; el servidor de Mathtrix verifica cada cuenta con sympy,
// les pone voz y los publica para estudiantes de Guatemala. Sin dependencias: solo Node 18+ y el comando `claude`.
//
//   node aportar.mjs --clave mtxk_...                  (10 videos, 3 a la vez)
//   node aportar.mjs --clave mtxk_... --cantidad 500 --paralelo 4
//   node aportar.mjs --clave mtxk_... --formato vertical --sin-fin
//
// Seguridad: Claude corre SIN herramientas (--tools "") en una carpeta temporal vacía: solo escribe texto,
// no puede leer ni tocar nada de tu compu. Cada video gasta del límite de TU plan de Claude.
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SERVIDOR_DEFECTO = '__SERVIDOR__';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
if (flag('ayuda') || flag('help') || flag('h')) {
  console.log(`Mathtrix · aportar videos a la comunidad

  --clave <mtxk_...>     tu clave (Mathtrix → Aportar). También: variable MATHTRIX_CLAVE
  --cantidad <n>         cuántos videos (por defecto 10)
  --paralelo <n>         cuántos a la vez (por defecto 3, máximo 8)
  --formato <f>          horizontal | vertical | mixto (por defecto mixto)
  --modelo <id>          modelo de Claude (por defecto claude-haiku-5-5)
  --sin-fin              seguir hasta que lo pares (Ctrl+C)
  --servidor <url>       servidor de Mathtrix (por defecto ${SERVIDOR_DEFECTO})`);
  process.exit(0);
}
const SERVIDOR = String(opt('servidor', process.env.MATHTRIX_SERVIDOR || SERVIDOR_DEFECTO)).replace(/\/$/, '');
const CLAVE = opt('clave', process.env.MATHTRIX_CLAVE);
const SIN_FIN = flag('sin-fin');
const CANTIDAD = SIN_FIN ? Infinity : Math.max(1, parseInt(opt('cantidad', '10')) || 10);
const PARALELO = Math.min(8, Math.max(1, parseInt(opt('paralelo', '3')) || 3));
const FORMATO = opt('formato', 'mixto');
const MODELO = opt('modelo', 'claude-haiku-5-5');
const c = { v: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, a: (s) => `\x1b[33m${s}\x1b[0m`, g: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };

if (!CLAVE) { console.error(c.r('Falta --clave. Sacá la tuya en ' + SERVIDOR + '/aportar')); process.exit(1); }
if (SERVIDOR.includes('__SERVIDOR__')) { console.error(c.r('Falta --servidor <url de Mathtrix>')); process.exit(1); }
if (+process.versions.node.split('.')[0] < 18) { console.error(c.r('Necesitás Node 18 o más nuevo')); process.exit(1); }

// ---- encontrar `claude` (instalador nativo .exe o npm .cmd) ----
let CLAUDE = process.env.CLAUDE_BIN || 'claude', CON_SHELL = false;
try {
  const w = execSync(process.platform === 'win32' ? 'where claude' : 'command -v claude', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  CLAUDE = process.env.CLAUDE_BIN || w.find((l) => /\.exe$/i.test(l)) || w[0] || CLAUDE;
  CON_SHELL = process.platform === 'win32' && !/\.exe$/i.test(CLAUDE);
} catch { console.error(c.r('No encuentro el comando `claude`. Instalá Claude Code e iniciá sesión: https://claude.com/claude-code')); process.exit(1); }

const VACIA = mkdtempSync(join(tmpdir(), 'mathtrix-'));
process.on('exit', () => { try { rmSync(VACIA, { recursive: true, force: true }); } catch {} });

/** Una llamada a Claude: sin herramientas, sin sesión guardada, con el sistema en un archivo (evita límites de la línea de comandos). */
function claude(sistema, prompt) {
  return new Promise((resolve, reject) => {
    const archivo = join(VACIA, 'sistema-' + Math.random().toString(36).slice(2) + '.txt');
    writeFileSync(archivo, sistema);
    const vacio = CON_SHELL ? '""' : '';
    const a = ['-p', '--model', MODELO, '--output-format', 'json', '--no-session-persistence', '--effort', 'low', '--setting-sources', vacio, '--tools', vacio, '--system-prompt-file', CON_SHELL ? `"${archivo}"` : archivo];
    const env = { ...process.env };
    for (const k of Object.keys(env)) if (/^CLAUDE_?CODE|^CLAUDECODE$/.test(k)) delete env[k];
    const p = spawn(CON_SHELL ? `"${CLAUDE}"` : CLAUDE, a, { cwd: VACIA, env, shell: CON_SHELL, windowsHide: true });
    let out = '', err = '';
    const to = setTimeout(() => { p.kill(); reject(new Error('Claude tardó más de 3 min')); }, 180000);
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => { clearTimeout(to); reject(e); });
    p.on('close', () => {
      clearTimeout(to);
      try { rmSync(archivo, { force: true }); } catch {}
      let j = null; try { j = JSON.parse(out.trim().split('\n').at(-1)); } catch {}
      if (!j) return reject(new Error((err || out || 'Claude no respondió').slice(0, 300)));
      if (j.is_error) { const e = new Error(String(j.result || j.error || 'error de Claude').slice(0, 300)); e.limite = /usage limit|rate.?limit|limit reached|quota|overloaded|credit balance|too many requests/i.test(e.message); return reject(e); }
      resolve({ texto: j.result || '', costo: j.total_cost_usd || 0, ms: j.duration_ms || 0 });
    });
    p.stdin.end(prompt);
  });
}

async function api(ruta, cuerpo) {
  const r = await fetch(SERVIDOR + ruta, { method: cuerpo ? 'POST' : 'GET', headers: { 'x-mathtrix-clave': CLAVE, ...(cuerpo ? { 'content-type': 'application/json' } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'HTTP ' + r.status); e.status = r.status; throw e; }
  return d;
}
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const seg = (ms) => (ms / 1000).toFixed(0) + ' s';

// ---- bucle: varios trabajadores en paralelo comparten una cola de tareas ----
let hechos = 0, fallidos = 0, enCurso = 0, costo = 0, pausaHasta = 0, parar = false;
const t0 = Date.now();
const cola = [];
process.on('SIGINT', () => { if (parar) process.exit(130); parar = true; console.log(c.a('\nTerminando los que están en curso… (Ctrl+C otra vez para salir ya)')); });

async function siguienteTarea() {
  if (!cola.length) cola.push(...(await api(`/api/comunidad/tareas?n=${Math.min(20, PARALELO * 2)}&formato=${FORMATO}`)).tareas);
  return cola.shift();
}
async function trabajador() {
  // cantidad = videos publicados (los descartados se reemplazan con otra tarea)
  while (!parar && hechos + enCurso < CANTIDAD && fallidos < Math.max(10, CANTIDAD)) {
    enCurso++;
    try { await unVideo(); } finally { enCurso--; }
  }
}
async function unVideo() {
  {
    if (Date.now() < pausaHasta) await espera(pausaHasta - Date.now());
    let tarea;
    try { tarea = await siguienteTarea(); } catch (e) {
      if (e.status === 401) { console.error(c.r('✗ ' + e.message)); parar = true; return; }
      console.log(c.a(`  servidor no disponible (${e.message}); reintento en 15 s`)); await espera(15000); return;
    }
    let nota = '';
    for (let intento = 1; intento <= 2; intento++) {
      const ti = Date.now();
      try {
        const r = await claude(tarea.sistema, tarea.prompt + nota);
        costo += r.costo;
        const v = await api('/api/comunidad/aporte', { tarea: tarea.id, guion: r.texto, ms: Date.now() - ti });
        hechos++;
        console.log(`${c.v('✓')} ${c.b(String(hechos).padStart(3))} ${c.g(seg(Date.now() - ti).padStart(5))} ${v.titulo}  ${c.g(SERVIDOR + v.url)}`);
        break;
      } catch (e) {
        if (e.limite) {
          pausaHasta = Date.now() + 5 * 60 * 1000;
          console.log(c.a(`  Tu plan de Claude llegó a su límite (${e.message.slice(0, 80)}). Pauso 5 min y sigo.`));
          intento--; await espera(pausaHasta - Date.now()); continue;
        }
        if (e.status === 429) { console.log(c.a('  ' + e.message)); await espera(60000); intento--; continue; }
        if (intento === 2 || e.status === 404) { fallidos++; console.log(`${c.r('✗')}     ${c.g(tarea.tema + ' · ' + tarea.persona)}  ${c.r(e.message.slice(0, 120))}`); break; }
        nota = `\nOJO: el intento anterior falló así: "${e.message.slice(0, 200)}". Revisá que cada {id} exista en variables o calculos y que el JSON sea válido.`;
      }
    }
  }
}

console.log(c.b('Mathtrix · aportando videos a la comunidad'));
console.log(c.g(`servidor ${SERVIDOR} · ${SIN_FIN ? 'sin fin' : CANTIDAD + ' videos'} · ${PARALELO} a la vez · ${FORMATO} · ${MODELO}`));
try { const e = await api('/api/comunidad/estado'); console.log(c.g(`la comunidad ya lleva ${e.total} videos (${e.hoy} hoy)\n`)); } catch (e) { console.error(c.r('No pude conectar con ' + SERVIDOR + ': ' + e.message)); process.exit(1); }
await Promise.all(Array.from({ length: PARALELO }, (_, i) => trabajador(i)));
const min = (Date.now() - t0) / 60000;
console.log(`\n${c.b(hechos + ' videos aportados')} en ${min.toFixed(1)} min${fallidos ? c.a(` · ${fallidos} descartados (no pasaron la verificación)`) : ''}`);
if (costo) console.log(c.g(`costo equivalente en API: US$ ${costo.toFixed(3)} (con suscripción no se cobra aparte)`));
console.log(c.v('¡Gracias por aportar! Cada video ayuda a un estudiante a entender mate.'));
