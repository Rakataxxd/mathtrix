// Catalogo de escenas. Cada una recibe datos del guion; todo se anima por numero de cuadro.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random } from 'remotion';
import { Objeto, Emoji, Mascota, Confeti, Destellos, useSp, useVert, DISPLAY, MONO, FUENTE, clamp } from './fx.jsx';
import { useEstilo, useClaveEstilo } from './estilos.jsx';
import { createContext, useContext } from 'react';
import { Expr, Morph, tamanoExpr } from './morph.jsx';

const vidrio = (P, extra = {}) => ({
  background: 'var(--mtx-panel-bg)', border: 'var(--mtx-panel-borde)', boxShadow: 'var(--mtx-panel-sombra)', borderRadius: 'var(--mtx-panel-radio)', ...extra,
});
export const tono = (hex, a) => { const h = String(hex || '#ffffff').replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
/** Elecciones del alumno en las preguntas del video (se pasan desde el reproductor). */
export const EleccionesCtx = createContext({});

function Chip({ children, P, style, delay = 0 }) {
  const sp = useSp();
  const s = sp(delay);
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 30px', borderRadius: 999, background: 'var(--mtx-chip-bg)', color: 'var(--mtx-chip-tx)', border: 'var(--mtx-chip-borde)', borderRadius: 'var(--mtx-chip-radio)', boxShadow: 'var(--mtx-chip-sombra)', fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`, ...style }}>{children}</div>;
}

// ---------- GANCHO ----------
function palabrasGancho(txt) {
  const out = []; let resalta = false;
  for (const w of String(txt || '').split(/\s+/).filter(Boolean)) {
    const ini = w.startsWith('*'), fin = w.replace(/[?!¿¡.,]+$/, '').endsWith('*');
    if (ini) resalta = true;
    out.push({ w: w.replace(/\*/g, ''), r: resalta });
    if (fin) resalta = false;
  }
  return out;
}
export function Gancho({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const E = useEstilo(); const clave = useClaveEstilo();
  const escribe = E.entrada === 'escribir';
  const { W, H, v } = useVert();
  const ws = palabrasGancho(e.texto);
  const largo = (e.texto || '').length;
  const fs = (v ? (largo < 32 ? 112 : largo < 48 ? 94 : 80) : (largo < 32 ? 100 : largo < 48 ? 84 : 72)) * (clave === 'neon' ? 1.28 : clave === 'tiza' || clave === 'cuaderno' ? 1.08 : 1);
  const ox = v ? W / 2 : W * 0.27, oy = v ? H * 0.27 : H * 0.5;
  const shake = interpolate(f, [4, 26], [16, 0], clamp) * (escribe ? 0 : E.camara);
  const sx = Math.sin(f * 2.7) * shake, sy = Math.cos(f * 3.1) * shake;
  const flash = escribe ? 0 : interpolate(f, [0, 6], [0.85, 0], clamp);
  const ruleta = Array.from({ length: 4 }, (_, i) => Math.floor(random('d' + i + Math.floor(f / 2)) * 10)).join('');
  const sticker = sp(18, { damping: 8 });
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      {/* rayos giratorios detras del objeto */}
      {(clave === 'ilustrado' || clave === 'neon') && <div style={{ position: 'absolute', left: ox - 900, top: oy - 900, width: 1800, height: 1800, borderRadius: '50%', background: `repeating-conic-gradient(from ${f * 0.7}deg, ${P.a}22 0deg 9deg, transparent 9deg 22deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', opacity: sp(0) }} />}
      <Objeto e={e.emoji} size={v ? 460 : 500} x={ox} y={oy} P={P} intensidad={1.4} />
      {(e.extras || []).slice(0, 2).map((x, i) => {
        const a = f * 0.035 + i * Math.PI + 0.6;
        const r = v ? 330 : 360;
        return <div key={i} style={{ position: 'absolute', left: ox + Math.cos(a) * r - 75, top: oy + Math.sin(a) * r * 0.55 - 75, transform: `scale(${sp(10 + i * 5)})` }}><Emoji e={x} size={150} /></div>;
      })}
      <div style={{ position: 'absolute', left: ox + (v ? 150 : 170), top: oy - (v ? 300 : 320), transform: `scale(${sticker}) rotate(${12 + Math.sin(f / 6) * 5}deg)`, padding: '14px 26px', borderRadius: 22, background: P.b, color: P.tx, fontFamily: MONO, fontWeight: 800, fontSize: 52, boxShadow: '0 14px 40px rgba(0,0,0,.4)' }}>= {f < 60 ? ruleta : '¿?'}</div>
      <div style={{ position: 'absolute', left: v ? W * 0.05 : W * 0.5, right: W * 0.05, top: v ? H * 0.445 : 0, bottom: v ? undefined : 0, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: v ? 'center' : 'flex-start', gap: '0 .26em', fontFamily: DISPLAY, fontWeight: 900, fontSize: fs, lineHeight: clave === 'neon' ? 1.12 : 1.06, letterSpacing: clave === 'neon' ? '.01em' : '-0.02em', textAlign: v ? 'center' : 'left' }}>
        {ws.map((w, i) => {
          const s = sp(6 + i * 3, { damping: 9, mass: 0.5 });
          const k = escribe ? interpolate(f, [3 + i * 2.6, 9 + i * 2.6], [0, 1], clamp) : 0;
          const anim = escribe ? { opacity: k > 0 ? 1 : 0, clipPath: `inset(-20% ${(1 - k) * 100}% -20% 0)` } : { opacity: Math.min(1, s * 2), transform: `scale(${interpolate(s, [0, 1], [2.6, 1])}) rotate(${(1 - s) * (i % 2 ? 9 : -9)}deg)` };
          return <span key={i} style={{ display: 'inline-block', ...anim, color: w.r ? 'var(--mtx-resalta-tx)' : P.tx, background: w.r ? 'var(--mtx-resalta-bg)' : 'transparent', padding: w.r ? '0 .14em' : 0, borderRadius: '.12em', margin: '.04em 0', WebkitTextStroke: w.r ? 0 : 'var(--mtx-trazo-texto)', textShadow: w.r ? 'none' : 'var(--mtx-sombra-texto)', boxShadow: w.r ? 'var(--mtx-resalta-sombra)' : 'none', textDecoration: w.r && escribe ? 'underline' : 'none', textDecorationThickness: '.08em', textUnderlineOffset: '.12em' }}>{w.w}</span>;
        })}
      </div>
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
    </AbsoluteFill>
  );
}

// ---------- DATOS ----------
export function Datos({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const datos = (e.datos || []).slice(0, 4);
  const ox = v ? W / 2 : W * 0.25, oy = v ? H * 0.25 : H * 0.53;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 150 : 70, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 40 : 34 }}>{e.titulo || 'Los datos'}</Chip></div>
      <Objeto e={e.emoji || datos[0]?.emoji} size={v ? 330 : 400} x={ox} y={oy} P={P} delay={2} />
      <div style={{ position: 'absolute', left: v ? W * 0.07 : W * 0.47, right: W * 0.06, top: v ? H * 0.39 : H * 0.16, bottom: v ? H * 0.38 : H * 0.12, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: v ? 22 : 26 }}>
        {datos.map((d, i) => {
          const s = sp(10 + i * 9, { damping: 13 });
          return (
            <div key={i} style={{ ...vidrio(P), display: 'flex', alignItems: 'center', gap: 26, padding: v ? '18px 28px' : '20px 32px', transform: `translateX(${(1 - s) * 500}px) rotate(${(1 - s) * 6}deg)`, opacity: s }}>
              <Emoji e={d.emoji} size={v ? 84 : 92} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FUENTE, fontWeight: 700, fontSize: v ? 34 : 32, color: 'var(--mtx-tx2)' }}>{d.etiqueta}</div>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: v ? 62 : 58, color: P.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.simbolo && <span style={{ color: P.a }}>{d.simbolo} = </span>}{d.valor}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!v && <Mascota x={W * 0.1} y={H * 0.85} size={170} P={P} palabras={e.palabras} mirar={1} delay={14} />}
    </AbsoluteFill>
  );
}

// ---------- FORMULA ----------
export function Formula({ e, P }) {
  const f = useCurrentFrame();
  const clave = useClaveEstilo();
  const sp = useSp();
  const { W, H, v } = useVert();
  const ancho = v ? W * 0.86 : W * 0.72;
  const maxEm = v ? 13 : 22;
  const size = tamanoExpr(e.formula, ancho * 0.9, v ? 118 : 130, maxEm);
  const s = sp(0, { damping: 14 });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 160 : 80, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 38 : 32 }}>La fórmula</Chip></div>
      <div style={{ position: 'absolute', left: (W - ancho) / 2, width: ancho, top: v ? H * 0.2 : H * 0.22, height: v ? H * 0.36 : H * 0.52, ...vidrio(P), transform: `perspective(1600px) rotateX(${(1 - s) * 28}deg) scale(${0.7 + s * 0.3})`, opacity: s, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40, ...(clave === 'ilustrado' ? { backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', backgroundSize: '48px 48px, 48px 48px, 100% 100%' } : {}) }}>
        <div style={{ width: '100%' }}><Expr s={e.formula} P={P} size={size} maxEm={maxEm} f={f - 8} stagger={2} /></div>
        {e.nota && <div style={{ fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 40 : 36, color: P.c, opacity: interpolate(f, [24, 34], [0, 1], clamp) }}>{e.nota}</div>}
      </div>
      <Destellos x={W / 2} y={v ? H * 0.38 : H * 0.48} r={v ? 520 : 760} P={P} />
      <Mascota x={v ? W * 0.82 : W * 0.9} y={v ? H * 0.6 : H * 0.84} size={v ? 190 : 170} P={P} palabras={e.palabras} mirar={-1} delay={12} />
    </AbsoluteFill>
  );
}

// ---------- PASO ----------
export function Paso({ e, P, n, total }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const ancho = v ? W * 0.88 : W * 0.74;
  const maxEm = v ? 13 : 22;
  const size = Math.min(tamanoExpr(e.expr, ancho * 0.9, v ? 112 : 124, maxEm), e.desde ? tamanoExpr(e.desde, ancho * 0.9, v ? 112 : 124, maxEm) : 999);
  const p = sp(5, { damping: 16, mass: 0.9 });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 160 : 80, left: 0, right: 0, textAlign: 'center' }}>
        <Chip P={P} style={{ fontSize: v ? 36 : 30 }}><span style={{ fontFamily: MONO }}>PASO {n}/{total}</span>{e.nota ? <span style={{ opacity: 0.85, textTransform: 'none', fontFamily: FUENTE }}>· {e.nota}</span> : null}</Chip>
      </div>
      <div style={{ position: 'absolute', left: (W - ancho) / 2, width: ancho, top: v ? H * 0.19 : H * 0.2, height: v ? H * 0.38 : H * 0.56, ...vidrio(P), display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30, padding: '30px 0' }}>
        {e.desde && <div style={{ opacity: 0.38, filter: 'grayscale(1)' }}><Expr s={e.desde} P={P} size={size * 0.5} maxEm={maxEm * 1.6} /></div>}
        {e.desde && <div style={{ textAlign: 'center', fontSize: 44, color: P.a, opacity: 0.8, transform: `translateY(${Math.sin(f / 6) * 6}px)` }}>▼</div>}
        <div>{e.desde ? <Morph desde={e.desde} hacia={e.expr} p={p} P={P} size={size} maxEm={maxEm} /> : <Expr s={e.expr} P={P} size={size} maxEm={maxEm} f={f} />}</div>
      </div>
      {!v && <Mascota x={W * 0.08} y={H * 0.82} size={150} P={P} palabras={e.palabras} mirar={1} />}
    </AbsoluteFill>
  );
}

// ---------- RESULTADO ----------
function partirValor(s) {
  const m = /^(.*?)(-?[\d,]*\.?\d+)(.*)$/.exec(String(s || ''));
  if (!m) return null;
  const n = parseFloat(m[2].replace(/,/g, ''));
  const dec = (m[2].split('.')[1] || '').length;
  return { pre: m[1], n, dec, post: m[3] };
}
export function Resultado({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const pv = partirValor(e.valor);
  const k = interpolate(f, [8, 38], [0, 1], clamp);
  const ease = 1 - Math.pow(1 - k, 3);
  const txt = pv ? pv.pre + (pv.n * ease).toLocaleString('en-US', { minimumFractionDigits: k < 1 ? 0 : pv.dec, maximumFractionDigits: pv.dec }) + pv.post : e.valor;
  const largo = String(e.valor || '').length + String(e.unidad || '').length * 0.5;
  const fs = Math.min(v ? 230 : 240, (v ? W * 0.9 : W * 0.8) / Math.max(3, largo * 0.68));
  const golpe = interpolate(f, [38, 44, 54], [1, 1.16, 1], clamp);
  const cy = v ? H * 0.36 : H * 0.45;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: W / 2 - 700, top: cy - 700, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, ${P.a}40, transparent 60%)`, transform: `scale(${0.6 + sp(36) * 0.5})` }} />
      <div style={{ position: 'absolute', top: v ? 170 : 70, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 40 : 34 }} delay={2}>Resultado</Chip></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy - fs * 0.7, textAlign: 'center', transform: `scale(${golpe})` }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: fs, letterSpacing: '-0.03em', background: 'var(--mtx-resultado)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'var(--mtx-resultado-filtro)' }}>{txt}</span>
        {e.unidad && <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: fs * 0.36, color: P.tx, marginLeft: 18 }}>{e.unidad}</span>}
      </div>
      <Objeto e={e.emoji} size={v ? 250 : 240} x={v ? W * 0.5 : W * 0.15} y={v ? H * 0.17 + 40 : H * 0.72} P={P} delay={30} intensidad={1.6} />
      {e.comparacion && (
        <div style={{ position: 'absolute', left: W * 0.08, right: W * 0.08, top: v ? H * 0.47 : H * 0.66, textAlign: 'center', transform: `translateY(${(1 - sp(44)) * 120}px)`, opacity: sp(44) }}>
          <div style={{ ...vidrio(P), display: 'inline-block', padding: v ? '22px 38px' : '20px 40px', fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 50 : 44, color: P.tx }}>{e.comparacion}</div>
        </div>
      )}
      <Confeti x={W / 2} y={cy} inicio={38} P={P} />
      <Mascota x={v ? W * 0.84 : W * 0.88} y={v ? H * 0.12 + 30 : H * 0.8} size={v ? 170 : 170} P={P} palabras={e.palabras} salta delay={40} />
    </AbsoluteFill>
  );
}

