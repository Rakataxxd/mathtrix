// Globo de dudas: el alumno pausa, escribe que no entendio y el tutor responde con el contexto del video.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Play, Sparkles, LifeBuoy } from 'lucide-react';
import { api, getToken } from '../api.js';
import { Generador } from './Generador.jsx';

const NOMBRE = { gancho: 'el gancho', datos: 'los datos', formula: 'la fórmula', paso: 'un paso', resultado: 'el resultado', iconos: 'la visualización', fraccion: 'la fracción', comparacion: 'la comparación', grafica: 'la gráfica', cta: 'el reto', pregunta: 'la pregunta', revision: 'tu solución' };
const RAPIDAS = ['No entendí este paso', '¿De dónde salió ese número?', 'Explicámelo más fácil', 'Dame otro ejemplo'];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Texto del tutor: **negrita**, listas y saltos de linea, sin HTML crudo. */
function Rico({ texto }) {
  return String(texto || '').split('\n').map((l, i) => {
    const partes = l.split(/(\*\*[^*]+\*\*)/g).map((p, k) => (p.startsWith('**') && p.endsWith('**') ? <b key={k}>{p.slice(2, -2)}</b> : <React.Fragment key={k}>{p}</React.Fragment>));
    return l.trim() ? <p key={i}>{partes}</p> : <div key={i} style={{ height: 6 }} />;
  });
}

export function Duda({ video, t, escena, onCerrar, onSeguir }) {
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [pensando, setPensando] = useState(false);
  const [trabajo, setTrabajo] = useState(null);
  const lista = useRef(null);
  const input = useRef(null);
  useEffect(() => { api(`/videos/${video.id}/dudas`).then((d) => setMsgs(d.flatMap((x) => [{ rol: 'yo', texto: x.pregunta }, { rol: 'tutor', texto: x.respuesta }]))).catch(() => {}); input.current?.focus(); }, [video.id]);
  useEffect(() => { lista.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [msgs, pensando]);
  const preguntar = async (pregunta) => {
    pregunta = pregunta.trim();
    if (!pregunta || pensando) return;
    const historial = msgs.slice(-6);
    setMsgs((m) => [...m, { rol: 'yo', texto: pregunta }, { rol: 'tutor', texto: '' }]);
    setTxt(''); setPensando(true);
    try {
      const r = await fetch(`/api/videos/${video.id}/duda`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + getToken() }, body: JSON.stringify({ pregunta, t, historial }) });
      const dec = new TextDecoder();
      let acc = '';
      for await (const c of r.body) { acc += dec.decode(c, { stream: true }); const a = acc; setMsgs((m) => [...m.slice(0, -1), { rol: 'tutor', texto: a }]); }
      if (!acc) throw new Error('vacío');
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { rol: 'tutor', texto: 'Se cortó la conexión. Probá otra vez.' }]);
    }
    setPensando(false);
  };
  // volver a la base (atama+): un video mas basico del mismo tema
  const masBasico = async () => {
    try {
      const d = video.leccion ? await api(`/lecciones/${video.leccion.id}/generar`, { cuerpo: { base: true, formato: 'vertical' } }) : await api('/generar-libre', { cuerpo: { tema: video.tema || video.titulo, base: true } });
      setTrabajo(d.trabajo);
    } catch {}
  };
  const ultimo = msgs.at(-1);
  return (
    <div className="duda tema-oscuro" onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <div className="duda-cab">
        <div className="duda-ico"><Sparkles size={16} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>Tutor Mathtrix</b>
          <div className="duda-donde">Pausaste en {mmss(t)}{escena ? ' · ' + (NOMBRE[escena.tipo] || escena.tipo) : ''}</div>
        </div>
        <button className="duda-x" onClick={onCerrar} aria-label="Cerrar"><X size={17} /></button>
      </div>
      <div className="duda-lista" ref={lista}>
        {!msgs.length && <div className="duda-msg tutor"><p>¿Qué no te quedó claro? Preguntame lo que sea de este video: sé exactamente qué estabas viendo.</p></div>}
        {msgs.map((m, i) => (
          <div key={i} className={'duda-msg ' + m.rol}>
            {m.rol === 'tutor' && !m.texto ? <span className="duda-puntos"><i /><i /><i /></span> : m.rol === 'tutor' ? <Rico texto={m.texto} /> : m.texto}
          </div>
        ))}
      </div>
      {!pensando && (
        <div className="duda-rapidas">
          {(msgs.length ? ['Explicámelo más fácil', 'Dame otro ejemplo'] : RAPIDAS).map((q) => <button key={q} onClick={() => preguntar(q)}>{q}</button>)}
          {msgs.length >= 2 && <button className="base" onClick={masBasico}><LifeBuoy size={13} />Video más básico</button>}
        </div>
      )}
      <form className="duda-input" onSubmit={(e) => { e.preventDefault(); preguntar(txt); }}>
        <textarea ref={input} rows={1} value={txt} placeholder="Escribí tu duda…" onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); preguntar(txt); } }} />
        <button className="duda-env" disabled={!txt.trim() || pensando} aria-label="Enviar"><Send size={16} /></button>
      </form>
      <button className="duda-seguir" onClick={onSeguir}><Play size={14} fill="currentColor" />{ultimo?.rol === 'tutor' && ultimo.texto ? '¡Entendí! Seguir viendo' : 'Seguir viendo'}</button>
      {trabajo && createPortal(<div className="tema-claro-portal"><Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} /></div>, document.body)}
    </div>
  );
}
