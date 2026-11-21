// Landing publica minimalista: un reel real corriendo (rota entre plantillas) y registro en un solo paso.
import React, { useEffect, useState } from 'react';
import { Player, Thumbnail } from '@remotion/player';
import { Target, ShieldCheck, Mic, Sparkles, School, BarChart3, X, Backpack, Presentation, ArrowRight } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { MathtrixVideo } from '../video/MathtrixVideo.jsx';
import { ESTILOS, LISTA_ESTILOS, FiltrosEstilo } from '../video/estilos.jsx';
import { MUESTRA } from '../components/SelectorEstilo.jsx';

const MUESTRA_V = { ...MUESTRA, ancho: 1080, alto: 1920, formato: 'vertical' };

function Auth({ inicial, onCerrar }) {
  const { entrar } = useSesion();
  const [modo, setModo] = useState(inicial.modo);
  const [rol, setRol] = useState(inicial.rol || 'alumno');
  const [f, setF] = useState({ nombre: '', email: '', clave: '' });
  const [cnb, setCnb] = useState(true);
  const [err, setErr] = useState(null);
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault(); setErr(null); setCargando(true);
    try { entrar(modo === 'registro' ? await api('/registro', { cuerpo: { ...f, rol, curriculo: cnb ? 'cnb' : 'general' } }) : await api('/login', { cuerpo: f })); }
    catch (x) { setErr(x.message); } finally { setCargando(false); }
  };
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <form className="caja auth" onSubmit={enviar}>
        <div className="entre"><h2>{modo === 'registro' ? 'Creá tu cuenta' : 'Bienvenido de vuelta'}</h2><button type="button" className="btn chico ico fant" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button></div>
        {modo === 'registro' && (
          <div className="seg" style={{ marginTop: 18, width: '100%' }}>
            <button type="button" style={{ flex: 1, justifyContent: 'center' }} className={rol === 'alumno' ? 'on' : ''} onClick={() => setRol('alumno')}><Backpack size={15} />Alumno</button>
            <button type="button" style={{ flex: 1, justifyContent: 'center' }} className={rol === 'profesor' ? 'on' : ''} onClick={() => setRol('profesor')}><Presentation size={15} />Profesor</button>
          </div>
        )}
        {modo === 'registro' && <input className="input" style={{ marginTop: 12 }} placeholder="Tu nombre" value={f.nombre} onChange={set('nombre')} required />}
        <input className="input" style={{ marginTop: 10 }} type="email" placeholder="Correo" value={f.email} onChange={set('email')} required />
        <input className="input" style={{ marginTop: 10 }} type="password" placeholder="Contraseña" value={f.clave} onChange={set('clave')} required minLength={4} />
        {modo === 'registro' && rol === 'profesor' && (
          <label className="check"><input type="checkbox" checked={cnb} onChange={(e) => setCnb(e.target.checked)} /><div><b>Alineado al CNB de Guatemala</b><div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>Desmarcalo si enseñás fuera de Guatemala.</div></div></label>
        )}
        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
        <button className="btn lima grande" style={{ width: '100%', marginTop: 18 }} disabled={cargando}>{modo === 'registro' ? 'Crear cuenta' : 'Entrar'}</button>
        <div className="muted" style={{ textAlign: 'center', fontSize: 14, marginTop: 16 }}>
          {modo === 'registro' ? '¿Ya tenés cuenta? ' : '¿Primera vez? '}
          <a href="#" style={{ color: 'var(--tx)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setModo(modo === 'registro' ? 'entrar' : 'registro'); }}>{modo === 'registro' ? 'Entrá' : 'Creá tu cuenta'}</a>
        </div>
      </form>
    </div>
  );
}

