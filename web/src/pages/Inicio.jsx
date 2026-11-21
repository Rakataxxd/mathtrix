import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Zap, Smartphone, RectangleHorizontal, Camera } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { VideoCard } from '../components/ui.jsx';
import { Generador } from '../components/Generador.jsx';
import { ModalRevisar } from '../components/RevisarFoto.jsx';

const TEMAS = ['Todo', 'Volumen', 'Velocidad', 'Porcentajes', 'Ecuaciones', 'Probabilidad', 'Fracciones', 'Área', 'Pitágoras'];
const sinTilde = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Inicio() {
  const { perfil } = useSesion();
  const [params] = useSearchParams();
  const [vids, setVids] = useState(null);
  const [tema, setTema] = useState('Todo');
  const [idea, setIdea] = useState('');
  const [formato, setFormato] = useState('horizontal');
  const [trabajo, setTrabajo] = useState(null);
  const [foto, setFoto] = useState(false);
  const q = params.get('q') || '';
  useEffect(() => { api('/feed' + (q ? '?q=' + encodeURIComponent(q) : '')).then(setVids).catch(() => setVids([])); }, [q]);
  const crear = async (e) => {
    e.preventDefault(); if (!idea.trim()) return;
    const d = await api('/generar-libre', { cuerpo: { tema: idea, formato, estilo: perfil?.estilo } }); setTrabajo(d.trabajo);
  };
  const lista = (vids || []).filter((v) => tema === 'Todo' || sinTilde(v.tema + ' ' + v.titulo).includes(sinTilde(tema).slice(0, 6)));
  const shorts = lista.filter((v) => v.formato === 'vertical');
  const arriba = lista.slice(0, 8), abajo = lista.slice(8);
  return (
    <div>
      {!q && (
        <form className="crear-barra vidrio" onSubmit={crear}>
          <Sparkles size={18} color="var(--acento)" />
          <input placeholder="¿Qué querés aprender hoy?" value={idea} onChange={(e) => setIdea(e.target.value)} />
          <div className="seg">
            <button type="button" className={formato === 'vertical' ? 'on' : ''} onClick={() => setFormato('vertical')} aria-label="Short"><Smartphone size={15} /></button>
            <button type="button" className={formato === 'horizontal' ? 'on' : ''} onClick={() => setFormato('horizontal')} aria-label="Video"><RectangleHorizontal size={15} /></button>
          </div>
          <button type="button" className="btn ico" onClick={() => setFoto(true)} aria-label="Revisar mi ejercicio con una foto" title="Revisar mi ejercicio (foto)"><Camera size={17} /></button>
          <button className="btn lima" disabled={!idea.trim()}>Crear</button>
        </form>
      )}
      {foto && <ModalRevisar onCerrar={() => setFoto(false)} />}
      <div className="pegajoso"><div className="chips">{TEMAS.map((t) => <button key={t} className={'chip' + (t === tema ? ' on' : '')} onClick={() => setTema(t)}>{t}</button>)}</div></div>
      {q && <h1 style={{ fontSize: 22, margin: '8px 0 20px' }}>Resultados para «{q}»</h1>}
      {vids === null && <div className="vacio">Cargando…</div>}
      {vids && !lista.length && <div className="vacio">Nada por aquí todavía. Escribí un tema arriba y creá el primero.</div>}
      <div className="grid" style={{ marginTop: 12 }}>{arriba.map((v) => <VideoCard key={v.id} v={v} />)}</div>
      {shorts.length > 0 && (
        <>
          <div className="seccion"><h2><Zap size={20} fill="currentColor" />Shorts</h2><Link to="/shorts" className="btn chico fant" style={{ marginLeft: 'auto' }}>Ver todo</Link></div>
          <div className="estante">{shorts.slice(0, 14).map((v) => <VideoCard key={v.id} v={v} vert />)}</div>
        </>
      )}
      {abajo.length > 0 && <div className="grid" style={{ marginTop: 40 }}>{abajo.map((v) => <VideoCard key={v.id} v={v} />)}</div>}
      {trabajo && <Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} />}
    </div>
  );
}
