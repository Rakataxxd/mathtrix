// Progreso en vivo de la generacion (Server-Sent Events): el guion se ve mientras Haiku lo escribe.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Cpu } from 'lucide-react';

const ETAPAS = [
  { k: 'perfil', txt: 'Analizando tu perfil y tu forma de aprender' },
  { k: 'guion', txt: 'Escribiendo el guion: gancho → contenido → reto' },
  { k: 'calculo', txt: 'Calculando cada paso con sympy (fracciones exactas)' },
  { k: 'verificacion', txt: 'Verificando que el resultado cierre' },
  { k: 'voz', txt: 'Grabando la voz neural y los subtítulos' },
  { k: 'listo', txt: 'Armando las animaciones' },
];

export function Generador({ trabajo, onCerrar }) {
  const nav = useNavigate();
  const [hechas, setHechas] = useState({});
  const [actual, setActual] = useState('perfil');
  const [msgs, setMsgs] = useState({});
  const [titulo, setTitulo] = useState(null);
  const [cola, setCola] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [error, setError] = useState(null);
  const [t0] = useState(Date.now());
  const [ahora, setAhora] = useState(Date.now());
  const [listo, setListo] = useState(null);

  useEffect(() => { const iv = setInterval(() => setAhora(Date.now()), 100); return () => clearInterval(iv); }, []);
  useEffect(() => {
    if (!trabajo) return;
    const es = new EventSource('/api/trabajos/' + trabajo);
    const orden = ETAPAS.map((e) => e.k);
    const marcar = (k) => setHechas((h) => { const n = { ...h }; for (const x of orden.slice(0, orden.indexOf(k))) n[x] = true; return n; });
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data);
      if (ev.etapa === 'escribiendo') { setCola(ev.cola || ''); return; }
      if (ev.etapa === 'titulo' || ev.titulo) setTitulo(ev.titulo);
      if (ev.etapa === 'aviso') { setAvisos((a) => [...a, ev.msg]); return; }
      if (ev.etapa === 'guion_ok') { setMsgs((x) => ({ ...x, guion: ev.msg })); return; }
      if (ev.etapa === 'error') { setError(ev.msg); es.close(); return; }
      if (orden.includes(ev.etapa)) { setActual(ev.etapa); marcar(ev.etapa); setMsgs((x) => ({ ...x, [ev.etapa]: ev.msg })); }
      if (ev.etapa === 'listo') {
        es.close(); setHechas(Object.fromEntries(orden.map((k) => [k, true]))); setListo(ev);
        setTimeout(() => nav('/ver/' + ev.video_id + '?nuevo=1'), 900);
      }
    };
    es.onerror = () => {};
    return () => es.close();
  }, [trabajo]);

  const seg = ((listo?.ms ?? ahora - t0) / 1000).toFixed(1);
  return (
    <div className="modal">
      <div className="caja">
        <div className="entre">
          <div>
            <div className="badge lima"><Cpu size={13} />Generando tu video personalizado</div>
            <h2 style={{ marginTop: 10, minHeight: 28 }}>{titulo || 'Inventando un gancho ridículo…'}</h2>
          </div>
          <div className="reloj">{seg}s</div>
        </div>
        <div className="etapas">
          {ETAPAS.map((e) => {
            const ok = hechas[e.k], on = !ok && actual === e.k && !error;
            return (
              <div key={e.k} className={'etapa' + (ok ? ' ok' : on ? ' on' : '')}>
                <div className="pt">{ok && <Check size={14} strokeWidth={3} />}</div>
                <div><div style={{ fontWeight: 700 }}>{e.txt}</div>{msgs[e.k] && <div className="dim" style={{ fontSize: 13, marginTop: 2 }}>{msgs[e.k]}</div>}</div>
              </div>
            );
          })}
          {avisos.map((a, i) => <div key={i} className="etapa aviso"><div className="pt" style={{ borderColor: 'var(--oro)' }}>!</div><div style={{ fontSize: 13 }}>{a}</div></div>)}
        </div>
        {actual === 'guion' && !hechas.guion && <div className="terminal">{cola || 'esperando el primer token…'}<span style={{ animation: 'gira 1s steps(2) infinite' }}>▌</span></div>}
        {error && <div className="error" style={{ marginTop: 16 }}>No se pudo generar: {error}</div>}
        <div className="entre" style={{ marginTop: 20 }}>
          <div className="dim" style={{ fontSize: 12.5 }}>Haiku 5.5 escribe · sympy calcula · el video es código: se dibuja en tu navegador, sin renderizar.</div>
          {(error || !listo) && <button className="btn chico" onClick={onCerrar}><X size={15} />{error ? 'Cerrar' : 'Ocultar'}</button>}
        </div>
      </div>
    </div>
  );
}
