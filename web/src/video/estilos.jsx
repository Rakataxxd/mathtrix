// Plantillas visuales. El guion es el mismo; solo cambia como se dibuja (cambio instantaneo).
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';
import { noise2D } from '@remotion/noise';

const G = (f) => `'${f}'`;
export const ESTILOS = {
  ilustrado: {
    nombre: 'Ilustrado', desc: 'Colores vivos, emojis 3D y cámara viva', emoji: 'color', camara: 1, mascota: true, entrada: 'golpe',
    fuentes: { display: G('Unbounded'), cuerpo: G('Plus Jakarta Sans'), mate: G('JetBrains Mono') },
    cap: { fuente: 'display', peso: 800, v: 70, h: 52, mayus: true, max: 3, trazo: '10px #000', color: '#fff', activo: null },
  },
  tiza: {
    nombre: 'Pizarrón', desc: 'Tiza a mano sobre pizarrón verde', emoji: 'linea', camara: 0.45, mascota: false, entrada: 'escribir',
    P: { f1: '#132a20', f2: '#1f4234', a: '#ffe680', b: '#ff9ecb', c: '#9ad7ff', tx: '#f4f1e8' }, linea: '#f4f1e8', rugoso: true,
    fuentes: { display: G('Cabin Sketch'), cuerpo: G('Caveat'), mate: G('Caveat') },
    cap: { fuente: 'cuerpo', peso: 700, v: 86, h: 64, mayus: false, max: 5, trazo: '0', color: '#f4f1e8', activo: '#ffe680' },
  },
  blueprint: {
    nombre: 'Blueprint', desc: 'Plano técnico: líneas blancas y cotas', emoji: 'linea', camara: 0.5, mascota: false, entrada: 'escribir',
    P: { f1: '#082457', f2: '#0f4aa8', a: '#ffd23b', b: '#7fdcff', c: '#ffffff', tx: '#eaf4ff' }, linea: '#eaf4ff',
    fuentes: { display: G('Space Grotesk'), cuerpo: G('Space Grotesk'), mate: G('IBM Plex Mono') },
    cap: { fuente: 'mate', peso: 600, v: 54, h: 40, mayus: true, max: 4, trazo: '0', color: '#eaf4ff', activo: '#ffd23b', caja: true },
  },
  manim: {
    nombre: 'Manim', desc: 'Fondo negro y fórmulas elegantes, estilo 3Blue1Brown', emoji: 'linea', camara: 0.22, mascota: false, entrada: 'escribir',
    P: { f1: '#000000', f2: '#06080a', a: '#F7D96F', b: '#58C4DD', c: '#83C167', tx: '#ffffff' }, linea: '#58C4DD', relleno: true,
    fuentes: { display: G('STIX Two Text'), cuerpo: G('STIX Two Text'), mate: G('STIX Two Text') },
    cap: { fuente: 'cuerpo', peso: 500, v: 58, h: 44, mayus: false, max: 6, trazo: '0', color: '#ffffff', activo: '#F7D96F' },
  },
  cuaderno: {
    nombre: 'Cuaderno', desc: 'Apuntes a mano, resaltador y stickers', emoji: 'sticker', camara: 0.6, mascota: true, entrada: 'escribir', claro: true,
    P: { f1: '#fbf8f1', f2: '#fbf8f1', a: '#ffe94d', b: '#ff6fa0', c: '#2f6fdb', tx: '#1d2b5a' },
    fuentes: { display: G('Kalam'), cuerpo: G('Patrick Hand'), mate: G('Kalam') },
    cap: { fuente: 'cuerpo', peso: 400, v: 78, h: 58, mayus: false, max: 5, trazo: '0', color: '#1d2b5a', activo: '#1d2b5a', fondoActivo: '#ffe94d' },
  },
  neon: {
    nombre: 'Neón', desc: 'Brillo neón, grilla retro y energía tipo TikTok', emoji: 'neon', camara: 1.4, mascota: false, entrada: 'golpe',
    P: { f1: '#030008', f2: '#1a0033', a: '#00f0ff', b: '#ff2e88', c: '#faff00', tx: '#ffffff' },
    fuentes: { display: G('Anton'), cuerpo: G('Plus Jakarta Sans'), mate: G('JetBrains Mono') },
    cap: { fuente: 'display', peso: 400, v: 120, h: 84, mayus: true, max: 2, trazo: '0', color: '#ffffff', activo: '#00f0ff', brillo: true },
  },
  vector: {
    nombre: 'Vector luz', desc: 'Ilustración plana con luz de borde, planetas y paralaje, tipo documental animado', emoji: 'vector', camara: 0.8, mascota: false, entrada: 'golpe',
    P: { f1: '#0E0A2E', f2: '#1A0F45', a: '#FFC23D', b: '#E0457B', c: '#2EC4F1', tx: '#F2F6EE' },
    fuentes: { display: G('Baloo 2'), cuerpo: G('Nunito'), mate: G('Baloo 2') },
    cap: { fuente: 'cuerpo', peso: 900, v: 58, h: 44, mayus: false, max: 4, trazo: '0', color: '#F2F6EE', activo: '#FFC23D', caja: { bg: '#2C6BE0', borde: '0', radio: 16 } },
  },
  cinetica: {
    nombre: 'Cinética', desc: 'Las palabras son la animación: cada frase golpea al ritmo', emoji: 'color', camara: 1.5, mascota: false, entrada: 'golpe',
    P: { f1: '#0a0a0a', f2: '#161616', a: '#FFE14D', b: '#FF3B5C', c: '#4CC9F0', tx: '#ffffff' },
    fuentes: { display: G('Archivo Black'), cuerpo: G('Inter'), mate: G('JetBrains Mono') },
    cap: { fuente: 'display', peso: 400, v: 150, h: 104, mayus: true, max: 3, trazo: '0', color: '#ffffff', activo: '#FFE14D', cinetica: true },
  },
  riso: {
    nombre: 'Riso', desc: 'Impreso en tintas flúor que se desfasan, semitono y grano', emoji: 'riso', camara: 0.9, mascota: false, entrada: 'golpe', claro: true,
    P: { f1: '#F3EBDD', f2: '#EFE4D0', a: '#FF48B0', b: '#0078BF', c: '#FFE800', tx: '#1A1A1A' },
    fuentes: { display: G('Archivo Black'), cuerpo: G('Space Grotesk'), mate: G('Space Grotesk') },
    cap: { fuente: 'display', peso: 400, v: 68, h: 50, mayus: true, max: 3, trazo: '0', color: '#1A1A1A', activo: '#1A1A1A', fondoActivo: '#FFE800' },
  },
};
export const LISTA_ESTILOS = Object.keys(ESTILOS);
export const estiloDe = (k) => ESTILOS[k] ? k : 'ilustrado';

