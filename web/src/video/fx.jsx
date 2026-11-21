// Capas visuales comunes: fondo con profundidad, camara viva, acabado, subtitulos, mascota, emoji.
import React, { useState, createContext, useContext } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, random } from 'remotion';
import { noise2D } from '@remotion/noise';
import { useEstilo, useClaveEstilo, filtroEmoji, FONDOS, AcabadoEstilo } from './estilos.jsx';

export const PALETAS = {
  neon: { f1: '#0b0420', f2: '#34106e', a: '#b6ff3b', b: '#ff4fd8', c: '#7af8ff' },
  atardecer: { f1: '#1a0626', f2: '#8a2350', a: '#ffd23b', b: '#ff6b5b', c: '#ffb3d9' },
  oceano: { f1: '#03142b', f2: '#0b5585', a: '#3bffd1', b: '#4fa8ff', c: '#b3f0ff' },
  selva: { f1: '#031a12', f2: '#0f6040', a: '#d4ff3b', b: '#3bffb0', c: '#c8ffd9' },
  oro: { f1: '#140c02', f2: '#5a390a', a: '#ffd23b', b: '#ff9f1c', c: '#fff1b3' },
  espacio: { f1: '#050617', f2: '#1f2470', a: '#7af8ff', b: '#a98bff', c: '#d6d9ff' },
  fuego: { f1: '#1a0404', f2: '#7a1a08', a: '#ffb23b', b: '#ff3b3b', c: '#ffd9b3' },
};
export const FUENTE = "var(--mtx-cuerpo, 'Plus Jakarta Sans'), system-ui, sans-serif";
export const DISPLAY = "var(--mtx-display, 'Unbounded'), sans-serif";
export const MONO = "var(--mtx-mate, 'JetBrains Mono'), ui-monospace, monospace";
export const PaletaCtx = createContext(null);
export const usePaleta = () => useContext(PaletaCtx);
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export function useSp() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (delay = 0, config = {}) => spring({ frame: f - delay, fps, config: { damping: 12, mass: 0.6, ...config } });
}
export function useVert() { const { width, height } = useVideoConfig(); return { W: width, H: height, v: height > width }; }

// ---------- emoji animado de Noto (cacheado por el servidor) ----------
export const codEmoji = (e) => [...String(e || '')].map((c) => c.codePointAt(0).toString(16)).join('_');
export function Emoji({ e, size = 200, style, ligero, sinFiltro }) {
  const [err, setErr] = useState(false);
  const E = useEstilo(); const clave = useClaveEstilo(); const P = usePaleta();
  if (!e) return null;
  const filtro = sinFiltro || !P ? undefined : filtroEmoji(clave, E, P, ligero);
  const base = typeof window !== 'undefined' && window.__MTX_BASE ? window.__MTX_BASE : '';
  if (err) return <div style={{ fontSize: size * 0.82, lineHeight: 1, width: size, height: size, textAlign: 'center', ...style }}>{e}</div>;
  return <img src={`${base}/emoji/${codEmoji(e)}`} width={size} height={size} draggable={false} onError={() => setErr(true)} style={{ display: 'block', filter: filtro, ...style }} alt="" />;
}

