// Reproductor: el video es codigo (Remotion) y se dibuja en el navegador.
// - Se pausa en cada "pregunta" y el alumno toca la opcion encima del video (rama correcta / incorrecta).
// - Al terminar sale el reto final como overlay encima del video.
// - Registra TODA la interaccion (play, pausa, rebobinar, salto, fin, respuestas, latidos).
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Player } from '@remotion/player';
import { Maximize2 } from 'lucide-react';
import { MathtrixVideo, paletaDe } from '../video/MathtrixVideo.jsx';
import { layoutPregunta } from '../video/escenas.jsx';
import { estiloDe, varsEstilo } from '../video/estilos.jsx';
import { getToken } from '../api.js';
import { RetoFinal } from './RetoFinal.jsx';

function enviar(eventos) {
  if (!eventos.length) return;
  fetch('/api/eventos', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + getToken() }, body: JSON.stringify({ eventos }) }).catch(() => {});
}

export const Reproductor = forwardRef(function Reproductor({ video, autoPlay, controles = true, estilo, onFin, estiloCaja, siguiente, retoAbierto, onReto }, refExt) {
  const ref = useRef(null);
  const caja = useRef(null);
  const tl = video.timeline;
  const clave = estiloDe(estilo || tl?.estilo);
  const P = paletaDe(tl, clave);
  const [elecciones, setElecciones] = useState({});
  const [pregunta, setPregunta] = useState(null);
  const [reto, setReto] = useState(false);
  const elec = useRef({});
  const api = useRef({});
  const sesion = useMemo(() => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())), [video.id]);
  useImperativeHandle(refExt, () => Object.assign(ref.current || {}, { abrirReto: () => { try { ref.current?.pause(); } catch {} setReto(true); } }), [video.id]);
  useEffect(() => { if (retoAbierto) { try { ref.current?.pause(); } catch {} setReto(true); } }, [retoAbierto]);
  useEffect(() => { onReto?.(reto); }, [reto]);
  useEffect(() => { setElecciones({}); elec.current = {}; setPregunta(null); setReto(false); }, [video.id]);
  const inputProps = useMemo(() => ({ tl, estilo: clave, elecciones }), [tl, clave, elecciones]);

  useEffect(() => {
    const p = ref.current;
    if (!p || !tl) return;
    window.__mtxPlayer = p;
    const cola = [];
    let ultimo = 0, jugando = false, fin = false, latido = 0, sistema = 0, t0Preg = 0;
    const saltos = {};
    const preguntas = tl.escenas.filter((e) => e.tipo === 'pregunta');
    const escena = (fr) => tl.escenas.find((e) => fr >= e.inicio && fr < e.inicio + e.duracion) || tl.escenas.at(-1);
    const push = (tipo, extra, fr = p.getCurrentFrame()) => {
      const e = escena(fr);
      cola.push({ video_id: video.id, sesion, tipo, t: +(fr / tl.fps).toFixed(2), escena: e?.i, escena_tipo: e?.tipo, extra });
    };
    const mover = (fr) => { sistema = Date.now(); p.seekTo(fr); };
    api.current.responder = (e, idx) => {
      const ok = idx === e.correcta;
      elec.current = { ...elec.current, [e.i]: idx };
      setElecciones(elec.current);
      push('respuesta', { pregunta: e.i, eleccion: idx, ok, ms: Date.now() - t0Preg }, e.inicio + e.q);
      saltos[e.i] = e.inicio + e.q + (ok ? e.fb_bien : e.fb_mal);
      setPregunta(null);
      mover(e.inicio + e.q);
      setTimeout(() => { sistema = Date.now(); p.play(); }, 60);
    };
    const onPlay = () => { jugando = true; fin = false; push('play'); };
    const onPause = () => { jugando = false; if (Date.now() - sistema < 400) return; if (!fin && p.getCurrentFrame() < tl.duracion - 3) push('pausa'); };
    const onSeeked = (e) => {
      const to = e.detail.frame;
      if (Date.now() - sistema > 400 && Math.abs(to - ultimo) > 8) push(to < ultimo ? 'rebobinar' : 'salto', { desde: +(ultimo / tl.fps).toFixed(2), hasta: +(to / tl.fps).toFixed(2) }, to);
      ultimo = to;
    };
    const onEnded = () => { fin = true; jugando = false; push('fin', null, tl.duracion - 1); onFin?.(); if (video.quiz?.length) setReto(true); };
    const onFrame = (ev) => {
      const fr = ev.detail.frame;
      ultimo = fr;
      if (!jugando) return;
      for (const e of preguntas) {
        const corte = e.inicio + e.q;
        if (elec.current[e.i] === undefined && fr >= corte - 2 && fr < corte + 8) {
          sistema = Date.now(); p.pause(); mover(corte - 1); t0Preg = Date.now(); setPregunta(e); return;
        }
        if (saltos[e.i] && fr >= saltos[e.i] && fr < e.inicio + e.duracion - 3) { delete saltos[e.i]; mover(e.inicio + e.duracion); return; }
      }
    };
    const onRate = (e) => push('velocidad', { rate: e.detail.playbackRate });
    const onVis = () => { if (document.hidden && jugando) push('oculto'); };
    p.addEventListener('play', onPlay); p.addEventListener('pause', onPause); p.addEventListener('seeked', onSeeked);
    p.addEventListener('ended', onEnded); p.addEventListener('frameupdate', onFrame); p.addEventListener('ratechange', onRate);
    document.addEventListener('visibilitychange', onVis);
    let tic = 0;
    const iv = setInterval(() => {
      if (jugando && ++latido % 5 === 0) push('latido');
      if (cola.length && (++tic % 3 === 0 || cola.some((c) => c.tipo === 'respuesta' || c.tipo === 'fin'))) enviar(cola.splice(0));
    }, 1000);
    return () => {
      p.removeEventListener('play', onPlay); p.removeEventListener('pause', onPause); p.removeEventListener('seeked', onSeeked);
      p.removeEventListener('ended', onEnded); p.removeEventListener('frameupdate', onFrame); p.removeEventListener('ratechange', onRate);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
      if (jugando) push('salida');
      enviar(cola.splice(0));
    };
  }, [video.id]);

  if (!tl) return null;
  const rects = pregunta ? layoutPregunta(tl.ancho, tl.alto, Math.min(3, pregunta.opciones.length)) : [];
  const pantallaCompleta = () => { const el = caja.current; if (!document.fullscreenElement) el?.requestFullscreen?.(); else document.exitFullscreen?.(); };
  return (
    <div ref={caja} className="mtx-full" style={{ position: 'relative', ...estiloCaja }}>
      <div className="mtx-marco" style={{ '--ar': tl.ancho / tl.alto, aspectRatio: `${tl.ancho} / ${tl.alto}` }}>
        <Player
          ref={ref}
          component={MathtrixVideo}
          inputProps={inputProps}
          durationInFrames={Math.max(1, tl.duracion)}
          fps={tl.fps}
          compositionWidth={tl.ancho}
          compositionHeight={tl.alto}
          controls={controles && !pregunta && !reto}
          autoPlay={autoPlay}
          clickToPlay={!pregunta && !reto}
          allowFullscreen={false}
          doubleClickToFullscreen={false}
          showPlaybackRateControl={[0.5, 0.75, 1, 1.25, 1.5]}
          spaceKeyToPlayOrPause
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
        {pregunta && (
          <div className="mtx-pregunta" style={varsEstilo(clave, P)}>
            {pregunta.opciones.slice(0, 3).map((o, i) => (
              <button key={i} aria-label={o} onClick={() => api.current.responder(pregunta, i)}
                style={{ left: `${rects[i].x / tl.ancho * 100}%`, top: `${rects[i].y / tl.alto * 100}%`, width: `${rects[i].w / tl.ancho * 100}%`, height: `${rects[i].h / tl.alto * 100}%`, '--ac': P.a }} />
            ))}
          </div>
        )}
        {reto && <RetoFinal video={video} clave={clave} P={P} siguiente={siguiente} onCerrar={() => setReto(false)} onRepetir={() => { setReto(false); try { ref.current.seekTo(0); ref.current.play(); } catch {} }} />}
        {!reto && <button className="mtx-fs" onClick={pantallaCompleta} aria-label="Pantalla completa"><Maximize2 size={16} /></button>}
      </div>
    </div>
  );
});