// ---------- ICONOS (visualizar cantidades) ----------
export function Iconos({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const n = e.n || 10;
  const mostrar = Math.min(n, 100);
  const cada = n > 100 ? Math.ceil(n / 100) : 1;
  const cols = v ? Math.min(10, Math.ceil(Math.sqrt(mostrar))) : Math.min(20, Math.ceil(Math.sqrt(mostrar * 2.2)));
  const filas = Math.ceil(mostrar / cols);
  const areaW = v ? W * 0.86 : W * 0.7, areaH = v ? H * 0.36 : H * 0.55;
  const tam = Math.min(areaW / cols, areaH / filas) * 0.9;
  const lleno = interpolate(f, [8, 8 + Math.min(50, mostrar * 1.2)], [0, mostrar], clamp);
  const cuenta = Math.round(lleno * cada);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 150 : 60, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: v ? 150 : 130, color: P.tx, textShadow: `0 10px 0 ${P.b}88` }}>{Math.min(cuenta, n).toLocaleString('en-US')}</div>
      <div style={{ position: 'absolute', left: (W - cols * tam / 0.9) / 2, top: v ? H * 0.2 : H * 0.25, width: cols * tam / 0.9, display: 'flex', flexWrap: 'wrap' }}>
        {Array.from({ length: mostrar }, (_, i) => {
          const s = interpolate(lleno - i, [0, 1], [0, 1], clamp);
          return <div key={i} style={{ width: tam / 0.9, height: tam / 0.9, display: 'grid', placeItems: 'center', transform: `scale(${s * (1 + Math.sin((f + i * 3) / 8) * 0.04)}) rotate(${(1 - s) * 90}deg)`, opacity: s }}><Emoji e={e.emoji} size={tam} ligero={mostrar > 24} /></div>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: v ? H * 0.58 : H * 0.84, textAlign: 'center' }}>
        <Chip P={P} delay={20} style={{ fontSize: v ? 40 : 34 }}>{e.texto || `${n} en total`}{cada > 1 ? ` · cada uno = ${cada}` : ''}</Chip>
      </div>
    </AbsoluteFill>
  );
}

