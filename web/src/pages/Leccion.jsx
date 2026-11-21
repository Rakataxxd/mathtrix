import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Upload, ScanLine, Save, Sparkles, BarChart3, FileText, Smartphone, RectangleHorizontal, Lightbulb, AlertTriangle, Users, Clock, Target, PauseCircle, Rewind, BadgeCheck, Play } from 'lucide-react';
import { api, useSesion, hace } from '../api.js';
import { Avatar, VideoCard } from '../components/ui.jsx';
import { Generador } from '../components/Generador.jsx';

export function Leccion() {
  const { usuario } = useSesion();
  return usuario.rol === 'profesor' ? <LeccionProfe /> : <LeccionAlumno />;
}

// ---------------- ALUMNO ----------------
function LeccionAlumno() {
  const { id } = useParams();
  const [l, setL] = useState(null);
  const [mios, setMios] = useState([]);
  const [trabajo, setTrabajo] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api('/lecciones/' + id).then((x) => {
      setL(x);
      api('/cursos/' + x.curso_id).then((c) => setMios(c.lecciones.find((y) => String(y.id) === id)?.mis_videos || []));
    }).catch((e) => setErr(e.message));
    // truco de velocidad: el guion arranca mientras el alumno lee la pantalla
    api(`/lecciones/${id}/pregenerar`, { cuerpo: { formato: 'vertical' } }).catch(() => {});
  }, [id]);
  const generar = async (formato) => { try { const d = await api(`/lecciones/${id}/generar`, { cuerpo: { formato } }); setTrabajo(d.trabajo); } catch (x) { setErr(x.message); } };
  if (err) return <div className="vacio">{err}</div>;
  if (!l) return <div className="vacio">Cargando…</div>;
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="dim" style={{ fontSize: 13 }}><Link to="/clases">Clases</Link> / <Link to={'/curso/' + l.curso_id}>{l.curso_titulo}</Link> / {l.titulo}</div>
      <div className="hero" style={{ marginTop: 14 }}>
        <span className="badge rosa">Clase · {l.tema}</span>
        <h1 style={{ marginTop: 12 }}>{l.titulo}</h1>
        {l.analisis?.resumen && <p className="muted" style={{ maxWidth: 700, fontSize: 16, lineHeight: 1.55 }}>{l.analisis.resumen}</p>}
        {l.analisis?.conceptos?.length > 0 && <div className="chips" style={{ marginTop: 6 }}>{l.analisis.conceptos.slice(0, 6).map((c) => <span key={c} className="chip">{c}</span>)}</div>}
        <div className="fila" style={{ marginTop: 22, flexWrap: 'wrap' }}>
          <button className="btn lima" style={{ height: 52, fontSize: 16 }} onClick={() => generar('vertical')}><Smartphone size={19} />Generar mi Short</button>
          <button className="btn" style={{ height: 52, fontSize: 16 }} onClick={() => generar('horizontal')}><RectangleHorizontal size={19} />Versión YouTube (más larga)</button>
        </div>
        <div className="dim" style={{ fontSize: 13, marginTop: 12 }}>Cada video es único: se arma con tus gustos, tus metas y cómo aprendés mejor.</div>
      </div>
      {mios.length > 0 && (
        <>
          <div className="seccion"><h2>Tus videos de esta clase</h2></div>
          <div className="grid">{mios.map((v) => <VideoCard key={v.id} v={{ ...v, autor: 'Vos', vistas: 0 }} vert={v.formato === 'vertical'} />)}</div>
        </>
      )}
      {trabajo && <Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} />}
    </div>
  );
}

