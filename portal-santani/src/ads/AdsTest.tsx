import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Cam3D, Mapa3D} from '../v2/Mapa3D';
import proyecto from '../../../proyectos/portal-santani/proyecto.json';

/**
 * Creativos de prueba para Meta Ads (Portal de Santaní). Archivos nuevos; no tocan el Reel ni los videos finales.
 * Datos comerciales y de contacto: SOLO de proyectos/portal-santani/proyecto.json.
 */
const P = proyecto.proyecto.nombre.toUpperCase(); // PORTAL DE SANTANÍ
const WA = proyecto.contacto.whatsapp;
const CUOTA = `G. ${proyecto.datos_comerciales.cuota_desde_gs.toLocaleString('es-PY').replace(/,/g, '.')}`; // G. 200.000
const M2 = `${proyecto.datos_comerciales.superficie_desde_m2} m²`;

const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ORO = '#F7C948';
const VERDE = '#062A1B';
const WAV = '#25D366';
const FONT = 'Montserrat';
const sombra = '0 6px 28px rgba(0,0,0,.75), 0 2px 6px rgba(0,0,0,.6)';

export const DUR_ADS_VIDEO = s(13.5);

const Pop: React.FC<{d?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({d = 0, children, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - d, fps, config: {damping: 13, stiffness: 190}});
  return <div style={{...style, opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})`}}>{children}</div>;
};

const Fondo: React.FC<{src: string; video?: number; zoom?: [number, number]; d: number; oscuro?: number}> = ({src, video, zoom = [1.06, 1.2], d, oscuro = 0.35}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, d], zoom, clamp);
  const st: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'saturate(1.2) contrast(1.08)'};
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      {video !== undefined ? <OffthreadVideo src={staticFile(src)} startFrom={s(video)} muted style={st} /> : <Img src={staticFile(src)} style={st} />}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${oscuro}) 0%, rgba(0,0,0,${oscuro * 0.4}) 45%, rgba(0,0,0,${oscuro}) 100%)`}} />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 4], [0.55, 0], clamp)}} />;
};

