// "Revisar mi ejercicio": el alumno sube una foto (o PDF) de lo que estaba resolviendo
// y Mathtrix le arma un video desde donde se quedo: que hizo bien, donde se equivoco y que le falta.
import React, { useRef, useState } from 'react';
import { Camera, ImageUp, ScanSearch, X } from 'lucide-react';
import { api } from '../api.js';
import { Generador } from './Generador.jsx';

export function RevisarFoto({ leccionId, onTrabajo, compacto }) {
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [err, setErr] = useState(null);
  const input = useRef(null);
  const elegir = (f) => {
    if (!f) return;
    setErr(null); setArchivo(f);
    setVista(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };
  const enviar = async () => {
    if (!archivo) return input.current?.click();
    setEnviando(true); setErr(null);
    const form = new FormData();
    form.append('foto', archivo);
    if (leccionId) form.append('leccion_id', leccionId);
    if (nota.trim()) form.append('nota', nota.trim());
    try { const d = await api('/revisar', { form }); onTrabajo(d.trabajo); } catch (x) { setErr(x.message); setEnviando(false); }
  };
  return (
    <div className="revisar">
      <input ref={input} type="file" accept="image/*,application/pdf" hidden onChange={(e) => elegir(e.target.files?.[0])} />
      {!archivo ? (
        <button type="button" className="soltar revisar-zona" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); elegir(e.dataTransfer.files?.[0]); }}>
          <Camera size={30} strokeWidth={1.6} />
          <b>Tomá una foto de tu hoja</b>
          <span>o subí una imagen / PDF de lo que estabas resolviendo</span>
        </button>
      ) : (
        <div className="revisar-vista">
          {vista ? <img src={vista} alt="Tu ejercicio" /> : <div className="revisar-pdf"><ImageUp size={26} />{archivo.name}</div>}
          <button type="button" className="btn chico ico" onClick={() => { setArchivo(null); setVista(null); }} aria-label="Quitar"><X size={16} /></button>
        </div>
      )}
      {!compacto && <input className="input" style={{ marginTop: 12 }} placeholder="¿Qué estabas resolviendo? (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />}
      <button type="button" className="btn lima grande" style={{ width: '100%', marginTop: 12 }} disabled={enviando} onClick={enviar}>
        <ScanSearch size={18} />{enviando ? 'Subiendo…' : archivo ? 'Revisar y hacer mi video' : 'Elegir foto'}
      </button>
      <div className="dim" style={{ fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>Te digo qué hiciste bien, dónde se torció y qué te falta, en un video solo para vos.</div>
      {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
    </div>
  );
}

/** Modal con el formulario; al subir la foto pasa directo al progreso (con el analisis paso a paso). */
export function ModalRevisar({ leccionId, onCerrar }) {
  const [trabajo, setTrabajo] = useState(null);
  if (trabajo) return <Generador trabajo={trabajo} onCerrar={onCerrar} />;
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="caja">
        <div className="entre" style={{ marginBottom: 14 }}><h2>Revisar mi ejercicio</h2><button type="button" className="btn chico ico fant" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button></div>
        <RevisarFoto leccionId={leccionId} onTrabajo={setTrabajo} />
      </div>
    </div>
  );
}
