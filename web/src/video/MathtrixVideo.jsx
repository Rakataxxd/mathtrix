// Composicion raiz: el mismo componente se reproduce en el navegador (@remotion/player)
// y se puede renderizar a MP4 en la RTX 5070 si alguien lo descarga.
import React from 'react';
import { AbsoluteFill, Sequence, Html5Audio, useCurrentFrame, interpolate } from 'remotion';
import { PALETAS, Fondo, PrimerPlano, Camara, Acabado, Subtitulos, useVert, DISPLAY, MONO, clamp } from './fx.jsx';
import { Gancho, Datos, Formula, Paso, Resultado, Iconos, Fraccion, Comparacion, Grafica, Cta } from './escenas.jsx';

const ESCENAS = { gancho: Gancho, datos: Datos, formula: Formula, paso: Paso, resultado: Resultado, iconos: Iconos, fraccion: Fraccion, comparacion: Comparacion, grafica: Grafica, cta: Cta };
const PARTE = (t) => (t === 'gancho' ? 0 : t === 'cta' ? 2 : 1);

function Barra({ tl, P }) {
  const f = useCurrentFrame();
  const { W, v } = useVert();
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
          <div style={{ height: 8, borderRadius: 9, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${x.p * 100}%`, background: P.a, boxShadow: `0 0 12px ${P.a}` }} /></div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: v ? 20 : 16, letterSpacing: '.12em', color: x.p > 0 && x.p < 1 ? '#fff' : 'rgba(255,255,255,.4)', marginTop: 8 }}>{nombres[x.k]}</div>
        </div>
      ))}
    </div>
  );
}

function Marca({ P }) {
  const { W, H, v } = useVert();
  return (
    <div style={{ position: 'absolute', right: v ? 40 : 60, bottom: v ? 40 : 30, fontFamily: MONO, fontWeight: 800, fontSize: v ? 30 : 26, color: 'rgba(255,255,255,.55)', letterSpacing: '.04em' }}>
      <span style={{ color: P.a }}>[</span>mathtrix<span style={{ color: P.a }}>]</span>
    </div>
  );
}

export function MathtrixVideo({ tl }) {
  if (!tl?.escenas?.length) return <AbsoluteFill style={{ background: '#0b0420' }} />;
  const P = PALETAS[tl.paleta] || PALETAS.espacio;
  const base = typeof window !== 'undefined' && window.__MTX_BASE ? window.__MTX_BASE : '';
  const pasos = tl.escenas.filter((e) => e.tipo === 'paso');
  return (
    <AbsoluteFill style={{ background: P.f1, color: '#fff', overflow: 'hidden' }}>
      <Fondo P={P} />
      {tl.escenas.map((e, i) => {
        const C = ESCENAS[e.tipo] || Formula;
        return (
          <Sequence key={i} from={e.inicio} durationInFrames={e.duracion} name={`${i + 1}. ${e.tipo}`}>
            <Camara dur={e.duracion} seed={i}>
              <C e={e} P={P} n={pasos.indexOf(e) + 1} total={pasos.length} />
            </Camara>
            {e.audio && <Html5Audio src={base + e.audio} />}
            <Subtitulos palabras={e.palabras} P={P} abajo={e.tipo === 'gancho'} />
          </Sequence>
        );
      })}
      <PrimerPlano P={P} />
      <Acabado />
      <Barra tl={tl} P={P} />
      <Marca P={P} />
    </AbsoluteFill>
  );
}
