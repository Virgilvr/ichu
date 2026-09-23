import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, D, esc, FPS} from '../config';
import {Titular, miles, useContador} from '../components/Texto';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const s = (seg: number) => Math.round(seg * FPS);

// 1 · GANCHO
export const Gancho: React.FC = () => {
  const [t1, t2] = esc('gancho').textos;
  const corte = s(1.75);
  const [a, b] = t2.split(/ (?=PORTAL)/);
  return (
    <AbsoluteFill>
      <Titular entra={0} sale={corte} y={640} size={104} desde="zoom">
        {t1}
      </Titular>
      <Titular entra={corte} y={600} size={62} peso={800} color={C.acento} desde="abajo">
        {a}
      </Titular>
      <Titular entra={corte + 4} y={690} size={132} desde="zoom">
        {b}
      </Titular>
    </AbsoluteFill>
  );
};

// 2 · UBICACIÓN
export const Ubicacion: React.FC = () => {
  const [nombre, ruta] = esc('ubicacion').textos;
  return (
    <AbsoluteFill>
      <Titular entra={4} y={290} size={72} fondo={C.verde} ancho={1000}>
        {nombre}
      </Titular>
      <Titular entra={s(1.9)} y={420} size={50} peso={800} ancho={1000} fondo={C.acento} color={C.verdeOscuro}>
        {ruta}
      </Titular>
    </AbsoluteFill>
  );
};

// 3 · PROYECTO
export const Proyecto: React.FC = () => {
  const [lotes, sup] = esc('proyecto').textos;
  const nLotes = parseInt(lotes, 10);
  const n = useContador(nLotes, s(0.6), s(2.4));
  return (
    <AbsoluteFill>
      <Titular entra={s(0.4)} y={270} size={190} color={C.acento}>
        {Math.round(n)}
      </Titular>
      <Titular entra={s(0.6)} y={460} size={80}>
        {lotes.replace(/^\d+\s*/, '')}
      </Titular>
      <Titular entra={s(2.8)} y={1250} size={74} fondo={C.blanco} color={C.verdeOscuro}>
        {sup}
      </Titular>
    </AbsoluteFill>
  );
};