/** Variables CSS que leen todas las escenas (fuentes, colores, paneles, chips). */
export function varsEstilo(k, P) {
  const E = ESTILOS[estiloDe(k)];
  const f = E.fuentes;
  const base = {
    '--mtx-display': `${f.display}, sans-serif`, '--mtx-cuerpo': `${f.cuerpo}, sans-serif`, '--mtx-mate': `${f.mate}, monospace`,
    '--mtx-tx': P.tx || '#fff', '--mtx-tx2': E.claro ? 'rgba(29,43,90,.7)' : 'rgba(255,255,255,.72)', '--mtx-sobre-acento': '#0b0420',
    '--mtx-panel-bg': 'linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', '--mtx-panel-borde': '1.5px solid rgba(255,255,255,.22)',
    '--mtx-panel-sombra': `inset 0 1px 0 rgba(255,255,255,.35), inset 0 0 60px ${P.a}14, 0 30px 80px rgba(0,0,0,.45)`, '--mtx-panel-radio': '36px',
    '--mtx-chip-bg': P.a, '--mtx-chip-tx': '#0b0420', '--mtx-chip-borde': '0', '--mtx-chip-radio': '999px', '--mtx-chip-sombra': `0 10px 30px ${P.a}55`,
    '--mtx-resalta-bg': P.a, '--mtx-resalta-tx': '#0b0420', '--mtx-resalta-sombra': `0 10px 0 ${P.b}`,
    '--mtx-sombra-texto': `0 8px 0 ${P.b}66, 0 18px 40px rgba(0,0,0,.5)`, '--mtx-trazo-texto': '3px rgba(0,0,0,.35)',
    '--mtx-resultado': `linear-gradient(180deg, #fffbe0 8%, ${P.a} 45%, #ff9f1c 100%)`, '--mtx-resultado-filtro': `drop-shadow(0 10px 0 rgba(0,0,0,.35)) drop-shadow(0 0 40px ${P.a}88)`,
  };
  const extra = {
    tiza: {
      '--mtx-panel-bg': 'rgba(255,255,255,.03)', '--mtx-panel-borde': '3px dashed rgba(244,241,232,.55)', '--mtx-panel-sombra': 'none', '--mtx-panel-radio': '18px',
      '--mtx-chip-bg': 'transparent', '--mtx-chip-tx': P.a, '--mtx-chip-borde': `3px solid ${P.a}`, '--mtx-chip-radio': '14px', '--mtx-chip-sombra': 'none',
      '--mtx-resalta-bg': 'transparent', '--mtx-resalta-tx': P.a, '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': '0 0 2px rgba(255,255,255,.4)', '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, ${P.a}, ${P.a})`, '--mtx-resultado-filtro': 'drop-shadow(0 0 3px rgba(255,255,255,.35))',
    },
    blueprint: {
      '--mtx-panel-bg': 'rgba(8,36,87,.55)', '--mtx-panel-borde': '2px solid rgba(234,244,255,.8)', '--mtx-panel-sombra': '8px 8px 0 rgba(234,244,255,.12)', '--mtx-panel-radio': '0px',
      '--mtx-chip-bg': 'rgba(8,36,87,.8)', '--mtx-chip-tx': '#eaf4ff', '--mtx-chip-borde': '2px solid #eaf4ff', '--mtx-chip-radio': '0px', '--mtx-chip-sombra': 'none',
      '--mtx-resalta-bg': 'transparent', '--mtx-resalta-tx': P.a, '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': 'none', '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, #fff, ${P.a})`, '--mtx-resultado-filtro': 'none',
    },
    manim: {
      '--mtx-panel-bg': 'transparent', '--mtx-panel-borde': '0', '--mtx-panel-sombra': 'none', '--mtx-panel-radio': '0px',
      '--mtx-chip-bg': 'transparent', '--mtx-chip-tx': P.b, '--mtx-chip-borde': '0', '--mtx-chip-radio': '0px', '--mtx-chip-sombra': 'none',
      '--mtx-resalta-bg': 'transparent', '--mtx-resalta-tx': P.a, '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': 'none', '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, ${P.a}, ${P.a})`, '--mtx-resultado-filtro': 'none',
    },
    cuaderno: {
      '--mtx-tx2': 'rgba(29,43,90,.7)', '--mtx-sobre-acento': '#1d2b5a',
      '--mtx-panel-bg': '#fff6a8', '--mtx-panel-borde': '0', '--mtx-panel-sombra': '0 14px 24px rgba(60,40,0,.18), 0 2px 0 rgba(0,0,0,.05)', '--mtx-panel-radio': '4px',
      '--mtx-chip-bg': P.a, '--mtx-chip-tx': '#1d2b5a', '--mtx-chip-borde': '0', '--mtx-chip-radio': '6px', '--mtx-chip-sombra': '0 4px 0 rgba(0,0,0,.08)',
      '--mtx-resalta-bg': P.a, '--mtx-resalta-tx': '#1d2b5a', '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': 'none', '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, ${P.c}, #1d2b5a)`, '--mtx-resultado-filtro': 'none',
    },
    neon: {
      '--mtx-panel-bg': 'rgba(0,0,0,.55)', '--mtx-panel-borde': `2px solid ${P.b}`, '--mtx-panel-sombra': `0 0 24px ${P.b}88, inset 0 0 24px ${P.b}44`, '--mtx-panel-radio': '20px',
      '--mtx-chip-bg': 'transparent', '--mtx-chip-tx': P.a, '--mtx-chip-borde': `2px solid ${P.a}`, '--mtx-chip-sombra': `0 0 20px ${P.a}, inset 0 0 12px ${P.a}88`,
      '--mtx-resalta-bg': 'transparent', '--mtx-resalta-tx': P.c, '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': `0 0 18px ${P.b}, 0 0 42px ${P.b}`, '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, #fff, ${P.a})`, '--mtx-resultado-filtro': `drop-shadow(0 0 20px ${P.a}) drop-shadow(0 0 50px ${P.b})`,
    },
    vector: {
      '--mtx-panel-bg': 'linear-gradient(165deg, #34267a, #221a5c)', '--mtx-panel-borde': '0',
      '--mtx-panel-sombra': `inset 0 4px 0 rgba(255,233,168,.32), inset -22px -26px 0 rgba(8,4,30,.28), 0 28px 70px rgba(5,2,25,.6), 0 0 90px ${P.c}22`, '--mtx-panel-radio': '44px',
      '--mtx-chip-bg': '#E0457B', '--mtx-chip-tx': '#ffffff', '--mtx-chip-borde': '0', '--mtx-chip-radio': '12px', '--mtx-chip-sombra': '0 10px 30px rgba(224,69,123,.45)',
      '--mtx-resalta-bg': '#2C6BE0', '--mtx-resalta-tx': '#ffffff', '--mtx-resalta-sombra': 'none',
      '--mtx-sombra-texto': '0 0 30px rgba(255,233,168,.25), 0 6px 0 rgba(8,4,30,.5)', '--mtx-trazo-texto': '0',
      '--mtx-resultado': 'linear-gradient(180deg, #FFF4C2 5%, #FFC23D 50%, #EC8F24 100%)', '--mtx-resultado-filtro': 'drop-shadow(0 0 40px rgba(255,194,61,.6)) drop-shadow(0 10px 0 rgba(8,4,30,.5))',
    },
    cinetica: {
      '--mtx-panel-bg': 'rgba(10,10,10,.6)', '--mtx-panel-borde': '5px solid #ffffff', '--mtx-panel-sombra': `14px 14px 0 ${P.a}`, '--mtx-panel-radio': '0px',
      '--mtx-chip-bg': P.a, '--mtx-chip-tx': '#0a0a0a', '--mtx-chip-borde': '0', '--mtx-chip-radio': '0px', '--mtx-chip-sombra': `8px 8px 0 ${P.b}`,
      '--mtx-resalta-bg': P.b, '--mtx-resalta-tx': '#ffffff', '--mtx-resalta-sombra': 'none', '--mtx-sombra-texto': `8px 8px 0 ${P.b}`, '--mtx-trazo-texto': '0',
      '--mtx-resultado': `linear-gradient(180deg, #ffffff, ${P.a})`, '--mtx-resultado-filtro': `drop-shadow(10px 10px 0 ${P.b})`,
    },
    riso: {
      '--mtx-tx2': 'rgba(26,26,26,.7)', '--mtx-sobre-acento': '#1A1A1A',
      '--mtx-panel-bg': 'rgba(255,72,176,.13)', '--mtx-panel-borde': '0', '--mtx-panel-sombra': '12px 12px 0 rgba(0,120,191,.8)', '--mtx-panel-radio': '8px',
      '--mtx-chip-bg': '#FFE800', '--mtx-chip-tx': '#1A1A1A', '--mtx-chip-borde': '0', '--mtx-chip-radio': '4px', '--mtx-chip-sombra': '6px 6px 0 rgba(255,72,176,.85)',
      '--mtx-resalta-bg': '#FF48B0', '--mtx-resalta-tx': '#ffffff', '--mtx-resalta-sombra': '6px 6px 0 rgba(0,120,191,.8)', '--mtx-sombra-texto': '5px 5px 0 rgba(255,72,176,.5)', '--mtx-trazo-texto': '0',
      '--mtx-resultado': 'linear-gradient(180deg, #FF48B0, #0078BF)', '--mtx-resultado-filtro': 'drop-shadow(8px 8px 0 rgba(255,232,0,.9))',
    },
  }[estiloDe(k)] || {};
  return { ...base, ...extra };
}