// ---------- CREATIVO 1: video 13,5 s ----------
export const AdsVideo: React.FC = () => {
  const f = useCurrentFrame();
  const cam = (t: number): Cam3D => {
    const p = interpolate(t, [0, 3.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    return {x: 0, y: 0, mpp: 1.9 - 0.75 * p, rot: -45 + 8 * p, tilt: 0};
  };
  return (
    <AbsoluteFill style={{background: VERDE}}>
      {/* 0–2 s: gancho sobre calles reales */}
      <Sequence durationInFrames={s(2)}>
        <Fondo src="v2/calles.mp4" video={14.5} d={s(2)} zoom={[1.15, 1.3]} />
        <Pop d={2} style={{position: 'absolute', left: 50, right: 50, top: 560, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 96, lineHeight: 1.04, color: '#fff', textShadow: sombra}}>
          ¿BUSCÁS UN TERRENO EN <span style={{color: ORO}}>SANTANÍ?</span>
        </Pop>
      </Sequence>
      {/* 2–5 s: precio mensual, dominante */}
      <Sequence from={s(2)} durationInFrames={s(3)}>
        <Fondo src="v2/foto5.jpg" d={s(3)} zoom={[1.05, 1.18]} oscuro={0.45} />
        <Flash />
        <Pop d={1} style={{position: 'absolute', left: 40, right: 40, top: 470, textAlign: 'center', fontFamily: FONT, fontWeight: 900, color: '#fff', textShadow: sombra}}>
          <div style={{fontSize: 70}}>LOTES DESDE</div>
        </Pop>
        <Pop d={5} style={{position: 'absolute', left: 30, right: 30, top: 570, textAlign: 'center', fontFamily: FONT, fontWeight: 900, color: ORO, textShadow: sombra}}>
          <div style={{fontSize: 172, lineHeight: 1}}>{CUOTA}</div>
        </Pop>
        <Pop d={9} style={{position: 'absolute', left: 40, right: 40, top: 770, textAlign: 'center', fontFamily: FONT, fontWeight: 900, color: '#fff', textShadow: sombra}}>
          <div style={{fontSize: 84}}>AL MES</div>
        </Pop>
      </Sequence>
      {/* 5–9 s: loteamiento real (KMZ sobre satélite) + superficie y nombre */}
      <Sequence from={s(5)} durationInFrames={s(4)}>
        <AbsoluteFill>
          <Mapa3D cam={cam((f - s(5)) / FPS)} oscurecer={0.18} />
        </AbsoluteFill>
        <Flash />
        <Pop d={2} style={{position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center', fontFamily: FONT, fontWeight: 900, color: '#fff', textShadow: sombra}}>
          <div style={{fontSize: 74}}>LOTES DESDE</div>
          <div style={{fontSize: 150, color: ORO, lineHeight: 1.02}}>{M2}</div>
        </Pop>
        <Pop d={s(1.4)} style={{position: 'absolute', left: 40, right: 40, top: 1180, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: 'rgba(6,42,27,.9)', border: `4px solid ${ORO}`, borderRadius: 24, padding: '16px 34px', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff'}}>{P}</div>
        </Pop>
      </Sequence>
      {/* 9–13,5 s: CTA WhatsApp sobre la entrada real */}
      <Sequence from={s(9)} durationInFrames={s(4.5)}>
        <Fondo src="v2/entrada.mp4" video={9.5} d={s(4.5)} zoom={[1.02, 1.1]} oscuro={0.62} />
        <Flash />
        <Pop d={2} style={{position: 'absolute', left: 50, right: 50, top: 420, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 78, lineHeight: 1.1, color: '#fff', textShadow: sombra}}>
          ¿QUERÉS CONOCER LOS LOTES <span style={{color: ORO}}>DISPONIBLES?</span>
        </Pop>
        <Pop d={s(0.9)} style={{position: 'absolute', left: 80, right: 80, top: 850, borderRadius: 34, background: WAV, boxShadow: '0 18px 50px rgba(0,0,0,.5)', padding: '26px 10px 30px', textAlign: 'center', fontFamily: FONT, color: '#fff'}}>
          <div style={{fontWeight: 900, fontSize: 54, letterSpacing: 1}}>ESCRIBINOS POR WHATSAPP</div>
          <div style={{fontWeight: 900, fontSize: 72, marginTop: 6}}>{WA}</div>
        </Pop>
        <Pop d={s(1.5)} style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 46, color: '#fff', textShadow: sombra}}>
          {P}
        </Pop>
      </Sequence>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [DUR_ADS_VIDEO - 10, DUR_ADS_VIDEO - 1], [0, 1], clamp), pointerEvents: 'none'}} />
      <Audio src={staticFile('v2/musica_v2.wav')} startFrom={s(16)} volume={(fr) => interpolate(fr, [0, 8, DUR_ADS_VIDEO - 25, DUR_ADS_VIDEO - 1], [0, 0.9, 0.9, 0], clamp)} />
      {[2, 5, 9].map((t) => (
        <Sequence key={t} from={s(t) - 6} durationInFrames={s(1)}>
          <Audio src={staticFile('audio/sfx/whoosh.wav')} volume={0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------- CREATIVO 2: flyer 1080×1350 y 1080×1080 ----------
export const AdsFlyer: React.FC<{alto: number}> = ({alto}) => {
  const cuadrado = alto === 1080;
  return (
    <AbsoluteFill style={{background: VERDE, fontFamily: FONT}}>
      <Img src={staticFile('v2/foto2.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 62%', filter: 'saturate(1.2) contrast(1.06)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,42,27,.55) 0%, rgba(6,42,27,.35) 40%, rgba(6,42,27,.78) 78%, rgba(6,42,27,.95) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: cuadrado ? 44 : 64, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: ORO, color: VERDE, fontWeight: 900, fontSize: cuadrado ? 50 : 56, padding: '12px 34px', borderRadius: 14, letterSpacing: 1}}>TERRENOS EN SANTANÍ</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: cuadrado ? 150 : 230, textAlign: 'center', color: '#fff', textShadow: sombra, lineHeight: 1}}>
        <div style={{fontWeight: 900, fontSize: cuadrado ? 64 : 80}}>DESDE</div>
        <div style={{whiteSpace: 'nowrap', color: ORO, fontWeight: 900, margin: cuadrado ? '10px 0 8px' : '14px 0 12px'}}>
          <span style={{fontSize: cuadrado ? 92 : 104, marginRight: 14}}>G.</span>
          <span style={{fontSize: cuadrado ? 176 : 196, letterSpacing: -3}}>{CUOTA.replace('G. ', '')}</span>
        </div>
        <div style={{fontWeight: 900, fontSize: cuadrado ? 64 : 80}}>AL MES</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: cuadrado ? 560 : 700, textAlign: 'center', color: '#fff', textShadow: sombra}}>
        <div style={{fontWeight: 800, fontSize: cuadrado ? 48 : 54}}>LOTES DESDE <span style={{color: ORO}}>{M2}</span></div>
        <div style={{fontWeight: 900, fontSize: cuadrado ? 42 : 48, letterSpacing: 3, marginTop: 10}}>{P}</div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, bottom: cuadrado ? 50 : 72, borderRadius: 28, background: WAV, boxShadow: '0 14px 40px rgba(0,0,0,.45)', padding: cuadrado ? '16px 10px 18px' : '20px 10px 24px', textAlign: 'center', color: '#fff'}}>
        <div style={{fontWeight: 900, fontSize: cuadrado ? 36 : 40}}>CONSULTÁ LOS LOTES DISPONIBLES</div>
        <div style={{fontWeight: 900, fontSize: cuadrado ? 44 : 52, marginTop: 4}}>WHATSAPP {WA}</div>
      </div>
    </AbsoluteFill>
  );
};
