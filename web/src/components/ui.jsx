import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Zap, GraduationCap, School, Search, LogOut, Sparkles, BarChart3, Plus } from 'lucide-react';
import { useSesion, hace, dur, vistas, inicial } from '../api.js';
import { PALETAS } from '../video/fx.jsx';
import { codEmoji } from '../video/fx.jsx';
import { ESTILOS, FiltrosEstilo, estiloDe, filtroEmoji } from '../video/estilos.jsx';

export function Logo({ chico }) {
  return <Link to="/" className="logo"><span className="ico">[π]</span>{!chico && <span>math<b>trix</b></span>}</Link>;
}
export function Avatar({ nombre, color, size = 36 }) {
  return <div className="avatar" style={{ background: color || '#b6ff3b', width: size, height: size, fontSize: size * 0.42 }}>{inicial(nombre)}</div>;
}

export function Layout({ children }) {
  const { usuario, salir } = useSesion();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const prof = usuario?.rol === 'profesor';
  const links = [
    { to: '/', ico: Home, txt: 'Inicio', end: true },
    { to: '/shorts', ico: Zap, txt: 'Shorts' },
    { to: '/aprender', ico: GraduationCap, txt: prof ? 'Mis alumnos' : 'Aprender' },
    { to: '/clases', ico: School, txt: 'Clases' },
  ];
  return (
    <>
      <header className="top">
        <Logo />
        <form className="buscar" onSubmit={(e) => { e.preventDefault(); nav('/?q=' + encodeURIComponent(q)); }}>
          <input placeholder="Buscá: volumen, Lamborghini, probabilidad…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button aria-label="Buscar"><Search size={18} /></button>
        </form>
        <div className="fila" style={{ marginLeft: 'auto' }}>
          {prof ? <Link to="/clases" className="btn chico lima"><Plus size={16} />Crear clase</Link> : <Link to="/?crear=1" className="btn chico lima"><Sparkles size={16} />Crear video</Link>}
          <Avatar nombre={usuario?.nombre} color={usuario?.color} />
          <button className="btn chico fant" onClick={salir} title="Salir"><LogOut size={17} /></button>
        </div>
      </header>
      <nav className="side">
        {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'activo' : '')}><l.ico size={21} />{l.txt}</NavLink>)}
        <hr />
        <div className="item dim" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 800 }}>{prof ? 'Profesor' : 'Alumno'} · {usuario?.nombre?.split(' ')[0]}</div>
        {prof && <NavLink to="/clases" className=""><BarChart3 size={21} />Analítica</NavLink>}
        <div className="mision"><b>Misión PISA</b>En PISA 2022 solo ~1 de cada 10 estudiantes de Guatemala llegó al nivel básico de matemática. Mathtrix existe para cambiar ese número.</div>
      </nav>
      <FiltrosEstilo />
      <main className="main">{children}</main>
      <nav className="tabbar">
        {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'activo' : '')}><l.ico size={22} />{l.txt}</NavLink>)}
      </nav>
    </>
  );
}

