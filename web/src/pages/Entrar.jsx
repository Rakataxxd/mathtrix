import React, { useState } from 'react';
import { Backpack, Presentation } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { codEmoji } from '../video/fx.jsx';

const FLOTAN = ['💎', '🏎️', '🎰', '⚽', '🚀', '🍕', '👟', '🎮'];

export function Entrar() {
  const { entrar } = useSesion();
  const [modo, setModo] = useState('registro');
  const [rol, setRol] = useState('alumno');
  const [f, setF] = useState({ nombre: '', email: '', clave: '' });
  const [cnb, setCnb] = useState(true);
  const [err, setErr] = useState(null);
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e?.preventDefault(); setErr(null); setCargando(true);
    try {
      const d = modo === 'registro' ? await api('/registro', { cuerpo: { ...f, rol, curriculo: cnb ? 'cnb' : 'general' } }) : await api('/login', { cuerpo: f });
      entrar(d);
    } catch (x) { setErr(x.message); } finally { setCargando(false); }
  };
  const demo = async (email) => { setErr(null); try { entrar(await api('/login', { cuerpo: { email, clave: 'mathtrix' } })); } catch (x) { setErr('Cuentas demo no cargadas: corré npm run seed'); } };

  return (
    <div className="entrar">
      <div className="izq">
        <div className="logo" style={{ fontSize: 26 }}><span className="ico">[π]</span><span>math<b>trix</b></span></div>
        {FLOTAN.map((e, i) => (
          <img key={i} alt="" src={`/emoji/${codEmoji(e)}`} style={{ position: 'absolute', width: 70 + (i % 3) * 30, right: `${6 + (i * 37) % 60}%`, top: `${14 + (i * 23) % 62}%`, opacity: 0.9, transform: `rotate(${(i % 2 ? 1 : -1) * 12}deg)`, filter: 'drop-shadow(0 14px 20px rgba(0,0,0,.5))' }} />
        ))}
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <h1 style={{ fontSize: 'clamp(32px, 4.2vw, 58px)', lineHeight: 1.02 }}>¿Cuántos diamantes lleva Peso Pluma en el cuello? <span style={{ background: 'var(--lima)', color: '#0a0a12', padding: '0 .15em', borderRadius: '.1em' }}>Ridículo calcularlo.</span></h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.55, marginTop: 18 }}>Videos de matemática hechos para vos, con lo que te gusta. Tu profe pone el tema; la IA arma el gancho, el código hace las cuentas exactas.</p>
        </div>
        <div className="dim" style={{ fontSize: 13, position: 'relative' }}>Hecho en Guatemala 🇬🇹 para subir el nivel de matemática en PISA.</div>
      </div>
      <div className="der">
        <form className="form" onSubmit={enviar}>
          <h2 style={{ fontSize: 26 }}>{modo === 'registro' ? 'Creá tu cuenta' : 'Entrá a Mathtrix'}</h2>
          <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>{modo === 'registro' ? '¿Ya tenés cuenta? ' : '¿Nuevo aquí? '}<a href="#" style={{ color: 'var(--lima)', fontWeight: 700 }} onClick={(e) => { e.preventDefault(); setModo(modo === 'registro' ? 'login' : 'registro'); }}>{modo === 'registro' ? 'Iniciá sesión' : 'Creá una cuenta'}</a></div>
          {modo === 'registro' && (
            <>
              <label className="lab">Soy…</label>
              <div className="roles">
                <button type="button" className={'rol' + (rol === 'alumno' ? ' on' : '')} onClick={() => setRol('alumno')}><Backpack color="var(--lima)" /><b>Alumno</b><span>Me uno a clases y genero mis videos</span></button>
                <button type="button" className={'rol' + (rol === 'profesor' ? ' on' : '')} onClick={() => setRol('profesor')}><Presentation color="var(--rosa)" /><b>Profesor</b><span>Creo cursos, subo material y veo el avance</span></button>
              </div>
              <label className="lab">Nombre</label>
              <input className="input" value={f.nombre} onChange={set('nombre')} placeholder={rol === 'alumno' ? 'Diego Pérez' : 'Profa. Ana López'} required />
            </>
          )}
          <label className="lab">Correo</label>
          <input className="input" type="email" value={f.email} onChange={set('email')} placeholder="vos@correo.com" required />
          <label className="lab">Contraseña</label>
          <input className="input" type="password" value={f.clave} onChange={set('clave')} placeholder="••••••••" required minLength={4} />
          {modo === 'registro' && rol === 'profesor' && (
            <label className="check">
              <input type="checkbox" checked={cnb} onChange={(e) => setCnb(e.target.checked)} />
              <div><b style={{ fontSize: 14.5 }}>Alineado al CNB de Guatemala</b><div className="muted" style={{ fontSize: 13, marginTop: 3 }}>Cada clase se liga a competencias e indicadores de logro del CNB. Desmarcalo si enseñás fuera de Guatemala. Solo lo ven profesores.</div></div>
            </label>
          )}
          {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
          <button className="btn lima" style={{ width: '100%', marginTop: 20, height: 48 }} disabled={cargando}>{modo === 'registro' ? 'Crear cuenta' : 'Entrar'}</button>
          <div className="entre" style={{ marginTop: 22, gap: 8 }}>
            <button type="button" className="btn chico" style={{ flex: 1 }} onClick={() => demo('diego@demo.gt')}>Demo alumno</button>
            <button type="button" className="btn chico" style={{ flex: 1 }} onClick={() => demo('profe@demo.gt')}>Demo profesor</button>
          </div>
        </form>
      </div>
    </div>
  );
}
