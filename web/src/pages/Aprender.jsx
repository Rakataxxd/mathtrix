// Progreso: nivel y XP, logros, ranking de la clase o global, como aprende (detectado por la data) y repasos.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Eye, Target, Sparkles, Brain, RotateCcw, BarChart3, Pencil, Trophy, Zap, Clock, Info } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { Poster, Avatar } from '../components/ui.jsx';

const ESCENA = { gancho: 'el gancho', datos: 'los datos', formula: 'la fórmula', paso: 'los pasos de resolución', resultado: 'el resultado', cta: 'el reto', fraccion: 'las fracciones', grafica: 'las gráficas', iconos: 'la visualización', comparacion: 'las comparaciones', pregunta: 'las preguntas', revision: 'la revisión' };
const FUENTES = { visto: ['🎬', 'Videos terminados'], acierto: ['🎯', 'Aciertos en retos'], en_video: ['👆', 'Respuestas en el video'], revision: ['📸', 'Ejercicios revisados'], duda: ['🙋', 'Dudas al tutor'], reflexion: ['🪞', 'Reflexiones'], racha: ['🔥', 'Días de racha'], creado: ['✨', 'Videos creados'] };
const ORO = ['#ffd23b', '#d9dde5', '#e9a46a'];

function Anillo({ nivel, xp }) {
  const r = 58, c = 2 * Math.PI * r;
  return (
    <div className="anillo">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--v2)" strokeWidth="11" />
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--acento)" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - nivel.progreso)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="dentro"><div><span>NIVEL</span><b>{nivel.n}</b><span>{xp.toLocaleString()} XP</span></div></div>
    </div>
  );
}

export function Ranking({ inicial = 'clase', titulo = 'Ranking' }) {
  const [alcance, setAlcance] = useState(inicial);
  const [periodo, setPeriodo] = useState('semana');
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); api(`/ranking?alcance=${alcance}&periodo=${periodo}`).then(setD).catch(() => setD({ top: [], total: 0 })); }, [alcance, periodo]);
  const podio = d?.top.slice(0, 3) || [];
  const resto = d?.top.slice(3) || [];
  const fueraTop = d?.yo && d.yo.pos > d.top.length;
  return (
    <div className="card">
      <div className="entre" style={{ flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18 }}><Trophy size={18} color="var(--oro)" style={{ verticalAlign: -3 }} /> {titulo}</h2>
        <div className="fila" style={{ gap: 6, flexWrap: 'wrap' }}>
          <div className="seg"><button className={alcance === 'clase' ? 'on' : ''} onClick={() => setAlcance('clase')}>Mi clase</button><button className={alcance === 'global' ? 'on' : ''} onClick={() => setAlcance('global')}>Guatemala</button></div>
          <div className="seg"><button className={periodo === 'semana' ? 'on' : ''} onClick={() => setPeriodo('semana')}>Semana</button><button className={periodo === 'todo' ? 'on' : ''} onClick={() => setPeriodo('todo')}>Siempre</button></div>
        </div>
      </div>
      {!d ? <div className="vacio" style={{ padding: 30 }}>Cargando…</div> : !d.top.length ? <div className="vacio" style={{ padding: 30 }}>Todavía no hay puntos esta semana. ¡Sé el primero!</div> : (
        <>
          <div className="podio">
            {[1, 0, 2].map((k) => podio[k] && (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar nombre={podio[k].nombre} color={podio[k].color} size={k === 0 ? 54 : 44} /></div>
                <div className="nom">{podio[k].yo ? 'Vos' : podio[k].nombre.split(' ')[0]}</div>
                <div className="xp">{podio[k].xp.toLocaleString()} XP</div>
                <div className="base" style={{ height: [92, 66, 50][k], background: ORO[k] }}>{k + 1}</div>
              </div>
            ))}
          </div>
          {resto.map((f) => <FilaRank key={f.id} f={f} />)}
          {fueraTop && <><div className="dim" style={{ textAlign: 'center', margin: '4px 0' }}>···</div><FilaRank f={d.yo} /></>}
          <div className="dim" style={{ fontSize: 12.5, marginTop: 10 }}><Info size={12} style={{ verticalAlign: -2 }} /> {d.total} alumnos. Repetir un reto no suma: cuenta tu mejor intento.</div>
        </>
      )}
    </div>
  );
}
function FilaRank({ f }) {
  return (
    <div className={'rank-fila' + (f.yo ? ' yo' : '')}>
      <span className="pos">{f.pos}</span>
      <Avatar nombre={f.nombre} color={f.color} size={32} />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: f.yo ? 700 : 500 }}>{f.yo ? 'Vos' : f.nombre}<span className="dim" style={{ fontSize: 12, marginLeft: 8 }}>{f.vistos} videos</span></span>
      <span className="xp">{f.xp.toLocaleString()}</span>
    </div>
  );
}