// ---------- FRACCION / PROBABILIDAD ----------
export function Fraccion({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const n = e.partes || 4, m = e.marcadas || 1;
  const R = v ? 330 : 330, cx = v ? W / 2 : W * 0.32, cy = v ? H * 0.33 : H * 0.52;
  const barrido = interpolate(f, [4, 26], [0, n], clamp);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs><radialGradient id="tajada" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" stopOpacity=".7" /><stop offset="35%" stopColor={P.a} /><stop offset="100%" stopColor={P.b} /></radialGradient></defs>
        <circle cx={cx} cy={cy + 24} r={R} fill="rgba(0,0,0,.35)" />
        {Array.from({ length: n }, (_, i) => {
          if (barrido < i) return null;
          const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
          const marc = i < m;
          const sal = marc ? sp(30 + i * 3, { damping: 9 }) * 46 : 0;
          const am = (a0 + a1) / 2;
          const ox = Math.cos(am) * sal, oy = Math.sin(am) * sal;
          const x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R, x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
          const d = `M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}Z`;
          return <path key={i} d={d} transform={`translate(${ox} ${oy})`} fill={marc ? 'url(#tajada)' : tono(P.tx, 0.1)} stroke={tono(P.tx, 0.55)} strokeWidth={n > 24 ? 1.5 : 3} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: v ? 0 : W * 0.56, right: v ? 0 : W * 0.04, top: v ? H * 0.53 : H * 0.3, textAlign: v ? 'center' : 'left', transform: `scale(${sp(18)})` }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: v ? 150 : 170, color: P.tx, textShadow: `0 10px 0 ${P.b}99` }}>{e.etiqueta || `${m}/${n}`}</div>
        <div style={{ fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 44 : 46, color: P.c }}>{m} de cada {n} · {((m / n) * 100).toLocaleString('en-US', { maximumFractionDigits: 1 })} %</div>
      </div>
    </AbsoluteFill>
  );
}

