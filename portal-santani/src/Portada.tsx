import React from 'react';
import {AbsoluteFill} from 'remotion';
import {at, C, D, esc} from './config';
import {Mapa} from './components/Mapa';

/** Portada: vista aérea con el trazado completo + datos clave. */
export const Portada: React.FC<{feed?: boolean}> = ({feed}) => {
  const [cuotas, monto] = esc('precio').textos;
  const base: React.CSSProperties = {whiteSpace: 'pre-line', position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: 'Montserrat', color: C.blanco, textShadow: '0 4px 18px rgba(0,0,0,.7)'};
  const y0 = feed ? 0 : 285;
  return (
    <AbsoluteFill style={{background: C.verdeOscuro, overflow: 'hidden'}}>
      <AbsoluteFill style={{top: feed ? -285 : 0, height: 1920, bottom: 'auto'}}>
        <Mapa oscurecer={0.12} frameFijo={Math.round(at('proyecto', 1))} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,42,27,.85) 0%, rgba(6,42,27,0) 32%, rgba(6,42,27,0) 62%, rgba(6,42,27,.9) 100%)'}} />
      <div style={{...base, top: y0 + 30, fontWeight: 900, fontSize: 108, lineHeight: 1}}>{D.proyecto.replace(' DE ', ' DE\n')}</div>
      <div style={{...base, top: y0 + 265, fontWeight: 800, fontSize: 44, color: C.acento}}>650 LOTES · DESDE 360 m²</div>
      <div style={{...base, top: y0 + (feed ? 1010 : 1060), fontWeight: 800, fontSize: 56}}>{cuotas}</div>
      <div style={{...base, top: y0 + (feed ? 1070 : 1125), fontWeight: 900, fontSize: 130, color: C.acento}}>{monto}</div>
    </AbsoluteFill>
  );
};