export function Aprender() {
  const { usuario } = useSesion();
  return usuario.rol === 'profesor' ? <Panel /> : <ProgresoAlumno />;
}

function ProgresoAlumno() {
  const { perfil } = useSesion();
  const [d, setD] = useState(null);
  useEffect(() => { api('/aprender').then(setD); }, []);
  if (!d) return <div className="vacio">Cargando…</div>;
  const st = d.stats || {};
  const p = d.puntos;
  const falta = p.nivel.hasta - p.xp;
  const repasar = d.historial.filter((h) => h.aciertos / h.total < 0.6);
  return (
    <div style={{ maxWidth: 1150 }}>
      <div className="card hero">
        <div className="prog-hero">
          <Anillo nivel={p.nivel} xp={p.xp} />
          <div style={{ minWidth: 0 }}>
            <div className="dim" style={{ fontSize: 13, fontWeight: 600 }}>TU NIVEL</div>
            <h1 style={{ marginTop: 2 }}>{p.nivel.nombre}</h1>
            <div className="muted" style={{ marginTop: 6 }}>Te faltan <b>{falta.toLocaleString()} XP</b> para el nivel {p.nivel.n + 1}. Un reto perfecto da 150.</div>
            <div className="stats-mini">
              <div><b style={{ color: 'var(--oro)' }}><Flame size={17} style={{ verticalAlign: -2 }} /> {p.racha}</b><span>{p.racha === 1 ? 'día de racha' : 'días de racha'}</span></div>
              <div><b><Zap size={17} style={{ verticalAlign: -2 }} /> {p.semana.toLocaleString()}</b><span>XP esta semana</span></div>
              <div><b><Eye size={17} style={{ verticalAlign: -2 }} /> {d.vistos}</b><span>videos completos</span></div>
              <div><b><Target size={17} style={{ verticalAlign: -2 }} /> {st.promedio != null ? Math.round(st.promedio * 100) + '%' : '—'}</b><span>promedio en retos</span></div>
              <div><b><Clock size={17} style={{ verticalAlign: -2 }} /> {p.minutos}</b><span>minutos aprendiendo</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="dos" style={{ marginTop: 18, alignItems: 'start' }}>
        <Ranking />
        <div>
          <div className="card">
            <h2 style={{ fontSize: 18 }}>Logros <span className="dim" style={{ fontWeight: 500, fontSize: 14 }}>{p.logros.filter((l) => l.ok).length}/{p.logros.length}</span></h2>
            <div className="logros" style={{ marginTop: 12 }}>
              {p.logros.map((l) => <div key={l.id} className={'logro' + (l.ok ? '' : ' no')} title={l.desc}><div className="e">{l.emoji}</div><b>{l.nombre}</b><span>{l.desc}</span></div>)}
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 18 }}>Cómo sumás XP</h2>
            <div className="xp-desg" style={{ marginTop: 12 }}>
              {Object.entries(FUENTES).map(([k, [e, t]]) => <React.Fragment key={k}><span>{e} {t}</span><span>{p.desglose[k]?.n ?? 0}</span><span>{(p.desglose[k]?.xp ?? 0).toLocaleString()}</span></React.Fragment>)}
            </div>
          </div>
        </div>
      </div>
      <div className="dos" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="entre"><h2 style={{ fontSize: 18 }}><Brain size={18} color="var(--rosa)" style={{ verticalAlign: -3 }} /> Cómo aprendés mejor</h2><Link to="/perfil" className="btn chico"><Pencil size={14} />Editar</Link></div>
          <div className="pila" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.5 }}>
            <div>Dijiste que aprendés mejor <b>{(perfil?.aprende || []).join(', ').toLowerCase() || '—'}</b>.</div>
            {st.mejorPlantilla && <div>El estilo visual que más te engancha: <span className="badge lima">{st.mejorPlantilla}</span> (tus próximos videos lo usan más).</div>}
            {st.mejorEstilo && <div>Te va mejor con ganchos de tipo <span className="badge lima">{st.mejorEstilo}</span></div>}
            {st.rebobina?.length > 0 && <div>Donde más pausás o rebobinás: <b>{st.rebobina.map((x) => ESCENA[x] || x).join(' y ')}</b>. Tus próximos videos van más despacio ahí.</div>}
            {st.debiles?.length > 0 && <div>Para reforzar: {st.debiles.slice(0, 5).map((t) => <span key={t} className="badge rojo" style={{ marginRight: 6 }} title={t}>{t.length > 30 ? t.slice(0, 28) + '…' : t}</span>)}</div>}
            {st.fuertes?.length > 0 && <div>Ya dominás: {st.fuertes.map((t) => <span key={t} className="badge lima" style={{ marginRight: 6 }}>{t}</span>)}</div>}
            {!st.intentos && <div className="dim">Hacé tu primer reto para que Mathtrix aprenda cómo aprendés.</div>}
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 18 }}><Sparkles size={18} color="var(--lima)" style={{ verticalAlign: -3 }} /> Clases pendientes</h2>
          <div className="pila" style={{ marginTop: 12 }}>
            {d.pendientes.map((x) => <Link key={x.id} to={'/leccion/' + x.id} className="entre" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--v1)' }}><div><b style={{ fontSize: 14.5 }}>{x.titulo}</b><div className="dim" style={{ fontSize: 12.5 }}>{x.curso}</div></div><span className="badge lima">+20 XP</span></Link>)}
            {!d.pendientes.length && <div className="dim">¡Al día! Unite a otra clase o generá un video libre desde Inicio.</div>}
          </div>
        </div>
      </div>
      {repasar.length > 0 && (
        <>
          <div className="seccion"><h2><RotateCcw size={20} color="var(--oro)" />Para repasar</h2></div>
          <div className="estante">{repasar.map((h) => <Link key={h.id} to={'/ver/' + h.id} className="vcard"><Poster v={h} vert={h.formato === 'vertical'} /><div className="tit" style={{ marginTop: 8, fontSize: 14 }}>{h.titulo}</div><div className="badge rojo" style={{ marginTop: 6 }}>{h.aciertos}/{h.total}</div></Link>)}</div>
        </>
      )}
    </div>
  );
}

