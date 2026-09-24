import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, GEO, SAT} from '../config';

/**
 * Vista aérea con inclinación 3D (v2). Dibuja el satélite + trazado del KMZ sobre un
 * "plano" más alto que la pantalla y lo inclina con perspectiva: tilt 0 = cenital,
 * tilt ~60 = cámara baja mirando hacia adelante por la calle.
 * Geometría exacta del KMZ; solo cambia el punto de vista.
 */
export type Cam3D = {x: number; y: number; mpp: number; rot: number; tilt: number};

const PW = 4600;
const PH = 5200; // el plano se extiende hacia arriba para que haya "horizonte" al inclinar
const CX = PW / 2;
const CY = PH - 960; // la cámara mira al punto que queda en el centro de la pantalla

export const Mapa3D: React.FC<{cam: Cam3D; lotes?: number; oscurecer?: number}> = ({cam, lotes = 1, oscurecer = 0}) => {
  const r = (cam.rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const P = (p: number[]): [number, number] => {
    const dx = (p[0] - cam.x) / cam.mpp;
    const dy = (p[1] - cam.y) / cam.mpp;
    return [CX + dx * cos - dy * sin, CY + dx * sin + dy * cos];
  };
  const path = (pts: number[][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${P(q).map((v) => v.toFixed(1)).join(' ')}`).join('');
  const capas = cam.mpp < 3 ? ['L1', 'L2'] : ['L0', 'L1', 'L2'];
  return (
    <AbsoluteFill style={{background: '#9fc3e6', overflow: 'hidden'}}>
      {/* cielo */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #5d98d6 0%, #a9cdef 38%, #dfeaf2 55%)'}} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - PW) / 2,
          top: 1920 - PH,
          width: PW,
          height: PH,
          transformOrigin: `${CX}px ${CY}px`,
          transform: `perspective(1100px) rotateX(${cam.tilt}deg)`,
          overflow: 'hidden',
        }}
      >
        {capas.map((n) => {
          const [x0, y0, x1, y1] = SAT[n].rel;
          const [sx, sy] = P([x0, y0]);
          return (
            <Img
              key={n}
              src={staticFile(SAT[n].file)}
              style={{position: 'absolute', left: 0, top: 0, width: (x1 - x0) / cam.mpp, height: (y1 - y0) / cam.mpp, transformOrigin: '0 0', transform: `translate(${sx}px, ${sy}px) rotate(${cam.rot}deg)`, filter: 'saturate(1.15) contrast(1.05)'}}
            />
          );
        })}
        <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
          <path d={path(GEO.perimetro)} fill={C.lotes} fillOpacity={0.1} stroke="#fff" strokeWidth={5} />
          {GEO.calles.map((s, i) => (
            <path key={`c${i}`} d={path(s)} stroke="#fff" strokeOpacity={0.85} strokeWidth={Math.max(1.5, 3 / Math.sqrt(cam.mpp))} fill="none" />
          ))}
          {GEO.lotes.map((s, i) => (
            <path key={`l${i}`} d={path(s)} stroke={C.lotes} strokeOpacity={0.9 * lotes} strokeWidth={Math.max(1.2, 2.2 / Math.sqrt(cam.mpp))} fill="none" />
          ))}
        </svg>
        {/* niebla de distancia para disimular la baja resolución del satélite al inclinar */}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(223,234,242,${Math.min(1, cam.tilt / 55)}) 0%, rgba(223,234,242,0) 45%)`}} />
      </div>
      <AbsoluteFill style={{background: C.verdeOscuro, opacity: oscurecer}} />
    </AbsoluteFill>
  );
};
