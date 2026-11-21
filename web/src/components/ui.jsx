import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Zap, School, Search, LogOut, Plus, UserRound, GraduationCap, Sparkles, Smartphone, RectangleHorizontal, X, Sun, Moon, Camera, Trophy } from 'lucide-react';
import { useSesion, api, hace, dur, vistas, inicial, getTema, setTema } from '../api.js';
import { PALETAS, codEmoji } from '../video/fx.jsx';
import { ESTILOS, FiltrosEstilo, estiloDe, filtroEmoji } from '../video/estilos.jsx';
import { Generador } from './Generador.jsx';
import { RevisarFoto } from './RevisarFoto.jsx';

export function Logo() {
  return <Link to="/" className="logo"><span className="ico">[π]</span><span>mathtrix</span></Link>;
}
export function Avatar({ nombre, color, size = 34 }) {
  return <div className="avatar" style={{ background: color || '#c8ff3d', width: size, height: size, fontSize: size * 0.42 }}>{inicial(nombre)}</div>;
}

function MenuUsuario() {
  const { usuario, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef();
  useEffect(() => { const f = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, []);
  return (
    <div className="menu" ref={ref}>
      <button onClick={() => setAbierto(!abierto)} aria-label="Cuenta"><Avatar nombre={usuario?.nombre} color={usuario?.color} /></button>
      {abierto && (
        <div className="menu-pop" onClick={() => setAbierto(false)}>
          <div className="yo"><b style={{ fontSize: 14.5 }}>{usuario.nombre}</b><div className="dim" style={{ fontSize: 13, marginTop: 2 }}>{usuario.rol === 'profesor' ? 'Profesor' : 'Alumno'} · {usuario.email}</div></div>
          {usuario.rol === 'alumno' && <Link to="/perfil"><UserRound size={17} />Mis gustos y estilo</Link>}
          <BotonTema />
          <button onClick={salir}><LogOut size={17} />Salir</button>
        </div>
      )}
    </div>
  );
}

/** Modo claro (por defecto) u oscuro; se recuerda en este navegador. */
export function BotonTema({ boton }) {
  const [t, setT] = useState(getTema());
  const cambiar = (e) => { e?.stopPropagation?.(); const n = t === 'oscuro' ? 'claro' : 'oscuro'; setTema(n); setT(n); };
  if (boton) return <button className="btn chico ico" onClick={cambiar} aria-label={t === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}>{t === 'oscuro' ? <Sun size={16} /> : <Moon size={16} />}</button>;
  return <button onClick={cambiar}>{t === 'oscuro' ? <Sun size={17} /> : <Moon size={17} />}{t === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}</button>;
}

/** Crear: un tema (un campo y un botón) o revisar mi ejercicio (foto). */
export function CrearVideo({ onCerrar }) {
  const { perfil } = useSesion();
  const [modo, setModo] = useState('tema');
  const [tema, setTema] = useState('');
  const [formato, setFormato] = useState('horizontal');
  const [trabajo, setTrabajo] = useState(null);
  const [err, setErr] = useState(null);
  const enviar = async (e) => {
    e.preventDefault(); if (!tema.trim()) return;
    try { const d = await api('/generar-libre', { cuerpo: { tema, formato, estilo: perfil?.estilo } }); setTrabajo(d.trabajo); } catch (x) { setErr(x.message); }
  };
  if (trabajo) return <Generador trabajo={trabajo} onCerrar={onCerrar} />;
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <form className="caja" onSubmit={enviar}>
        <div className="entre"><h2>{modo === 'tema' ? '¿Qué querés aprender?' : 'Revisar mi ejercicio'}</h2><button type="button" className="btn chico ico fant" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button></div>
        <div className="seg" style={{ marginTop: 14 }}>
          <button type="button" className={modo === 'tema' ? 'on' : ''} onClick={() => setModo('tema')}><Sparkles size={15} />Un tema</button>
          <button type="button" className={modo === 'foto' ? 'on' : ''} onClick={() => setModo('foto')}><Camera size={15} />Mi ejercicio</button>
        </div>
        {modo === 'foto' ? <div style={{ marginTop: 14 }}><RevisarFoto onTrabajo={setTrabajo} /></div> : <>
        <input autoFocus className="input" style={{ marginTop: 16, height: 52, fontSize: 16 }} placeholder="Ej. probabilidad de ganar la lotería" value={tema} onChange={(e) => setTema(e.target.value)} />
        <div className="entre" style={{ marginTop: 14 }}>
          <div className="seg">
            <button type="button" className={formato === 'vertical' ? 'on' : ''} onClick={() => setFormato('vertical')}><Smartphone size={15} />Short</button>
            <button type="button" className={formato === 'horizontal' ? 'on' : ''} onClick={() => setFormato('horizontal')}><RectangleHorizontal size={15} />Video</button>
          </div>
          <button className="btn lima" disabled={!tema.trim()}><Sparkles size={16} />Crear</button>
        </div></>}
        {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
      </form>
    </div>
  );
}

export function Layout({ children }) {
  const { usuario } = useSesion();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [crear, setCrear] = useState(false);
  const prof = usuario?.rol === 'profesor';
  const links = [
    { to: '/', ico: Home, txt: 'Inicio', end: true },
    { to: '/shorts', ico: Zap, txt: 'Shorts' },
    { to: '/clases', ico: School, txt: 'Clases' },
    { to: '/aprender', ico: prof ? GraduationCap : Trophy, txt: prof ? 'Ranking' : 'Progreso' },
  ];
  return (
    <>
      <header className="top">
        <Logo />
        <form className="buscar" onSubmit={(e) => { e.preventDefault(); nav('/?q=' + encodeURIComponent(q)); }}>
          <input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <button aria-label="Buscar"><Search size={18} /></button>
        </form>
        <div className="top-der">
          {prof ? <Link to="/clases?nueva=1" className="btn chico"><Plus size={16} />Crear curso</Link> : <button className="btn chico" onClick={() => setCrear(true)}><Plus size={16} />Crear</button>}
          <MenuUsuario />
        </div>
      </header>
      <nav className="side">
        {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'activo' : '')}><l.ico size={22} strokeWidth={1.8} />{l.txt}</NavLink>)}
      </nav>
      <FiltrosEstilo />
      <main className="main">{children}</main>
      <nav className="tabbar vidrio">
        {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'activo' : '')}><l.ico size={22} strokeWidth={1.8} />{l.txt}</NavLink>)}
      </nav>
      {crear && <CrearVideo onCerrar={() => setCrear(false)} />}
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
  vector: (P) => `radial-gradient(60% 50% at 85% 10%, #2EC4F1 0 28%, transparent 29%), radial-gradient(140% 90% at 75% 0%, #2B1772, ${P.f2} 45%, ${P.f1} 85%)`,
  cinetica: () => '#0a0a0a',
  riso: (P) => `radial-gradient(circle, #FF48B0 38%, transparent 40%) 0 0/12px 12px, ${P.f1}`,
  neon: (P) => `linear-gradient(180deg, ${P.f1}, ${P.f2} 60%, #000)`,
};
const FUENTE_POSTER = { tiza: "'Cabin Sketch'", blueprint: "'Space Grotesk'", manim: "'STIX Two Text'", cuaderno: "'Kalam'", neon: "'Anton'", vector: "'Baloo 2'", cinetica: "'Archivo Black'", riso: "'Archivo Black'" };
export function Poster({ v, vert }) {
  const est = estiloDe(v.poster?.estilo || v.estilo);
  const E = ESTILOS[est];
  const P = E.P || { tx: '#fff', ...(PALETAS[v.poster?.paleta] || PALETAS.espacio) };
  const emoji = v.poster?.emoji || '🤯';
  const texto = v.poster?.texto || v.titulo;
  const largo = String(texto).length;
  const tam = (vert ? (largo > 45 ? 7.6 : 9) : (largo > 45 ? 4.6 : largo > 32 ? 5.4 : 6.2)) * (FUENTE_POSTER[est] ? 1.1 : 1);
  return (
    <div className={'poster' + (vert ? ' vert' : '')} style={{ containerType: 'inline-size', '--ac': E.claro || est === 'ilustrado' ? P.a : 'transparent', '--ac-tx': est === 'ilustrado' || E.claro ? '#0a0a12' : P.a }}>
      <div className="bg" style={{ background: FONDO_POSTER[est] ? FONDO_POSTER[est](P) : `radial-gradient(120% 90% at 30% 10%, ${P.f2}, ${P.f1} 65%, #000)` }} />
      {est === 'ilustrado' && <div className="lluvia" style={{ color: P.c }}>{lluvia(v.id)}</div>}
      {est === 'tiza' && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 4px #5b3d22' }} />}
      <img className="emo" alt="" src={`/emoji/${codEmoji(emoji)}`} style={{ ...(vert ? { width: '62%', left: '19%', top: '12%' } : { width: '40%', left: '6%', top: '14%' }), filter: est === 'ilustrado' ? undefined : filtroEmoji(est, E, P, false) }} loading="lazy" />
      <div className="txt" style={{ ...(vert ? { left: '7%', right: '7%', bottom: '13%', textAlign: 'center' } : { left: '47%', right: '5%', top: '50%', transform: 'translateY(-50%)' }), fontSize: `${tam}cqw`, color: P.tx, ...(FUENTE_POSTER[est] ? { fontFamily: FUENTE_POSTER[est], fontWeight: 700 } : {}), textShadow: est === 'neon' ? `0 0 10px ${P.b}` : E.claro || est === 'manim' ? 'none' : '0 3px 0 rgba(0,0,0,.35)' }}>{textoGancho(texto)}</div>
      {!E.claro && est !== 'manim' && <div className="vign" />}
      {v.duracion ? <div className="dur">{dur(v.duracion)}</div> : null}
    </div>
  );
}

export function VideoCard({ v, vert }) {
  return (
    <Link to={vert ? `/shorts/${v.id}` : `/ver/${v.id}`} className="vcard">
      <Poster v={v} vert={vert} />
      <div className="meta">
        {!vert && <Avatar nombre={v.autor} color={v.autor_color} size={32} />}
        <div style={{ minWidth: 0 }}>
          <div className="tit">{v.titulo}</div>
          <div className="sub">{!vert && <>{v.autor} · </>}{vistas(v.vistas)}{!vert && <> · {hace(v.creado)}</>}</div>
        </div>
      </div>
    </Link>
  );
}
