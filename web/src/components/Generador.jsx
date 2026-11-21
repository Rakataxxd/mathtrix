// Progreso en vivo de la generacion (Server-Sent Events). Minimalista: titulo, una barra y el paso actual.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

const PASOS = { perfil: [6, 'Leyendo tus gustos'], guion: [12, 'Escribiendo tu gancho'], calculo: [70, 'Calculando cada paso exacto'], verificacion: [78, 'Verificando el resultado'], voz: [88, 'Grabando la voz'], listo: [100, '¡Listo!'] };

export function useTrabajo(trabajo) {
  const [st, setSt] = useState({ p: 3, paso: 'Preparando…', titulo: null, cola: '', error: null, listo: null });
  useEffect(() => {
    if (!trabajo) return;
    const es = new EventSource('/api/trabajos/' + trabajo);
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data);
      setSt((s) => {
        const n = { ...s };
        if (ev.titulo) n.titulo = ev.titulo;
        if (ev.etapa === 'escribiendo') { n.cola = ev.cola || ''; n.p = Math.max(s.p, Math.min(66, 12 + (ev.chars || 0) / 70)); }
        else if (PASOS[ev.etapa]) { n.p = Math.max(s.p, PASOS[ev.etapa][0]); n.paso = PASOS[ev.etapa][1]; }
        if (ev.etapa === 'error') n.error = ev.msg;
        if (ev.etapa === 'listo') n.listo = ev;
        return n;
      });
      if (ev.etapa === 'listo' || ev.etapa === 'error') es.close();
    };
    return () => es.close();
  }, [trabajo]);
  return st;
}

export function Progreso({ st, t0 }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => { if (st.listo || st.error) return; const iv = setInterval(() => setAhora(Date.now()), 200); return () => clearInterval(iv); }, [st.listo, st.error]);
  const seg = ((st.listo?.ms ?? ahora - t0) / 1000).toFixed(0);
  return (
    <div>
      <div className="entre" style={{ alignItems: 'flex-start' }}>
        <h2 style={{ fontSize: 20, lineHeight: 1.3, minHeight: 52 }}>{st.titulo || 'Inventando un gancho para vos…'}</h2>
        <span className="reloj">{seg}s</span>
      </div>
      <div className="gen-barra"><div style={{ width: `${st.p}%` }} /></div>
      <div className="gen-paso">{st.error ? <span className="error">No se pudo: {st.error}</span> : <><Sparkles size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{st.paso}</>}</div>
      {!st.listo && !st.error && st.cola && <div className="gen-texto">{st.cola}</div>}
    </div>
  );
}

export function Generador({ trabajo, onCerrar }) {
  const nav = useNavigate();
  const [t0] = useState(Date.now());
  const st = useTrabajo(trabajo);
  useEffect(() => { if (st.listo) setTimeout(() => nav('/ver/' + st.listo.video_id + '?nuevo=1'), 700); }, [st.listo]);
  return (
    <div className="modal">
      <div className="caja">
        <div className="entre" style={{ marginBottom: 14 }}>
          <span className="badge lima">Tu video personalizado</span>
          {!st.listo && <button className="btn chico ico fant" onClick={onCerrar} aria-label="Cerrar"><X size={17} /></button>}
        </div>
        <Progreso st={st} t0={t0} />
      </div>
    </div>
  );
}