// ---------------- PROFESOR ----------------
function LeccionProfe() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [l, setL] = useState(null);
  const [tab, setTab] = useState(params.get('nueva') ? 'contenido' : 'analitica');
  const [err, setErr] = useState(null);
  const cargar = () => api('/lecciones/' + id).then(setL).catch((e) => setErr(e.message));
  useEffect(() => { cargar(); }, [id]);
  if (err) return <div className="vacio">{err}</div>;
  if (!l) return <div className="vacio">Cargando…</div>;
  return (
    <div style={{ maxWidth: 1250 }}>
      <div className="dim" style={{ fontSize: 13 }}><Link to="/clases">Cursos</Link> / <Link to={'/curso/' + l.curso_id}>{l.curso_titulo}</Link> / {l.titulo}</div>
      <div className="entre" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <div><h1>{l.titulo}</h1><div className="muted" style={{ marginTop: 6 }}>{l.tema}{l.objetivo && ' · ' + l.objetivo}</div></div>
        {l.cnb ? <span className="badge oro"><BadgeCheck size={13} />Alineado al CNB</span> : <span className="badge">Currículo general</span>}
      </div>
      <div className="tabs">
        <button className={tab === 'analitica' ? 'on' : ''} onClick={() => setTab('analitica')}><BarChart3 size={17} />Analítica</button>
        <button className={tab === 'contenido' ? 'on' : ''} onClick={() => setTab('contenido')}><FileText size={17} />Contenido y brief</button>
        <button className={tab === 'probar' ? 'on' : ''} onClick={() => setTab('probar')}><Play size={17} />Vista previa</button>
      </div>
      {tab === 'contenido' && <Contenido l={l} recargar={cargar} />}
      {tab === 'analitica' && <Analitica id={id} />}
      {tab === 'probar' && <Probar l={l} />}
    </div>
  );
}

