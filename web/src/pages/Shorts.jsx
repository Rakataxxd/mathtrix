// Shorts con diseño de Reels: un video por pantalla, riel de acciones, comentarios en hoja lateral.
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageCircle, Target, Share2, VolumeX, Volume2, ChevronUp, ChevronDown, X, Check } from 'lucide-react';
import { api } from '../api.js';
import { Poster, Avatar } from '../components/ui.jsx';
import { Reproductor } from '../components/Reproductor.jsx';
import { Comentarios } from '../components/Quiz.jsx';

let conSonido = false; // una vez que el usuario activa el sonido, queda activo para los siguientes

function Reel({ v, activo, onComentarios }) {
  const [full, setFull] = useState(null);
  const [like, setLike] = useState(0);
  const [likes, setLikes] = useState(v.likes || 0);
  const [mudo, setMudo] = useState(!conSonido);
  const [prog, setProg] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const ref = useRef();
  useEffect(() => { if (activo && !full) api('/videos/' + v.id).then((d) => { setFull(d); setLike(d.mi_like); setLikes(d.likes); }).catch(() => {}); }, [activo]);
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    try { if (activo) { p.seekTo(0); if (conSonido) p.unmute(); p.play(); setMudo(!conSonido); } else p.pause(); } catch {}
  }, [activo, full]);
  const sonido = () => { const p = ref.current; if (!p) return; if (mudo) { p.unmute(); conSonido = true; setMudo(false); if (!p.isPlaying()) p.play(); } else { p.mute(); conSonido = false; setMudo(true); } };
  const darLike = async () => { const val = like === 1 ? 0 : 1; setLike(val); setLikes((n) => n + (val ? 1 : -1)); const r = await api(`/videos/${v.id}/like`, { cuerpo: { valor: val } }); setLikes(r.likes); };
  const compartir = () => { navigator.clipboard?.writeText(location.origin + '/shorts/' + v.id); setCopiado(true); setTimeout(() => setCopiado(false), 1400); };
  return (
    <div className="reel">
      <div className="reel-caja">
        {activo && full ? <Reproductor ref={ref} video={full} controles={false} autoPlay silenciado={!conSonido} onProgreso={setProg} sinPantallaCompleta estiloCaja={{ height: '100%', width: '100%' }} /> : <Poster v={v} vert />}
        {activo && full && <button className="reel-sonido" onClick={sonido}>{mudo ? <><VolumeX size={15} />Activar sonido</> : <Volume2 size={15} />}</button>}
        <div className="reel-info">
          <div className="fila" style={{ gap: 10 }}><Avatar nombre={v.autor} color={v.autor_color} size={30} /><b style={{ fontSize: 14 }}>{v.autor}</b></div>
          <div className="reel-tit">{v.titulo}</div>
        </div>
        <div className="reel-prog"><div style={{ width: `${prog * 100}%` }} /></div>
      </div>
      <div className="reel-riel">
        <div><button onClick={darLike} className={like === 1 ? 'on' : ''} aria-label="Me gusta"><Heart fill={like === 1 ? 'currentColor' : 'none'} /></button><small>{likes}</small></div>
        <div><button onClick={() => onComentarios(v.id)} aria-label="Comentarios"><MessageCircle /></button><small>Coment.</small></div>
        <div><button onClick={() => ref.current?.abrirReto?.()} aria-label="Reto"><Target /></button><small>Reto</small></div>
        <div><button onClick={compartir} aria-label="Compartir">{copiado ? <Check /> : <Share2 />}</button><small>{copiado ? 'Copiado' : 'Compartir'}</small></div>
      </div>
    </div>
  );
}

export function Shorts() {
  const { id } = useParams();
  const [vids, setVids] = useState(null);
  const [activo, setActivo] = useState(0);
  const [coment, setComent] = useState(null);
  const cont = useRef();
  useEffect(() => {
    api('/feed?formato=vertical').then((l) => {
      if (id) { const i = l.findIndex((x) => String(x.id) === id); if (i > 0) l.unshift(...l.splice(i, 1)); }
      setVids(l);
    });
  }, [id]);
  useEffect(() => {
    if (!vids || !cont.current) return;
    const obs = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) setActivo(+e.target.dataset.i); }, { root: cont.current, threshold: 0.65 });
    cont.current.querySelectorAll('[data-i]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [vids]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowDown') ir(1); if (e.key === 'ArrowUp') ir(-1); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const ir = (d) => cont.current?.querySelector(`[data-i="${Math.max(0, Math.min((vids?.length || 1) - 1, activo + d))}"]`)?.scrollIntoView({ behavior: 'smooth' });
  if (vids && !vids.length) return <div className="vacio">Todavía no hay Shorts. Creá uno desde Inicio.</div>;
  return (
    <>
      <div className="reels" ref={cont}>
        {(vids || []).map((v, i) => <div key={v.id} data-i={i}><Reel v={v} activo={i === activo} onComentarios={setComent} /></div>)}
      </div>
      <div className="reel-nav">
        <button className="btn ico" onClick={() => ir(-1)} disabled={activo === 0} aria-label="Anterior"><ChevronUp /></button>
        <button className="btn ico" onClick={() => ir(1)} disabled={!vids || activo >= vids.length - 1} aria-label="Siguiente"><ChevronDown /></button>
      </div>
      {coment && (
        <div className="reel-hoja vidrio">
          <div className="entre"><h2>Comentarios</h2><button className="btn chico ico fant" onClick={() => setComent(null)} aria-label="Cerrar"><X size={18} /></button></div>
          <Comentarios videoId={coment} sinTitulo />
        </div>
      )}
    </>
  );
}
