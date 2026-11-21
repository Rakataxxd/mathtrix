import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Zap, GraduationCap, School, Search, LogOut, Sparkles, BarChart3, Plus } from 'lucide-react';
import { useSesion, hace, dur, vistas, inicial } from '../api.js';
import { PALETAS } from '../video/fx.jsx';
import { codEmoji } from '../video/fx.jsx';

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
export function Poster({ v, vert }) {
  const P = PALETAS[v.poster?.paleta] || PALETAS.espacio;
  const emoji = v.poster?.emoji || '🤯';
  const texto = v.poster?.texto || v.titulo;
  const largo = String(texto).length;
  return (
    <div className={'poster' + (vert ? ' vert' : '')} style={{ '--ac': P.a }}>
      <div className="bg" style={{ background: `radial-gradient(120% 90% at 30% 10%, ${P.f2}, ${P.f1} 65%, #000)` }} />
      <div className="lluvia" style={{ color: P.c }}>{lluvia(v.id)}</div>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-conic-gradient(from ${v.id * 17}deg at ${vert ? '50% 32%' : '26% 50%'}, ${P.a}1c 0 9deg, transparent 9deg 22deg)`, WebkitMaskImage: `radial-gradient(circle at ${vert ? '50% 32%' : '26% 50%'}, #000, transparent 60%)` }} />
      <img className="emo" alt="" src={`/emoji/${codEmoji(emoji)}`} style={vert ? { width: '62%', left: '19%', top: '12%' } : { width: '40%', left: '6%', top: '14%' }} loading="lazy" />
      <div className="txt" style={vert ? { left: '7%', right: '7%', bottom: '14%', fontSize: largo > 45 ? 15 : 18, textAlign: 'center' } : { left: '47%', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: largo > 45 ? 14 : largo > 32 ? 16.5 : 19 }}>{textoGancho(texto)}</div>
      <div className="vign" />
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
