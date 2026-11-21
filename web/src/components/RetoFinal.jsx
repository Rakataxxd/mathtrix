// Reto final como overlay encima del video: una pregunta a la vez, con correccion inmediata.
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, RotateCcw, ArrowRight, X, Trophy, Check } from 'lucide-react';
import { api } from '../api.js';
import { varsEstilo, tono } from '../video/estilos.jsx';

export function RetoFinal({ video, clave, P, onCerrar, onRepetir, siguiente }) {
  const quiz = video.quiz || [];
  const [i, setI] = useState(-1);
  const [resp, setResp] = useState([]);
  const [rev, setRev] = useState(null);
  const [fin, setFin] = useState(null);
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
  const VERDE = '#3bdc7a', ROJO = '#ff5b6b';
  const AC = clave === 'cuaderno' ? P.c : P.a;
  const q = quiz[i];
  return (
    <div className="reto" style={{ ...varsEstilo(clave, P), background: tono(P.f1, 0.88), color: P.tx }}>
      <button className="reto-x" onClick={onCerrar} aria-label="Cerrar" style={{ color: P.tx }}><X size={18} /></button>
      {i === -1 && !fin && (
        <div className="reto-centro">
          <Target size={46} color={AC} />
          <div className="reto-titulo" style={{ color: AC }}>¡TE TOCA!</div>
          <div className="reto-sub">{quiz.length} preguntas sobre este video. Tu profe ve tus resultados.</div>
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
              <button className="reto-btn" style={{ background: P.a, color: '#0b0420', marginTop: 12 }} onClick={siguientePregunta}>{i + 1 < quiz.length ? 'Siguiente' : 'Ver mi resultado'} <ArrowRight size={17} /></button>
            </div>
          )}
        </div>
      )}
      {fin && (
        <div className="reto-centro">
          <Trophy size={52} color={fin.aciertos / fin.total >= 0.6 ? P.a : '#ffb23b'} />
          <div className="reto-titulo" style={{ color: AC }}>{fin.aciertos}/{fin.total}</div>
          <div className="reto-sub">{fin.aciertos === fin.total ? '¡Perfecto! Sos una máquina.' : fin.aciertos / fin.total >= 0.6 ? '¡Bien! Ya casi lo dominás.' : 'Volvé a ver los pasos y probá de nuevo.'} <b style={{ color: AC }}>+{fin.aciertos * 50} XP</b></div>
          <div className="reto-acc">
            <button className="reto-btn sec" style={{ borderColor: tono(P.tx, 0.3), color: P.tx }} onClick={onRepetir}><RotateCcw size={17} />Ver de nuevo</button>
            {siguiente ? <Link className="reto-btn" style={{ background: P.a, color: '#0b0420' }} to={siguiente}>Siguiente video <ArrowRight size={17} /></Link>
              : <button className="reto-btn" style={{ background: P.a, color: '#0b0420' }} onClick={onCerrar}><Check size={17} />Listo</button>}
          </div>
        </div>
      )}
    </div>
  );
}
