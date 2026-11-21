import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Zap, Flame, RectangleHorizontal, Smartphone } from 'lucide-react';
import { api, useSesion } from '../api.js';
import { VideoCard } from '../components/ui.jsx';
import { Generador } from '../components/Generador.jsx';
import { SelectorEstilo } from '../components/SelectorEstilo.jsx';

const TEMAS = ['Todo', 'Volumen', 'Velocidad', 'Porcentajes', 'Ecuaciones', 'Probabilidad', 'Fracciones', 'Área', 'Pitágoras', 'Funciones'];
const IDEAS = ['Probabilidad de ganar la lotería', 'Volumen de una pizza gigante', 'Teorema de Pitágoras en una cancha', 'Interés compuesto para ser millonario'];

export function Inicio() {
  const { usuario, perfil } = useSesion();
  const [estilo, setEstilo] = useState(perfil?.estilo || 'ilustrado');
  const [params, setParams] = useSearchParams();
  const [vids, setVids] = useState(null);
  const [tema, setTema] = useState('Todo');
  const [idea, setIdea] = useState('');
  const [formato, setFormato] = useState('vertical');
  const [trabajo, setTrabajo] = useState(null);
  const [err, setErr] = useState(null);
  const inp = useRef();
  const q = params.get('q') || '';

  useEffect(() => { api('/feed' + (q ? '?q=' + encodeURIComponent(q) : '')).then(setVids).catch(() => setVids([])); }, [q]);
  useEffect(() => { if (params.get('crear')) { inp.current?.focus(); setParams({}); } }, [params]);

  const crear = async (e) => {
    e?.preventDefault(); setErr(null);
    if (!idea.trim()) return inp.current?.focus();
    try { const d = await api('/generar-libre', { cuerpo: { tema: idea, formato, estilo } }); setTrabajo(d.trabajo); } catch (x) { setErr(x.message); }
  };
  const filtro = (v) => tema === 'Todo' || (v.tema + ' ' + v.titulo).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(tema.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 6));
  const lista = (vids || []).filter(filtro);
  const shorts = lista.filter((v) => v.formato === 'vertical');
  const largos = lista.filter((v) => v.formato === 'horizontal');
  return (
    <div>
      {!q && (
        <section className="hero">
          <div className="badge lima"><Sparkles size={13} />Videos personalizados con IA · cuentas exactas con sympy</div>
          <h1 style={{ marginTop: 14 }}>Pedí cualquier tema de mate y te lo explicamos con <mark>lo que te gusta</mark>, {usuario.nombre.split(' ')[0]}.</h1>
          <form className="crear" onSubmit={crear}>
            <input ref={inp} className="input" placeholder="Ej. probabilidad de ganar en el casino" value={idea} onChange={(e) => setIdea(e.target.value)} />
            <div className="pill">
              <button type="button" className={formato === 'vertical' ? 'on' : ''} onClick={() => setFormato('vertical')}><Smartphone size={16} />Short</button>
              <button type="button" className={formato === 'horizontal' ? 'on' : ''} onClick={() => setFormato('horizontal')}><RectangleHorizontal size={16} />YouTube</button>
            </div>
            <button className="btn lima" style={{ height: 50 }}><Sparkles size={17} />Generar</button>
          </form>
          <div style={{ marginTop: 14, maxWidth: 760 }}><SelectorEstilo compacto valor={estilo} onChange={setEstilo} /></div>
          <div className="chips" style={{ marginTop: 10 }}>{IDEAS.map((x) => <button key={x} className="chip" onClick={() => setIdea(x)}>{x}</button>)}</div>
          {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
          <div className="flot" style={{ fontSize: 22, lineHeight: 1.6 }}>V = 4/3·π·r³<br /><span style={{ color: 'var(--rosa)' }}>v = d ÷ t</span><br /><span style={{ color: 'var(--cian)' }}>P = 1/37</span></div>
        </section>
      )}
      {q && <h1 style={{ fontSize: 24 }}>Resultados para «{q}»</h1>}
      <div className="chips" style={{ marginTop: 22 }}>{TEMAS.map((t) => <button key={t} className={'chip' + (t === tema ? ' on' : '')} onClick={() => setTema(t)}>{t}</button>)}</div>
      {vids === null && <div className="vacio">Cargando…</div>}
      {vids && !lista.length && <div className="vacio">Todavía no hay videos de esto. ¡Generá el primero arriba!</div>}
      {shorts.length > 0 && (
        <>
          <div className="seccion"><h2><Zap color="var(--rosa)" fill="var(--rosa)" size={22} />Shorts</h2><Link to="/shorts" className="btn chico">Ver todos</Link></div>
          <div className="estante">{shorts.slice(0, 14).map((v) => <VideoCard key={v.id} v={v} vert />)}</div>
        </>
      )}
      {largos.length > 0 && (
        <>
          <div className="seccion"><h2><Flame color="var(--lima)" size={22} />Recomendado para vos</h2></div>
          <div className="grid">{largos.map((v) => <VideoCard key={v.id} v={v} mostrarMotivo />)}</div>
        </>
      )}
      {largos.length === 0 && shorts.length > 0 && (
        <>
          <div className="seccion"><h2><Flame color="var(--lima)" size={22} />Recomendado para vos</h2></div>
          <div className="grid">{shorts.slice(0, 12).map((v) => <VideoCard key={v.id} v={v} mostrarMotivo />)}</div>
        </>
      )}
      {trabajo && <Generador trabajo={trabajo} onCerrar={() => setTrabajo(null)} />}
    </div>
  );
}