export const EstiloCtx = createContext('ilustrado');
export const useEstilo = () => ESTILOS[useContext(EstiloCtx)] || ESTILOS.ilustrado;
export const useClaveEstilo = () => useContext(EstiloCtx);

/** Filtros SVG: convierten un emoji en tiza, plano, trazo Manim o sticker. */
export function FiltrosEstilo() {
  const linea = (id, color, rugoso, relleno) => (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="gris" />
      <feConvolveMatrix in="gris" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="bordes" />
      <feColorMatrix in="bordes" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 4 4 0 0" result="bordesA" />
      <feComposite in="bordesA" in2="SourceAlpha" operator="in" result="internos" />
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="gordo" />
      <feComposite in="gordo" in2="SourceAlpha" operator="out" result="contorno" />
      <feMerge result="lineas"><feMergeNode in="contorno" /><feMergeNode in="internos" /></feMerge>
      {rugoso ? (<>
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="ondas" />
        <feDisplacementMap in="lineas" in2="ondas" scale="5" result="movidas" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="polvo" />
        <feColorMatrix in="polvo" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.55" result="polvoA" />
        <feComposite in="movidas" in2="polvoA" operator="in" result="trazo" />
      </>) : <feComposite in="lineas" in2="lineas" operator="in" result="trazo" />}
      <feFlood floodColor={color} result="color" />
      <feComposite in="color" in2="trazo" operator="in" result="pintado" />
      {relleno ? (<>
        <feFlood floodColor={color} floodOpacity="0.16" result="c2" />
        <feComposite in="c2" in2="SourceAlpha" operator="in" result="fondo" />
        <feMerge><feMergeNode in="fondo" /><feMergeNode in="pintado" /></feMerge>
      </>) : <feMerge><feMergeNode in="pintado" /></feMerge>}
    </filter>
  );
  return (
    <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {linea('mtx-linea-tiza', '#f4f1e8', true, false)}
        {linea('mtx-linea-blueprint', '#eaf4ff', false, true)}
        {linea('mtx-linea-manim', '#58C4DD', false, true)}
        <filter id="mtx-sticker" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="d" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="d" operator="in" result="borde" />
          <feGaussianBlur in="d" stdDeviation="6" result="b" />
          <feOffset in="b" dx="0" dy="10" result="bo" />
          <feFlood floodColor="#3c2800" floodOpacity="0.25" />
          <feComposite in2="bo" operator="in" result="sombra" />
          <feMerge><feMergeNode in="sombra" /><feMergeNode in="borde" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* vector plano: colores en pocos niveles, luz de borde arriba-izquierda, sombra en media luna y halo */}
        <filter id="mtx-vector" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feComponentTransfer in="SourceGraphic" result="plano">
            <feFuncR type="discrete" tableValues="0.04 0.28 0.55 0.8 1" /><feFuncG type="discrete" tableValues="0.04 0.28 0.55 0.8 1" /><feFuncB type="discrete" tableValues="0.12 0.35 0.62 0.86 1" />
          </feComponentTransfer>
          <feColorMatrix in="plano" type="saturate" values="1.5" result="sat" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="20" result="halo" />
          <feFlood floodColor="#FFE9A8" floodOpacity="0.4" /><feComposite in2="halo" operator="in" result="glow" />
          <feOffset in="SourceAlpha" dx="9" dy="9" result="abajo" />
          <feComposite in="SourceAlpha" in2="abajo" operator="out" result="borde" />
          <feFlood floodColor="#FFF4C2" floodOpacity="0.7" /><feComposite in2="borde" operator="in" result="luz" />
          <feOffset in="SourceAlpha" dx="-16" dy="-16" result="arriba" />
          <feComposite in="SourceAlpha" in2="arriba" operator="out" result="luna" />
          <feFlood floodColor="#0E0A2E" floodOpacity="0.38" /><feComposite in2="luna" operator="in" result="sombra" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="sat" /><feMergeNode in="sombra" /><feMergeNode in="luz" /></feMerge>
        </filter>
        {/* riso: dos tintas (rosa y azul) desfasadas, como impresion mal registrada */}
        <filter id="mtx-riso" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="gris" />
          <feColorMatrix in="gris" type="matrix" values="0 0 0 0 1  0 0 0 0 0.28  0 0 0 0 0.69  -1.3 0 0 0 1.25" result="rosa0" />
          <feComposite in="rosa0" in2="SourceAlpha" operator="in" result="rosa" />
          <feColorMatrix in="gris" type="matrix" values="0 0 0 0 0  0 0 0 0 0.47  0 0 0 0 0.75  -1.6 0 0 0 1.05" result="azul0" />
          <feComposite in="azul0" in2="SourceAlpha" operator="in" result="azul1" />
          <feOffset in="azul1" dx="9" dy="7" result="azul" />
          <feBlend in="rosa" in2="azul" mode="multiply" />
        </filter>
      </defs>
    </svg>
  );
}

