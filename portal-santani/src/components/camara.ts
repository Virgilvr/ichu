import {Easing, interpolate} from 'remotion';
import {at, W, H} from '../config';

/**
 * Cámara aérea continua para todo el Reel.
 * x, y: metros (Web Mercator) relativos al centro del proyecto; y positivo = sur.
 * mpp: metros por pixel (menor = más cerca). rot: grados.
 * Los keyframes se anclan a (escena, fracción), así que cambiar duraciones en
 * datos.json reacomoda la cámara sola.
 */
type KF = {e: string; f: number; x: number; y: number; mpp: number; rot: number};

const KEYFRAMES: KF[] = [
  {e: 'gancho', f: 0, x: 2700, y: -350, mpp: 9.5, rot: 0},
  {e: 'gancho', f: 1, x: 1700, y: 50, mpp: 5.2, rot: 0},
  {e: 'ubicacion', f: 0.9, x: 450, y: 500, mpp: 2.6, rot: 0},
  {e: 'proyecto', f: 0.35, x: 0, y: 0, mpp: 0.95, rot: -20},
  {e: 'proyecto', f: 1, x: 0, y: 0, mpp: 0.66, rot: -45},
  {e: 'precio', f: 1, x: 0, y: 40, mpp: 0.6, rot: -53},
  {e: 'financiacion', f: 1, x: 90, y: -60, mpp: 0.57, rot: -45},
  {e: 'cercania', f: 0.5, x: 2650, y: -420, mpp: 6.2, rot: 0},
  {e: 'cercania', f: 1, x: 2650, y: -400, mpp: 5.8, rot: 0},
  {e: 'tour', f: 0.35, x: 0, y: 0, mpp: 0.9, rot: -45},
  {e: 'tour', f: 1, x: 0, y: 0, mpp: 0.78, rot: -45},
  {e: 'cta', f: 1, x: 0, y: 0, mpp: 1.7, rot: -25},
];

export type Cam = {x: number; y: number; mpp: number; rot: number};

export const camara = (frame: number): Cam => {
  const kf = KEYFRAMES.map((k) => ({...k, t: at(k.e, k.f)}));
  if (frame <= kf[0].t) return kf[0];
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (frame <= b.t) {
      const p = interpolate(frame, [a.t, b.t], [0, 1], {easing: Easing.inOut(Easing.cubic)});
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        mpp: Math.exp(Math.log(a.mpp) + (Math.log(b.mpp) - Math.log(a.mpp)) * p),
        rot: a.rot + (b.rot - a.rot) * p,
      };
    }
  }
  return kf[kf.length - 1];
};

/** Proyecta metros del mundo a pixeles de pantalla. */
export const proyectar = (cam: Cam) => {
  const r = (cam.rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return (p: number[]): [number, number] => {
    const dx = (p[0] - cam.x) / cam.mpp;
    const dy = (p[1] - cam.y) / cam.mpp;
    return [W / 2 + dx * cos - dy * sin, H / 2 + dx * sin + dy * cos];
  };
};
