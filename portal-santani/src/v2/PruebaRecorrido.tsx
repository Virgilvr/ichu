import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../config';
import {Cam3D, Mapa3D} from './Mapa3D';

/**
 * Prueba visual v2 (≈15,5 s): entrada real → descenso aéreo sobre el KMZ → recorrido por
 * una calle (video real) → estacas y lotes (foto real) → giro en la esquina y subida.
 * Composición independiente: no toca el Reel anterior.
 */
export const FPS2 = 30;
const s = (x: number) => Math.round(x * FPS2);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Calle real del KMZ (eje calculado entre dos bordes de manzana paralelos, 16 m de ancho real)
const U = [0.678, -0.735]; // dirección de la calle (hacia el NE)
const C0 = [18.8, 11.9]; // centro de la calle
const P0 = [C0[0] - U[0] * 105, C0[1] - U[1] * 105];
const P1 = [C0[0] + U[0] * 105, C0[1] + U[1] * 105];
const RUMBO = -42.7; // rotación que deja la calle "hacia adelante" en pantalla

type KF = Cam3D & {t: number};
const lerp = (a: KF, b: KF, f: number): Cam3D => {
  const p = interpolate(f, [a.t, b.t], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    mpp: Math.exp(Math.log(a.mpp) + (Math.log(b.mpp) - Math.log(a.mpp)) * p),
    rot: a.rot + (b.rot - a.rot) * p,
    tilt: a.tilt + (b.tilt - a.tilt) * p,
  };
};
const recorrer = (kfs: KF[], f: number) => {
  for (let i = 0; i < kfs.length - 1; i++) if (f <= kfs[i + 1].t) return lerp(kfs[i], kfs[i + 1], f);
  return kfs[kfs.length - 1];
};
const en = (p: number[], d: number) => ({x: p[0] + U[0] * d, y: p[1] + U[1] * d});

// Descenso: de la vista cenital del loteamiento a la altura de la calle, y avance
const DESCENSO: KF[] = [
  {t: 0, x: 0, y: 0, mpp: 1.25, rot: -45, tilt: 0},
  {t: s(2.2), ...en(P0, 10), mpp: 0.3, rot: RUMBO, tilt: 58},
  {t: s(3.5), ...en(P0, 70), mpp: 0.24, rot: RUMBO, tilt: 64},
];
// Subida: avanza hasta la esquina, gira 90° y se eleva mostrando todo el proyecto
const SUBIDA: KF[] = [
  {t: 0, ...en(P1, -60), mpp: 0.24, rot: RUMBO, tilt: 64},
  {t: s(0.9), ...en(P1, 0), mpp: 0.24, rot: RUMBO, tilt: 64},
  {t: s(1.6), x: P1[0], y: P1[1], mpp: 0.26, rot: RUMBO - 90, tilt: 60},
  {t: s(3.2), x: 0, y: 0, mpp: 0.78, rot: -45, tilt: 0},
];

const Sub: React.FC<{texto: string; dur: number}> = ({texto, dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 5, dur - 5, dur], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1442, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{background: 'rgba(0,0,0,.72)', color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, lineHeight: 1.25, textAlign: 'center', padding: '12px 26px', borderRadius: 14, maxWidth: 940}}>
        {texto}
      </div>
    </div>
  );
};

/** Clip real (vertical, baja resolución de WhatsApp) llevado a 1080×1920 con leve movimiento. */
const Clip: React.FC<{src: string; desde: number; dur: number; zoom?: [number, number]}> = ({src, desde, dur, zoom = [1.04, 1.12]}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, clamp);
  const blur = interpolate(f, [0, 5], [10, 0], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={staticFile(src)} startFrom={s(desde)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: `blur(${blur}px) saturate(1.12) contrast(1.06)`}} />
    </AbsoluteFill>
  );
};

const Foto: React.FC<{src: string; dur: number; desde?: [number, number]}> = ({src, dur, desde = [1.02, 1.14]}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], desde, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateY(${(z - 1) * -120}px)`}} />
    </AbsoluteFill>
  );
};

const Descenso: React.FC = () => {
  const f = useCurrentFrame();
  const salida = interpolate(f, [s(3.2), s(3.5)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{filter: `blur(${salida * 12}px)`, transform: `scale(${1 + salida * 0.15})`}}>
      <Mapa3D cam={recorrer(DESCENSO, f)} />
    </AbsoluteFill>
  );
};

const Subida: React.FC = () => {
  const f = useCurrentFrame();
  const entrada = interpolate(f, [0, 5], [12, 0], clamp);
  return (
    <AbsoluteFill style={{filter: `blur(${entrada}px)`}}>
      <Mapa3D cam={recorrer(SUBIDA, f)} />
    </AbsoluteFill>
  );
};

const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [s(1.2), s(1.6), s(3.2), s(3.5)], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: o, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 92, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,.7)', lineHeight: 1}}>
      PORTAL DE<br />SANTANÍ
    </div>
  );
};

export const DUR_PRUEBA = s(15.7);

export const PruebaRecorrido: React.FC = () => (
  <AbsoluteFill style={{background: C.verdeOscuro}}>
    {/* 1 · Entrada real (portal en obra con el cartel de Trebol) */}
    <Sequence from={0} durationInFrames={s(3.5)}>
      <Clip src="v2/entrada.mp4" desde={9.5} dur={s(3.5)} zoom={[1.0, 1.1]} />
      <Titulo />
    </Sequence>
    {/* 2 · Descenso aéreo sobre el KMZ hasta una calle real */}
    <Sequence from={s(3.5)} durationInFrames={s(3.5)}>
      <Descenso />
    </Sequence>
    {/* 3 · Recorrido real por una calle recién abierta */}
    <Sequence from={s(7.0)} durationInFrames={s(4.0)}>
      <Clip src="v2/calles.mp4" desde={14.5} dur={s(4.0)} />
    </Sequence>
    {/* 4 · Estacas y lotes (foto real) */}
    <Sequence from={s(11.0)} durationInFrames={s(1.5)}>
      <Foto src="v2/foto5.jpg" dur={s(1.5)} />
    </Sequence>
    {/* 5 · Giro en la esquina y subida para ver todo el loteamiento */}
    <Sequence from={s(12.5)} durationInFrames={s(3.2)}>
      <Subida />
    </Sequence>

    {/* Voz G + subtítulos */}
    <Sequence from={s(0.3)} durationInFrames={s(3.45)}>
      <Audio src={staticFile('v2/voz_01.wav')} />
      <Sub texto="Y acá está… ¡Portal de Santaní!" dur={s(3.45)} />
    </Sequence>
    <Sequence from={s(7.1)} durationInFrames={s(5.8)}>
      <Audio src={staticFile('v2/voz_02.wav')} />
      <Sub texto="Mirá sus calles… sus lotes, uno al lado del otro." dur={s(5.8)} />
    </Sequence>
    {/* Música provisoria (la pista original del Reel anterior); la música nueva va en el render final */}
    <Audio src={staticFile('audio/musica.wav')} startFrom={s(8)} volume={(f) => ((f > s(0.2) && f < s(3.9)) || (f > s(7.0) && f < s(13.0)) ? 0.22 : 0.75)} />
  </AbsoluteFill>
);