export function filtroEmoji(clave, E, P, ligero) {
  if (E.emoji === 'linea') return ligero ? (E.claro ? 'brightness(0)' : 'brightness(0) invert(1)') + ' opacity(.85)' : `url(#mtx-linea-${clave})`;
  if (E.emoji === 'sticker') return ligero ? 'drop-shadow(0 4px 4px rgba(60,40,0,.25))' : 'url(#mtx-sticker)';
  if (E.emoji === 'neon') return `drop-shadow(0 0 10px ${P.b}) drop-shadow(0 0 26px ${P.a}88)`;
  if (E.emoji === 'vector') return ligero ? 'saturate(1.4) drop-shadow(0 0 14px rgba(255,233,168,.45))' : 'url(#mtx-vector)';
  if (E.emoji === 'riso') return ligero ? 'grayscale(1) contrast(1.3) sepia(1) hue-rotate(280deg) saturate(4)' : 'url(#mtx-riso)';
  return 'drop-shadow(0 18px 26px rgba(0,0,0,.45))';
}

// ---------------- fondos por plantilla ----------------
const W100 = { position: 'absolute', inset: 0 };
export function FondoTiza({ P }) {
  const garabatos = ['x² + y² = r²', 'π ≈ 3.1416', 'a/b', '∫ f(x) dx', '√2', 'A = b·h', '3x − 7 = 11', 'Δ'];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 30%, ${P.f2}, ${P.f1} 75%)`, overflow: 'hidden' }}>
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: 'absolute', left: `${random('tx' + i) * 90}%`, top: `${random('ty' + i) * 90}%`, width: `${30 + random('tw' + i) * 40}%`, height: `${10 + random('th' + i) * 16}%`, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,.06), transparent)', transform: `rotate(${random('tr' + i) * 40 - 20}deg)` }} />)}
      {garabatos.map((g, i) => <div key={g} style={{ position: 'absolute', left: `${random('gx' + i) * 80}%`, top: `${random('gy' + i) * 92}%`, fontFamily: "'Caveat'", fontSize: 54 + random('gs' + i) * 40, color: '#f4f1e8', opacity: 0.07, transform: `rotate(${random('gr' + i) * 30 - 15}deg)`, whiteSpace: 'nowrap' }}>{g}</div>)}
      <div style={{ ...W100, boxShadow: 'inset 0 0 0 22px #5b3d22, inset 0 0 0 26px #3b2714, inset 0 0 120px rgba(0,0,0,.6)' }} />
    </AbsoluteFill>
  );
}
export function FondoBlueprint({ P }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 25%, ${P.f2}, ${P.f1} 80%)`, overflow: 'hidden' }}>
      <div style={{ ...W100, backgroundImage: 'linear-gradient(rgba(234,244,255,.07) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(234,244,255,.07) 1.5px, transparent 1.5px), linear-gradient(rgba(234,244,255,.17) 2px, transparent 2px), linear-gradient(90deg, rgba(234,244,255,.17) 2px, transparent 2px)', backgroundSize: '30px 30px, 30px 30px, 150px 150px, 150px 150px', backgroundPosition: `${f * 0.3}px ${f * 0.2}px` }} />
      {[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', right: -200 + i * 40, top: -200 + i * 40, width: 700 - i * 80, height: 700 - i * 80, borderRadius: '50%', border: '2px dashed rgba(234,244,255,.13)', transform: `rotate(${f * (0.2 + i * 0.1)}deg)` }} />)}
      <div style={{ position: 'absolute', left: 40, bottom: 40, border: '2px solid rgba(234,244,255,.45)', padding: '10px 18px', fontFamily: "'IBM Plex Mono'", fontSize: 22, color: 'rgba(234,244,255,.6)', lineHeight: 1.5 }}>MATHTRIX · HOJA 01<br />ESC. 1:1 · REV. A</div>
    </AbsoluteFill>
  );
}
export function FondoManim() {
  return <AbsoluteFill style={{ background: '#000' }}><div style={{ ...W100, backgroundImage: 'linear-gradient(rgba(88,196,221,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(88,196,221,.05) 1px, transparent 1px)', backgroundSize: '120px 120px', backgroundPosition: 'center' }} /></AbsoluteFill>;
}
export function FondoCuaderno({ P }) {
  return (
    <AbsoluteFill style={{ background: '#fbf8f1', overflow: 'hidden' }}>
      <div style={{ ...W100, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 60px, #c9dcf2 60px 62px)', backgroundPosition: '0 30px' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 110, width: 3, background: '#f2a0a8' }} />
      {[0.2, 0.5, 0.8].map((y) => <div key={y} style={{ position: 'absolute', left: 34, top: `${y * 100}%`, width: 36, height: 36, borderRadius: '50%', background: '#e6e0d2', boxShadow: 'inset 0 4px 6px rgba(0,0,0,.18)' }} />)}
      {['★', '→', '✦', '?!', '♥'].map((d, i) => <div key={i} style={{ position: 'absolute', right: `${4 + random('dx' + i) * 14}%`, top: `${10 + random('dy' + i) * 78}%`, fontFamily: "'Kalam'", fontSize: 64, color: P.c, opacity: 0.22, transform: `rotate(${random('dr' + i) * 40 - 20}deg)` }}>{d}</div>)}
    </AbsoluteFill>
  );
}
export function FondoNeon({ P }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.f1} 0%, ${P.f2} 55%, #000 100%)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: '30%', width: 700, height: 700, marginLeft: -350, borderRadius: '50%', background: `linear-gradient(180deg, ${P.c}, ${P.b} 70%)`, opacity: 0.22, filter: 'blur(4px)', WebkitMaskImage: 'repeating-linear-gradient(180deg, #000 0 26px, transparent 26px 36px)' }} />
      <div style={{ position: 'absolute', left: '-50%', right: '-50%', top: '58%', height: '80%', transform: 'perspective(600px) rotateX(62deg)', transformOrigin: 'top', backgroundImage: `linear-gradient(${P.b}aa 2px, transparent 2px), linear-gradient(90deg, ${P.b}aa 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0 ${(f * 4) % 90}px`, WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 30%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '58%', height: 4, background: P.b, boxShadow: `0 0 30px ${P.b}, 0 0 80px ${P.b}` }} />
      {Array.from({ length: 30 }, (_, i) => <div key={i} style={{ position: 'absolute', left: `${random('sx' + i) * 100}%`, top: `${random('sy' + i) * 55}%`, width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.3 + 0.7 * Math.abs(Math.sin((f + i * 13) / 14)) }} />)}
    </AbsoluteFill>
  );
}
export function AcabadoEstilo({ clave }) {
  const f = useCurrentFrame();
  if (clave === 'neon') return <AbsoluteFill style={{ pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,.18) 0 2px, transparent 2px 5px)', opacity: 0.5 + noise2D('sc', f / 6, 0) * 0.1 }} />;
  if (clave === 'tiza') return <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.45))' }} />;
  if (clave === 'cuaderno') return <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 40%, transparent 60%, rgba(120,90,30,.14))' }} />;
  if (clave === 'blueprint') return <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,10,40,.5))' }} />;
  if (clave === 'vector') return <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(6,2,30,.55))' }} />;
  if (clave === 'riso') return <GranoRiso />;
  return null;
}