// ---------- COMPARACION ----------
export function Comparacion({ e, P }) {
  const sp = useSp();
  const { W, H, v } = useVert();
  const barras = (e.barras || []).slice(0, 4);
  const max = Math.max(1, ...barras.map((b) => Math.abs(b.num || 0)));
  const colores = [P.a, P.b, P.c, '#ffd23b'];
  const ancho = v ? W * 0.62 : W * 0.6;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 160 : 70, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 38 : 32 }}>Comparemos{e.unidad ? ` · ${e.unidad}` : ''}</Chip></div>
      <div style={{ position: 'absolute', left: W * 0.06, right: W * 0.06, top: v ? H * 0.17 : H * 0.2, bottom: v ? H * 0.42 : H * 0.12, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: v ? 40 : 34 }}>
        {barras.map((b, i) => {
          const s = sp(8 + i * 8, { damping: 15 });
          const w = Math.max(0.04, Math.abs(b.num || 0) / max) * ancho * s;
          return (
            <div key={i}>
              <div style={{ fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 40 : 36, color: P.tx, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}><Emoji e={b.emoji} size={v ? 64 : 58} />{b.etiqueta}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ height: v ? 74 : 64, width: w, borderRadius: 999, background: `linear-gradient(90deg, ${colores[i]}aa, ${colores[i]})`, boxShadow: `0 0 30px ${colores[i]}66, inset 0 2px 0 rgba(255,255,255,.5)` }} />
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: v ? 50 : 46, color: P.tx, opacity: s, whiteSpace: 'nowrap' }}>{b.valor}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------- GRAFICA ----------
export function Grafica({ e, P }) {
  const f = useCurrentFrame();
  const { W, H, v } = useVert();
  const pts = e.puntos || [];
  if (pts.length < 2) return <Formula e={{ ...e, formula: e.etiqueta || e.funcion }} P={P} />;
  const x0 = v ? W * 0.08 : W * 0.12, x1 = v ? W * 0.92 : W * 0.88, y0 = v ? H * 0.15 : H * 0.14, y1 = v ? H * 0.56 : H * 0.86;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
  const pad = (ymax - ymin) * 0.12 || 1; ymin -= pad; ymax += pad;
  const X = (x) => x0 + (x - xmin) / (xmax - xmin || 1) * (x1 - x0);
  const Y = (y) => y1 - (y - ymin) / (ymax - ymin || 1) * (y1 - y0);
  const sc = pts.map((p) => [X(p[0]), Y(p[1])]);
  let L = 0; for (let i = 1; i < sc.length; i++) L += Math.hypot(sc[i][0] - sc[i - 1][0], sc[i][1] - sc[i - 1][1]);
  const p = interpolate(f, [8, 58], [0, 1], clamp);
  const d = 'M' + sc.map((q) => q.join(' ')).join(' L');
  const idx = Math.min(sc.length - 1, Math.floor(p * (sc.length - 1)));
  const tip = sc[idx];
  const paso = Math.max(1, Math.round((xmax - xmin) / 8));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <rect x={x0 - 20} y={y0 - 20} width={x1 - x0 + 40} height={y1 - y0 + 40} rx="30" fill={tono(P.tx, 0.06)} stroke={tono(P.tx, 0.18)} strokeWidth="2" />
        {Array.from({ length: Math.floor((xmax - xmin) / paso) + 1 }, (_, i) => { const xv = Math.ceil(xmin) + i * paso; return <line key={'gx' + i} x1={X(xv)} x2={X(xv)} y1={y0} y2={y1} stroke={tono(P.tx, 0.08)} strokeWidth="2" />; })}
        {ymin < 0 && ymax > 0 && <line x1={x0} x2={x1} y1={Y(0)} y2={Y(0)} stroke={tono(P.tx, 0.55)} strokeWidth="4" />}
        {xmin < 0 && xmax > 0 && <line x1={X(0)} x2={X(0)} y1={y0} y2={y1} stroke={tono(P.tx, 0.55)} strokeWidth="4" />}
        <path d={d} fill="none" stroke={P.a} strokeOpacity=".35" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
        <path d={d} fill="none" stroke={P.a} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
        {p > 0 && <circle cx={tip[0]} cy={tip[1]} r={20} fill="#fff" stroke={P.b} strokeWidth="8" />}
      </svg>
      {p > 0 && <div style={{ position: 'absolute', left: Math.min(tip[0] + 26, W - 380), top: tip[1] - 80, fontFamily: MONO, fontWeight: 800, fontSize: 40, color: P.tx, background: 'rgba(0,0,0,.5)', padding: '6px 16px', borderRadius: 14 }}>({pts[idx][0]}, {pts[idx][1].toLocaleString('en-US', { maximumFractionDigits: 2 })})</div>}
      <div style={{ position: 'absolute', left: x0, top: y0 - (v ? 6 : 4), padding: '10px 26px', fontFamily: MONO, fontWeight: 800, fontSize: v ? 54 : 50, color: P.a }}>{e.etiqueta || e.funcion}</div>
    </AbsoluteFill>
  );
}

