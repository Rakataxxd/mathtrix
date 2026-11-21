// Progreso en vivo de la generacion (Server-Sent Events). Minimalista: titulo, una barra y el paso actual.
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Sparkles, Play, Check } from 'lucide-react';

const PASOS = { foto: [5, 'Leyendo tu ejercicio paso por paso'], analisis: [10, 'Armando tu video de corrección'], perfil: [6, 'Leyendo tus gustos'], guion: [12, 'Escribiendo tu gancho'], calculo: [70, 'Calculando cada paso exacto'], verificacion: [78, 'Verificando el resultado'], voz: [88, 'Grabando la voz'], listo: [100, '¡Listo!'] };

export function useTrabajo(trabajo) {
  const [st, setSt] = useState({ p: 3, paso: 'Preparando…', titulo: null, cola: '', error: null, listo: null });
  useEffect(() => {
    if (!trabajo) return;
    const es = new EventSource('/api/trabajos/' + trabajo);
    let visto = 0, fin = false, iv = null;
    const procesar = (ev) => {
      if (fin) return;
      setSt((s) => {
        const n = { ...s };
        if (ev.titulo) n.titulo = ev.titulo;
        if (ev.etapa === 'escribiendo') { n.cola = ev.cola || ''; n.p = Math.max(s.p, Math.min(66, 12 + (ev.chars || 0) / 70)); }
        else if (PASOS[ev.etapa]) { n.p = Math.max(s.p, PASOS[ev.etapa][0]); n.paso = PASOS[ev.etapa][1]; }
        if (ev.analisis) n.analisis = ev.analisis;
        if (ev.etapa === 'analisis' && ev.msg) n.paso = ev.msg;
        if (ev.etapa === 'error') n.error = ev.msg;
        if (ev.etapa === 'listo') n.listo = ev;
        return n;
      });
      if (ev.etapa === 'listo' || ev.etapa === 'error') { fin = true; es.close(); clearInterval(iv); }
    };
    es.onmessage = (m) => { visto++; procesar(JSON.parse(m.data)); };
    // respaldo: si el tunel retiene el streaming, se pregunta el estado cada 1.5 s
    iv = setInterval(async () => {
      try {
        const r = await (await fetch(`/api/trabajos/${trabajo}/eventos?desde=${visto}`, { cache: 'no-store' })).json();
        if (r.total > visto) { visto = r.total; r.eventos.forEach(procesar); }
      } catch {}
    }, 1500);
    return () => { es.close(); clearInterval(iv); };
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
      {st.analisis && <Analisis a={st.analisis} />}
      {!st.listo && !st.error && st.cola && !st.analisis && <div className="gen-texto">{st.cola}</div>}
    </div>
  );
}

/** Lo que la IA vio en la foto del alumno: cada paso con ✓ / ✗ (aparece antes que el video). */
export function Analisis({ a }) {
  return (
    <div className="analisis">
      <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>LO QUE VI EN TU HOJA</div>
      <div className="analisis-prob">{a.problema}</div>
      {(a.pasos || []).map((p, i) => (
        <div key={i} className={'analisis-paso ' + (p.ok ? 'ok' : 'mal')}>
          <span className="analisis-marca">{p.ok ? '✓' : '✗'}</span>
          <span className="mono">{p.texto}</span>
          {p.nota && <small>{p.nota}</small>}
        </div>
      ))}
      {a.resumen && <div className="analisis-res">{a.resumen}</div>}
    </div>
  );
}

export function Generador({ trabajo, onCerrar }) {
  const nav = useNavigate();
  const [t0] = useState(Date.now());
  const st = useTrabajo(trabajo);
  // al terminar abre el video y cierra el progreso (antes quedaba tapando el video)
  useEffect(() => { if (st.listo) setTimeout(() => { nav('/ver/' + st.listo.video_id + '?nuevo=1'); onCerrar?.(); }, 700); }, [st.listo]);
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

/** Varios videos a la vez: una fila por video, cada uno con su propio Haiku en paralelo. */
function FilaLote({ trabajo, i }) {
  const [t0] = useState(Date.now());
  const [ahora, setAhora] = useState(Date.now());
  const st = useTrabajo(trabajo);
  useEffect(() => { if (st.listo || st.error) return; const iv = setInterval(() => setAhora(Date.now()), 500); return () => clearInterval(iv); }, [st.listo, st.error]);
  return (
    <div className="lote-fila">
      <div className="entre" style={{ alignItems: 'flex-start' }}>
        <b style={{ fontSize: 14.5, lineHeight: 1.3 }}>{st.titulo || `Video ${i + 1}: inventando el gancho…`}</b>
        {st.listo ? <Link to={'/ver/' + st.listo.video_id} className="btn chico lima"><Play size={14} fill="currentColor" />Ver</Link> : <span className="reloj">{Math.round((ahora - t0) / 1000)}s</span>}
      </div>
      <div className="gen-barra" style={{ marginTop: 10 }}><div style={{ width: `${st.p}%` }} /></div>
      <div className="gen-paso" style={{ marginTop: 6 }}>{st.error ? <span className="error">{st.error}</span> : st.listo ? <><Check size={13} style={{ verticalAlign: -2 }} /> Listo en {(st.listo.ms / 1000).toFixed(0)} s</> : st.paso}</div>
    </div>
  );
}
export function GeneradorLote({ trabajos, onCerrar }) {
  return (
    <div className="modal">
      <div className="caja">
        <div className="entre" style={{ marginBottom: 14 }}>
          <span className="badge lima">{trabajos.length} videos a la vez</span>
          <button className="btn chico ico fant" onClick={onCerrar} aria-label="Cerrar"><X size={17} /></button>
        </div>
        <div className="pila">{trabajos.map((t, i) => <FilaLote key={t} trabajo={t} i={i} />)}</div>
        <div className="dim" style={{ fontSize: 12.5, marginTop: 14 }}>Cada uno se escribe con su propio Haiku en paralelo. Podés cerrar: quedan en tu Inicio.</div>
      </div>
    </div>
  );
}