/** Objeto ilustrado: halo de luz, sombra suave, flotacion y balanceo. */
export function Objeto({ e, size = 360, x, y, delay = 0, P, halo = true, intensidad = 1 }) {
  P = P || usePaleta();
  const f = useCurrentFrame();
  const sp = useSp();
  const clave = useClaveEstilo();
  const tranquilo = clave === 'manim' || clave === 'blueprint' || clave === 'tiza';
  const s = sp(delay, { damping: tranquilo ? 16 : 9, mass: 0.7 });
  intensidad *= tranquilo ? 0.35 : 1;
  halo = halo && (clave === 'ilustrado' || clave === 'neon');
  const bob = Math.sin((f + delay) / 11) * 14 * intensidad;
  const rot = Math.sin((f + delay) / 17) * 5 * intensidad;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s})` }}>
      {halo && <div style={{ position: 'absolute', inset: -size * 0.45, borderRadius: '50%', background: `radial-gradient(circle, ${P.a}55 0%, ${P.b}22 38%, transparent 68%)`, transform: `scale(${1 + Math.sin(f / 13) * 0.06})` }} />}
      {(clave === 'ilustrado' || clave === 'neon' || clave === 'cuaderno') && <div style={{ position: 'absolute', left: size * 0.16, right: size * 0.16, bottom: -size * 0.1, height: size * 0.13, borderRadius: '50%', background: `radial-gradient(closest-side, ${clave === 'neon' ? P.b + '88' : clave === 'cuaderno' ? 'rgba(60,40,0,.18)' : 'rgba(0,0,0,.55)'}, transparent)`, transform: `scaleX(${1 - bob / 140})` }} />}
      {clave === 'blueprint' && <Cotas size={size} s={s} />}
      <div style={{ transform: `translateY(${bob}px) rotate(${rot}deg)` }}>
        <Emoji e={e} size={size} />
      </div>
    </div>
  );
}

/** Lineas de cota del plano (blueprint). */
function Cotas({ size, s }) {
  const c = 'rgba(234,244,255,.75)';
  return (
    <svg width={size * 1.5} height={size * 1.5} style={{ position: 'absolute', left: -size * 0.25, top: -size * 0.25, overflow: 'visible', opacity: s }}>
      <line x1={size * 0.75} y1={0} x2={size * 0.75} y2={size * 1.5} stroke={c} strokeWidth="1.5" strokeDasharray="10 6 2 6" />
      <line x1={0} y1={size * 0.75} x2={size * 1.5} y2={size * 0.75} stroke={c} strokeWidth="1.5" strokeDasharray="10 6 2 6" />
      <circle cx={size * 0.75} cy={size * 0.75} r={size * 0.62} fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="4 8" />
      <line x1={size * 0.25} y1={size * 1.42} x2={size * 1.25} y2={size * 1.42} stroke={c} strokeWidth="2" />
      <line x1={size * 0.25} y1={size * 1.34} x2={size * 0.25} y2={size * 1.5} stroke={c} strokeWidth="2" />
      <line x1={size * 1.25} y1={size * 1.34} x2={size * 1.25} y2={size * 1.5} stroke={c} strokeWidth="2" />
      <text x={size * 0.75} y={size * 1.4 - 8} textAnchor="middle" fill={c} fontFamily="IBM Plex Mono" fontSize={size * 0.07}>FIG. 1</text>
    </svg>
  );
}

// ---------- fondo en tres capas ----------
const GLIFOS = 'π∑√÷×±∞≈∫x²y³%∆θ0123456789+=−';
export function Fondo({ P }) {
  const clave = useClaveEstilo();
  if (FONDOS[clave]) { const F = FONDOS[clave]; return <F P={P} />; }
  return <FondoIlustrado P={P} />;
}
function FondoIlustrado({ P }) {
  const f = useCurrentFrame();
  const { W, H, v } = useVert();
  const cols = v ? 9 : 16;
  const bokeh = Array.from({ length: 13 }, (_, i) => ({
    x: random('bx' + i) * W, y: random('by' + i) * H, r: 60 + random('br' + i) * 180, c: i % 3 === 0 ? P.a : i % 3 === 1 ? P.b : P.c, o: 0.1 + random('bo' + i) * 0.18,
  }));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 12%, ${P.f2} 0%, ${P.f1} 62%, #000 120%)`, overflow: 'hidden' }}>
      {/* capa lejana: lluvia de simbolos matematicos (la firma de Mathtrix) */}
      {Array.from({ length: cols }, (_, i) => {
        const vel = 0.6 + random('cv' + i) * 1.4;
        const off = (f * vel + random('co' + i) * H) % (H * 1.4);
        const txt = Array.from({ length: 14 }, (_, k) => GLIFOS[Math.floor(random('g' + i + k) * GLIFOS.length)]).join('\n');
        return <div key={i} style={{ position: 'absolute', left: (i + 0.5) * (W / cols), top: off - H * 0.5, fontFamily: MONO, fontSize: v ? 34 : 30, lineHeight: 1.7, color: P.c, opacity: 0.07, whiteSpace: 'pre', textAlign: 'center' }}>{txt}</div>;
      })}
      {/* plano medio: bokeh */}
      {bokeh.map((b, i) => {
        const dx = noise2D('nx' + i, f / 160, 0) * 60, dy = noise2D('ny' + i, 0, f / 160) * 60 - f * 0.25 * (i % 2 ? 1 : 0.5);
        return <div key={i} style={{ position: 'absolute', left: b.x - b.r + dx, top: ((b.y + dy) % (H + 2 * b.r) + H + 2 * b.r) % (H + 2 * b.r) - b.r * 2, width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`, opacity: b.o }} />;
      })}
    </AbsoluteFill>
  );
}

/** Primer plano grande y borroso que se mueve mas rapido (profundidad). */
export function PrimerPlano({ P }) {
  const clave = useClaveEstilo();
  if (clave !== 'ilustrado' && clave !== 'neon') return null;
  return <PrimerPlanoDibujo P={P} />;
}
function PrimerPlanoDibujo({ P }) {
  const f = useCurrentFrame();
  const { W, H } = useVert();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', width: W * 0.5, height: W * 0.5, left: -W * 0.22 + noise2D('fp1', f / 90, 0) * 90, top: H * 0.68 + noise2D('fp2', 0, f / 90) * 70, borderRadius: '50%', background: P.b, opacity: 0.16, filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', width: W * 0.42, height: W * 0.42, right: -W * 0.16 + noise2D('fp3', f / 80, 2) * 80, top: H * 0.05 + noise2D('fp4', 2, f / 80) * 60, borderRadius: '50%', background: P.a, opacity: 0.12, filter: 'blur(60px)' }} />
    </AbsoluteFill>
  );
}

/** Camara viva: acercamiento continuo, deriva con ruido suave y transicion "atravesar". */
export function Camara({ dur, seed = 0, children }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = useEstilo().camara;
  const ent = spring({ frame: f, fps, config: { damping: 15, mass: 0.55 } });
  const sal = interpolate(f, [dur - 8, dur], [0, 1], clamp);
  const push = interpolate(f, [0, dur], [1, 1 + 0.07 * k]);
  const nx = noise2D('cx' + seed, f / 85, 0) * 12 * k, ny = noise2D('cy' + seed, 0, f / 85) * 12 * k, rot = noise2D('cr' + seed, f / 110, 1) * 0.6 * k;
  const esc = push * interpolate(ent, [0, 1], [1 - 0.22 * Math.min(1, k), 1]) * (1 + sal * sal * 1.8 * Math.min(1, k));
  return (
    <AbsoluteFill style={{ transform: `translate(${nx}px, ${ny}px) rotate(${rot}deg) scale(${esc})`, opacity: Math.min(1, ent * 1.6) * (1 - sal), filter: sal > 0.05 ? `blur(${sal * 14}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
}

const GRANO = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
/** Acabado: vineta, brillo, correccion de color y grano. */
export function Acabado() {
  const clave = useClaveEstilo();
  if (clave !== 'ilustrado') return <AcabadoEstilo clave={clave} />;
  return <AcabadoGrano />;
}
function AcabadoGrano() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(0,0,0,.62) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.05), transparent 30%, transparent 70%, rgba(0,0,0,.25))', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ backgroundImage: GRANO, backgroundPosition: `${random('gx' + f) * 220}px ${random('gy' + f) * 220}px`, opacity: 0.13, mixBlendMode: 'overlay' }} />
    </AbsoluteFill>
  );
}

// ---------- subtitulos palabra por palabra ----------
function trozos(palabras, max) {
  const out = []; let cur = [];
  for (const p of palabras || []) {
    if (p.corte && cur.length) { out.push(cur); cur = []; }
    cur.push(p);
    if (cur.length >= max || /[.,;:!?¿¡]$/.test(p.w)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}
export function Subtitulos(props) {
  const E = useEstilo();
  if (E.cap.cinetica) return <SubCinetica {...props} />;
  return <SubNormal {...props} />;
}
/** Tipografia cinetica: la palabra que se dice ocupa la pantalla y golpea; las anteriores quedan chicas arriba. */
function SubCinetica({ palabras, P, abajo }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, v } = useVert();
  const cap = useEstilo().cap;
  const t = f / fps;
  const ps = palabras || [];
  let k = -1;
  for (let i = 0; i < ps.length; i++) if (t >= ps[i].t - 0.03) k = i;
  if (k < 0) return null;
  const p = ps[k];
  if (k === ps.length - 1 && t > p.t + p.d + 0.7) return null;
  let ini = k; while (ini > 0 && k - ini < 3 && !ps[ini].corte) ini--;
  const prev = ps.slice(ini, k).filter((x) => !x.corte || x === ps[ini]);
  const pop = spring({ frame: f - Math.round(p.t * fps), fps, config: { damping: 9, mass: 0.4 } });
  const w = p.w.replace(/[.,;:¿?¡!"]/g, '');
  const fs = (v ? cap.v : cap.h) * Math.min(1, 7 / Math.max(4, w.length));
  const col = [cap.color, cap.activo, P.c, cap.color, P.b][k % 5];
  return (
    <div style={{ position: 'absolute', left: W * 0.05, right: W * 0.05, top: v ? (abajo ? '71%' : '62%') : undefined, bottom: v ? undefined : '5%', textAlign: 'center', fontFamily: DISPLAY, textTransform: 'uppercase' }}>
      <div style={{ fontSize: fs * 0.3, color: cap.color, opacity: 0.55, letterSpacing: '.02em', minHeight: '1.1em' }}>{prev.map((x) => x.w.replace(/[.,;:]$/, '')).join(' ')}</div>
      <div style={{ display: 'inline-block', fontSize: fs, lineHeight: 0.95, color: col, transform: `scale(${0.55 + pop * 0.45}) rotate(${(1 - pop) * (k % 2 ? 7 : -7)}deg)`, textShadow: `8px 8px 0 ${P.b}` }}>{w}</div>
    </div>
  );
}
function SubNormal({ palabras, P, abajo }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, v } = useVert();
  const t = f / fps;
  const E = useEstilo();
  const cap = E.cap;
  const grupos = trozos(palabras, v ? cap.max : Math.min(6, cap.max * 2));
  let g = null, gi = -1;
  for (let i = 0; i < grupos.length; i++) if (t >= grupos[i][0].t - 0.05) { g = grupos[i]; gi = i; }
  if (!g) return null;
  const fin = g.at(-1).t + g.at(-1).d + 0.6;
  if (t > fin && gi === grupos.length - 1) return null;
  const pop = spring({ frame: f - Math.round(g[0].t * fps), fps, config: { damping: 11, mass: 0.45 } });
  return (
    <div style={{ position: 'absolute', left: W * 0.06, right: W * 0.06, top: v ? (abajo ? '79%' : '64%') : undefined, bottom: v ? undefined : '7%', textAlign: 'center', transform: `scale(${0.82 + pop * 0.18})`, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 .3em', fontFamily: cap.fuente === 'display' ? DISPLAY : cap.fuente === 'mate' ? MONO : FUENTE, fontWeight: cap.peso, fontSize: v ? cap.v : cap.h, lineHeight: 1.15, letterSpacing: cap.mayus ? '-0.01em' : 0, textTransform: cap.mayus ? 'uppercase' : 'none', ...(cap.caja ? { background: cap.caja.bg || 'rgba(8,36,87,.85)', border: cap.caja.borde || '2px solid #eaf4ff', borderRadius: cap.caja.radio || 0, padding: '8px 22px' } : {}) }}>
        {g.map((p, i) => {
          const act = t >= p.t - 0.03 && t < p.t + p.d + 0.08;
          const conTrazo = cap.trazo !== '0';
          return <span key={i} style={{ display: 'inline-block', color: act ? (cap.activo || P.a) : cap.color, background: act && cap.fondoActivo ? cap.fondoActivo : 'transparent', padding: cap.fondoActivo ? '0 .12em' : 0, borderRadius: 6, transform: `scale(${act ? 1.08 : 1}) translateY(${act ? -4 : 0}px)`, WebkitTextStroke: conTrazo ? (v ? '10px #000' : '8px #000') : 0, paintOrder: 'stroke fill', textShadow: cap.brillo ? `0 0 14px ${act ? P.a : P.b}, 0 0 34px ${act ? P.a : P.b}` : conTrazo ? '0 6px 18px rgba(0,0,0,.6)' : E.claro ? 'none' : '0 2px 10px rgba(0,0,0,.6)' }}>{p.w.replace(/[.,;:]$/, '')}</span>;
        })}
      </div>
    </div>
  );
}

// ---------- mascota Trix: parpadea, mira y "habla" con la voz ----------
export function Mascota({ x, y, size = 200, P, palabras, mirar = 0, saluda = false, salta = false, delay = 0 }) {
  const E = useEstilo();
  if (!E.mascota) return null;
  return <MascotaDibujo {...{ x, y, size, P, palabras, mirar, saluda, salta, delay }} />;
}
function MascotaDibujo({ x, y, size, P, palabras, mirar, saluda, salta, delay }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = useSp();
  const s = sp(delay, { damping: 10 });
  const t = f / fps;
  const habla = (palabras || []).some((p) => t >= p.t && t < p.t + p.d);
  const boca = habla ? 5 + Math.abs(Math.sin(f * 0.85)) * 13 : 3;
  const ciclo = (f + 37) % 96;
  const ojo = ciclo < 4 ? 0.12 : 1;
  const brinco = salta ? -Math.abs(Math.sin(f / 6)) * 40 : Math.sin(f / 15) * 6;
  const brazo = saluda ? Math.sin(f / 4) * 30 : Math.sin(f / 18) * 8;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `translateY(${brinco}px) scale(${s})` }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible', filter: 'drop-shadow(0 14px 22px rgba(0,0,0,.45))' }}>
        <defs>
          <radialGradient id="mtxCuerpo" cx="38%" cy="30%" r="75%"><stop offset="0%" stopColor="#fff" stopOpacity=".9" /><stop offset="22%" stopColor={P.a} /><stop offset="100%" stopColor={P.b} /></radialGradient>
        </defs>
        <g transform={`rotate(${brazo} 160 110)`}><rect x="150" y="96" width="46" height="22" rx="11" fill={P.b} /></g>
        <rect x="8" y="100" width="40" height="20" rx="10" fill={P.b} transform={`rotate(${-brazo / 3} 40 110)`} />
        <path d="M100 18 C150 18 178 50 178 102 C178 158 146 184 100 184 C54 184 22 158 22 102 C22 50 50 18 100 18Z" fill="url(#mtxCuerpo)" />
        <path d="M52 40 C70 26 92 24 104 26" stroke="#fff" strokeOpacity=".55" strokeWidth="7" strokeLinecap="round" fill="none" />
        {[70, 130].map((cx, i) => (
          <g key={i} transform={`translate(${cx} 92) scale(1 ${ojo})`}>
            <ellipse rx="20" ry="24" fill="#fff" />
            <circle cx={mirar * 8} cy="3" r="11" fill="#140a2a" />
            <circle cx={mirar * 8 + 4} cy="-3" r="4" fill="#fff" />
          </g>
        ))}
        <ellipse cx="100" cy="140" rx={habla ? 15 : 18} ry={boca} fill="#2a0a20" />
        <text x="100" y="178" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="800" fontSize="22" fill="#140a2a" opacity=".55">[π]</text>
      </svg>
    </div>
  );
}

/** Confeti determinista (misma fisica siempre). */
export function Confeti({ x, y, inicio = 0, P, n = 70 }) {
  const f = useCurrentFrame() - inicio;
  if (f < 0 || f > 75) return null;
  const cols = [P.a, P.b, P.c, '#fff', '#ffd23b'];
  return Array.from({ length: n }, (_, i) => {
    const ang = random('ca' + i) * Math.PI * 2, vel = 18 + random('cv' + i) * 30;
    const px = x + Math.cos(ang) * vel * f, py = y + Math.sin(ang) * vel * f * 0.8 + 0.9 * f * f;
    const r = f * (8 + random('cr' + i) * 14);
    const w = 14 + random('cw' + i) * 16;
    return <div key={i} style={{ position: 'absolute', left: px, top: py, width: w, height: w * (i % 3 ? 0.45 : 1), borderRadius: i % 3 ? 3 : '50%', background: cols[i % cols.length], transform: `rotate(${r}deg)`, opacity: interpolate(f, [50, 75], [1, 0], clamp) }} />;
  });
}

/** Estrellitas que titilan alrededor de algo importante. */
export function Destellos({ x, y, r = 300, P, n = 7 }) {
  const f = useCurrentFrame();
  return Array.from({ length: n }, (_, i) => {
    const a = random('da' + i) * Math.PI * 2, d = r * (0.6 + random('dd' + i) * 0.5);
    const s = Math.max(0, Math.sin((f + random('df' + i) * 60) / 9));
    return <div key={i} style={{ position: 'absolute', left: x + Math.cos(a) * d - 20, top: y + Math.sin(a) * d - 20, width: 40, height: 40, transform: `scale(${s}) rotate(45deg)`, background: `radial-gradient(circle, #fff 0 12%, ${i % 2 ? P.a : P.c} 13% 22%, transparent 23%)`, clipPath: 'polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%)' }} />;
  });
}
