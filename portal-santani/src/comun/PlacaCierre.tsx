import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Placa final genérica (estilo aprobado). Todos los datos llegan por props desde
 * proyectos/<slug>/proyecto.json; no hay ningún asesor, número ni logo fijo en este archivo.
 *   <proyecto> · ¿QUERÉS CONOCER LOS LOTES DISPONIBLES? · <asesor> · <rol> · ESCRIBINOS POR WHATSAPP · <whatsapp>
 * `fondo` es opcional (p. ej. satélite del propio proyecto). `tWhatsapp`: segundo local en que aparece el botón.
 */
export type ContactoCierre = {proyecto: string; asesor: string; rol?: string; whatsapp: string};

const VERDE_OSCURO = '#062A1B';
const ACENTO = '#F7C948';

const partirNombre = (n: string): [string, string] => {
  const w = n.toUpperCase().split(' ');
  if (w.length < 2) return ['', w[0]];
  const corte = Math.ceil(w.length / 2);
  return [w.slice(0, corte).join(' '), w.slice(corte).join(' ')];
};

export const PlacaCierre: React.FC<ContactoCierre & {tWhatsapp?: number; fondo?: React.ReactNode}> = ({proyecto, asesor, rol = 'Asesor Inmobiliario', whatsapp, tWhatsapp = 3.5, fondo}) => {
  if (!proyecto || !asesor || !whatsapp) throw new Error('PlacaCierre: faltan datos de contacto del proyecto (proyecto, asesor, whatsapp).');
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = (t: number) => spring({frame: f - Math.round(t * fps), fps, config: {damping: 16, stiffness: 120}});
  const a = sp(0.1);
  const b = sp(0.35);
  const e = sp(0.9);
  const c = sp(tWhatsapp);
  const d = sp(tWhatsapp + 0.3);
  const [l1, l2] = partirNombre(proyecto);
  return (
    <AbsoluteFill style={{opacity: interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'})}}>
      <AbsoluteFill style={{background: VERDE_OSCURO, overflow: 'hidden'}}>
        {fondo}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(6,42,27,.72) 0%, rgba(6,42,27,.93) 70%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 40, right: 40, top: 250, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 92, color: '#fff', lineHeight: 1.02, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, textShadow: '0 6px 24px rgba(0,0,0,.5)'}}>
        {l1 ? <>{l1}<br /></> : null}
        <span style={{color: ACENTO}}>{l2}</span>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 500, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 48, color: '#fff', lineHeight: 1.2, opacity: b, transform: `translateY(${(1 - b) * 40}px)`}}>
        ¿QUERÉS CONOCER LOS LOTES DISPONIBLES?
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontFamily: 'Montserrat', opacity: e, transform: `translateY(${(1 - e) * 30}px)`}}>
        <div style={{width: 120, height: 4, background: ACENTO, borderRadius: 2, margin: '0 auto 26px'}} />
        <div style={{fontWeight: 800, fontSize: 74, color: '#fff', lineHeight: 1.05, textShadow: '0 4px 18px rgba(0,0,0,.45)'}}>{asesor}</div>
        <div style={{fontWeight: 700, fontSize: 34, color: ACENTO, letterSpacing: 6, marginTop: 10}}>{rol.toUpperCase()}</div>
      </div>
      <div style={{position: 'absolute', left: 100, right: 100, top: 960, borderRadius: 30, background: '#25D366', boxShadow: '0 18px 50px rgba(0,0,0,.45)', padding: '20px 10px 24px', textAlign: 'center', fontFamily: 'Montserrat', color: '#fff', opacity: c, transform: `scale(${0.9 + 0.1 * c})`}}>
        <div style={{fontWeight: 800, fontSize: 36, letterSpacing: 2}}>ESCRIBINOS POR WHATSAPP</div>
        <div style={{fontWeight: 900, fontSize: 70, lineHeight: 1.1, marginTop: 4, opacity: d}}>{whatsapp}</div>
      </div>
    </AbsoluteFill>
  );
};
