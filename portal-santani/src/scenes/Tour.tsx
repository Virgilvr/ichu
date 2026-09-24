import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, D, esc, FPS, GEO, SAT} from '../config';
import {Titular} from '../components/Texto';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const s = (seg: number) => Math.round(seg * FPS);

// Pantalla del teléfono
const PW = 560;
const PH = 1080;
const MAPA_H = 700;

// Centro de la celda de lote usada para la demo (geometría real del KMZ)
const lote = GEO.loteDemo;
const lx = lote.reduce((a, p) => a + p[0], 0) / lote.length;
const ly = lote.reduce((a, p) => a + p[1], 0) / lote.length;

/**
 * Mapa dentro del teléfono: imagen satelital + trazos del KMZ, con paneo y zoom
 * hacia el lote demo. Rotado -45° igual que el resto del Reel.
 */
const MiniMapa: React.FC<{p: number; toque: number}> = ({p, toque}) => {
  const mpp = Math.exp(interpolate(p, [0, 1], [Math.log(1.7), Math.log(0.42)]));
  const cx = interpolate(p, [0, 1], [0, lx]);
  const cy = interpolate(p, [0, 1], [0, ly]);
  const rot = -45;
  const r = (rot * Math.PI) / 180;
  const P = (q: number[]): [number, number] => {
    const dx = (q[0] - cx) / mpp;
    const dy = (q[1] - cy) / mpp;
    return [PW / 2 + dx * Math.cos(r) - dy * Math.sin(r), MAPA_H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  const d = (pts: number[][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${P(q).map((v) => v.toFixed(1)).join(' ')}`).join('');
  const [x0, y0, x1, y1] = SAT.L2.rel;
  const [sx, sy] = P([x0, y0]);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: MAPA_H, overflow: 'hidden', background: '#1b2b20'}}>
      <Img
        src={staticFile(SAT.L2.file)}
        style={{position: 'absolute', left: 0, top: 0, width: (x1 - x0) / mpp, height: (y1 - y0) / mpp, transformOrigin: '0 0', transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg)`}}
      />
      <svg width={PW} height={MAPA_H} style={{position: 'absolute', inset: 0}}>
        <path d={d(GEO.perimetro)} fill="rgba(247,201,72,.10)" stroke="#fff" strokeWidth={3} />
        {GEO.calles.map((c, i) => (
          <path key={`c${i}`} d={d(c)} stroke="#fff" strokeOpacity={0.8} strokeWidth={1.5} fill="none" />
        ))}
        {GEO.lotes.map((c, i) => (
          <path key={`l${i}`} d={d(c)} stroke={C.lotes} strokeWidth={1.2} fill="none" />
        ))}
        <path d={d(lote)} fill={C.acento} fillOpacity={0.85 * toque} stroke="#fff" strokeWidth={3 * toque} />
      </svg>
    </div>
  );
};

const Ficha: React.FC<{p: number; foco: number}> = ({p, foco}) => {
  const campos = D.tour.campos;
  const resaltar = D.tour.resaltar;
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        borderRadius: 26,
        background: '#fff',
        padding: '18px 22px 20px',
        fontFamily: 'Montserrat',
        transform: `translateY(${(1 - p) * 110}%)`,
        boxShadow: '0 -10px 40px rgba(0,0,0,.35)',
      }}
    >
      {campos.map((c) => {
        const idx = resaltar.indexOf(c);
        const activo = idx >= 0 && foco >= idx && foco < idx + 1;
        const visto = idx >= 0 && foco >= idx;
        return (
          <div
            key={c}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              margin: '2px 0',
              borderRadius: 12,
              background: activo ? C.acento : 'transparent',
              transform: activo ? 'scale(1.04)' : 'none',
              transition: 'none',
            }}
          >
            <span style={{fontWeight: 800, fontSize: 25, color: visto ? C.verdeOscuro : '#555', letterSpacing: 1}}>{c}</span>
            {/* Valores deliberadamente difuminados: la demo enseña dónde mirar, no un precio */}
            <span style={{width: 170, height: 22, borderRadius: 11, background: visto ? '#8aa596' : '#cfd8d3', filter: 'blur(3px)'}} />
          </div>
        );
      })}
    </div>
  );
};

