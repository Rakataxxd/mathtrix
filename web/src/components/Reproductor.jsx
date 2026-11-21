// Reproductor: el video es codigo (Remotion) y se dibuja en el navegador. Registra TODA la interaccion.
import React, { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Player } from '@remotion/player';
import { MathtrixVideo } from '../video/MathtrixVideo.jsx';
import { getToken } from '../api.js';

function enviar(eventos) {
  if (!eventos.length) return;
  fetch('/api/eventos', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + getToken() }, body: JSON.stringify({ eventos }) }).catch(() => {});
}

export const Reproductor = forwardRef(function Reproductor({ video, autoPlay, controles = true, loop = false, estilo, onFin }, refExt) {
  const ref = useRef(null);
  const tl = video.timeline;
  const sesion = useMemo(() => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())), [video.id]);
  useImperativeHandle(refExt, () => ref.current, []);

  useEffect(() => {
    const p = ref.current;
    if (!p || !tl) return;
    window.__mtxPlayer = p;
    const cola = [];
    let ultimo = 0, jugando = false, fin = false, latido = 0;
    const escena = (fr) => tl.escenas.find((e) => fr >= e.inicio && fr < e.inicio + e.duracion) || tl.escenas.at(-1);
    const push = (tipo, extra, fr = p.getCurrentFrame()) => {
      const e = escena(fr);
      cola.push({ video_id: video.id, sesion, tipo, t: +(fr / tl.fps).toFixed(2), escena: e?.i, escena_tipo: e?.tipo, extra });
    };
    const onPlay = () => { jugando = true; fin = false; push('play'); };
    const onPause = () => { jugando = false; if (!fin && p.getCurrentFrame() < tl.duracion - 3) push('pausa'); };
    const onSeeked = (e) => { const to = e.detail.frame; if (Math.abs(to - ultimo) > 8) push(to < ultimo ? 'rebobinar' : 'salto', { desde: +(ultimo / tl.fps).toFixed(2), hasta: +(to / tl.fps).toFixed(2) }, to); ultimo = to; };
    const onEnded = () => { fin = true; jugando = false; push('fin', null, tl.duracion - 1); onFin?.(); };
    const onFrame = (e) => { ultimo = e.detail.frame; };
    const onRate = (e) => push('velocidad', { rate: e.detail.playbackRate });
    const onVis = () => { if (document.hidden && jugando) push('oculto'); };
    p.addEventListener('play', onPlay); p.addEventListener('pause', onPause); p.addEventListener('seeked', onSeeked);
    p.addEventListener('ended', onEnded); p.addEventListener('frameupdate', onFrame); p.addEventListener('ratechange', onRate);
    document.addEventListener('visibilitychange', onVis);
    const iv = setInterval(() => {
      if (jugando && ++latido % 5 === 0) push('latido');
      if (cola.length && latido % 4 === 0) enviar(cola.splice(0));
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
  return (
    <Player
      ref={ref}
      component={MathtrixVideo}
      inputProps={{ tl }}
      durationInFrames={Math.max(1, tl.duracion)}
      fps={tl.fps}
      compositionWidth={tl.ancho}
      compositionHeight={tl.alto}
      controls={controles}
      autoPlay={autoPlay}
      loop={loop}
      clickToPlay
      doubleClickToFullscreen
      allowFullscreen
      showPlaybackRateControl={[0.5, 0.75, 1, 1.25, 1.5]}
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${tl.ancho} / ${tl.alto}`, ...estilo }}
    />
  );
});
