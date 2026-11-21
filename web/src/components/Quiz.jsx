import React, { useEffect, useRef, useState } from 'react';
import { Target, Send, Trophy, RotateCcw } from 'lucide-react';
import { api, hace } from '../api.js';
import { Avatar } from './ui.jsx';

/** Mini test debajo del video: el CTA "probalo vos". Guarda respuestas y tiempo por pregunta. */
export function Quiz({ video, onHecho }) {
  const [resp, setResp] = useState(() => video.quiz.map(() => null));
  const [res, setRes] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inicio = useRef(Date.now());
  const tiempos = useRef(video.quiz.map(() => 0));
  const ultimo = useRef(Date.now());

  useEffect(() => { setResp(video.quiz.map(() => null)); setRes(null); tiempos.current = video.quiz.map(() => 0); }, [video.id]);

  const elegir = (qi, oi) => {
    if (res) return;
    const ahora = Date.now();
    tiempos.current[qi] += ahora - ultimo.current; ultimo.current = ahora;
    setResp((r) => r.map((x, i) => (i === qi ? oi : x)));
  };
  const enviar = async () => {
    setEnviando(true);
    try { const r = await api(`/videos/${video.id}/quiz`, { cuerpo: { respuestas: resp, tiempos: tiempos.current } }); setRes(r); onHecho?.(r); }
    finally { setEnviando(false); }
  };
  const todo = resp.every((x) => x !== null);
  return (
    <div className="quiz">
      <div className="entre">
        <div className="fila"><Target size={22} color="var(--lima)" /><h2>¡Probalo vos!</h2></div>
        <span className="badge lima">{video.quiz.length} preguntas · +50 XP c/u</span>
      </div>
      <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>Demostrá que entendiste el video. Tu profe ve tus resultados (sin presión, se vale equivocarse).</div>
      {video.quiz.map((q, qi) => (
        <div className="q" key={qi}>
          <h3>{qi + 1}. {q.pregunta}</h3>
          <div className="ops">
            {q.opciones.map((o, oi) => {
              let c = 'op';
              if (res) { if (res.detalle[qi].correcta === oi) c += ' bien'; else if (resp[qi] === oi) c += ' mal'; }
              else if (resp[qi] === oi) c += ' sel';
              return <button key={oi} className={c} onClick={() => elegir(qi, oi)}><span className="mono" style={{ opacity: 0.5, marginRight: 8 }}>{'ABCDE'[oi]}</span>{o}</button>;
            })}
          </div>
          {res && <div className="dim" style={{ fontSize: 13.5, marginTop: 8 }}>{res.detalle[qi].ok ? '✓ ' : '✗ '}{res.explicaciones[qi].explicacion}</div>}
        </div>
      ))}
      <div className="entre" style={{ marginTop: 22 }}>
        {res ? (
          <div className="fila">
            <Trophy size={34} color={res.aciertos / res.total >= 0.6 ? 'var(--lima)' : 'var(--oro)'} />
            <div><div className="puntaje">{res.aciertos}/{res.total}</div><div className="muted" style={{ fontSize: 14 }}>{res.aciertos === res.total ? '¡Perfecto! Sos una máquina.' : res.aciertos / res.total >= 0.6 ? '¡Bien! Ya casi lo dominás.' : 'Volvé a ver la parte de los pasos y probá de nuevo.'} +{res.aciertos * 50} XP</div></div>
          </div>
        ) : <div className="dim" style={{ fontSize: 13 }}>{resp.filter((x) => x !== null).length}/{resp.length} respondidas</div>}
        {res ? <button className="btn" onClick={() => { setRes(null); setResp(video.quiz.map(() => null)); }}><RotateCcw size={16} />Intentar de nuevo</button>
          : <button className="btn lima" disabled={!todo || enviando} onClick={enviar}><Send size={16} />Revisar respuestas</button>}
      </div>
    </div>
  );
}

export function Comentarios({ videoId }) {
  const [lista, setLista] = useState([]);
  const [txt, setTxt] = useState('');
  const cargar = () => api(`/videos/${videoId}/comentarios`).then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, [videoId]);
  const enviar = async (e) => { e.preventDefault(); if (!txt.trim()) return; await api(`/videos/${videoId}/comentarios`, { cuerpo: { texto: txt } }); setTxt(''); cargar(); };
  return (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 18 }}>{lista.length} comentarios</h2>
      <form onSubmit={enviar} className="fila" style={{ marginTop: 14 }}>
        <input className="input" placeholder="¿Qué no entendiste? ¿Qué gancho querés ver?" value={txt} onChange={(e) => setTxt(e.target.value)} />
        <button className="btn lima" aria-label="Comentar"><Send size={16} /></button>
      </form>
      <div style={{ marginTop: 18 }} className="pila">
        {lista.map((c) => (
          <div key={c.id} className="fila" style={{ alignItems: 'flex-start' }}>
            <Avatar nombre={c.nombre} color={c.color} size={34} />
            <div><div style={{ fontSize: 13 }}><b>{c.nombre}</b> {c.rol === 'profesor' && <span className="badge oro" style={{ padding: '1px 7px' }}>Profe</span>} <span className="dim">{hace(c.creado)}</span></div><div style={{ fontSize: 14.5, marginTop: 3, lineHeight: 1.45 }}>{c.texto}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
