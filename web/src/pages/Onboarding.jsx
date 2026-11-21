// Conocer al alumno en 3 pasos (todo se puede saltar): gustos, metas y como aprende.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { SelectorEstilo } from '../components/SelectorEstilo.jsx';

const GUSTOS = ['⚽ Fútbol', '🎮 Videojuegos', '🎧 Música', '🏎️ Autos', '💰 Dinero', '👟 Moda', '📱 Redes', '🍥 Anime', '🚀 Espacio', '🍕 Comida', '🏀 Básquet', '🎬 Series'];
const IDOLOS = ['Messi', 'Cristiano Ronaldo', 'Bad Bunny', 'Peso Pluma', 'Karol G', 'Taylor Swift', 'MrBeast', 'Ibai', 'LeBron James', 'Shakira'];
const METAS = ['🤑 Ser millonario', '🏪 Tener mi negocio', '⚽ Ser futbolista', '📹 Ser creador', '🎓 Ir a la U', '✈️ Viajar', '🛠️ Ser ingeniero/a', '🩺 Ser médico/a', '🚗 Mi carro', '🕹️ Gamer pro'];
const APRENDE = ['👀 Viendo ejemplos', '🐢 Paso a paso', '📖 Con historias', '🏆 Con retos', '⚡ Rápido y directo'];
const COMPLICA = ['Fracciones', 'Porcentajes', 'Ecuaciones', 'Geometría', 'Problemas con palabras', 'Probabilidad'];
const limpio = (x) => x.replace(/^\S+\s/, (m) => (/\p{Extended_Pictographic}/u.test(m) ? '' : m));

function Grupo({ titulo, ops, valor, onChange, libre }) {
  const [extra, setExtra] = useState('');
  const todos = [...ops, ...valor.filter((v) => !ops.some((o) => limpio(o) === v))];
  const tog = (o) => { const k = limpio(o); onChange(valor.includes(k) ? valor.filter((x) => x !== k) : [...valor, k]); };
  return (
    <div className="grupo">
      <div className="lab">{titulo}</div>
      <div className="opciones">
        {todos.map((o) => <button key={o} type="button" className={'opcion' + (valor.includes(limpio(o)) ? ' on' : '')} onClick={() => tog(o)}>{o}</button>)}
        {libre && <form onSubmit={(e) => { e.preventDefault(); if (extra.trim()) { onChange([...valor, extra.trim()]); setExtra(''); } }}><input className="input" style={{ height: 42, borderRadius: 999, width: 180, padding: '0 16px' }} placeholder="+ Otro" value={extra} onChange={(e) => setExtra(e.target.value)} /></form>}
      </div>
    </div>
  );
}

export function Onboarding({ editar }) {
  const { usuario, perfil, setPerfil } = useSesion();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [r, setR] = useState(() => ({ gustos: [], idolos: [], metas: [], aprende: [], complica: [], ambicion: '', voz: 'Andres', estilo: 'auto', ...(perfil || {}) }));
  const set = (k) => (v) => setR({ ...r, [k]: v });
  const fin = async () => { await api('/perfil', { cuerpo: r }); setPerfil(r); if (editar) nav('/'); };
  const PASOS = [
    { t: `Hola, ${usuario.nombre.split(' ')[0]}. ¿Qué te gusta?`, c: <><Grupo titulo="Tus gustos" ops={GUSTOS} valor={r.gustos} onChange={set('gustos')} /><Grupo titulo="A quién seguís" ops={IDOLOS} valor={r.idolos} onChange={set('idolos')} libre /></> },
    { t: '¿Qué querés lograr?', c: <><Grupo titulo="Tus metas" ops={METAS} valor={r.metas} onChange={set('metas')} /><div className="grupo"><div className="lab">En tus palabras (opcional)</div><input className="input" placeholder="Tener un Lamborghini y comprarle casa a mi mamá" value={r.ambicion} onChange={(e) => set('ambicion')(e.target.value)} /></div></> },
    { t: '¿Cómo aprendés mejor?', c: <>
      <Grupo titulo="Aprendo mejor…" ops={APRENDE} valor={r.aprende} onChange={set('aprende')} />
      <Grupo titulo="Se me complica" ops={COMPLICA} valor={r.complica} onChange={set('complica')} />
      <div className="grupo"><div className="lab">Estilo de tus videos</div><SelectorEstilo conAuto valor={r.estilo} onChange={set('estilo')} /></div>
      <div className="grupo"><div className="lab">Voz</div><div className="seg"><button type="button" className={r.voz !== 'Marta' ? 'on' : ''} onClick={() => set('voz')('Andres')}>Voz masculina</button><button type="button" className={r.voz === 'Marta' ? 'on' : ''} onClick={() => set('voz')('Marta')}>Voz femenina</button></div></div>
    </> },
  ];
  const p = PASOS[i];
  return (
    <div className="onb">
      <div className="logo" style={{ marginBottom: 34 }}><span className="ico">[π]</span><span>mathtrix</span></div>
      <div className="prog">{PASOS.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}</div>
      <h1>{p.t}</h1>
      {p.c}
      <div className="onb-pie">
        <div>
          {i > 0 ? <button className="btn fant" onClick={() => setI(i - 1)}><ArrowLeft size={16} />Atrás</button> : <button className="btn fant" onClick={fin}>Saltar</button>}
          {i < PASOS.length - 1 ? <button className="btn lima grande" onClick={() => setI(i + 1)}>Seguir<ArrowRight size={17} /></button> : <button className="btn lima grande" onClick={fin}><Check size={17} />Listo</button>}
        </div>
      </div>
    </div>
  );
}
