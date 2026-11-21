// Formulas que se transforman simbolo a simbolo (idea de TransformMatchingTex de Manim).
// Fuente monoespaciada: cada simbolo ocupa 0.6em, asi la posicion se calcula sin medir el DOM.
import React from 'react';
import { interpolate } from 'remotion';
import { MONO, clamp } from './fx.jsx';
import { useEstilo } from './estilos.jsx';
import { tono } from './estilos.jsx';

/** Cada caracter en su celda de 0.6em: asi cualquier fuente (tiza, serif) respeta la posicion calculada. */
const celdas = (t) => ([...t].length === 1 ? t : [...t].map((c, i) => <span key={i} style={{ display: 'inline-block', width: '.6em', textAlign: 'center' }}>{c}</span>));

const ANCHO = 0.6, ESPACIO = 0.32;
export function tokens(s) {
  const out = [];
  const re = /(\d[\d,]*(?:\.\d+)?|[A-Za-zÁÉÍÓÚáéíóúñÑ]+|\s+|.)/gu;
  for (const m of String(s || '').matchAll(re)) out.push(/^\s+$/.test(m[0]) ? { t: ' ', sp: true } : { t: m[0] });
  return out;
}
const anchoDe = (k) => (k.sp ? ESPACIO : [...k.t].length * ANCHO);

/** Parte en renglones si no entra (formulas largas en 9:16) y centra cada renglon. */
export function maquetar(toks, maxEm) {
  const lineas = [[]];
  let w = 0;
  toks.forEach((k, i) => {
    const kw = anchoDe(k);
    const corte = k.sp && w > maxEm * 0.55 && (toks[i + 1] && /^[=+−\-·÷×]$/.test(toks[i + 1].t));
    if ((w + kw > maxEm || corte) && lineas.at(-1).length) { lineas.push([]); w = 0; if (k.sp) return; }
    lineas.at(-1).push({ ...k, idx: i }); w += kw;
  });
  const anchos = lineas.map((l) => l.reduce((a, k) => a + anchoDe(k), 0));
  const pos = new Array(toks.length);
  lineas.forEach((l, li) => {
    let x = -anchos[li] / 2;
    for (const k of l) { pos[k.idx] = { x, y: (li - (lineas.length - 1) / 2) * 1.35, w: anchoDe(k) }; x += anchoDe(k); }
  });
  toks.forEach((k, i) => { if (!pos[i]) pos[i] = { x: 0, y: 0, w: 0, oculto: true }; });
  return { pos, ancho: Math.max(...anchos, 1), lineas: lineas.length };
}

/** Empareja simbolos iguales entre un paso y el siguiente, respetando el orden. */
export function emparejar(A, B) {
  const usado = new Set();
  return B.map((b, j) => {
    if (b.sp) return -1;
    let mejor = -1, md = 1e9;
    A.forEach((a, i) => {
      if (a.sp || usado.has(i) || a.t !== b.t) return;
      const d = Math.abs(i / Math.max(1, A.length) - j / Math.max(1, B.length));
      if (d < md) { md = d; mejor = i; }
    });
    if (mejor >= 0) usado.add(mejor);
    return mejor;
  });
}

const VAR_COLORES = ['#7af8ff', '#ff8fe6', '#ffd23b', '#9bff8a', '#ffa86b', '#b9a3ff'];
const VAR_OSCUROS = ['#1c5fd6', '#d1307a', '#b8860b', '#1f8f4e', '#d2601a', '#6a3fd1'];
const VAR_MANIM = ['#58C4DD', '#FC6255', '#F7D96F', '#83C167', '#FF862F', '#9A72AC'];
export function colorDe(t, P, E) {
  const tx = P.tx || '#ffffff';
  if (/^\d/.test(t)) return tx;
  if (t === '=') return E?.claro ? P.b : P.a;
  if (/^[+−\-·÷×/()²³√π%]$/.test(t)) return tono(tx, 0.78);
  if (/^[A-Za-z]$/.test(t)) { const L = E?.claro ? VAR_OSCUROS : E?.nombre === 'Manim' ? VAR_MANIM : VAR_COLORES; return L[t.toLowerCase().charCodeAt(0) % L.length]; }
  return tx;
}