function Contenido({ l, recargar }) {
  const [archivos, setArchivos] = useState([]);
  const [notas, setNotas] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [prompt, setPrompt] = useState(l.prompt || '');
  const [ej, setEj] = useState(l.ejercicio || '');
  const [msg, setMsg] = useState(null);
  const [arr, setArr] = useState(false);
  const inp = useRef();
  const a = l.analisis;
  useEffect(() => { setPrompt(l.prompt || ''); }, [l.prompt]);
  const subir = async () => {
    setSubiendo(true); setMsg(null);
    try {
      const fd = new FormData();
      archivos.forEach((f) => fd.append('archivos', f));
      if (notas.trim()) fd.append('texto', notas);
      const r = await api(`/lecciones/${l.id}/materiales`, { form: fd });
      setMsg(`Material leído: ${r.archivos.map((x) => `${x.nombre} (${x.chars.toLocaleString()} caracteres)`).join(', ')}`);
      setArchivos([]); setNotas(''); recargar();
    } catch (x) { setMsg(x.message); } finally { setSubiendo(false); }
  };
  const escanear = async () => {
    setEscaneando(true); setMsg(null);
    try {
      if (ej !== l.ejercicio) await api('/lecciones/' + l.id, { metodo: 'PUT', cuerpo: { ejercicio: ej } });
      await api(`/lecciones/${l.id}/escanear`, { cuerpo: {} }); recargar(); setMsg('Brief generado. Revisalo y ajustalo si querés.');
    } catch (x) { setMsg(x.message); } finally { setEscaneando(false); }
  };
  const guardar = async () => { await api('/lecciones/' + l.id, { metodo: 'PUT', cuerpo: { prompt, ejercicio: ej } }); setMsg('Guardado ✓'); recargar(); };
  return (
    <div className="dos" style={{ gridTemplateColumns: '1fr 1.15fr', alignItems: 'start' }}>
      <div className="pila">
        <div className="card">
          <h2 style={{ fontSize: 18 }}>1 · Subí tu material</h2>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>PDF del libro, fotos de la pizarra o del cuaderno, guías. Las imágenes se leen con IA.</div>
          <div className={'soltar' + (arr ? ' on' : '')} style={{ marginTop: 14 }} onClick={() => inp.current.click()} onDragOver={(e) => { e.preventDefault(); setArr(true); }} onDragLeave={() => setArr(false)} onDrop={(e) => { e.preventDefault(); setArr(false); setArchivos([...archivos, ...e.dataTransfer.files]); }}>
            <Upload size={26} /><div style={{ fontWeight: 700, marginTop: 8 }}>Arrastrá archivos o hacé clic</div><div className="dim" style={{ fontSize: 13 }}>PDF, JPG, PNG, TXT · hasta 25 MB</div>
            <input ref={inp} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={(e) => setArchivos([...archivos, ...e.target.files])} />
          </div>
          {archivos.length > 0 && <div style={{ marginTop: 10, fontSize: 14 }}>{archivos.map((f) => <div key={f.name}>📄 {f.name}</div>)}</div>}
          <label className="lab">Notas o referencias (opcional)</label>
          <textarea className="area" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Pegá aquí tu explicación, ejercicios o referencias del libro…" />
          <button className="btn" style={{ marginTop: 12 }} disabled={subiendo || (!archivos.length && !notas.trim())} onClick={subir}><Upload size={16} />{subiendo ? 'Leyendo…' : 'Subir y leer'}</button>
          {l.materiales?.length > 0 && <div style={{ marginTop: 14 }} className="pila">{l.materiales.map((m) => <div key={m.id} className="fila" style={{ fontSize: 13.5 }}><FileText size={15} color="var(--lima)" />{m.nombre}<span className="dim">· {(m.chars || 0).toLocaleString()} caracteres</span></div>)}</div>}
        </div>
        <div className="card">
          <h2 style={{ fontSize: 18 }}>2 · Ecuación o ejercicio a estudiar</h2>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Si querés un ejercicio específico, ponelo aquí. Los números los calcula sympy.</div>
          <input className="input mono" style={{ marginTop: 12 }} value={ej} onChange={(e) => setEj(e.target.value)} placeholder="3x + 12 = 45" />
          <button className="btn lima" style={{ marginTop: 14 }} disabled={escaneando} onClick={escanear}><ScanLine size={17} />{escaneando ? 'Escaneando con IA…' : 'Escanear contenido y generar brief'}</button>
        </div>
        {msg && <div className="badge lima" style={{ whiteSpace: 'normal', lineHeight: 1.4, padding: '8px 12px' }}>{msg}</div>}
      </div>
      <div className="card">
        <h2 style={{ fontSize: 18 }}>3 · Brief de la clase (el prompt de cada video)</h2>
        {!a && <div className="vacio" style={{ padding: 30 }}>Subí material y tocá «Escanear». Mathtrix detecta conceptos, fórmulas, errores comunes{l.cnb ? ' y la competencia del CNB' : ''}.</div>}
        {a && (
          <div className="pila" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 15, lineHeight: 1.55 }}>{a.resumen}</div>
            {a.cnb && <div className="cnb"><b style={{ color: 'var(--oro)' }}>CNB · {a.cnb.area} {a.cnb.grado}</b><div style={{ marginTop: 4 }}><b>Competencia:</b> {a.cnb.competencia}</div><div style={{ marginTop: 4 }}><b>Indicador de logro:</b> {a.cnb.indicador}</div></div>}
            <div className="dos" style={{ gap: 12 }}>
              <div><div className="lab" style={{ marginTop: 0 }}>Conceptos</div>{a.conceptos?.map((c) => <div key={c} style={{ fontSize: 14 }}>• {c}</div>)}</div>
              <div><div className="lab" style={{ marginTop: 0 }}>Fórmulas</div>{a.formulas?.map((c) => <div key={c} className="mono" style={{ fontSize: 13.5, color: 'var(--lima)' }}>{c}</div>)}</div>
            </div>
            {a.errores_comunes?.length > 0 && <div><div className="lab" style={{ marginTop: 0 }}>Errores comunes</div>{a.errores_comunes.map((c) => <div key={c} style={{ fontSize: 14 }}>⚠️ {c}</div>)}</div>}
            <div><label className="lab">Prompt para el guionista (editable)</label><textarea className="area" style={{ minHeight: 170, fontSize: 14 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
            <button className="btn lima" onClick={guardar}><Save size={16} />Guardar brief</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Probar({ l }) {
  const [trabajo, setTrabajo] = useState(null);
  const generar = async (formato) => { const d = await api(`/lecciones/${l.id}/generar`, { cuerpo: { formato } }); setTrabajo(d.trabajo); };
  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 18 }}>Probá cómo lo verán tus alumnos</h2>
      <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Genera un video de muestra con el brief actual. Cada alumno recibe uno distinto, armado con sus gustos y su forma de aprender.</div>
      <div className="fila" style={{ marginTop: 16 }}><button className="btn lima" onClick={() => generar('vertical')}><Smartphone size={17} />Short de muestra</button><button className="btn" onClick={() => generar('horizontal')}><RectangleHorizontal size={17} />Horizontal</button></div>
      {trabajo && <Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} />}
    </div>
  );
}

