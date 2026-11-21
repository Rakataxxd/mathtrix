// Modo aprendizaje: progreso, forma de aprender detectada por la data, pendientes y repasos.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, Eye, Target, Sparkles, Brain, RotateCcw, ChevronRight, BarChart3, Pencil } from 'lucide-react';
import { api, useSesion, hace } from '../api.js';
import { Poster } from '../components/ui.jsx';

const ESCENA = { gancho: 'el gancho', datos: 'los datos', formula: 'la fórmula', paso: 'los pasos de resolución', resultado: 'el resultado', cta: 'el reto', fraccion: 'las fracciones', grafica: 'las gráficas', iconos: 'la visualización', comparacion: 'las comparaciones' };

export function Aprender() {
  const { usuario, perfil } = useSesion();
  if (usuario.rol === 'profesor') return <Panel />;
  const [d, setD] = useState(null);
  useEffect(() => { api('/aprender').then(setD); }, []);
  if (!d) return <div className="vacio">Cargando…</div>;
  const st = d.stats || {};
  const nivel = Math.floor(d.xp / 500) + 1;
  const repasar = d.historial.filter((h) => h.aciertos / h.total < 0.6);
  return (
    <div style={{ maxWidth: 1150 }}>
      <h1>Tu modo aprendizaje</h1>
      <div className="muted" style={{ marginTop: 6 }}>Todo lo que hacés (pausas, rebobinadas, respuestas) ajusta tus próximos videos.</div>
      <div className="kpis" style={{ marginTop: 20 }}>
        <div className="kpi"><div className="l"><Star size={14} /> Nivel {nivel}</div><div className="n" style={{ color: 'var(--lima)' }}>{d.xp.toLocaleString()} XP</div><div className="barrita" style={{ marginTop: 8 }}><div style={{ width: `${(d.xp % 500) / 5}%`, background: 'var(--lima)' }} /></div></div>
        <div className="kpi"><div className="l"><Flame size={14} /> Racha</div><div className="n" style={{ color: 'var(--oro)' }}>{d.racha} {d.racha === 1 ? 'día' : 'días'}</div></div>
        <div className="kpi"><div className="l"><Eye size={14} /> Videos completos</div><div className="n">{d.vistos}</div></div>
        <div className="kpi"><div className="l"><Target size={14} /> Promedio en retos</div><div className="n">{st.promedio != null ? Math.round(st.promedio * 100) + '%' : '—'}</div></div>
      </div>
      <div className="dos" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="entre"><h2 style={{ fontSize: 18 }}><Brain size={18} color="var(--rosa)" style={{ verticalAlign: -3 }} /> Cómo aprendés mejor</h2><Link to="/perfil" className="btn chico"><Pencil size={14} />Editar perfil</Link></div>
          <div className="pila" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.5 }}>
            <div>Dijiste que aprendés mejor <b>{(perfil?.aprende || []).join(', ').toLowerCase() || '—'}</b>.</div>
            {st.mejorEstilo && <div>La data dice que te va mejor con ganchos de estilo <span className="badge lima">{st.mejorEstilo}</span></div>}
            {st.rebobina?.length > 0 && <div>Donde más pausás o rebobinás: <b>{st.rebobina.map((x) => ESCENA[x] || x).join(' y ')}</b>. Tus próximos videos van más despacio ahí.</div>}
            {st.debiles?.length > 0 && <div>Temas para reforzar: {st.debiles.map((t) => <span key={t} className="badge rojo" style={{ marginRight: 6 }}>{t}</span>)}</div>}
            {st.fuertes?.length > 0 && <div>Ya dominás: {st.fuertes.map((t) => <span key={t} className="badge lima" style={{ marginRight: 6 }}>{t}</span>)}</div>}
            {!st.intentos && <div className="dim">Hacé tu primer reto para que Mathtrix aprenda cómo aprendés.</div>}
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 18 }}><Sparkles size={18} color="var(--lima)" style={{ verticalAlign: -3 }} /> Clases pendientes</h2>
          <div className="pila" style={{ marginTop: 12 }}>
            {d.pendientes.map((p) => <Link key={p.id} to={'/leccion/' + p.id} className="entre" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--s2)' }}><div><b style={{ fontSize: 14.5 }}>{p.titulo}</b><div className="dim" style={{ fontSize: 12.5 }}>{p.curso}</div></div><span className="btn chico lima">Generar <ChevronRight size={15} /></span></Link>)}
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
      <div className="seccion"><h2>Historial de retos</h2></div>
      <div className="card" style={{ padding: 8 }}>
        <table className="tabla"><tbody>
          {d.historial.map((h, i) => <tr key={i}><td><Link to={'/ver/' + h.id}><b style={{ fontSize: 14 }}>{h.titulo}</b></Link><div className="dim" style={{ fontSize: 12.5 }}>{h.tema}</div></td><td className="mono" style={{ fontWeight: 800, color: h.aciertos / h.total >= 0.6 ? 'var(--lima)' : 'var(--rojo)' }}>{h.aciertos}/{h.total}</td><td className="dim" style={{ fontSize: 13 }}>{hace(h.cuando)}</td></tr>)}
          {!d.historial.length && <tr><td className="dim" style={{ padding: 20 }}>Todavía no hiciste retos.</td></tr>}
        </tbody></table>
      </div>
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
      <div className="muted" style={{ marginTop: 6 }}>Resumen de comprensión por clase. Entrá a cada clase para ver pausas, abandonos y respuestas.</div>
      {cursos.map((c) => (
        <div key={c.id} className="card" style={{ marginTop: 18 }}>
          <div className="entre"><h2 style={{ fontSize: 19 }}>{c.titulo}</h2><span className="badge mono">{c.codigo}</span></div>
          <table className="tabla" style={{ marginTop: 10 }}>
            <thead><tr><th>Clase</th><th>Con video</th><th>Terminaron</th><th>Promedio test</th><th>Comprendieron</th><th></th></tr></thead>
            <tbody>{c.a.lecciones.map((l) => (
              <tr key={l.id}><td><b>{l.titulo}</b><div className="dim" style={{ fontSize: 12.5 }}>{l.tema}</div></td><td className="mono">{l.con_video}/{l.alumnos}</td><td className="mono">{l.terminaron}%</td>
                <td className="mono" style={{ fontWeight: 800, color: l.promedio == null ? undefined : l.promedio >= 60 ? 'var(--lima)' : 'var(--rojo)' }}>{l.promedio == null ? '—' : l.promedio + '%'}</td><td className="mono">{l.comprendieron}</td>
                <td><Link to={'/leccion/' + l.id} className="btn chico"><BarChart3 size={14} />Ver</Link></td></tr>
            ))}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
