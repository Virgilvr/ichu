import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../config';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Props = {
  children: React.ReactNode;
  /** frame (relativo a la escena) en que entra */
  entra?: number;
  /** frame en que sale; undefined = no sale */
  sale?: number;
  y: number;
  size?: number;
  color?: string;
  peso?: number;
  desde?: 'abajo' | 'arriba' | 'zoom';
  fondo?: string;
  ancho?: number;
  style?: React.CSSProperties;
};

/** Titular con entrada por resorte y salida rápida, centrado horizontalmente. */
export const Titular: React.FC<Props> = ({children, entra = 0, sale, y, size = 96, color = C.blanco, peso = 900, desde = 'abajo', fondo, ancho = 900, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - entra, fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
  const out = sale === undefined ? 0 : interpolate(f, [sale - 6, sale], [0, 1], clamp);
  const o = Math.min(1, s * 1.4) * (1 - out);
  if (o <= 0.001) return null;
  const t =
    desde === 'zoom'
      ? `scale(${1.35 - 0.35 * s + 0.1 * out})`
      : `translateY(${(1 - s) * (desde === 'abajo' ? 70 : -70) - out * 30}px)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: y,
        width: ancho,
        marginLeft: -ancho / 2,
        textAlign: 'center',
        fontFamily: 'Montserrat',
        fontWeight: peso,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -1,
        color,
        opacity: o,
        transform: t,
        textShadow: fondo ? undefined : '0 4px 18px rgba(0,0,0,.65), 0 2px 4px rgba(0,0,0,.6)',
        ...style,
      }}
    >
      {fondo ? (
        <span
          style={{
            display: 'inline-block',
            lineHeight: 1.12,
            background: fondo,
            padding: '14px 28px',
            borderRadius: 18,
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </div>
  );
};

/** Formatea con separador de miles paraguayo (punto). */
export const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Contador animado 0 → valor. */
export const useContador = (valor: number, desde: number, hasta: number) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [desde, hasta], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  return valor * p;
};
