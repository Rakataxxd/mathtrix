// Selector de plantilla visual con vista previa real (el mismo componente del video).
import React from 'react';
import { Thumbnail } from '@remotion/player';
import { Check } from 'lucide-react';
import { MathtrixVideo } from '../video/MathtrixVideo.jsx';
import { ESTILOS, LISTA_ESTILOS } from '../video/estilos.jsx';

export const MUESTRA = {
  fps: 30, ancho: 1920, alto: 1080, formato: 'horizontal', paleta: 'oro', emoji: '💎', duracion: 240,
  escenas: [
    { tipo: 'gancho', i: 0, inicio: 0, duracion: 120, texto: '¿CUÁNTOS *DIAMANTES* LLEVA EN EL *CUELLO*?', emoji: '💎', extras: ['⛓️', '🤑'], narracion: '', palabras: [] },
    { tipo: 'paso', i: 1, inicio: 120, duracion: 120, expr: 'V = 4/3 · π · 0.4³', desde: 'V = 4/3 · π · r³', nota: 'Sustituimos r', narracion: '', palabras: [] },
  ],
};

export function SelectorEstilo({ valor, onChange, compacto, cuadro = 205 }) {
  if (compacto) {
    return (
      <div className="chips">
        {LISTA_ESTILOS.map((k) => (
          <button key={k} type="button" className={'chip' + (valor === k ? ' on' : '')} onClick={() => onChange(k)} title={ESTILOS[k].desc}>{ESTILOS[k].nombre}</button>
        ))}
      </div>
    );
  }
  return (
    <div className="estilos">
      {LISTA_ESTILOS.map((k) => (
        <button key={k} type="button" className={'estilo' + (valor === k ? ' on' : '')} onClick={() => onChange(k)}>
          <div className="estilo-vista">
            <Thumbnail component={MathtrixVideo} inputProps={{ tl: MUESTRA, estilo: k }} compositionWidth={1920} compositionHeight={1080} durationInFrames={240} fps={30} frameToDisplay={cuadro} style={{ width: '100%' }} acknowledgeRemotionLicense />
            {valor === k && <div className="estilo-ok"><Check size={16} strokeWidth={3} /></div>}
          </div>
          <b>{ESTILOS[k].nombre}</b>
          <span>{ESTILOS[k].desc}</span>
        </button>
      ))}
    </div>
  );
}
