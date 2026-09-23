import datos from './datos.json';
import proyecto from '../public/geo/proyecto.json';
import sat from '../public/sat/sat.json';

export const D = datos;
export const GEO = proyecto as unknown as {
  perimetro: number[][];
  calles: number[][][];
  lotes: number[][][];
  loteDemo: number[][];
  ruta3: number[][][];
  poi: {centro: number[]; kaavo: number[]};
};
export const SAT = sat as unknown as Record<string, {file: string; rel: number[]}>;

export const FPS = datos.fps;
export const W = 1080;
export const H = 1920;
export const C = datos.marca;

// Zona segura Reels: textos clave entre estos límites verticales
export const SAFE = {top: 250, bottom: 1450, side: 90};

const resolver = (t: string) => {
  if (t.startsWith('@')) {
    const k = t.slice(1) as keyof typeof datos.distancias;
    return datos.distancias[k].texto;
  }
  return t;
};

export type Escena = {id: string; from: number; dur: number; textos: string[]};

let acc = 0;
export const ESCENAS: Escena[] = datos.escenas.map((e) => {
  const from = acc;
  const dur = Math.round(e.dur * FPS);
  acc += dur;
  return {id: e.id, from, dur, textos: e.textos.map(resolver)};
});
export const TOTAL = acc;

export const esc = (id: string) => {
  const e = ESCENAS.find((x) => x.id === id);
  if (!e) throw new Error(`Escena desconocida: ${id}`);
  return e;
};

/** Frame absoluto a partir de (escena, fracción 0..1). */
export const at = (id: string, frac: number) => {
  const e = esc(id);
  return e.from + frac * e.dur;
};
