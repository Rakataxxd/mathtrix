import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, LogIn, Users, BookOpen, Copy, ChevronRight, Sparkles, Check, BadgeCheck } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { Avatar } from '../components/ui.jsx';

export function Clases() {
  const { usuario } = useSesion();
  const prof = usuario.rol === 'profesor';
  const nav = useNavigate();
  const [cursos, setCursos] = useState(null);
  const [cod, setCod] = useState('');
  const [f, setF] = useState({ titulo: '', grado: '', descripcion: '', cnb: usuario.curriculo !== 'general' });
  const [err, setErr] = useState(null);
  const [abrir, setAbrir] = useState(() => new URLSearchParams(window.location.search).has('nueva'));
  const cargar = () => api('/cursos').then(setCursos);
  useEffect(() => { cargar(); }, []);
  const unirse = async (e) => { e.preventDefault(); setErr(null); try { const r = await api('/cursos/unirse', { cuerpo: { codigo: cod } }); nav('/curso/' + r.curso_id); } catch (x) { setErr(x.message); } };
  const crear = async (e) => { e.preventDefault(); setErr(null); try { const c = await api('/cursos', { cuerpo: f }); nav('/curso/' + c.id); } catch (x) { setErr(x.message); } };
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="entre" style={{ flexWrap: 'wrap' }}>
        <div><h1>{prof ? 'Mis cursos' : 'Mis clases'}</h1><div className="muted" style={{ marginTop: 6 }}>{prof ? 'Creá el curso, agregá clases con tu material y compartí el código.' : 'Unite con el código que te dio tu profe.'}</div></div>
        {prof ? <button className="btn lima" onClick={() => setAbrir(!abrir)}><Plus size={17} />Nuevo curso</button> : (
          <form onSubmit={unirse} className="fila">
            <input className="input mono" style={{ width: 200, textTransform: 'uppercase' }} placeholder="MTX-XXXX" value={cod} onChange={(e) => setCod(e.target.value)} />
            <button className="btn lima"><LogIn size={17} />Unirme</button>
          </form>
        )}
      </div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      {prof && abrir && (
        <form className="card" style={{ marginTop: 20 }} onSubmit={crear}>
          <h2>Nuevo curso</h2>
          <div className="dos" style={{ gap: 14 }}>
            <div><label className="lab">Nombre del curso</label><input className="input" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Matemática · 3ro Básico A" /></div>
            <div><label className="lab">Grado</label><input className="input" value={f.grado} onChange={(e) => setF({ ...f, grado: e.target.value })} placeholder="3ro Básico" /></div>
          </div>
          <label className="lab">Descripción</label>
          <input className="input" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Unidad 3: geometría y volumen" />
          <label className="check"><input type="checkbox" checked={f.cnb} onChange={(e) => setF({ ...f, cnb: e.target.checked })} /><div><b>Alineado al CNB de Guatemala</b><div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Cada clase sugiere la competencia y el indicador de logro del CNB más parecido. Los alumnos no lo ven.</div></div></label>
          <button className="btn lima" style={{ marginTop: 18 }}><Check size={17} />Crear curso</button>
        </form>
      )}
      <div className="grid" style={{ marginTop: 26, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {(cursos || []).map((c) => (
          <Link key={c.id} to={'/curso/' + c.id} className="card" style={{ display: 'block', borderTop: `4px solid ${c.color || 'var(--lima)'}` }}>
            <div className="entre"><span className="badge mono">{c.codigo}</span>{prof && c.cnb ? <span className="badge oro"><BadgeCheck size={12} />CNB</span> : null}</div>
            <h2 style={{ marginTop: 14, fontSize: 19 }}>{c.titulo}</h2>
            <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>{c.descripcion || c.grado}</div>
            <div className="fila dim" style={{ marginTop: 16, fontSize: 13.5, gap: 16 }}>
              <span className="fila" style={{ gap: 6 }}><BookOpen size={15} />{c.clases} clases</span>
              {prof ? <span className="fila" style={{ gap: 6 }}><Users size={15} />{c.alumnos} alumnos</span> : <span>Profe: {c.profesor}</span>}
            </div>
          </Link>
        ))}
      </div>
      {cursos && !cursos.length && <div className="vacio">{prof ? 'Todavía no tenés cursos. Creá el primero.' : 'Todavía no estás en ninguna clase. Pedile el código a tu profe.'}</div>}
    </div>
  );
}

export function Curso() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const prof = usuario.rol === 'profesor';
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [f, setF] = useState({ titulo: '', tema: '', objetivo: '', ejercicio: '' });
  const [abrir, setAbrir] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [err, setErr] = useState(null);
  const cargar = () => api('/cursos/' + id).then(setC).catch((e) => setErr(e.message));
  useEffect(() => { cargar(); }, [id]);
  const crear = async (e) => { e.preventDefault(); try { const l = await api(`/cursos/${id}/lecciones`, { cuerpo: f }); nav('/leccion/' + l.id + '?nueva=1'); } catch (x) { setErr(x.message); } };
  if (err) return <div className="vacio">{err}</div>;
  if (!c) return <div className="vacio">Cargando…</div>;
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="dim" style={{ fontSize: 13 }}><Link to="/clases">Clases</Link> / {c.titulo}</div>
      <div className="entre" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <div><h1>{c.titulo}</h1><div className="muted" style={{ marginTop: 6 }}>{c.descripcion} {c.grado && `· ${c.grado}`} · Profe {c.profesor}</div></div>
        {prof && (
          <div className="fila">
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(c.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}><Copy size={16} />Código <b className="mono" style={{ color: 'var(--lima)' }}>{c.codigo}</b>{copiado && ' ✓'}</button>
            <button className="btn lima" onClick={() => setAbrir(!abrir)}><Plus size={17} />Nueva clase</button>
          </div>
        )}
      </div>
      {prof && abrir && (
        <form className="card" style={{ marginTop: 20 }} onSubmit={crear}>
          <h2>Nueva clase</h2>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Después subís tus materiales (PDF, fotos del libro, notas) y Mathtrix arma el brief para los videos.</div>
          <div className="dos" style={{ gap: 14 }}>
            <div><label className="lab">Título de la clase</label><input className="input" required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Volumen de la esfera" /></div>
            <div><label className="lab">Tema matemático</label><input className="input" required value={f.tema} onChange={(e) => setF({ ...f, tema: e.target.value })} placeholder="Volumen de cuerpos redondos" /></div>
          </div>
          <label className="lab">Objetivo de aprendizaje</label>
          <input className="input" value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} placeholder="Calcular el volumen de una esfera dado su radio" />
          <label className="lab">Ecuación o ejercicio específico (opcional)</label>
          <input className="input mono" value={f.ejercicio} onChange={(e) => setF({ ...f, ejercicio: e.target.value })} placeholder="V = 4/3 · π · r³ con r = 3 cm" />
          <button className="btn lima" style={{ marginTop: 18 }}><Sparkles size={17} />Crear clase</button>
        </form>
      )}
      <div className="dos" style={{ marginTop: 24, gridTemplateColumns: prof ? '1.6fr 1fr' : '1fr' }}>
        <div className="lista-lecciones">
          <h2 style={{ marginBottom: 14 }}>Clases</h2>
          {c.lecciones.map((l, i) => (
            <Link key={l.id} to={'/leccion/' + l.id} className="lec">
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{l.titulo}</b>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>{l.analisis?.resumen || l.tema}</div>
                <div className="fila" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                  {prof ? <><span className={'badge ' + (l.prompt ? 'lima' : 'oro')}>{l.prompt ? 'Brief listo' : 'Falta escanear material'}</span><span className="badge">{l.videos} videos generados</span></>
                    : l.mis_videos?.length ? <span className="badge lima">Tenés {l.mis_videos.length} video(s)</span> : <span className="badge rosa"><Sparkles size={12} />Generá tu video</span>}
                </div>
              </div>
              <ChevronRight className="dim" />
            </Link>
          ))}
          {!c.lecciones.length && <div className="vacio">{prof ? 'Agregá la primera clase.' : 'Tu profe todavía no publica clases.'}</div>}
        </div>
        {prof && (
          <div className="card">
            <h2 style={{ fontSize: 18 }}>Alumnos ({c.alumnos.length})</h2>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Se unen con el código <b className="mono" style={{ color: 'var(--lima)' }}>{c.codigo}</b></div>
            <div className="pila" style={{ marginTop: 16, maxHeight: 460, overflowY: 'auto' }}>
              {c.alumnos.map((a) => <div key={a.id} className="fila"><Avatar nombre={a.nombre} color={a.color} size={30} /><span style={{ fontSize: 14.5 }}>{a.nombre}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