/** Expresion estatica que aparece simbolo por simbolo. */
export function Expr({ s, P, size, maxEm = 14, f = 999, stagger = 2, style }) {
  const E = useEstilo();
  const escribe = E.entrada === 'escribir';
  const italica = E.nombre === 'Manim';
  const toks = tokens(s);
  const { pos, lineas } = maquetar(toks, maxEm);
  return (
    <div style={{ position: 'relative', height: size * 1.35 * lineas, fontFamily: MONO, fontWeight: 800, fontSize: size, ...style }}>
      {toks.map((k, i) => {
        if (k.sp || pos[i].oculto) return null;
        const p = interpolate(f - i * stagger, [0, 8], [0, 1], clamp);
        const anim = escribe ? { opacity: p > 0 ? 1 : 0, clipPath: `inset(-30% ${(1 - p) * 100}% -30% 0)` } : { opacity: p, transform: `translateY(${(1 - p) * 0.5}em) scale(${0.6 + p * 0.4})` };
        return <span key={i} style={{ position: 'absolute', left: `calc(50% + ${pos[i].x}em)`, top: `calc(50% + ${pos[i].y - 0.62}em)`, color: colorDe(k.t, P, E), ...anim, whiteSpace: 'pre', fontStyle: italica && /^[A-Za-z]$/.test(k.t) ? 'italic' : 'normal', textShadow: E.claro ? 'none' : '0 0 .35em rgba(255,255,255,.18)' }}>{celdas(k.t)}</span>;
      })}
    </div>
  );
}

/** Transforma A en B: los que siguen viajan, los nuevos aparecen con resaltador, los que sobran se van. */
export function Morph({ desde, hacia, p, P, size, maxEm = 14 }) {
  const E = useEstilo();
  const A = tokens(desde), B = tokens(hacia);
  const la = maquetar(A, maxEm), lb = maquetar(B, maxEm);
  const par = emparejar(A, B);
  const usadosA = new Set(par.filter((x) => x >= 0));
  const alto = Math.max(la.lineas, lb.lineas);
  const e = p * p * (3 - 2 * p);
  const nuevos = B.map((k, j) => par[j] < 0 && !k.sp);
  const marca = interpolate(p, [0.55, 0.95], [0, 1], clamp);
  return (
    <div style={{ position: 'relative', height: size * 1.35 * alto, fontFamily: MONO, fontWeight: 800, fontSize: size }}>
      {/* resaltador detras de lo que cambio */}
      {B.map((k, j) => nuevos[j] && !lb.pos[j].oculto ? (
        <div key={'m' + j} style={{ position: 'absolute', left: `calc(50% + ${lb.pos[j].x - 0.06}em)`, top: `calc(50% + ${lb.pos[j].y - 0.5}em)`, width: `${(lb.pos[j].w + 0.12) * marca}em`, height: '1em', background: P.a, opacity: 0.28, borderRadius: '.18em' }} />
      ) : null)}
      {A.map((k, i) => {
        if (k.sp || usadosA.has(i) || la.pos[i].oculto) return null;
        const o = interpolate(p, [0, 0.45], [1, 0], clamp);
        return <span key={'a' + i} style={{ position: 'absolute', left: `calc(50% + ${la.pos[i].x}em)`, top: `calc(50% + ${la.pos[i].y - 0.62 - p * 0.6}em)`, color: colorDe(k.t, P, E), opacity: o, whiteSpace: 'pre', transform: `scale(${1 - p * 0.4})` }}>{celdas(k.t)}</span>;
      })}
      {B.map((k, j) => {
        if (k.sp || lb.pos[j].oculto) return null;
        const i = par[j];
        if (i >= 0) {
          const x = la.pos[i].x + (lb.pos[j].x - la.pos[i].x) * e;
          const y = la.pos[i].y + (lb.pos[j].y - la.pos[i].y) * e - Math.sin(e * Math.PI) * (la.pos[i].x !== lb.pos[j].x ? 0.45 : 0);
          return <span key={'b' + j} style={{ position: 'absolute', left: `calc(50% + ${x}em)`, top: `calc(50% + ${y - 0.62}em)`, color: colorDe(k.t, P, E), whiteSpace: 'pre' }}>{celdas(k.t)}</span>;
        }
        const o = interpolate(p, [0.4, 0.85], [0, 1], clamp);
        return <span key={'b' + j} style={{ position: 'absolute', left: `calc(50% + ${lb.pos[j].x}em)`, top: `calc(50% + ${lb.pos[j].y - 0.62 + (1 - o) * 0.4}em)`, color: k.t === '=' ? P.a : (P.tx || '#fff'), opacity: o, whiteSpace: 'pre', transform: `scale(${0.5 + o * 0.5})`, textShadow: E.claro ? 'none' : `0 0 .4em ${P.a}` }}>{celdas(k.t)}</span>;
      })}
    </div>
  );
}

export function tamanoExpr(s, disponiblePx, maxPx, maxEm) {
  const { ancho } = maquetar(tokens(s), maxEm);
  return Math.min(maxPx, disponiblePx / ancho);
}
