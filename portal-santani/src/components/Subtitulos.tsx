import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, D, FPS} from '../config';

/** Subtítulos quemados, dentro de la zona segura (encima de la UI de Reels). */
export const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const linea = D.locucion.find((l) => t >= l.desde && t <= l.hasta);
  if (!linea) return null;
  const o = interpolate(t, [linea.desde, linea.desde + 0.12, linea.hasta - 0.12, linea.hasta], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1420, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div
        style={{
          background: 'rgba(0,0,0,.72)',
          color: C.blanco,
          fontFamily: 'Montserrat',
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.25,
          textAlign: 'center',
          padding: '12px 26px',
          borderRadius: 14,
          maxWidth: 940,
        }}
      >
        {linea.texto}
      </div>
    </div>
  );
};
