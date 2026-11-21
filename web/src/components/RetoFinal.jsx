// Reto final como overlay encima del video: una pregunta a la vez, con correccion inmediata.
// Al fallar muestra "que pasaria si" (consecuencia). Al terminar: XP y nivel, reflexion de 1 toque (furikaeri),
// practica extra si acerto lento (Kumon) y video mas basico si le fue mal (atama+).
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Target, RotateCcw, ArrowRight, X, Trophy, Check, LifeBuoy, Timer } from 'lucide-react';
import { api, getToken } from '../api.js';
import { varsEstilo, tono } from '../video/estilos.jsx';
import { Generador } from './Generador.jsx';

const REFLEXION = [['domino', '💪', 'Lo domino'], ['mas_o_menos', '🤔', 'Más o menos'], ['perdido', '😵', 'Me perdí']];

export function RetoFinal({ video, clave, P, onCerrar, onRepetir, siguiente }) {
  const quiz = video.quiz || [];
  const [i, setI] = useState(-1);
  const [resp, setResp] = useState([]);
  const [rev, setRev] = useState(null);
  const [fin, setFin] = useState(null);
  const [refl, setRefl] = useState(null);
  const [trabajo, setTrabajo] = useState(null);
  const tiempos = useRef([]);
  const t0 = useRef(Date.now());
  const elegir = async (oi) => {
    if (rev) return;
    tiempos.current[i] = Date.now() - t0.current;
    const r = await api(`/videos/${video.id}/quiz/revisar`, { cuerpo: { i, eleccion: oi } });
    setResp((x) => { const n = [...x]; n[i] = oi; return n; });
    setRev({ ...r, eleccion: oi });
  };
  const siguientePregunta = async () => {
    setRev(null); t0.current = Date.now();
    if (i + 1 < quiz.length) { setI(i + 1); return; }
    const r = await api(`/videos/${video.id}/quiz`, { cuerpo: { respuestas: resp, tiempos: tiempos.current } });
    setFin(r);
  };
  const reflexionar = (valor) => {
    setRefl(valor);
    fetch('/api/eventos', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + getToken() }, body: JSON.stringify({ eventos: [{ video_id: video.id, tipo: 'reflexion', extra: { valor, aciertos: fin?.aciertos, total: fin?.total } }] }) }).catch(() => {});
  };
  const generar = async (base) => {
    try {
      const d = video.leccion ? await api(`/lecciones/${video.leccion.id}/generar`, { cuerpo: { base, formato: 'vertical' } }) : await api('/generar-libre', { cuerpo: { tema: video.tema || video.titulo, base } });
      setTrabajo(d.trabajo);
    } catch {}
  };
  const VERDE = '#3bdc7a', ROJO = '#ff5b6b';
  const AC = clave === 'cuaderno' ? P.c : P.a;
  const q = quiz[i];
  const pct = fin ? fin.aciertos / (fin.total || 1) : 0;
  const nivel = fin?.puntos?.nivel;
  return (
    <div className="reto" style={{ ...varsEstilo(clave, P), background: tono(P.f1, 0.9), color: P.tx }}>
      <button className="reto-x" onClick={onCerrar} aria-label="Cerrar" style={{ color: P.tx }}><X size={18} /></button>
      {i === -1 && !fin && (
        <div className="reto-centro">
          <Target size={46} color={AC} />
          <div className="reto-titulo" style={{ color: AC }}>¡TE TOCA!</div>
          <div className="reto-sub">{quiz.length} preguntas sobre este video. Cada acierto suma <b>50 XP</b>.</div>
          <button className="reto-btn" style={{ background: P.a, color: '#0b0420' }} onClick={() => { setI(0); t0.current = Date.now(); }}>Empezar el reto <ArrowRight size={18} /></button>
        </div>
      )}
      {q && !fin && (
        <div className="reto-q">
          <div className="reto-prog">{quiz.map((_, k) => <span key={k} style={{ background: k < i ? P.a : k === i ? P.tx : tono(P.tx, 0.2) }} />)}</div>
          <div className="reto-num" style={{ color: AC }}>PREGUNTA {i + 1}/{quiz.length}</div>
          <div className="reto-preg">{q.pregunta}</div>
          <div className="reto-ops">
            {q.opciones.map((o, oi) => {
              let borde = tono(P.tx, 0.25), fondo = tono(P.tx, 0.06), marca = 'ABCDE'[oi];
              if (rev) {
                if (oi === rev.correcta) { borde = VERDE; fondo = tono(VERDE, 0.2); marca = '✓'; }
                else if (oi === rev.eleccion) { borde = ROJO; fondo = tono(ROJO, 0.18); marca = '✗'; }
              }
              return (
                <button key={oi} className={'reto-op' + (rev && oi === rev.eleccion && !rev.ok ? ' tiembla' : '')} onClick={() => elegir(oi)} style={{ borderColor: borde, background: fondo, color: P.tx, opacity: rev && oi !== rev.correcta && oi !== rev.eleccion ? 0.45 : 1 }}>
                  <span className="reto-letra" style={{ background: rev && (oi === rev.correcta || oi === rev.eleccion) ? borde : P.a }}>{marca}</span>{o}
                </button>
              );
            })}
          </div>
          {rev && (
            <div className="reto-fb" style={{ borderColor: rev.ok ? VERDE : ROJO }}>
              <b style={{ color: rev.ok ? VERDE : ROJO }}>{rev.ok ? '¡Exacto!' : '¡No! Casi…'}</b> {rev.explicacion}
              {!rev.ok && rev.consecuencia && <div className="reto-cons">😬 <b>¿Qué pasaría?</b> {rev.consecuencia}</div>}
              <div><button className="reto-btn" style={{ background: P.a, color: '#0b0420', marginTop: 12 }} onClick={siguientePregunta}>{i + 1 < quiz.length ? 'Siguiente' : 'Ver mi resultado'} <ArrowRight size={17} /></button></div>
            </div>
          )}
        </div>
      )}
      {fin && (
        <div className="reto-centro">
          <Trophy size={44} color={pct >= 0.6 ? P.a : '#ffb23b'} />
          <div className="reto-titulo" style={{ color: AC }}>{fin.aciertos}/{fin.total}</div>
          <div className="reto-sub">{fin.aciertos === fin.total ? '¡Perfecto! Sos una máquina.' : pct >= 0.6 ? '¡Bien! Ya casi lo dominás.' : 'Todavía no. Te armo algo más fácil.'}</div>
          {nivel && (
            <div className="reto-xp">
              <div className="entre"><b style={{ color: AC }}>+{fin.aciertos * 50} XP</b><span>Nivel {nivel.n} · {nivel.nombre}</span></div>
              <div className="reto-xp-barra" style={{ background: tono(P.tx, 0.15) }}><div style={{ width: `${Math.round(nivel.progreso * 100)}%`, background: P.a }} /></div>
            </div>
          )}
          {!refl ? (
            <div className="reto-refl">
              <div className="reto-num" style={{ color: tono(P.tx, 0.7) }}>¿CÓMO TE QUEDÓ ESTE TEMA?</div>
              <div className="reto-acc">{REFLEXION.map(([k, e, t]) => <button key={k} className="reto-btn sec" style={{ borderColor: tono(P.tx, 0.3), color: P.tx }} onClick={() => reflexionar(k)}>{e} {t}</button>)}</div>
            </div>
          ) : (
            <div className="reto-logro" style={{ borderColor: AC }}>
              {refl === 'domino' && pct >= 0.6 ? <>🏅 <b>Dominaste:</b> {video.tema || video.titulo}</> : refl === 'perdido' || pct < 0.5 ? <>🧭 Tranqui: volver a la base es de genios. Probá el video más básico.</> : <>📌 Un repaso más y queda. Tu profe ya sabe dónde reforzar.</>}
            </div>
          )}
          {fin.lentas?.length > 0 && pct >= 0.6 && <div className="reto-sub" style={{ fontSize: 'clamp(12px, 3.2cqw, 16px)' }}><Timer size={14} style={{ verticalAlign: -2 }} /> Acertaste, pero tardaste. Uno parecido más y te sale en automático.</div>}
          <div className="reto-acc">
            {(pct < 0.5 || refl === 'perdido') && <button className="reto-btn" style={{ background: P.a, color: '#0b0420' }} onClick={() => generar(true)}><LifeBuoy size={17} />Video más básico</button>}
            {fin.lentas?.length > 0 && pct >= 0.6 && <button className="reto-btn" style={{ background: P.a, color: '#0b0420' }} onClick={() => generar(false)}><Timer size={17} />Practicar otro parecido</button>}
            <button className="reto-btn sec" style={{ borderColor: tono(P.tx, 0.3), color: P.tx }} onClick={onRepetir}><RotateCcw size={17} />Ver de nuevo</button>
            {siguiente ? <Link className="reto-btn" style={{ background: P.a, color: '#0b0420' }} to={siguiente}>Siguiente <ArrowRight size={17} /></Link>
              : <button className="reto-btn" style={{ background: P.a, color: '#0b0420' }} onClick={onCerrar}><Check size={17} />Listo</button>}
          </div>
        </div>
      )}
      {trabajo && createPortal(<Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} />, document.body)}
    </div>
  );
}
