// Composicion raiz: el mismo componente se reproduce en el navegador (@remotion/player)
// y se puede renderizar a MP4. La plantilla visual se elige al reproducir: cambiarla es instantaneo.
import React from 'react';
import { AbsoluteFill, Sequence, Html5Audio, useCurrentFrame, interpolate } from 'remotion';
import { PALETAS, Fondo, PrimerPlano, Camara, Acabado, Subtitulos, useVert, DISPLAY, MONO, clamp, PaletaCtx } from './fx.jsx';
import { Gancho, Datos, Formula, Paso, Resultado, Iconos, Fraccion, Comparacion, Grafica, Cta, Pregunta, Revision, EleccionesCtx } from './escenas.jsx';
import { Transicion, transicionDe, DUR_TRANSICION } from './transiciones.jsx';
import { ESTILOS, EstiloCtx, estiloDe, varsEstilo, FiltrosEstilo, tono } from './estilos.jsx';

const ESCENAS = { gancho: Gancho, datos: Datos, formula: Formula, paso: Paso, resultado: Resultado, iconos: Iconos, fraccion: Fraccion, comparacion: Comparacion, grafica: Grafica, cta: Cta, pregunta: Pregunta, revision: Revision };
const PARTE = (t) => (t === 'gancho' ? 0 : t === 'cta' ? 2 : 1);