function Panel() {
  const [cursos, setCursos] = useState(null);
  useEffect(() => {
    api('/cursos').then(async (cs) => setCursos(await Promise.all(cs.map(async (c) => ({ ...c, a: await api(`/cursos/${c.id}/analitica`) })))));
  }, []);
  if (!cursos) return <div className="vacio">Cargando…</div>;
  return (
    <div style={{ maxWidth: 1150 }}>
      <h1>Mis alumnos</h1>
      <div className="muted" style={{ marginTop: 6 }}>Quién va adelante y cómo comprende cada clase. Entrá a una clase para ver pausas, dudas y respuestas.</div>
      <div className="dos" style={{ marginTop: 18, alignItems: 'start' }}>
        <Ranking titulo="Ranking de tus alumnos" />
        <div>
          {cursos.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 16, padding: 14, overflowX: 'auto' }}>
              <div className="entre"><h2 style={{ fontSize: 17 }}>{c.titulo}</h2><span className="badge mono">{c.codigo}</span></div>
              <table className="tabla" style={{ marginTop: 8 }}>
                <thead><tr><th>Clase</th><th>Video</th><th>Test</th><th></th></tr></thead>
                <tbody>{c.a.lecciones.map((l) => (
                  <tr key={l.id}><td><b>{l.titulo}</b><div className="dim" style={{ fontSize: 12.5 }}>{l.terminaron}% terminaron</div></td><td className="mono">{l.con_video}/{l.alumnos}</td>
                    <td className="mono" style={{ fontWeight: 800, color: l.promedio == null ? undefined : l.promedio >= 60 ? 'var(--lima)' : 'var(--rojo)' }}>{l.promedio == null ? '—' : l.promedio + '%'}</td>
                    <td><Link to={'/leccion/' + l.id} className="btn chico ico" aria-label="Ver analítica"><BarChart3 size={14} /></Link></td></tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