export const Tour: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [titulo, aclaracion] = esc('tour').textos;
  const dur = esc('tour').dur;

  const entra = spring({frame: f, fps, config: {damping: 16, stiffness: 140}});
  const pMapa = interpolate(f, [s(0.4), s(1.6)], [0, 1], {...clamp, easing: (t) => t * t * (3 - 2 * t)});
  const tTap = s(1.75);
  const toque = interpolate(f, [tTap, tTap + 5], [0, 1], clamp);
  const pFicha = spring({frame: f - (tTap + 4), fps, config: {damping: 15, stiffness: 160}});
  const foco = interpolate(f, [s(2.4), s(4.4)], [0, D.tour.resaltar.length], clamp);
  const pWa = interpolate(f, [s(4.4), dur], [0, 1], clamp);
  const latido = 1 + 0.08 * Math.max(0, Math.sin(f / 3)) * (pWa > 0 ? 1 : 0);

  // Dedo: baja hacia el centro del mini mapa (donde queda el lote) y toca
  const dedoY = interpolate(f, [s(1.1), tTap, tTap + 6], [MAPA_H + 120, MAPA_H / 2 + 20, MAPA_H / 2 + 30], clamp);
  const dedoO = interpolate(f, [s(1.1), s(1.3), tTap + 12, tTap + 18], [0, 1, 1, 0], clamp);
  const onda = interpolate(f, [tTap, tTap + 14], [0, 1], clamp);

  const grab = D.tour.grabacion;

  return (
    <AbsoluteFill>
      <Titular entra={2} y={250} size={54} fondo={C.verde} ancho={1000}>
        {titulo}
      </Titular>
      <div
        style={{
          position: 'absolute',
          left: 540 - PW / 2 - 18,
          top: 390,
          width: PW + 36,
          height: PH + 36,
          borderRadius: 64,
          background: '#0b0f0d',
          boxShadow: '0 40px 90px rgba(0,0,0,.6)',
          transform: `translateY(${(1 - entra) * 900}px) scale(0.82)`,
          transformOrigin: '50% 0',
        }}
      >
        <div style={{position: 'absolute', left: 18, top: 18, width: PW, height: PH, borderRadius: 48, overflow: 'hidden', background: '#f2f5f3'}}>
          {grab ? (
            <OffthreadVideo src={staticFile(grab)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 80, background: C.verdeOscuro, color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, letterSpacing: 1}}>
                TOUR VIRTUAL · {D.proyecto}
              </div>
              <div style={{position: 'absolute', left: 0, top: 80, width: PW, height: MAPA_H}}>
                <MiniMapa p={pMapa} toque={toque} />
                <div style={{position: 'absolute', left: PW / 2 - 60 * onda, top: MAPA_H / 2 - 60 * onda, width: 120 * onda, height: 120 * onda, borderRadius: '50%', border: '4px solid #fff', opacity: 1 - onda}} />
                <svg width={70} height={90} viewBox="0 0 70 90" style={{position: 'absolute', left: PW / 2 - 14, top: dedoY, opacity: dedoO}}>
                  <path d="M22 4c5 0 8 4 8 8v26l4-1c4-1 7 1 8 4l1-1c4-1 7 1 8 4 4-1 8 2 8 6v18c0 14-10 24-24 24h-4c-10 0-17-6-21-14L2 52c-2-4 0-8 4-9 3-1 6 1 8 3l0-34c0-4 3-8 8-8z" fill="#fff" stroke="#222" strokeWidth={3} />
                </svg>
              </div>
              <Ficha p={pFicha} foco={foco} />
            </>
          )}
        </div>
        {/* Botón WhatsApp de la ficha */}
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: -46,
            height: 92,
            borderRadius: 46,
            background: '#25D366',
            color: '#fff',
            fontFamily: 'Montserrat',
            fontWeight: 900,
            fontSize: 28,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pWa > 0 ? 1 : 0,
            transform: `scale(${pWa > 0 ? latido : 0.6})`,
            boxShadow: '0 12px 30px rgba(0,0,0,.45)',
          }}
        >
          CONSULTAR POR WHATSAPP
        </div>
      </div>
      <Titular entra={s(0.8)} y={1358} size={27} peso={600} ancho={900}>
        {aclaracion}
      </Titular>
    </AbsoluteFill>
  );
};
