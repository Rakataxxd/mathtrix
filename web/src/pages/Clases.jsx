import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, LogIn, Users, BookOpen, Copy, ChevronRight, Sparkles, Check, BadgeCheck, Play, Camera, FileUp, Share2, Film, X } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { Avatar } from '../components/ui.jsx';
import { ModalRevisar } from '../components/RevisarFoto.jsx';

const GLIFOS = ['π', '√x', 'x²', '∑', '÷', '%', '∆', '∞'];

function Portada({ c, i }) {
  return (
    <div className="cls-portada" style={{ background: `linear-gradient(135deg, ${c.color || '#c8ff3d'}, color-mix(in srgb, ${c.color || '#c8ff3d'} 55%, #ffffff))` }}>
      <span className="badge mono" style={{ background: 'rgba(255,255,255,.7)', color: '#0d0d12' }}>{c.codigo}</span>
      {c.cnb ? <span className="badge" style={{ background: 'rgba(255,255,255,.7)', color: '#0d0d12' }}><BadgeCheck size={12} />CNB</span> : null}
      <span className="glifo">{GLIFOS[i % GLIFOS.length]}</span>
    </div>
  );
}

export function Clases() {
  const { usuario } = useSesion();
  const prof = usuario.rol === 'profesor';
  const nav = useNavigate();
  const [cursos, setCursos] = useState(null);
  const [cod, setCod] = useState('');
  const [f, setF] = useState({ titulo: '', grado: '', descripcion: '', cnb: usuario.curriculo !== 'general' });
  const [err, setErr] = useState(null);
  const [abrir, setAbrir] = useState(() => new URLSearchParams(window.location.search).has('nueva'));
  useEffect(() => { api('/cursos').then(setCursos); }, []);
  const unirse = async (e) => { e.preventDefault(); setErr(null); try { const r = await api('/cursos/unirse', { cuerpo: { codigo: cod } }); nav('/curso/' + r.curso_id); } catch (x) { setErr(x.message); } };
  const crear = async (e) => { e.preventDefault(); setErr(null); try { const c = await api('/cursos', { cuerpo: f }); nav('/curso/' + c.id); } catch (x) { setErr(x.message); } };
  const vacio = cursos && !cursos.length;
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="cls-cab">
        <div>
          <h1>{prof ? 'Mis cursos' : 'Mis clases'}</h1>
          <div className="muted" style={{ marginTop: 6 }}>{prof ? 'Cada curso tiene un código. Tus alumnos se unen con él y cada clase les genera su propio video.' : 'Tus clases y lo que te falta. ¿Tenés un código nuevo? Unite acá.'}</div>
        </div>
        {prof ? <button className="btn lima" onClick={() => setAbrir(true)}><Plus size={17} />Nuevo curso</button> : (
          <form onSubmit={unirse} className="cls-unirse vidrio">
            <input placeholder="MTX-XXXX" value={cod} onChange={(e) => setCod(e.target.value)} aria-label="Código de clase" />
            <button className="btn lima chico" disabled={cod.trim().length < 4}><LogIn size={15} />Unirme</button>
          </form>
        )}
      </div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      {prof && (vacio || abrir) && (
        <div className="pasos-guia">
          {[['Creá el curso', 'Nombre y grado; marcá CNB si querés.'], ['Agregá una clase', 'Tema, objetivo y la ecuación si tenés.'], ['Subí tu material', 'PDF o fotos del libro: se arma el brief.'], ['Compartí el código', 'Cada alumno genera su video.']].map(([t, d], i) => (
            <div key={t} className={!vacio && i === 0 ? 'hecho' : ''}><span className="n">{!vacio && i === 0 ? '✓' : i + 1}</span><div><b>{t}</b>{d}</div></div>
          ))}
        </div>
      )}
      {prof && abrir && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setAbrir(false)}>
          <form className="caja" onSubmit={crear}>
            <div className="entre"><h2>Nuevo curso</h2><button type="button" className="btn chico ico fant" onClick={() => setAbrir(false)} aria-label="Cerrar"><X size={18} /></button></div>
            <label className="lab">Nombre del curso</label>
            <input className="input" autoFocus required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Matemática · 3ro Básico A" />
            <div className="dos" style={{ gap: 12 }}>
              <div><label className="lab">Grado</label><input className="input" value={f.grado} onChange={(e) => setF({ ...f, grado: e.target.value })} placeholder="3ro Básico" /></div>
              <div><label className="lab">Unidad o descripción</label><input className="input" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Unidad 3: geometría" /></div>
            </div>
            <label className="check"><input type="checkbox" checked={f.cnb} onChange={(e) => setF({ ...f, cnb: e.target.checked })} /><div><b>Alineado al CNB de Guatemala</b><div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Cada clase sugiere la competencia e indicador de logro más parecidos. Los alumnos no lo ven.</div></div></label>
            <button className="btn lima grande" style={{ marginTop: 18, width: '100%' }}><Check size={17} />Crear curso</button>
          </form>
        </div>
      )}
      <div className="cls-grid">
        {(cursos || []).map((c, i) => {
          const pct = prof ? (c.clases ? c.listas / c.clases : 0) : (c.clases ? c.hechas / c.clases : 0);
          return (
            <Link key={c.id} to={'/curso/' + c.id} className="cls-card vidrio">
              <Portada c={prof ? c : { ...c, cnb: 0 }} i={i} />
              <div className="cls-cuerpo">
                <h3>{c.titulo}</h3>
                <div className="muted" style={{ fontSize: 13.5 }}>{c.descripcion || c.grado || (prof ? '' : 'Profe ' + c.profesor)}</div>
                <div className="entre" style={{ fontSize: 12.5, marginTop: 4 }}>
                  <span className="dim">{prof ? `${c.listas || 0}/${c.clases} clases con brief` : `${c.hechas || 0}/${c.clases} clases completadas`}</span>
                  <b>{Math.round(pct * 100)}%</b>
                </div>
                <div className="cls-prog"><div style={{ width: `${pct * 100}%` }} /></div>
                <div className="cls-meta">
                  <span><BookOpen size={14} />{c.clases} clases</span>
                  {prof ? <><span><Users size={14} />{c.alumnos} alumnos</span><span><Film size={14} />{c.videos || 0} videos</span></> : <span>Profe {String(c.profesor || '').split(' ')[0]}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {vacio && !prof && (
        <div className="card" style={{ marginTop: 22, textAlign: 'center', padding: 34 }}>
          <div style={{ fontSize: 40 }}>🎟️</div>
          <h2 style={{ marginTop: 8 }}>Pedile el código a tu profe</h2>
          <div className="muted" style={{ marginTop: 6 }}>Es algo como <b className="mono">MTX-3B0A</b>. Escribilo arriba y entrás a su clase.</div>
        </div>
      )}
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
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api('/cursos/' + id).then(setC).catch((e) => setErr(e.message)); }, [id]);
  const crear = async (e) => { e.preventDefault(); try { const l = await api(`/cursos/${id}/lecciones`, { cuerpo: f }); nav('/leccion/' + l.id + '?nueva=1'); } catch (x) { setErr(x.message); } };
  const copiar = () => { navigator.clipboard?.writeText(c.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500); };
  const compartir = () => { const txt = `Unite a mi clase "${c.titulo}" en Mathtrix con el código ${c.codigo}`; if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else { navigator.clipboard?.writeText(txt); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } };
  if (err) return <div className="vacio">{err}</div>;
  if (!c) return <div className="vacio">Cargando…</div>;
  const siguiente = !prof ? c.lecciones.find((l) => !l.mis_videos?.length) : null;
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="dim" style={{ fontSize: 13 }}><Link to="/clases">Clases</Link> / {c.titulo}</div>
      <div className="cls-cab" style={{ marginTop: 10 }}>
        <div><h1>{c.titulo}</h1><div className="muted" style={{ marginTop: 6 }}>{[c.descripcion, c.grado, 'Profe ' + c.profesor].filter(Boolean).join(' · ')}</div></div>
        {prof ? <button className="btn lima" onClick={() => setAbrir(true)}><Plus size={17} />Nueva clase</button>
          : siguiente && <Link className="btn lima" to={'/leccion/' + siguiente.id}><Play size={16} fill="currentColor" />Seguir: {siguiente.titulo}</Link>}
      </div>
      {prof && (
        <div className="codigo-gde vidrio" style={{ marginTop: 18 }}>
          <div><div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>CÓDIGO PARA TUS ALUMNOS</div><div className="cod">{c.codigo}</div></div>
          <div className="fila" style={{ marginLeft: 'auto' }}>
            <button className="btn" onClick={copiar}>{copiado ? <Check size={16} /> : <Copy size={16} />}{copiado ? 'Copiado' : 'Copiar'}</button>
            <button className="btn" onClick={compartir}><Share2 size={16} />Compartir</button>
          </div>
          <div className="muted" style={{ fontSize: 13, flexBasis: '100%' }}>{c.alumnos.length ? `${c.alumnos.length} alumnos ya están adentro.` : 'Todavía nadie se unió: pasales el código por WhatsApp.'}</div>
        </div>
      )}
      {prof && abrir && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setAbrir(false)}>
          <form className="caja" onSubmit={crear}>
            <div className="entre"><h2>Nueva clase</h2><button type="button" className="btn chico ico fant" onClick={() => setAbrir(false)} aria-label="Cerrar"><X size={18} /></button></div>
            <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Después subís tu material y Mathtrix arma el brief para los videos.</div>
            <label className="lab">Título de la clase</label>
            <input className="input" autoFocus required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Volumen de la esfera" />
            <label className="lab">Tema matemático</label>
            <input className="input" required value={f.tema} onChange={(e) => setF({ ...f, tema: e.target.value })} placeholder="Volumen de cuerpos redondos" />
            <label className="lab">Objetivo (opcional)</label>
            <input className="input" value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} placeholder="Calcular el volumen de una esfera dado su radio" />
            <label className="lab">Ecuación o ejercicio (opcional)</label>
            <input className="input mono" value={f.ejercicio} onChange={(e) => setF({ ...f, ejercicio: e.target.value })} placeholder="V = 4/3 · π · r³ con r = 3 cm" />
            <button className="btn lima grande" style={{ marginTop: 18, width: '100%' }}><Sparkles size={17} />Crear y subir material</button>
          </form>
        </div>
      )}
      <div className="dos" style={{ marginTop: 22, gridTemplateColumns: prof ? 'minmax(0, 1.7fr) minmax(0, 1fr)' : '1fr', alignItems: 'start' }}>
        <div>
          <h2 style={{ marginBottom: 12 }}>Clases <span className="dim" style={{ fontWeight: 500 }}>· {c.lecciones.length}</span></h2>
          {c.lecciones.map((l, i) => {
            const hecho = prof ? !!l.prompt : !!l.mis_videos?.length;
            const esSig = !prof && siguiente?.id === l.id;
            return (
              <div key={l.id} className="lec2">
                <Link to={'/leccion/' + l.id} className={'estado' + (hecho ? ' listo' : esSig ? ' sig' : '')}>{hecho ? <Check size={18} /> : String(i + 1).padStart(2, '0')}</Link>
                <Link to={'/leccion/' + l.id} style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 15 }}>{l.titulo}</b>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.analisis?.resumen || l.tema}</div>
                </Link>
                {prof ? (
                  l.prompt ? <span className="badge lima"><Film size={12} />{l.videos} videos</span> : <Link to={'/leccion/' + l.id} className="btn chico"><FileUp size={15} />Subir material</Link>
                ) : (
                  <div className="fila" style={{ gap: 6 }}>
                    <button className="btn chico ico" title="Revisar mi ejercicio de esta clase" aria-label="Revisar mi ejercicio" onClick={() => setFoto(l.id)}><Camera size={15} /></button>
                    <Link to={'/leccion/' + l.id} className={'btn chico' + (esSig ? ' lima' : '')}>{hecho ? <><Play size={14} fill="currentColor" />Ver</> : <><Sparkles size={14} />Mi video</>}</Link>
                  </div>
                )}
              </div>
            );
          })}
          {!c.lecciones.length && <div className="card vacio">{prof ? <>Agregá la primera clase con <b>Nueva clase</b>.</> : 'Tu profe todavía no publica clases.'}</div>}
        </div>
        {prof && (
          <div className="card">
            <h2 style={{ fontSize: 17 }}>Alumnos ({c.alumnos.length})</h2>
            <div className="pila" style={{ marginTop: 14, maxHeight: 460, overflowY: 'auto' }}>
              {c.alumnos.map((a) => <div key={a.id} className="fila"><Avatar nombre={a.nombre} color={a.color} size={30} /><span style={{ fontSize: 14.5 }}>{a.nombre}</span></div>)}
              {!c.alumnos.length && <div className="muted" style={{ fontSize: 14 }}>Cuando se unan con el código van a aparecer acá.</div>}
            </div>
            <Link to="/aprender" className="btn" style={{ marginTop: 16, width: '100%' }}>Ver ranking de la clase <ChevronRight size={15} /></Link>
          </div>
        )}
      </div>
      {foto && <ModalRevisar leccionId={foto} onCerrar={() => setFoto(null)} />}
    </div>
  );
}
