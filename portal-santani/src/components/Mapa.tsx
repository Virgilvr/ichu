import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {at, C, D, GEO, H, SAT, W} from '../config';
import {camara, proyectar} from './camara';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Rampa 0→1→0 anclada a escenas: [entra desde, entra hasta, sale desde, sale hasta]. */
const ventana = (f: number, a: [string, number], b: [string, number], c: [string, number], d: [string, number]) =>
  interpolate(f, [at(...a), at(...b), at(...c), at(...d)], [0, 1, 1, 0], clamp);

const rampa = (f: number, a: [string, number], b: [string, number]) =>
  interpolate(f, [at(...a), at(...b)], [0, 1], clamp);

const CAPAS = ['L0', 'L1', 'L2'];

// Orden de aparición de cada línea de lote: barrido diagonal a través del proyecto
const barrido = (() => {
  const v = GEO.lotes.map((s) => (s[0][0] + s[1][0]) / 2 - (s[0][1] + s[1][1]) / 2);
  const min = Math.min(...v);
  const max = Math.max(...v);
  return v.map((x) => (x - min) / (max - min));
})();

const RUTA_PT = [729.5, 1781.3]; // punto de la Ruta 3 más cercano al proyecto (OSM)
const PERIM_PT = [-6.5, 460.4]; // punto del perímetro más cercano a la Ruta 3