// ---------- CTA ----------
export function Cta({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const s = sp(0, { damping: 7, mass: 0.6 });
  const pulso = 1 + Math.sin(f / 5) * 0.04;
  return (
    <AbsoluteFill>
      {[0, 1, 2].map((i) => {
        const k = ((f + i * 20) % 60) / 60;
        return <div key={i} style={{ position: 'absolute', left: W / 2 - 300, top: (v ? H * 0.24 : H * 0.36) - 300, width: 600, height: 600, borderRadius: '50%', border: `6px solid ${P.a}`, opacity: 1 - k, transform: `scale(${0.5 + k * 1.6})` }} />;
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: v ? H * 0.15 : H * 0.18, textAlign: 'center', transform: `scale(${s * pulso}) rotate(${(1 - s) * -12 - 3}deg)` }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: v ? 210 : 190, color: P.a, WebkitTextStroke: 'var(--mtx-trazo-texto)', textShadow: 'var(--mtx-sombra-texto)' }}>¡TE TOCA!</span>
      </div>
      <div style={{ position: 'absolute', left: W * 0.08, right: W * 0.08, top: v ? H * 0.33 : H * 0.48, textAlign: 'center', opacity: sp(10), transform: `translateY(${(1 - sp(10)) * 80}px)` }}>
        <div style={{ ...vidrio(P), display: 'inline-block', padding: v ? '26px 40px' : '24px 46px', fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 58 : 52, color: P.tx }}>{e.texto}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: v ? H * 0.47 : H * 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: v ? 40 : 36, color: P.tx, opacity: sp(18), letterSpacing: '.06em' }}>{v ? 'EL RETO SALE AL TERMINAR' : 'EL RETO APARECE AL TERMINAR EL VIDEO'}</div>
        {[0, 1, 2].map((i) => <div key={i} style={{ fontSize: 70, lineHeight: 0.6, color: P.a, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((f - i * 4) / 5)), transform: `translateY(${Math.sin((f - i * 4) / 5) * 8}px)` }}>⌄</div>)}
      </div>
      <Mascota x={v ? W * 0.18 : W * 0.12} y={v ? H * 0.52 : H * 0.66} size={v ? 220 : 220} P={P} palabras={e.palabras} saluda mirar={1} delay={6} />
    </AbsoluteFill>
  );
}