export function Landing() {
  const { entrar } = useSesion();
  const [auth, setAuth] = useState(null);
  const [demo, setDemo] = useState(null);
  const [n, setN] = useState(0);
  useEffect(() => { fetch('/api/publico/demo').then((r) => r.json()).then((l) => setDemo(l[0] || null)).catch(() => {}); }, []);
  useEffect(() => { const iv = setInterval(() => setN((x) => x + 1), 3800); return () => clearInterval(iv); }, []);
  const tl = demo?.timeline || MUESTRA_V;
  const estilo = LISTA_ESTILOS[n % LISTA_ESTILOS.length];
  const entrarDemo = async (email) => { try { entrar(await api('/login', { cuerpo: { email, clave: 'mathtrix' } })); } catch { setAuth({ modo: 'entrar' }); } };
  return (
    <div className="landing">
      <FiltrosEstilo />
      <nav className="l-nav vidrio">
        <div className="logo"><span className="ico">[π]</span><span>mathtrix</span></div>
        <div className="fila" style={{ gap: 6 }}>
          <button className="btn chico fant" onClick={() => setAuth({ modo: 'entrar' })}>Entrar</button>
          <button className="btn chico lima" onClick={() => setAuth({ modo: 'registro' })}>Empezar</button>
        </div>
      </nav>
      <section className="l-hero">
        <div>
          <div className="l-ojo vidrio"><i />Matemática para Guatemala</div>
          <h1>Aprendé mate con <span>lo que ya te gusta.</span></h1>
          <p>Tu profe pone el tema. Mathtrix crea un video solo para vos, con tus ídolos, tus metas y el estilo que elijas. Las cuentas siempre exactas.</p>
          <div className="fila" style={{ flexWrap: 'wrap', gap: 10 }}>
            <button className="btn lima grande" onClick={() => setAuth({ modo: 'registro', rol: 'alumno' })}>Empezar gratis <ArrowRight size={17} /></button>
            <button className="btn grande" onClick={() => setAuth({ modo: 'registro', rol: 'profesor' })}>Soy profe</button>
          </div>
          <div className="dim" style={{ fontSize: 13.5, marginTop: 18 }}>
            Probalo sin registrarte: <a href="#" style={{ color: 'var(--tx2)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); entrarDemo('diego@demo.gt'); }}>demo alumno</a> · <a href="#" style={{ color: 'var(--tx2)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); entrarDemo('profe@demo.gt'); }}>demo profe</a>
          </div>
        </div>
        <div className="l-tel">
          <div>
            <Player component={MathtrixVideo} inputProps={{ tl, estilo }} durationInFrames={Math.max(1, tl.duracion)} fps={tl.fps} compositionWidth={tl.ancho} compositionHeight={tl.alto} autoPlay loop initiallyMuted controls={false} clickToPlay={false} acknowledgeRemotionLicense style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="l-flota vidrio" style={{ left: -150, top: '18%' }}><Target size={16} color="var(--acento)" />Pregunta dentro del video</div>
          <div className="l-flota vidrio" style={{ right: -130, top: '48%', animationDelay: '1.2s' }}><ShieldCheck size={16} color="var(--cian)" />Cuentas verificadas</div>
          <div className="l-flota vidrio" style={{ left: -110, bottom: '14%', animationDelay: '2.4s' }}><Mic size={16} color="var(--rosa)" />Voz natural</div>
          <div className="vidrio" style={{ position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Estilo: {ESTILOS[estilo].nombre}</div>
        </div>
      </section>
      <section className="l-sec" style={{ paddingTop: 70 }}>
        <div className="l-tres">
          {[[School, 'Tu profe pone el tema', 'Sube su material o una ecuación. Mathtrix arma la clase alineada al CNB.'], [Sparkles, 'Un video solo para vos', 'Un gancho absurdo con lo que te gusta, la explicación paso a paso y un reto.'], [BarChart3, 'Tu profe ve tu avance', 'Dónde pausás, qué respondés y qué se te complica. Sin exámenes aburridos.']].map(([I, t, d]) => (
            <div key={t} className="card"><I size={22} strokeWidth={1.8} /><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>
      <section className="l-sec">
        <h2>Elegí cómo querés verlo</h2>
        <div className="l-estilos">
          {LISTA_ESTILOS.map((k) => (
            <div key={k}><Thumbnail component={MathtrixVideo} inputProps={{ tl: MUESTRA, estilo: k }} compositionWidth={1920} compositionHeight={1080} durationInFrames={240} fps={30} frameToDisplay={205} style={{ width: '100%' }} acknowledgeRemotionLicense /><span>{ESTILOS[k].nombre}</span></div>
          ))}
        </div>
      </section>
      <div className="l-pie">En PISA 2022, cerca de 1 de cada 10 estudiantes de Guatemala alcanzó el nivel básico de matemática. Mathtrix existe para cambiar ese número.</div>
      {auth && <Auth inicial={auth} onCerrar={() => setAuth(null)} />}
    </div>
  );
}