// ---------------- analitica ----------------
function Retencion({ datos }) {
  const W = 560, H = 190, pad = 28;
  const x = (p) => pad + (p / 100) * (W - pad * 2), y = (v) => H - pad - (v / 100) * (H - pad * 2);
  const d = datos.map((r, i) => `${i ? 'L' : 'M'}${x(r.p)} ${y(r.v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs><linearGradient id="ret" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b6ff3b" stopOpacity=".45" /><stop offset="100%" stopColor="#b6ff3b" stopOpacity="0" /></linearGradient></defs>
      {[0, 50, 100].map((v) => <g key={v}><line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="#ffffff14" /><text x={4} y={y(v) + 4} fill="#6e6e88" fontSize="11">{v}%</text></g>)}
      {datos.length > 0 && <path d={d + ` L${x(100)} ${y(0)} L${x(0)} ${y(0)}Z`} fill="url(#ret)" />}
      {datos.length > 0 && <path d={d} fill="none" stroke="#b6ff3b" strokeWidth="3" />}
      {['Gancho', 'Contenido', 'Reto'].map((t, i) => <text key={t} x={x([4, 50, 94][i])} y={H - 6} fill="#6e6e88" fontSize="11" textAnchor="middle">{t}</text>)}
    </svg>
  );
}

const ESTADO = { comprendio: ['Comprendió', 'lima'], reforzar: ['Reforzar', 'rojo'], vio: ['Vio, sin test', 'cian'], viendo: ['Viendo', 'oro'], sin_video: ['Sin video', ''] };
function Analitica({ id }) {
  const [a, setA] = useState(null);
  useEffect(() => { const c = () => api(`/lecciones/${id}/analitica`).then(setA); c(); const iv = setInterval(c, 8000); return () => clearInterval(iv); }, [id]);
  if (!a) return <div className="vacio">Cargando analítica…</div>;
  const r = a.resumen;
  const maxT = Math.max(1, ...a.trabas.map((t) => t.pausas + t.rebobinar));
  return (
    <div className="pila">
      <div className="kpis">
        <div className="kpi"><div className="l"><Users size={14} /> Alumnos con video</div><div className="n">{r.con_video}<span className="dim" style={{ fontSize: 18 }}>/{r.alumnos}</span></div></div>
        <div className="kpi"><div className="l"><Target size={14} /> Promedio del test</div><div className="n" style={{ color: r.promedio >= 60 ? 'var(--lima)' : 'var(--oro)' }}>{r.promedio ?? '—'}{r.promedio != null && '%'}</div></div>
        <div className="kpi"><div className="l"><BadgeCheck size={14} /> Comprendieron</div><div className="n">{r.comprendieron}</div></div>
        <div className="kpi"><div className="l"><Play size={14} /> Vieron hasta el final</div><div className="n">{r.terminaron}%</div></div>
        <div className="kpi"><div className="l"><Clock size={14} /> Generación promedio</div><div className="n">{r.gen_s ?? '—'}<span className="dim" style={{ fontSize: 18 }}> s</span></div></div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: 18 }}><Lightbulb size={18} color="var(--oro)" style={{ verticalAlign: -3 }} /> Lo que dice la data</h2>
        <div style={{ marginTop: 14 }}>
          {a.insights.map((x, i) => <div key={i} className="insight">{x.tipo === 'traba' || x.tipo === 'abandono' ? <AlertTriangle size={18} color="var(--oro)" /> : <Lightbulb size={18} color="var(--lima)" />}<div>{x.txt}</div></div>)}
          {!a.insights.length && <div className="dim">Todavía no hay suficiente data. Aparece apenas los alumnos vean sus videos.</div>}
        </div>
      </div>
      <div className="dos">
        <div className="card"><h2 style={{ fontSize: 18 }}>¿Hasta dónde ven?</h2><div className="dim" style={{ fontSize: 13, margin: '4px 0 10px' }}>% de reproducciones que llegan a cada punto del video</div><Retencion datos={a.retencion} /></div>
        <div className="card">
          <h2 style={{ fontSize: 18 }}>¿Dónde se traban?</h2><div className="dim" style={{ fontSize: 13, margin: '4px 0 14px' }}>Pausas y rebobinadas por parte del video</div>
          <div className="pila">
            {a.trabas.map((t) => (
              <div key={t.escena_tipo}>
                <div className="entre" style={{ fontSize: 13.5 }}><b>{t.nombre}</b><span className="dim"><PauseCircle size={13} style={{ verticalAlign: -2 }} /> {t.pausas} · <Rewind size={13} style={{ verticalAlign: -2 }} /> {t.rebobinar}</span></div>
                <div className="barrita" style={{ marginTop: 6, display: 'flex' }}><div style={{ width: `${t.pausas / maxT * 100}%`, background: 'var(--oro)', borderRadius: 0 }} /><div style={{ width: `${t.rebobinar / maxT * 100}%`, background: 'var(--rosa)', borderRadius: 0 }} /></div>
              </div>
            ))}
            {!a.trabas.length && <div className="dim">Sin pausas registradas todavía.</div>}
          </div>
        </div>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Alumnos</h2>
        <table className="tabla">
          <thead><tr><th>Alumno</th><th>Su gancho</th><th>Visto</th><th>Pausas</th><th>Rebob.</th><th>Test</th><th>Aprende mejor</th><th>Estado</th></tr></thead>
          <tbody>
            {a.alumnos.map((x) => (
              <tr key={x.id}>
                <td><div className="fila"><Avatar nombre={x.nombre} color={x.color} size={28} /><b style={{ fontSize: 14 }}>{x.nombre}</b></div></td>
                <td style={{ maxWidth: 260 }}>{x.video_id ? <Link to={'/ver/' + x.video_id} style={{ fontSize: 13 }} className="muted">{x.gancho}</Link> : <span className="dim">—</span>}</td>
                <td><div className="fila" style={{ gap: 8 }}><div className="barrita"><div style={{ width: x.visto + '%', background: 'var(--lima)' }} /></div><span className="mono" style={{ fontSize: 12 }}>{x.visto}%</span></div></td>
                <td className="mono">{x.pausas}</td><td className="mono">{x.rebobinadas}</td>
                <td className="mono" style={{ color: x.puntaje == null ? undefined : x.puntaje >= 60 ? 'var(--lima)' : 'var(--rojo)', fontWeight: 800 }}>{x.puntaje == null ? '—' : `${x.aciertos}/${x.total}`}</td>
                <td style={{ fontSize: 12.5 }} className="muted">{(x.aprende || []).slice(0, 2).join(', ') || '—'}{x.traba && <div className="dim">se traba en: {x.traba}</div>}</td>
                <td><span className={'badge ' + ESTADO[x.estado][1]}>{ESTADO[x.estado][0]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