// ---------- PREGUNTA dentro del video (if-else) ----------
/** Rectangulos de las opciones en coordenadas del video: el reproductor pone botones encima, justo ahi. */
export function layoutPregunta(W, H, n) {
  const v = H > W;
  if (v) { const w = W * 0.84, h = 150, g = 34, y0 = H * 0.36; return Array.from({ length: n }, (_, i) => ({ x: (W - w) / 2, y: y0 + i * (h + g), w, h })); }
  const g = 36, w = (W * 0.86 - g * (n - 1)) / n, h = 230, y0 = H * 0.45;
  return Array.from({ length: n }, (_, i) => ({ x: W * 0.07 + i * (w + g), y: y0, w, h }));
}
export function Pregunta({ e, P }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = useSp();
  const { W, H, v } = useVert();
  const elecciones = useContext(EleccionesCtx);
  const eleccion = elecciones?.[e.i];
  const ops = (e.opciones || []).slice(0, 3);
  const rects = layoutPregunta(W, H, ops.length);
  const enRespuesta = f >= e.q;
  const fr = f - e.q;
  const bien = eleccion === undefined || eleccion === e.correcta;
  const VERDE = '#3bdc7a', ROJO = '#ff5b6b';
  const golpe = enRespuesta ? sp(e.q, { damping: 8 }) : 0;
  const temblor = enRespuesta && !bien ? Math.sin(fr * 2.2) * interpolate(fr, [0, 18], [18, 0], clamp) : 0;
  const cons = enRespuesta && eleccion !== undefined && !bien && e.consecuencia ? e.consecuencia : null;
  const sc = cons ? sp(e.q + 9, { damping: 10 }) : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 150 : 60, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 36 : 30 }}>¿Qué harías vos?</Chip></div>
      <div style={{ position: 'absolute', left: W * 0.07, right: W * 0.07, top: v ? H * 0.15 : H * 0.17, height: v ? H * 0.19 : H * 0.24, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: v ? 70 : 64, lineHeight: 1.12, color: P.tx, opacity: sp(4) * (1 - sc), textShadow: 'var(--mtx-sombra-texto)' }}>{e.pregunta}</div>
      {cons && (
        <div style={{ position: 'absolute', left: W * 0.06, right: W * 0.06, top: v ? H * 0.19 : H * 0.18, height: v ? H * 0.16 : H * 0.24, display: 'flex', alignItems: 'center', gap: v ? 26 : 34, padding: v ? '0 34px' : '0 44px', borderRadius: 'var(--mtx-panel-radio)', background: tono(ROJO, 0.16), border: `4px solid ${ROJO}`, boxShadow: `0 20px 60px ${ROJO}44`, opacity: sc, transform: `scale(${0.7 + sc * 0.3}) rotate(${(1 - sc) * -4}deg)` }}>
          <div style={{ flex: 'none', fontSize: v ? 120 : 110, transform: `rotate(${Math.sin(fr / 4) * 8}deg) scale(${1 + 0.06 * Math.sin(fr / 3)})` }}><Emoji e={cons.emoji} size={v ? 130 : 120} ligero /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: v ? 30 : 28, letterSpacing: '.08em', color: ROJO }}>SI HACÉS ESO…</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: v ? 58 : 54, lineHeight: 1.08, color: P.tx }}>{cons.texto}</div>
          </div>
        </div>
      )}
      {ops.map((o, i) => {
        const r = rects[i];
        const s = sp(10 + i * 6, { damping: 13 });
        const esCorrecta = i === e.correcta, esElegida = i === eleccion;
        let borde = tono(P.tx, 0.35), fondo = 'var(--mtx-panel-bg)', marca = null;
        if (enRespuesta) {
          if (esCorrecta) { borde = VERDE; fondo = tono(VERDE, 0.22); marca = '✓'; }
          else if (esElegida) { borde = ROJO; fondo = tono(ROJO, 0.2); marca = '✗'; }
          else { fondo = tono(P.tx, 0.03); }
        } else {
          const pulso = 0.5 + 0.5 * Math.sin((f - i * 8) / 7);
          borde = tono(P.a, 0.4 + pulso * 0.5);
        }
        const opac = enRespuesta && !esCorrecta && !esElegida ? 0.35 : 1;
        return (
          <div key={i} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 'var(--mtx-panel-radio)', border: `4px solid ${borde}`, background: fondo, boxShadow: enRespuesta && esCorrecta ? `0 0 40px ${VERDE}88` : 'var(--mtx-panel-sombra)', display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px', opacity: s * opac, transform: `translateY(${(1 - s) * 80}px) translateX(${esElegida ? temblor : 0}px) scale(${enRespuesta && esCorrecta ? 1 + golpe * 0.04 : 1})` }}>
            <div style={{ width: v ? 74 : 70, height: v ? 74 : 70, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, background: marca ? (marca === '✓' ? VERDE : ROJO) : P.a, color: '#0b0420' }}>{marca || 'ABC'[i]}</div>
            <div style={{ fontFamily: FUENTE, fontWeight: 800, fontSize: v ? 50 : 46, color: P.tx, lineHeight: 1.15 }}>{o}</div>
          </div>
        );
      })}
      {!enRespuesta && <div style={{ position: 'absolute', left: 0, right: 0, top: v ? rects.at(-1).y + rects.at(-1).h + 40 : rects[0].y + rects[0].h + 40, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: v ? 38 : 32, color: P.tx === '#1d2b5a' ? P.c : P.a, opacity: 0.6 + 0.4 * Math.sin(f / 6) }}>👆 TOCÁ TU RESPUESTA</div>}
      {enRespuesta && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: v ? H * 0.115 : H * 0.06, textAlign: 'center', transform: `scale(${golpe}) rotate(${bien ? -3 : 3}deg)` }}>
          <span style={{ display: 'inline-block', fontFamily: DISPLAY, fontWeight: 900, fontSize: v ? 120 : 110, color: eleccion === undefined ? P.a : bien ? VERDE : ROJO, textShadow: '0 10px 30px rgba(0,0,0,.45)', background: E_FONDO(P), padding: '0 .3em', borderRadius: 24 }}>{eleccion === undefined ? 'RESPUESTA' : bien ? '¡EXACTO!' : '¡NO! 😬'}</span>
        </div>
      )}
      {enRespuesta && bien && eleccion !== undefined && <Confeti x={W / 2} y={H * 0.25} inicio={e.q + 4} P={P} n={50} />}
    </AbsoluteFill>
  );
}
const E_FONDO = (P) => tono(P.f1, 0.75);

