import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, ShieldCheck, Cpu, School, Check, Target, Palette } from 'lucide-react';
import { api, hace, vistas } from '../api.js';
import { Avatar, Poster } from '../components/ui.jsx';
import { Reproductor } from '../components/Reproductor.jsx';
import { Comentarios } from '../components/Quiz.jsx';
import { SelectorEstilo } from '../components/SelectorEstilo.jsx';

export function Ver() {
  const { id } = useParams();
  const loc = useLocation();
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  const [recs, setRecs] = useState([]);
  const [like, setLike] = useState(0);
  const [likes, setLikes] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const repRef = useRef();
  const [estiloVer, setEstiloVer] = useState(null);
  const nuevo = new URLSearchParams(loc.search).get('nuevo');

  useEffect(() => {
    setV(null);
    api('/videos/' + id).then((d) => { setV(d); setLike(d.mi_like); setLikes(d.likes); setEstiloVer(d.timeline?.estilo || 'ilustrado'); }).catch((e) => setErr(e.message));
    api('/feed').then((l) => setRecs(l.filter((x) => String(x.id) !== id).slice(0, 14))).catch(() => {});
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => {
    if (v && loc.hash === '#quiz') setTimeout(() => repRef.current?.abrirReto?.(), 400);
    else if (v && loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 300);
  }, [v, loc.hash]);

  const votar = async (val) => { const n = like === val ? 0 : val; setLike(n); const r = await api(`/videos/${id}/like`, { cuerpo: { valor: n } }); setLikes(r.likes); };
  if (err) return <div className="vacio">{err}</div>;
  if (!v) return <div className="vacio">Cargando video…</div>;
  const vert = v.formato === 'vertical';
  return (
    <div className="ver">
      <div>
        <div className={'marco' + (vert ? ' vert' : '')}>
          <Reproductor ref={repRef} video={v} autoPlay={!!nuevo} estilo={estiloVer} siguiente={recs[0] ? '/ver/' + recs[0].id : null} estiloCaja={vert ? { height: 'min(78vh, 900px)', aspectRatio: '9/16' } : { width: '100%' }} />
        </div>
        <h1 style={{ fontSize: 22, marginTop: 16, fontFamily: 'var(--fuente)', fontWeight: 800 }}>{v.titulo}</h1>
        <div className="entre" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <div className="fila"><Avatar nombre={v.autor} color={v.autor_color} size={42} /><div><b>{v.autor}</b><div className="dim" style={{ fontSize: 13 }}>{vistas(v.vistas)} · {hace(v.creado)}</div></div></div>
          <div className="acciones">
            <div className="pill">
              <button className={like === 1 ? 'on' : ''} onClick={() => votar(1)}><ThumbsUp size={18} fill={like === 1 ? 'var(--lima)' : 'none'} />{likes}</button>
              <button className={like === -1 ? 'on' : ''} onClick={() => votar(-1)}><ThumbsDown size={18} /></button>
            </div>
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(location.href); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}>{copiado ? <Check size={17} /> : <Share2 size={17} />}{copiado ? 'Copiado' : 'Compartir'}</button>
          </div>
        </div>
        <div className="desc" style={{ marginTop: 14 }}>
          <div className="fila" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span className="badge lima"><ShieldCheck size={13} />Cuentas verificadas con sympy</span>
            <span className="badge cian"><Cpu size={13} />{v.motor === 'haiku-5.5' ? 'Guion: Claude Haiku 5.5' : v.motor === 'qwen3-gpu' ? 'Guion: qwen3 en RTX 5050' : 'Guion: plantilla'}{v.ms_generacion ? ` · ${(v.ms_generacion / 1000).toFixed(1)} s` : ''}</span>
            <span className="badge">{v.tema}</span>
            {v.leccion && <Link to={`/leccion/${v.leccion.id}`} className="badge oro"><School size={13} />{v.leccion.curso} · {v.leccion.titulo}</Link>}
            {(v.etiquetas || []).map((e) => <span key={e} className="badge">#{e}</span>)}
          </div>
          <div style={{ marginTop: 10 }}>Este video se generó para {v.autor?.split(' ')[0]} con sus gustos. Estructura: <b>gancho → contenido → reto</b>. Pausá, rebobiná y hacé el reto de abajo: todo eso le ayuda a tu profe a saber dónde te trabás.</div>
        </div>
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <div className="entre" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="fila" style={{ gap: 8 }}><Palette size={18} color="var(--lima)" /><b>Mismo video, otro estilo</b><span className="dim" style={{ fontSize: 13 }}>· cambia al instante</span></div>
            {v.quiz?.length > 0 && <button className="btn lima" onClick={() => { repRef.current?.abrirReto?.(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Target size={17} />{v.intento ? `Reto: ${v.intento.aciertos}/${v.intento.total} · repetir` : 'Hacer el reto'}</button>}
          </div>
          <div style={{ marginTop: 12 }}><SelectorEstilo compacto valor={estiloVer} onChange={setEstiloVer} /></div>
        </div>
        <div id="comentarios"><Comentarios videoId={v.id} /></div>
      </div>
      <aside>
        <h3 style={{ marginBottom: 12 }}>A continuación</h3>
        <div className="pila">
          {recs.map((r) => (
            <Link key={r.id} to={`/ver/${r.id}`} className="fila" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 168, flex: 'none' }}><Poster v={r} /></div>
              <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{r.titulo}</div><div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>{r.autor} · {vistas(r.vistas)}</div>{r.motivo && <div className="badge lima" style={{ marginTop: 5, fontSize: 11 }}>{r.motivo}</div>}</div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
