// Transiciones entre escenas (16 cuadros, tapan el corte). Nada de fundido generico:
// destello de color, iris que entra al objeto, barrido con el emoji del gancho y paneles que se cruzan.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { codEmoji } from './fx.jsx';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const DUR_TRANSICION = 16;
const POR_ESTILO = {
  ilustrado: ['barrido', 'iris', 'destello', 'paneles'], vector: ['iris', 'destello', 'barrido'], cinetica: ['paneles', 'destello', 'barrido'],
  neon: ['destello', 'barrido', 'paneles'], riso: ['paneles', 'barrido'], blueprint: ['paneles'], tiza: ['barrido'], cuaderno: ['barrido', 'paneles'], manim: [],
};
export function transicionDe(clave, i, semilla = 0) {
  const L = POR_ESTILO[clave] || POR_ESTILO.ilustrado;
  return L.length ? L[(i * 7 + semilla) % L.length] : null;
}

export function Transicion({ tipo, P, emoji, claro }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const medio = DUR_TRANSICION / 2;
  const entra = interpolate(f, [0, medio], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sale = interpolate(f, [medio, DUR_TRANSICION], [1, 0], { ...clamp, easing: Easing.out(Easing.exp) });
  const cubre = f < medio ? entra : sale;
  if (tipo === 'destello') {
    return <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(circle at 50% 45%, ${claro ? '#fff' : '#fffbe6'} 0%, ${P.a} 38%, transparent ${30 + cubre * 70}%)`, opacity: cubre }} />;
  }
  if (tipo === 'iris') {
    const r = Math.hypot(W, H) * 0.55 * cubre;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${P.b}, ${P.f1})`, clipPath: `circle(${r}px at 50% 50%)` }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, borderRadius: '50%', boxShadow: `0 0 0 ${8 + cubre * 10}px ${P.a}, 0 0 60px ${P.a}` , opacity: cubre > 0.98 ? 0 : 1 }} />
      </AbsoluteFill>
    );
  }
  if (tipo === 'paneles') {
    const n = 4;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {Array.from({ length: n }, (_, i) => {
          const d = Math.min(1, Math.max(0, (f < medio ? (f - i * 0.8) / (medio - 2) : (DUR_TRANSICION - f - (n - 1 - i) * 0.8) / (medio - 2))));
          const desde = i % 2 ? -1 : 1;
          return <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i * 100) / n}%`, width: `${100 / n + 0.5}%`, background: [P.a, P.b, P.c, P.f2][i % 4], transform: `translateY(${desde * (1 - Easing.out(Easing.cubic)(d)) * 105}%)` }} />;
        })}
      </AbsoluteFill>
    );
  }
  // barrido: una franja diagonal cruza el cuadro con el emoji del gancho al frente
  const x = interpolate(f, [0, DUR_TRANSICION], [-1.25, 1.25], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const s = Math.min(W, H) * 0.32;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: W * 1.15, background: `linear-gradient(90deg, ${P.b}, ${P.a})`, transform: `translateX(${x * W - W * 0.075}px) skewX(-14deg)` }} />
      <img alt="" src={`/emoji/${codEmoji(emoji || '🚀')}`} style={{ position: 'absolute', top: H / 2 - s / 2, left: 0, width: s, height: s, transform: `translateX(${x * W + W * 0.55}px) rotate(${x * 25}deg)`, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.35))' }} />
    </AbsoluteFill>
  );
}
