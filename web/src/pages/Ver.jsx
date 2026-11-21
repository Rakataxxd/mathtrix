import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, Check, Target, Palette, ChevronDown } from 'lucide-react';
import { api, hace, vistas } from '../api.js';
import { Avatar, Poster } from '../components/ui.jsx';
import { Reproductor } from '../components/Reproductor.jsx';
import { Comentarios } from '../components/Quiz.jsx';
import { ESTILOS, LISTA_ESTILOS } from '../video/estilos.jsx';

function MenuEstilo({ valor, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef();
  useEffect(() => { const f = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, []);
  return (
    <div className="pop" ref={ref}>
      <button className="btn" onClick={() => setAbierto(!abierto)}><Palette size={16} />{ESTILOS[valor]?.nombre || 'Estilo'}<ChevronDown size={15} /></button>
      {abierto && (
        <div className="pop-caja">
          {LISTA_ESTILOS.map((k) => (
            <button key={k} onClick={() => { onChange(k); setAbierto(false); }}>
              <span><div style={{ fontWeight: 600 }}>{ESTILOS[k].nombre}</div><small>{ESTILOS[k].desc}</small></span>{valor === k && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Ver() {
  const { id } = useParams();
  const loc = useLocation();
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  const [recs, setRecs] = useState([]);
  const [like, setLike] = useState(0);
  const [likes, setLikes] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [estilo, setEstilo] = useState(null);
  const [masDesc, setMasDesc] = useState(false);
  const rep = useRef();
  const nuevo = new URLSearchParams(loc.search).get('nuevo');
  useEffect(() => {
    setV(null);
    api('/videos/' + id).then((d) => { setV(d); setLike(d.mi_like); setLikes(d.likes); setEstilo(d.timeline?.estilo || 'ilustrado'); }).catch((e) => setErr(e.message));
    api('/feed').then((l) => setRecs(l.filter((x) => String(x.id) !== id).slice(0, 16))).catch(() => {});
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => { if (v && loc.hash === '#quiz') setTimeout(() => rep.current?.abrirReto?.(), 400); }, [v, loc.hash]);
  const votar = async (val) => { const n = like === val ? 0 : val; setLike(n); const r = await api(`/videos/${id}/like`, { cuerpo: { valor: n } }); setLikes(r.likes); };
  if (err) return <div className="vacio">{err}</div>;
  if (!v) return <div className="vacio">Cargando…</div>;
  const vert = v.formato === 'vertical';
  return (
    <div className="ver">
      <div>
        <div className={'marco' + (vert ? ' vert' : '')}>
          <Reproductor ref={rep} video={v} autoPlay={!!nuevo} estilo={estilo} siguiente={recs[0] ? '/ver/' + recs[0].id : null} estiloCaja={vert ? { height: 'min(76vh, 880px)', aspectRatio: '9/16' } : { width: '100%' }} />
        </div>
        <div className="ver-tit">{v.titulo}</div>
        <div className="entre" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <div className="fila"><Avatar nombre={v.autor} color={v.autor_color} size={38} /><div><b style={{ fontWeight: 600 }}>{v.autor}</b><div className="dim" style={{ fontSize: 12.5 }}>{vistas(v.vistas)} · {hace(v.creado)}</div></div></div>
          <div className="acciones">
            <div className="pill">
              <button className={like === 1 ? 'on' : ''} onClick={() => votar(1)} aria-label="Me gusta"><ThumbsUp size={17} fill={like === 1 ? 'currentColor' : 'none'} />{likes}</button>
              <button className={like === -1 ? 'on' : ''} onClick={() => votar(-1)} aria-label="No me gusta"><ThumbsDown size={17} /></button>
            </div>
            <MenuEstilo valor={estilo} onChange={setEstilo} />
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(location.href); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}>{copiado ? <Check size={16} /> : <Share2 size={16} />}{copiado ? 'Copiado' : 'Compartir'}</button>
            {v.quiz?.length > 0 && <button className="btn lima" onClick={() => { rep.current?.abrirReto?.(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Target size={16} />{v.intento ? `Reto ${v.intento.aciertos}/${v.intento.total}` : 'Reto'}</button>}
          </div>
        </div>
        <div className="desc" style={{ marginTop: 14, cursor: 'pointer' }} onClick={() => setMasDesc(!masDesc)}>
          <b>{v.tema}</b>{v.leccion && <> · <Link to={`/leccion/${v.leccion.id}`} onClick={(e) => e.stopPropagation()}>{v.leccion.titulo}</Link></>}
          <div style={{ marginTop: 4 }}>Hecho para {v.autor?.split(' ')[0]} con sus gustos. Al final te sale un reto de {v.quiz?.length || 3} preguntas.</div>
          {masDesc ? (
            <div style={{ marginTop: 8 }}>
              Guion: {v.motor === 'haiku-5.5' ? 'Claude Haiku 5.5' : v.motor === 'qwen3-gpu' ? 'qwen3 (GPU)' : 'plantilla'}{v.ms_generacion ? ` · generado en ${(v.ms_generacion / 1000).toFixed(1)} s` : ''} · cuentas calculadas y verificadas con sympy.
              {(v.etiquetas || []).length > 0 && <div style={{ marginTop: 6 }}>{v.etiquetas.map((e) => '#' + e).join('  ')}</div>}
            </div>
          ) : <div style={{ marginTop: 6, fontWeight: 600, color: 'var(--tx)' }}>Más</div>}
        </div>
        <div id="comentarios"><Comentarios videoId={v.id} /></div>
      </div>
      <aside className="pila">
        {recs.map((r) => (
          <Link key={r.id} to={r.formato === 'vertical' ? `/shorts/${r.id}` : `/ver/${r.id}`} className="lado-item">
            <Poster v={r} />
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>{r.titulo}</div><div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>{r.autor}<br />{vistas(r.vistas)}</div></div>
          </Link>
        ))}
      </aside>
    </div>
  );
}