// ---------- poster dibujado con CSS (rapido, sin renderizar el video) ----------
const GLIFOS = 'π∑√÷×∞≈∫x²y³%∆θ0123456789+=−';
function lluvia(seed, n = 260) { let s = seed * 9301 + 49297; let o = ''; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; o += GLIFOS[s % GLIFOS.length]; } return o; }
function textoGancho(t) {
  const partes = String(t || '').split(/(\*[^*]+\*)/g).filter(Boolean);
  return partes.map((p, i) => (p.startsWith('*') ? <mark key={i}>{p.replace(/\*/g, '')}</mark> : <span key={i}>{p}</span>));
}
const FONDO_POSTER = {
  tiza: (P) => `radial-gradient(120% 90% at 50% 30%, ${P.f2}, ${P.f1} 75%)`,
  blueprint: (P) => `linear-gradient(rgba(234,244,255,.08) 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, rgba(234,244,255,.08) 1px, transparent 1px) 0 0/14px 14px, radial-gradient(120% 90% at 50% 25%, ${P.f2}, ${P.f1} 80%)`,
  manim: () => '#000',
  cuaderno: () => 'repeating-linear-gradient(180deg, #fbf8f1 0 17px, #c9dcf2 17px 18px)',
  neon: (P) => `linear-gradient(180deg, ${P.f1}, ${P.f2} 60%, #000)`,
};
const FUENTE_POSTER = { tiza: "'Cabin Sketch'", blueprint: "'Space Grotesk'", manim: "'STIX Two Text'", cuaderno: "'Kalam'", neon: "'Anton'" };
export function Poster({ v, vert }) {
  const est = estiloDe(v.poster?.estilo || v.estilo);
  const E = ESTILOS[est];
  const P = E.P || { tx: '#fff', ...(PALETAS[v.poster?.paleta] || PALETAS.espacio) };
  const emoji = v.poster?.emoji || '🤯';
  const texto = v.poster?.texto || v.titulo;
  const largo = String(texto).length;
  return (
    <div className={'poster' + (vert ? ' vert' : '')} style={{ '--ac': E.claro || est === 'ilustrado' ? P.a : 'transparent', '--ac-tx': est === 'ilustrado' || E.claro ? '#0a0a12' : P.a }}>
      <div className="bg" style={{ background: FONDO_POSTER[est] ? FONDO_POSTER[est](P) : `radial-gradient(120% 90% at 30% 10%, ${P.f2}, ${P.f1} 65%, #000)` }} />
      {est === 'ilustrado' && <div className="lluvia" style={{ color: P.c }}>{lluvia(v.id)}</div>}
      {(est === 'ilustrado' || est === 'neon') && <div style={{ position: 'absolute', inset: 0, background: `repeating-conic-gradient(from ${v.id * 17}deg at ${vert ? '50% 32%' : '26% 50%'}, ${P.a}1c 0 9deg, transparent 9deg 22deg)`, WebkitMaskImage: `radial-gradient(circle at ${vert ? '50% 32%' : '26% 50%'}, #000, transparent 60%)` }} />}
      {est === 'tiza' && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 6px #5b3d22' }} />}
      <img className="emo" alt="" src={`/emoji/${codEmoji(emoji)}`} style={{ ...(vert ? { width: '62%', left: '19%', top: '12%' } : { width: '40%', left: '6%', top: '14%' }), filter: est === 'ilustrado' ? undefined : filtroEmoji(est, E, P, false) }} loading="lazy" />
      <div className="txt" style={{ ...(vert ? { left: '7%', right: '7%', bottom: '14%', fontSize: largo > 45 ? 15 : 18, textAlign: 'center' } : { left: '47%', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: largo > 45 ? 14 : largo > 32 ? 16.5 : 19 }), color: P.tx, ...(FUENTE_POSTER[est] ? { fontFamily: FUENTE_POSTER[est], fontWeight: 700, fontSize: (largo > 45 ? 15 : 19) * (est === 'neon' ? 1.15 : 1.1) } : {}), textShadow: est === 'neon' ? `0 0 10px ${P.b}` : E.claro || est === 'manim' ? 'none' : undefined }}>{textoGancho(texto)}</div>
      {!E.claro && est !== 'manim' && <div className="vign" />}
      {est !== 'ilustrado' && <div className="badge" style={{ position: 'absolute', right: 8, top: 8, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 10.5 }}>{E.nombre}</div>}
      <div className="tag"><span style={{ color: P.a }}>[</span>mathtrix<span style={{ color: P.a }}>]</span></div>
      {v.duracion ? <div className="dur">{dur(v.duracion)}</div> : null}
    </div>
  );
}

export function VideoCard({ v, vert, mostrarMotivo }) {
  return (
    <Link to={`/ver/${v.id}`} className="vcard">
      <Poster v={v} vert={vert} />
      <div className="meta">
        {!vert && <Avatar nombre={v.autor} color={v.autor_color} />}
        <div style={{ minWidth: 0 }}>
          <div className="tit">{v.titulo}</div>
          <div className="sub">{!vert && <>{v.autor} · </>}{vistas(v.vistas)}{!vert && <> · {hace(v.creado)}</>}</div>
          {mostrarMotivo && v.motivo && <div className="badge lima" style={{ marginTop: 6 }}>{v.motivo}</div>}
        </div>
      </div>
    </Link>
  );
}
