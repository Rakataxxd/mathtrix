// Cuestionario inicial: conoce al alumno (gustos, idolos, metas, como aprende) para personalizar cada video.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { codEmoji } from '../video/fx.jsx';

const PASOS = [
  { k: 'gustos', t: '¿Qué te gusta?', s: 'Elegí todo lo que quieras. Con esto inventamos los ganchos.', multi: true, ops: [['Fútbol', '⚽'], ['Videojuegos', '🎮'], ['Música', '🎧'], ['Autos', '🏎️'], ['Dinero y negocios', '💰'], ['Moda y tenis', '👟'], ['Redes sociales', '📱'], ['Anime', '🍥'], ['Espacio', '🚀'], ['Comida', '🍕'], ['Básquet', '🏀'], ['Animales', '🐶'], ['Series y cine', '🎬'], ['Arte y dibujo', '🎨'], ['Tecnología', '🤖'], ['Gym', '💪']] },
  { k: 'idolos', t: '¿A quién seguís o admirás?', s: 'Famosos, creadores, deportistas… o agregá el tuyo.', multi: true, libre: true, ops: [['Messi', '🐐'], ['Cristiano Ronaldo', '⚽'], ['Bad Bunny', '🐰'], ['Peso Pluma', '🎤'], ['Karol G', '💖'], ['Taylor Swift', '🎸'], ['MrBeast', '💸'], ['Ibai', '🎙️'], ['Elon Musk', '🚀'], ['LeBron James', '🏀'], ['Shakira', '💃'], ['Fede Valverde', '🇺🇾']] },
  { k: 'metas', t: '¿Qué metas tenés?', s: 'Nadie más lo ve, solo sirve para que los videos te hablen a vos.', multi: true, ops: [['Ser millonario', '🤑'], ['Tener mi negocio', '🏪'], ['Ser futbolista', '⚽'], ['Ser creador de contenido', '📹'], ['Ir a la universidad', '🎓'], ['Viajar por el mundo', '✈️'], ['Ser ingeniero/a', '🛠️'], ['Ser médico/a', '🩺'], ['Comprar mi carro', '🚗'], ['Ser gamer pro', '🕹️'], ['Ayudar a mi familia', '🏡'], ['Programar apps', '💻']] },
  { k: 'ambicion', t: 'En 10 años quiero…', s: 'Escribilo con tus palabras. Entre más loco, mejores ganchos.', texto: true, ph: 'Tener un Lamborghini, jugar en Europa y comprarle casa a mi mamá' },
  { k: 'aprende', t: '¿Cómo aprendés mejor?', s: 'Esto cambia cómo se explica cada video.', multi: true, ops: [['Con ejemplos visuales', '👀'], ['Paso a paso y despacio', '🐢'], ['Con historias', '📖'], ['Con retos y competencia', '🏆'], ['Rápido y directo', '⚡'], ['Repitiendo varias veces', '🔁']] },
  { k: 'complica', t: '¿Qué se te complica de mate?', s: 'Sin pena: así sabemos dónde ir más lento.', multi: true, ops: [['Fracciones', '🍰'], ['Porcentajes', '💯'], ['Ecuaciones', '⚖️'], ['Geometría', '📐'], ['Operaciones básicas', '➗'], ['Problemas con palabras', '📝'], ['Gráficas', '📈'], ['Probabilidad', '🎲'], ['Nada, todo fácil', '😎']] },
  { k: 'grado', t: '¿En qué grado vas?', s: 'Para ajustar la dificultad.', ops: [['Primaria (4to a 6to)', '🎒'], ['1ro a 3ro básico', '📘'], ['4to a 6to bachillerato', '📗'], ['Universidad', '🎓'], ['Ya no estudio', '🧠']] },
  { k: 'voz', t: '¿Qué voz querés en tus videos?', s: 'Voces neurales con acento de Guatemala.', ops: [['Andrés', '🧑🏽'], ['Marta', '👩🏽']] },
];

export function Onboarding({ editar }) {
  const { usuario, perfil, setPerfil } = useSesion();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [r, setR] = useState(() => perfil || { gustos: [], idolos: [], metas: [], aprende: [], complica: [], ambicion: '', grado: '', voz: 'Andrés' });
  const [extra, setExtra] = useState('');
  const p = PASOS[i];
  const val = r[p.k];
  const toggle = (o) => {
    if (p.multi) setR({ ...r, [p.k]: val.includes(o) ? val.filter((x) => x !== o) : [...val, o] });
    else setR({ ...r, [p.k]: o === 'Andrés' ? 'Andrés' : o === 'Marta' ? 'Marta' : o });
  };
  const listo = p.texto ? true : p.multi ? val.length > 0 : !!val;
  const fin = async () => {
    const datos = { ...r, voz: r.voz === 'Marta' ? 'Marta' : 'Andres' };
    await api('/perfil', { cuerpo: datos });
    setPerfil(datos);
    if (editar) nav('/');
  };
  const ops = p.libre ? [...p.ops, ...val.filter((x) => !p.ops.some((o) => o[0] === x)).map((x) => [x, '⭐'])] : p.ops || [];
  return (
    <div className="onb">
      <div className="logo" style={{ marginBottom: 26 }}><span className="ico">[π]</span><span>math<b>trix</b></span></div>
      <div className="prog"><div style={{ width: `${((i + 1) / PASOS.length) * 100}%` }} /></div>
      <div className="dim mono" style={{ fontSize: 13, fontWeight: 700 }}>{i + 1}/{PASOS.length} · Hola, {usuario.nombre.split(' ')[0]} 👋</div>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 10 }}>{p.t}</h1>
      <div className="muted" style={{ marginTop: 8, fontSize: 16 }}>{p.s}</div>
      {p.texto ? (
        <textarea className="area" style={{ marginTop: 22, fontSize: 18, minHeight: 140 }} placeholder={p.ph} value={val} onChange={(e) => setR({ ...r, [p.k]: e.target.value })} />
      ) : (
        <div className="opciones">
          {ops.map(([o, e]) => (
            <button key={o} className={'opcion' + ((p.multi ? val.includes(o) : val === o || (p.k === 'voz' && val?.startsWith(o.slice(0, 4)))) ? ' on' : '')} onClick={() => toggle(o)}>
              <img alt="" src={`/emoji/${codEmoji(e)}`} />{o}
            </button>
          ))}
        </div>
      )}
      {p.libre && (
        <form className="fila" style={{ marginTop: 16, maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); if (extra.trim()) { setR({ ...r, [p.k]: [...val, extra.trim()] }); setExtra(''); } }}>
          <input className="input" placeholder="Agregar otro (ej. Kylian Mbappé)" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <button className="btn">Agregar</button>
        </form>
      )}
      <div className="entre" style={{ marginTop: 40 }}>
        <button className="btn fant" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft size={17} />Atrás</button>
        {i < PASOS.length - 1
          ? <button className="btn lima" disabled={!listo} onClick={() => setI(i + 1)}>Siguiente<ArrowRight size={17} /></button>
          : <button className="btn lima" disabled={!listo} onClick={fin}><Sparkles size={17} />Crear mi perfil</button>}
      </div>
    </div>
  );
}