function Barra({ tl, P, el = {} }) {
  const f = useCurrentFrame();
  const { v } = useVert();
  const partes = [0, 1, 2].map((k) => {
    const es = tl.escenas.filter((e) => PARTE(e.tipo) === k);
    if (!es.length) return null;
    const ini = es[0].inicio, fin = es.at(-1).inicio + es.at(-1).duracion;
    return { k, p: interpolate(f, [ini, fin], [0, 1], clamp), peso: fin - ini };
  }).filter(Boolean);
  const nombres = ['GANCHO', 'CONTENIDO', 'RETO'];
  return (
    <div style={{ position: 'absolute', left: v ? 40 : 60, right: v ? 40 : 60, top: v ? 52 : 26, display: 'flex', gap: 10 }}>
      {partes.map((x) => (
        <div key={x.k} style={{ flex: x.peso }}>
          <div style={{ position: 'relative' }}>
            <div style={{ height: 8, borderRadius: 9, background: tono(P.tx, 0.22), overflow: 'hidden' }}><div style={{ height: '100%', width: `${x.p * 100}%`, background: P.a, boxShadow: `0 0 12px ${P.a}` }} /></div>
            {/* checkpoints: donde el video se va a pausar para preguntar */}
            {tl.escenas.filter((e) => e.tipo === 'pregunta' && PARTE(e.tipo) === x.k).map((e) => {
              const es = tl.escenas.filter((z) => PARTE(z.tipo) === x.k);
              const ini = es[0].inicio, fin = es.at(-1).inicio + es.at(-1).duracion;
              const corte = e.inicio + e.q;
              const pos = (corte - ini) / (fin - ini);
              const r = el[e.i];
              const estado = r === undefined ? (f >= corte ? 'aqui' : 'pend') : r === e.correcta ? 'bien' : 'mal';
              const cerca = estado === 'pend' && corte - f < 90 && corte - f > 0;
              const tam = v ? 52 : 46;
              const fondo = estado === 'bien' ? '#3bdc7a' : estado === 'mal' ? '#ff5b6b' : estado === 'aqui' ? P.a : tono(P.f1, 0.85);
              return (
                <div key={e.i} style={{ position: 'absolute', left: `${pos * 100}%`, top: 4, width: tam, height: tam, marginLeft: -tam / 2, marginTop: -tam / 2, borderRadius: '50%', display: 'grid', placeItems: 'center',
                  background: fondo, border: `3px solid ${estado === 'pend' ? P.a : '#fff'}`, color: estado === 'pend' ? P.a : '#0b0420', fontFamily: DISPLAY, fontWeight: 900, fontSize: tam * 0.52,
                  boxShadow: `0 0 ${cerca ? 18 + 10 * Math.sin(f / 4) : 8}px ${P.a}`, transform: `scale(${cerca ? 1 + 0.12 * Math.sin(f / 4) : 1})` }}>
                  {estado === 'bien' ? '✓' : estado === 'mal' ? '✗' : '?'}
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: v ? 20 : 16, letterSpacing: '.12em', color: x.p > 0 && x.p < 1 ? P.tx : tono(P.tx, 0.4), marginTop: 8 }}>{nombres[x.k]}</div>
        </div>
      ))}
    </div>
  );
}

function Marca({ P }) {
  const { v } = useVert();
  return (
    <div style={{ position: 'absolute', right: v ? 40 : 60, bottom: v ? 40 : 30, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: v ? 30 : 26, color: tono(P.tx, 0.55), letterSpacing: '.04em' }}>
      <span style={{ color: P.a }}>[</span>mathtrix<span style={{ color: P.a }}>]</span>
    </div>
  );
}

export function paletaDe(tl, estilo) {
  const E = ESTILOS[estiloDe(estilo)];
  return E.P || { tx: '#ffffff', ...(PALETAS[tl?.paleta] || PALETAS.espacio) };
}

export function MathtrixVideo({ tl, estilo, elecciones, sinSonidos }) {
  if (!tl?.escenas?.length) return <AbsoluteFill style={{ background: '#0b0420' }} />;
  const clave = estiloDe(estilo || tl.estilo);
  const P = paletaDe(tl, clave);
  const base = typeof window !== 'undefined' && window.__MTX_BASE ? window.__MTX_BASE : '';
  const pasos = tl.escenas.filter((e) => e.tipo === 'paso');
  const el = elecciones || {};
  return (
    <EstiloCtx.Provider value={clave}>
      <PaletaCtx.Provider value={P}>
        <EleccionesCtx.Provider value={el}>
          <AbsoluteFill style={{ background: P.f1, color: P.tx, overflow: 'hidden', ...varsEstilo(clave, P) }}>
            <FiltrosEstilo />
            <Fondo P={P} />
            {tl.escenas.map((e, i) => {
              const C = ESCENAS[e.tipo] || Formula;
              let palabras = e.palabras;
              let audioRama = null;
              if (e.tipo === 'pregunta') {
                const bien = el[e.i] === undefined || el[e.i] === e.correcta;
                // sin respuesta todavia no hay rama: ni subtitulos ni audio de "¡Exacto!"
                const pr = el[e.i] === undefined ? [] : bien ? e.palabras_bien : e.palabras_mal;
                const off = e.q / tl.fps;
                palabras = [...(e.palabras || []), ...(pr || []).map((p, k) => ({ ...p, t: p.t + off, corte: k === 0 }))];
                audioRama = el[e.i] === undefined ? null : bien ? e.audio_bien : e.audio_mal;
              }
              return (
                <Sequence key={i} from={e.inicio} durationInFrames={e.duracion} name={`${i + 1}. ${e.tipo}`}>
                  <Camara dur={e.duracion} seed={i}>
                    <C e={e} P={P} n={pasos.indexOf(e) + 1} total={pasos.length} />
                  </Camara>
                  {e.audio && <Html5Audio src={base + e.audio} />}
                  {audioRama && <Sequence from={e.q} layout="none"><Html5Audio key={audioRama} src={base + audioRama} /></Sequence>}
                  {e.tipo === 'pregunta' && el[e.i] !== undefined && !sinSonidos && <Sequence from={e.q} layout="none"><Html5Audio key={'s' + el[e.i]} src={base + (el[e.i] === e.correcta ? '/sfx/ding.wav' : '/sfx/error.wav')} volume={0.4} /></Sequence>}
                  <Subtitulos palabras={palabras} P={P} abajo={e.tipo === 'gancho' || e.tipo === 'pregunta' || e.tipo === 'revision'} />
                </Sequence>
              );
            })}
            {tl.escenas.slice(1).map((e, k) => {
              const tipo = transicionDe(clave, k, (tl.titulo || '').length);
              if (!tipo) return null;
              return (
                <Sequence key={'tr' + k} from={Math.max(0, e.inicio - DUR_TRANSICION / 2)} durationInFrames={DUR_TRANSICION} layout="none" name={'transición ' + tipo}>
                  <Transicion tipo={tipo} P={P} emoji={tl.emoji} claro={ESTILOS[clave].claro} />
                  {!sinSonidos && <Html5Audio src={base + '/sfx/whoosh.wav'} volume={0.22} />}
                </Sequence>
              );
            })}
            <PrimerPlano P={P} />
            <Acabado />
            <Barra tl={tl} P={P} el={el} />
            <Marca P={P} />
          </AbsoluteFill>
        </EleccionesCtx.Provider>
      </PaletaCtx.Provider>
    </EstiloCtx.Provider>
  );
}