// ---------- REVISION: los pasos que el alumno escribio (de su foto) con ✓ / ✗ ----------
export function Revision({ e, P }) {
  const f = useCurrentFrame();
  const sp = useSp();
  const { W, H, v } = useVert();
  const pasos = (e.pasos || []).slice(0, 6);
  const n = Math.max(1, pasos.length);
  const cada = Math.max(12, Math.min(30, Math.floor((e.duracion - 40) / n)));
  const top = v ? H * 0.2 : H * 0.17, alto = v ? H * 0.56 : H * 0.7;
  const fila = Math.min(v ? 170 : 130, (alto - 60) / n);
  const fs = Math.min(v ? 66 : 54, fila * 0.48);
  const VERDE = '#1f9d55', ROJO = '#e5383b';
  const hoja = sp(2, { damping: 14 });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: v ? 110 : 40, left: 0, right: 0, textAlign: 'center' }}><Chip P={P} style={{ fontSize: v ? 38 : 30 }}>📸 {e.titulo || 'Tu solución'}</Chip></div>
      <div style={{ position: 'absolute', left: W * (v ? 0.07 : 0.16), right: W * (v ? 0.07 : 0.16), top, height: alto, borderRadius: 18, background: '#fbf8f1', boxShadow: '0 30px 70px rgba(0,0,0,.35)', overflow: 'hidden', transform: `translateY(${(1 - hoja) * 120}px) rotate(${-1.6 + (1 - hoja) * 6}deg)`, opacity: hoja }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${fila - 3}px, #c9dcf2 ${fila - 3}px ${fila - 1}px)`, backgroundPosition: '0 30px' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 86, width: 3, background: '#f2a0a8' }} />
        {pasos.map((p, i) => {
          const d = 10 + i * cada;
          const escribe = interpolate(f, [d, d + 12], [0, 100], clamp);
          const sello = sp(d + 10, { damping: 9 });
          const raya = interpolate(f, [d + 14, d + 22], [0, 100], clamp);
          const pulso = !p.ok && f > 10 + n * cada ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
          return (
            <div key={i} style={{ position: 'absolute', left: 110, right: 40, top: 30 + i * fila, height: fila, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Kalam'", fontWeight: 700, fontSize: fs, color: '#1d2b5a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', clipPath: `inset(0 ${100 - escribe}% 0 0)`, textShadow: pulso ? `0 0 ${18 * pulso}px rgba(229,56,59,.6)` : 'none' }}>{p.texto}</div>
                {!p.ok && <div style={{ position: 'absolute', left: -6, top: '52%', height: 6, width: `${raya}%`, background: ROJO, borderRadius: 4, transform: 'rotate(-2deg)' }} />}
                {p.nota && <div style={{ fontFamily: FUENTE, fontWeight: 700, fontSize: fs * 0.42, color: p.ok ? VERDE : ROJO, opacity: sello, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ok ? '✓ ' : '✗ '}{p.nota}</div>}
              </div>
              <div style={{ flex: 'none', width: fila * 0.62, height: fila * 0.62, borderRadius: '50%', display: 'grid', placeItems: 'center', background: p.ok ? VERDE : ROJO, color: '#fff', fontFamily: DISPLAY, fontWeight: 900, fontSize: fila * 0.36, transform: `scale(${sello}) rotate(${(1 - sello) * -40}deg)`, boxShadow: `0 8px 20px ${p.ok ? 'rgba(31,157,85,.4)' : 'rgba(229,56,59,.45)'}` }}>{p.ok ? '✓' : '✗'}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
