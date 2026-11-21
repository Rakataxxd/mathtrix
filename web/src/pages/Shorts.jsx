import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Target, Share2, Play } from 'lucide-react';
import { api } from '../api.js';
import { Poster, Avatar } from '../components/ui.jsx';
import { Reproductor } from '../components/Reproductor.jsx';

let gesto = false; // el navegador solo deja sonar audio despues de un toque del usuario

function Item({ v, activo }) {
  const [full, setFull] = useState(null);
  const [toque, setToque] = useState(gesto);
  const [like, setLike] = useState(0);
  const [likes, setLikes] = useState(v.likes || 0);
  const ref = useRef();
  useEffect(() => { if (activo && !full) api('/videos/' + v.id).then((d) => { setFull(d); setLike(d.mi_like); setLikes(d.likes); }).catch(() => {}); }, [activo]);
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    if (activo && toque) { try { p.seekTo(0); p.play(); } catch {} } else { try { p.pause(); } catch {} }
  }, [activo, toque, full]);
  const darLike = async () => { const val = like === 1 ? 0 : 1; setLike(val); const r = await api(`/videos/${v.id}/like`, { cuerpo: { valor: val } }); setLikes(r.likes); };
  return (
    <div className="short">
      <div className="caja">
        {activo && full ? <Reproductor ref={ref} video={full} controles={toque} estiloCaja={{ height: '100%', aspectRatio: '9/16', maxWidth: '100%', margin: '0 auto' }} /> : <Poster v={v} vert />}
        {activo && full && !toque && <div className="tocar" onClick={() => { gesto = true; setToque(true); }}><div className="btn lima" style={{ height: 64, padding: '0 28px', fontSize: 18 }}><Play fill="#000" size={22} />Tocá para ver</div></div>}
        <div className="info">
          <div className="fila"><Avatar nombre={v.autor} color={v.autor_color} size={30} /><b style={{ fontSize: 14 }}>{v.autor}</b>{v.motivo && <span className="badge lima">{v.motivo}</span>}</div>
          <div style={{ fontWeight: 700, marginTop: 8, fontSize: 15 }}>{v.titulo}</div>
        </div>
      </div>
      <div className="lado">
        <div><button onClick={darLike} className={like === 1 ? 'on' : ''} aria-label="Me gusta"><Heart fill={like === 1 ? 'var(--lima)' : 'none'} /></button><small>{likes}</small></div>
        <div><Link to={`/ver/${v.id}#comentarios`} aria-label="Comentarios"><MessageCircle /></Link><small>Coment.</small></div>
        <div><button aria-label="Reto" style={{ background: 'var(--lima)', color: '#000' }} onClick={() => ref.current?.abrirReto?.()}><Target /></button><small>Reto</small></div>
        <div><button aria-label="Compartir" onClick={() => navigator.clipboard?.writeText(location.origin + '/ver/' + v.id)}><Share2 /></button><small>Compartir</small></div>
      </div>
    </div>
  );
}

export function Shorts() {
  const { id } = useParams();
  const [vids, setVids] = useState(null);
  const [activo, setActivo] = useState(0);
  const cont = useRef();
  useEffect(() => {
    api('/feed?formato=vertical').then((l) => {
      if (id) { const i = l.findIndex((x) => String(x.id) === id); if (i > 0) l.unshift(...l.splice(i, 1)); }
      setVids(l);
    });
  }, [id]);
  useEffect(() => {
    if (!vids || !cont.current) return;
    const obs = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting && e.intersectionRatio > 0.6) setActivo(+e.target.dataset.i); }, { root: cont.current, threshold: [0.6] });
    cont.current.querySelectorAll('[data-i]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [vids]);
  if (vids && !vids.length) return <div className="vacio">Todavía no hay Shorts. Generá uno desde Inicio o desde tu clase.</div>;
  return (
    <div className="shorts" ref={cont}>
      {(vids || []).map((v, i) => <div key={v.id} data-i={i}><Item v={v} activo={i === activo} /></div>)}
    </div>
  );
}