const Chip: React.FC<{x: number; y: number; texto: string; o: number; color?: string; ancla?: number}> = ({x, y, texto, o, color, ancla = 50}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-${ancla}%, -130%) scale(${0.85 + 0.15 * o})`,
      opacity: o,
      background: color ?? C.verdeOscuro,
      color: C.blanco,
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: 1,
      padding: '10px 18px',
      borderRadius: 12,
      whiteSpace: 'nowrap',
      boxShadow: '0 6px 20px rgba(0,0,0,.45)',
    }}
  >
    {texto}
  </div>
);

export const Mapa: React.FC<{desenfoque?: number; oscurecer?: number; frameFijo?: number}> = ({desenfoque = 0, oscurecer = 0, frameFijo}) => {
  const actual = useCurrentFrame();
  const f = frameFijo ?? actual;
  const cam = camara(f);
  const P = proyectar(cam);
  const radioVista = (Math.hypot(W, H) / 2) * cam.mpp;

  // Una capa gruesa se omite si la vista entera cae dentro de una capa más fina
  const dentro = (n: string) => {
    const [x0, y0, x1, y1] = SAT[n].rel;
    return cam.x - radioVista > x0 && cam.x + radioVista < x1 && cam.y - radioVista > y0 && cam.y + radioVista < y1;
  };

  const path = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${P(p).map((v) => v.toFixed(1)).join(' ')}`).join('');

  // Programación de capas vectoriales
  const oPin = ventana(f, ['ubicacion', 0.1], ['ubicacion', 0.3], ['proyecto', 0.15], ['proyecto', 0.35]);
  const pRuta = rampa(f, ['ubicacion', 0.1], ['ubicacion', 0.55]);
  const oRuta = Math.max(
    ventana(f, ['ubicacion', 0.05], ['ubicacion', 0.15], ['proyecto', 0.2], ['proyecto', 0.4]),
    ventana(f, ['cercania', 0.1], ['cercania', 0.3], ['cercania', 0.95], ['tour', 0.1]),
  );
  const oDist = ventana(f, ['ubicacion', 0.45], ['ubicacion', 0.6], ['proyecto', 0.05], ['proyecto', 0.2]);
  const pPerim = rampa(f, ['proyecto', 0.05], ['proyecto', 0.4]);
  const pCalles = rampa(f, ['proyecto', 0.3], ['proyecto', 0.6]);
  const pLotes = rampa(f, ['proyecto', 0.45], ['proyecto', 0.95]);
  const oPoi = ventana(f, ['cercania', 0.25], ['cercania', 0.45], ['cercania', 0.95], ['tour', 0.1]);
  const pPoi = rampa(f, ['cercania', 0.25], ['cercania', 0.6]);
  const pulso = (Math.sin(f / 6) + 1) / 2;

  const centro = P([0, 0]);
  const kaavo = P(GEO.poi.kaavo);
  const pCentro = P(GEO.poi.centro);
  const ruta = P(RUTA_PT);
  const perimPt = P(PERIM_PT);

  return (
    <AbsoluteFill style={{background: C.verdeOscuro, overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: desenfoque ? `blur(${desenfoque}px)` : undefined, transform: desenfoque ? 'scale(1.04)' : undefined}}>
        {CAPAS.map((n, i) => {
          const finas = CAPAS.slice(i + 1);
          if (finas.some(dentro)) return null;
          const [x0, y0, x1, y1] = SAT[n].rel;
          const [sx, sy] = P([x0, y0]);
          const feather = i === 0 ? '0%' : '5%';
          const mask = `linear-gradient(to right, transparent 0, #000 ${feather}, #000 calc(100% - ${feather}), transparent 100%), linear-gradient(to bottom, transparent 0, #000 ${feather}, #000 calc(100% - ${feather}), transparent 100%)`;
          return (
            <Img
              key={n}
              src={staticFile(SAT[n].file)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: (x1 - x0) / cam.mpp,
                height: (y1 - y0) / cam.mpp,
                transformOrigin: '0 0',
                transform: `translate(${sx}px, ${sy}px) rotate(${cam.rot}deg)`,
                maskImage: mask,
                WebkitMaskImage: mask,
                maskComposite: 'intersect',
                WebkitMaskComposite: 'source-in',
                filter: 'saturate(1.12) contrast(1.06)',
              }}
            />
          );
        })}

        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ruta 3 (OSM) */}
          <g opacity={oRuta}>
            {GEO.ruta3.map((l, i) => (
              <path key={i} d={path(l)} stroke="#000" strokeOpacity={0.5 * pRuta} strokeWidth={14} fill="none" strokeLinecap="round" />
            ))}
            {GEO.ruta3.map((l, i) => (
              <path key={i} d={path(l)} stroke={C.acento} strokeWidth={8} fill="none" strokeOpacity={pRuta} strokeLinecap="round" />
            ))}
          </g>

          {/* Distancia al eje de la Ruta 3 */}
          <g opacity={oDist}>
            <line x1={perimPt[0]} y1={perimPt[1]} x2={ruta[0]} y2={ruta[1]} stroke={C.blanco} strokeWidth={4} strokeDasharray="14 10" />
            <circle cx={ruta[0]} cy={ruta[1]} r={10} fill={C.blanco} />
          </g>

          {/* Perímetro */}
          <path d={path(GEO.perimetro)} fill={C.lotes} fillOpacity={0.12 * pPerim} stroke="none" />
          <path d={path(GEO.perimetro)} fill="none" stroke={C.perimetro} strokeWidth={5} pathLength={1} strokeDasharray={`${pPerim} 1`} filter="url(#glow)" strokeLinejoin="round" />

          {/* Calles */}
          <g opacity={0.85}>
            {GEO.calles.map((s, i) => (
              <path key={i} d={path(s)} stroke={C.blanco} strokeWidth={2.2} fill="none" pathLength={1} strokeDasharray={`${pCalles} 1`} />
            ))}
          </g>

          {/* Lotes: barrido diagonal */}
          <g>
            {GEO.lotes.map((s, i) => {
              const p = Math.min(1, Math.max(0, (pLotes * 1.35 - barrido[i]) / 0.35));
              if (p <= 0) return null;
              return <path key={i} d={path(s)} stroke={C.lotes} strokeWidth={1.8} strokeOpacity={0.95} fill="none" pathLength={1} strokeDasharray={`${p} 1`} />;
            })}
          </g>

          {/* Cercanías */}
          <g opacity={oPoi}>
            <line x1={centro[0]} y1={centro[1]} x2={centro[0] + (kaavo[0] - centro[0]) * pPoi} y2={centro[1] + (kaavo[1] - centro[1]) * pPoi} stroke={C.blanco} strokeWidth={4} strokeDasharray="12 10" />
            <line x1={centro[0]} y1={centro[1]} x2={centro[0] + (pCentro[0] - centro[0]) * pPoi} y2={centro[1] + (pCentro[1] - centro[1]) * pPoi} stroke={C.blanco} strokeWidth={4} strokeDasharray="12 10" />
            <circle cx={kaavo[0]} cy={kaavo[1]} r={12 * pPoi} fill={C.acento} stroke={C.verdeOscuro} strokeWidth={4} />
            <circle cx={pCentro[0]} cy={pCentro[1]} r={12 * pPoi} fill={C.acento} stroke={C.verdeOscuro} strokeWidth={4} />
            <circle cx={centro[0]} cy={centro[1]} r={16} fill={C.verde} stroke={C.blanco} strokeWidth={5} />
          </g>

          {/* Pin del proyecto */}
          <g opacity={oPin} transform={`translate(${centro[0]} ${centro[1]})`}>
            <circle r={30 + 40 * pulso} fill="none" stroke={C.acento} strokeWidth={4} opacity={1 - pulso} />
            <path d="M0 0 C -26 -40 -34 -52 -34 -70 A 34 34 0 1 1 34 -70 C 34 -52 26 -40 0 0 Z" fill={C.verde} stroke={C.blanco} strokeWidth={5} />
            <circle cy={-70} r={12} fill={C.blanco} />
          </g>
        </svg>

        <Chip x={(perimPt[0] + ruta[0]) / 2} y={(perimPt[1] + ruta[1]) / 2 + 30} texto={D.distancias.ruta3.etiquetaMapa} o={oDist} />
        <Chip x={ruta[0]} y={ruta[1] - 20} texto="RUTA 3" o={oRuta * pRuta} color={C.verde} />
        <Chip x={kaavo[0]} y={kaavo[1] - 10} texto="KA'AVO" o={oPoi * pPoi} />
        <Chip x={pCentro[0]} y={pCentro[1] - 10} texto="CENTRO SANTANÍ" o={oPoi * pPoi} ancla={85} />
        <Chip x={centro[0]} y={centro[1] + 110} texto="PORTAL DE SANTANÍ" o={oPoi} color={C.verde} ancla={12} />
      </AbsoluteFill>

      {/* Viñeta para legibilidad + oscurecido por escena */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)'}} />
      <AbsoluteFill style={{background: C.verdeOscuro, opacity: oscurecer}} />
    </AbsoluteFill>
  );
};