// 4 · PRECIO (momento principal)
export const Precio: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [cuotas, monto, aclaracion] = esc('precio').textos;
  const valor = parseInt(monto.replace(/\D/g, ''), 10);
  const n = useContador(valor, s(0.45), s(1.4));
  const golpe = spring({frame: f - s(1.4), fps, config: {damping: 9, stiffness: 220}});
  const brillo = interpolate(f, [s(1.4), s(2.2)], [-1, 2], clamp);
  return (
    <AbsoluteFill>
      <Titular entra={0} y={560} size={84} peso={800}>
        {cuotas}
      </Titular>
      <Titular entra={s(0.3)} y={690} size={150} color={C.acento} desde="zoom" ancho={1040} style={{textShadow: 'none', whiteSpace: 'nowrap', transform: `scale(${1 + 0.08 * golpe * (1 - golpe) * 4})`}}>
        <span
          style={{
            backgroundImage: `linear-gradient(100deg, ${C.acento} ${brillo * 50 - 20}%, #fff ${brillo * 50}%, ${C.acento} ${brillo * 50 + 20}%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.55))',
          }}
        >
          Gs. {miles(n)}
        </span>
      </Titular>
      <Titular entra={s(2.2)} y={900} size={40} peso={600} ancho={860}>
        {aclaracion}
      </Titular>
    </AbsoluteFill>
  );
};

// 5 · FINANCIACIÓN
const Tarjeta: React.FC<{entra: number; y: number; arriba: string; grande: string; abajo?: string; lado: 1 | -1}> = ({entra, y, arriba, grande, abajo, lado}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - entra, fps, config: {damping: 15, stiffness: 150}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: y,
        padding: '34px 30px',
        borderRadius: 32,
        background: 'rgba(6,42,27,.86)',
        border: `3px solid ${C.acento}`,
        textAlign: 'center',
        fontFamily: 'Montserrat',
        color: C.blanco,
        opacity: p,
        transform: `translate(${(1 - p) * 500 * lado}px, ${(1 - p) * 120}px) rotate(${(1 - p) * 8 * lado}deg)`,
        boxShadow: '0 20px 50px rgba(0,0,0,.45)',
      }}
    >
      <div style={{fontWeight: 800, fontSize: 46, letterSpacing: 2}}>{arriba}</div>
      <div style={{fontWeight: 900, fontSize: 112, lineHeight: 1.05, color: C.acento}}>{grande}</div>
      {abajo ? <div style={{fontWeight: 800, fontSize: 52}}>{abajo}</div> : null}
    </div>
  );
};

export const Financiacion: React.FC = () => {
  const [plazo, contado] = esc('financiacion').textos;
  const m = plazo.match(/^(.*?)(\d+)\s+(.*)$/);
  const w = contado.split(' ');
  return (
    <AbsoluteFill>
      <Tarjeta entra={2} y={400} arriba={m ? m[1].trim() : ''} grande={m ? m[2] : plazo} abajo={m ? m[3] : undefined} lado={-1} />
      <Tarjeta entra={s(1.2)} y={860} arriba={w.length > 1 ? w[0] : ''} grande={w.length > 1 ? w.slice(1).join(' ') : contado} lado={1} />
    </AbsoluteFill>
  );
};

// 6 · CERCANÍA
export const Cercania: React.FC = () => {
  const [kaavo, centro] = esc('cercania').textos;
  return (
    <AbsoluteFill>
      <Titular entra={s(0.9)} y={290} size={50} peso={800} fondo={C.verde} ancho={1000}>
        {kaavo}
      </Titular>
      <Titular entra={s(1.5)} y={400} size={50} peso={800} fondo={C.blanco} color={C.verdeOscuro} ancho={1000}>
        {centro}
      </Titular>
    </AbsoluteFill>
  );
};

// 8 · CTA
const Burbuja: React.FC<{entra: number}> = ({entra}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - entra, fps, config: {damping: 12, stiffness: 160}});
  const palabra = D.palabraClave;
  const letras = Math.floor(interpolate(f, [entra + 6, entra + 6 + palabra.length * 3], [0, palabra.length], clamp));
  const cursor = Math.floor(f / 8) % 2 === 0 && letras < palabra.length;
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        right: 150,
        top: 760,
        height: 210,
        borderRadius: '48px 48px 12px 48px',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 132,
        color: C.blanco,
        letterSpacing: 2,
        transform: `scale(${p})`,
        opacity: Math.min(1, p * 1.5),
        boxShadow: '0 24px 60px rgba(0,0,0,.45)',
        textShadow: '0 3px 10px rgba(0,0,0,.25)',
      }}
    >
      {palabra.slice(0, letras)}
      <span style={{opacity: cursor ? 1 : 0}}>|</span>
    </div>
  );
};

export const Cta: React.FC = () => {
  const [pregunta, escribinos, , porWa, envio] = esc('cta').textos;
  const t2 = s(1.7);
  return (
    <AbsoluteFill>
      <Titular entra={0} sale={t2} y={620} size={96} desde="zoom">
        {pregunta}
      </Titular>
      <Titular entra={t2} y={400} size={34} peso={700} color="rgba(255,255,255,.85)">
        {D.marca.logo ? <Img src={staticFile(D.marca.logo)} style={{height: 110, objectFit: 'contain'}} /> : D.loteadora.toUpperCase()}
      </Titular>
      <Titular entra={t2} y={560} size={110}>
        {escribinos}
      </Titular>
      <Burbuja entra={t2 + 6} />
      <Titular entra={t2 + 26} y={1010} size={84} color="#25D366" style={{textShadow: '0 4px 14px rgba(0,0,0,.7)'}}>
        {porWa}
      </Titular>
      <Titular entra={t2 + 40} y={1130} size={44} peso={600} ancho={880}>
        {envio}
      </Titular>
      <Titular entra={t2 + 52} y={1290} size={58} peso={900} fondo={C.blanco} color={C.verdeOscuro}>
        {D.whatsapp}
      </Titular>
    </AbsoluteFill>
  );
};
