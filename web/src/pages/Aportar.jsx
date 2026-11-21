// Aportar a la comunidad: tu clave + el comando para generar videos con tu propio Claude.
import React, { useEffect, useState } from 'react';
import { HeartHandshake, KeyRound, Copy, Check, Terminal, ShieldCheck, RefreshCw, Users, Film, Zap } from 'lucide-react';
import { api } from '../api.js';
import { Avatar } from '../components/ui.jsx';

function Copiable({ texto, etiqueta }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="cmd">
      {etiqueta && <div className="cmd-et">{etiqueta}</div>}
      <pre>{texto}</pre>
      <button className="btn chico" onClick={() => { navigator.clipboard?.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1400); }}>{ok ? <Check size={14} /> : <Copy size={14} />}{ok ? 'Copiado' : 'Copiar'}</button>
    </div>
  );
}

export function Aportar() {
  const [d, setD] = useState(null);
  const [os, setOs] = useState(/Win/i.test(navigator.platform) ? 'win' : 'unix');
  const cargar = () => api('/comunidad/yo').then(setD).catch(() => setD({ total: 0, top: [] }));
  useEffect(() => { cargar(); }, []);
  const crearClave = async (rotar) => { const r = await api('/comunidad/clave', { cuerpo: { rotar } }); setD((x) => ({ ...x, clave: r.clave })); };
  const base = window.location.origin;
  const clave = d?.clave || 'TU_CLAVE';
  const cmd = os === 'win'
    ? `irm ${base}/aportar.mjs -OutFile aportar.mjs\nnode aportar.mjs --clave ${clave} --cantidad 100 --paralelo 3`
    : `curl -sO ${base}/aportar.mjs\nnode aportar.mjs --clave ${clave} --cantidad 100 --paralelo 3`;
  return (
    <div style={{ maxWidth: 1050 }}>
      <div className="card hero">
        <div className="fila" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className="duda-ico" style={{ width: 52, height: 52, borderRadius: 16 }}><HeartHandshake size={26} /></div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1>Aportá videos a la comunidad</h1>
            <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.55, marginTop: 8, maxWidth: 640 }}>Si tenés Claude Code, tu compu puede escribir guiones de videos de mate mientras hacés otra cosa. Mathtrix verifica cada cuenta, les pone voz y los publica gratis para estudiantes de Guatemala.</p>
          </div>
        </div>
        <div className="stats-mini" style={{ marginTop: 18 }}>
          <div><b><Film size={17} style={{ verticalAlign: -2 }} /> {(d?.total ?? 0).toLocaleString()}</b><span>videos de la comunidad</span></div>
          <div><b><Zap size={17} style={{ verticalAlign: -2 }} /> {(d?.hoy ?? 0).toLocaleString()}</b><span>aportados hoy</span></div>
          <div><b><Users size={17} style={{ verticalAlign: -2 }} /> {d?.top?.length ?? 0}</b><span>aportantes</span></div>
          <div><b>{(d?.mios ?? 0).toLocaleString()}</b><span>tus videos</span></div>
        </div>
      </div>

      <div className="dos" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ fontSize: 18 }}><span className="paso-n">1</span> Tu clave</h2>
          {d?.clave ? (
            <>
              <Copiable texto={d.clave} />
              <button className="btn chico fant" style={{ marginTop: 8 }} onClick={() => crearClave(true)}><RefreshCw size={14} />Cambiar clave</button>
            </>
          ) : <button className="btn lima" style={{ marginTop: 12 }} onClick={() => crearClave(false)}><KeyRound size={16} />Generar mi clave</button>}
          <div className="dim" style={{ fontSize: 12.5, marginTop: 10 }}>Es personal: los videos que aportes quedan a tu nombre.</div>

          <h2 style={{ fontSize: 18, marginTop: 24 }}><span className="paso-n">2</span> Corré esto en tu terminal</h2>
          <div className="seg" style={{ marginTop: 10 }}>
            <button className={os === 'win' ? 'on' : ''} onClick={() => setOs('win')}>Windows (PowerShell)</button>
            <button className={os === 'unix' ? 'on' : ''} onClick={() => setOs('unix')}>Mac / Linux</button>
          </div>
          <Copiable texto={cmd} etiqueta={<><Terminal size={13} /> terminal</>} />
          <div className="dim" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>Necesitás Node 18+ y Claude Code con sesión iniciada. Cambiá <b>--cantidad</b> (o usá <b>--sin-fin</b>) y <b>--paralelo</b> (hasta 8 a la vez).</div>

          <h2 style={{ fontSize: 18, marginTop: 24 }}><span className="paso-n">3</span> Listo</h2>
          <div className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>Cada video aparece en el Inicio de todos con un gancho distinto, su voz, su pregunta en el video y su reto. Los que no pasan la verificación de la cuenta se descartan solos.</div>
          <div className="insight" style={{ marginTop: 14 }}><ShieldCheck size={18} color="var(--verde)" /><div style={{ fontSize: 13.5 }}>Claude corre <b>sin herramientas</b> en una carpeta vacía: solo escribe texto, no puede leer ni tocar nada de tu compu. Gasta del límite de tu plan.</div></div>
        </div>

        <div>
          <div className="card precio">
            <div className="dim" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.08em' }}>CUÁNTO CUESTA</div>
            <div className="precio-gde">Con <b>$10</b> generás <b>650+</b> videos</div>
            <div className="muted" style={{ fontSize: 14 }}>Menos de 2 centavos por video. Con una suscripción, cada aporte no se cobra aparte.</div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 18 }}>Quiénes aportan</h2>
            <div style={{ marginTop: 10 }}>
              {(d?.top || []).map((f, i) => (
                <div key={f.id} className="rank-fila"><span className="pos">{i + 1}</span><Avatar nombre={f.nombre} color={f.color} size={30} /><span>{f.nombre}</span><span className="xp">{f.videos} videos</span></div>
              ))}
              {!d?.top?.length && <div className="dim" style={{ fontSize: 14 }}>Todavía nadie. ¡Sé el primero!</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