// ---------------- plantillas nuevas: Vector luz (guia de estilo documental), Cinetica y Riso (Atlas) ----------------
function Cerros({ color, alto, y, vel, f, semilla, W }) {
  // silueta de cerros redondeados que se desplaza en paralaje (dos copias seguidas)
  const pts = Array.from({ length: 9 }, (_, i) => [i * 250, 120 - random(semilla + i) * 110]);
  let d = `M0 ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C${x0 + 125} ${y0} ${x1 - 125} ${y1} ${x1} ${y1}`; }
  d += ' L2000 300 L0 300 Z';
  const dx = -((f * vel) % 2000);
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: W * 3, height: alto, transform: `translateX(${dx}px)` }}>
      {[0, 1].map((k) => <svg key={k} viewBox="0 0 2000 300" preserveAspectRatio="none" style={{ position: 'absolute', left: k * 2000, top: 0, width: 2000, height: alto }}><path d={d} fill={color} /></svg>)}
    </div>
  );
}
export function FondoVector({ P }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const v = H > W;
  const pl = v ? 820 : 640;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(140% 90% at 75% 0%, #2B1772 0%, ${P.f2} 42%, ${P.f1} 82%)`, overflow: 'hidden' }}>
      {Array.from({ length: 70 }, (_, i) => {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin((f + i * 17) / (18 + (i % 7) * 4)));
        const s = 2 + random('vs' + i) * 4;
        return <div key={i} style={{ position: 'absolute', left: `${random('vx' + i) * 100}%`, top: `${random('vy' + i) * 70}%`, width: s, height: s, borderRadius: '50%', background: i % 9 === 0 ? '#FFE9A8' : '#F2F6EE', opacity: tw * 0.85, boxShadow: i % 9 === 0 ? '0 0 12px #FFE9A8' : 'none', transform: `translateX(${-f * 0.05}px)` }} />;
      })}
      <div style={{ position: 'absolute', right: v ? -pl * 0.35 : -pl * 0.18, top: v ? -pl * 0.2 : -pl * 0.32, width: pl, height: pl, transform: `translateX(${-f * 0.12}px) rotate(${f * 0.02}deg)` }}>
        <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(46,196,241,.35), transparent)', filter: 'blur(6px)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 35% 30%, #6FD8F5, #2EC4F1 30%, #2576CB 62%, #1B2A78 100%)', boxShadow: 'inset 0 0 0 10px rgba(178,240,255,.25)' }}>
          {[[18, 30, 34, 18], [52, 55, 30, 22], [30, 70, 22, 12]].map(([x, y, w, h], i) => <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, borderRadius: '45% 55% 50% 40%', background: '#22B573', opacity: 0.85 }} />)}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 78% 82%, rgba(14,10,46,.85) 0%, rgba(14,10,46,.55) 30%, transparent 58%)' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: v ? '8%' : '6%', top: v ? '9%' : '12%', width: v ? 90 : 70, height: v ? 90 : 70, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FFF4C2, #F4BF29 55%, #EC8F24)', boxShadow: '0 0 60px rgba(244,191,41,.55)', transform: `translateY(${Math.sin(f / 40) * 10}px)` }} />
      <Cerros color="#2A1A6E" alto={H * 0.3} y={H * 0.74} vel={0.35} f={f} semilla="c1" W={W} />
      <Cerros color="#1C1150" alto={H * 0.22} y={H * 0.83} vel={0.7} f={f} semilla="c2" W={W} />
      <Cerros color="#0B0722" alto={H * 0.14} y={H * 0.91} vel={1.4} f={f} semilla="c3" W={W} />
      {Array.from({ length: 18 }, (_, i) => {
        const y = (random('py' + i) * H - f * (0.6 + random('pv' + i))) % H;
        return <div key={'p' + i} style={{ position: 'absolute', left: `${random('px' + i) * 100}%`, top: y < 0 ? y + H : y, width: 6, height: 6, borderRadius: '50%', background: '#FFE9A8', opacity: 0.35, boxShadow: '0 0 14px 4px rgba(255,233,168,.35)', mixBlendMode: 'screen' }} />;
      })}
    </AbsoluteFill>
  );
}
export function FondoCinetica({ P }) {
  const f = useCurrentFrame();
  const fila = (txt, y, vel, color, op) => {
    const dx = vel > 0 ? -((f * vel) % 1700) : -1700 + ((-f * vel) % 1700);
    return <div style={{ position: 'absolute', left: 0, top: y, whiteSpace: 'nowrap', fontFamily: "'Archivo Black'", fontSize: 250, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${color}`, opacity: op, transform: `translateX(${dx}px)` }}>{txt.repeat(10)}</div>;
  };
  return (
    <AbsoluteFill style={{ background: '#0a0a0a', overflow: 'hidden' }}>
      {fila('PENSÁ · CALCULÁ · ', '4%', 3, '#ffffff', 0.08)}
      {fila('MATE · MATHTRIX · ', '38%', -2.2, P.a, 0.1)}
      {fila('¿Y SI…? · RESOLVÉ · ', '72%', 2.6, '#ffffff', 0.07)}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 55% at 50% 50%, transparent, rgba(0,0,0,.7))' }} />
    </AbsoluteFill>
  );
}
const PUNTOS = (c, tam = 22, r = 38) => `radial-gradient(circle, ${c} ${r}%, transparent ${r + 2}%) 0 0/${tam}px ${tam}px`;
export function FondoRiso({ P }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const v = H > W;
  const g = v ? 1000 : 820;
  return (
    <AbsoluteFill style={{ background: P.f1, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -g * 0.3, top: -g * 0.25, width: g, height: g, borderRadius: '50%', background: PUNTOS('#FF48B0', 24, 40), WebkitMaskImage: 'radial-gradient(circle, #000 25%, transparent 70%)', mixBlendMode: 'multiply', transform: `rotate(${f * 0.05}deg)` }} />
      <div style={{ position: 'absolute', left: -g * 0.35, bottom: -g * 0.3, width: g * 0.9, height: g * 0.9, borderRadius: '50%', background: PUNTOS('#0078BF', 20, 36), WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 68%)', mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', left: '62%', top: v ? '58%' : '52%', width: 220, height: 220, borderRadius: '50%', background: '#FFE800', mixBlendMode: 'multiply', transform: `translate(${Math.sin(f / 30) * 8}px, ${Math.cos(f / 36) * 8}px)` }} />
      <div style={{ position: 'absolute', left: 'calc(62% + 14px)', top: v ? 'calc(58% + 10px)' : 'calc(52% + 10px)', width: 220, height: 220, borderRadius: '50%', border: '6px solid #FF48B0', mixBlendMode: 'multiply' }} />
      {['+', '÷', '×', '='].map((s, i) => <div key={s} style={{ position: 'absolute', left: `${8 + random('rx' + i) * 80}%`, top: `${8 + random('ry' + i) * 80}%`, fontFamily: "'Archivo Black'", fontSize: 120, color: i % 2 ? '#0078BF' : '#FF48B0', opacity: 0.18, mixBlendMode: 'multiply', transform: `rotate(${random('rr' + i) * 40 - 20}deg)` }}>{s}</div>)}
    </AbsoluteFill>
  );
}
function GranoRiso() {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.4 }}>
      <svg width="100%" height="100%"><filter id="mtx-grano-riso"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.1  0 0 0 0 0.12  0 0 0 0.55 -0.1" /></filter><rect width="100%" height="100%" filter="url(#mtx-grano-riso)" /></svg>
    </AbsoluteFill>
  );
}

export const FONDOS = { tiza: FondoTiza, blueprint: FondoBlueprint, manim: FondoManim, cuaderno: FondoCuaderno, neon: FondoNeon, vector: FondoVector, cinetica: FondoCinetica, riso: FondoRiso };
export const tono = (hex, a) => { const h = String(hex || '#ffffff').replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
