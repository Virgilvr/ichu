import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Cam3D, Mapa3D} from '../v2/Mapa3D';
import proyecto from '../../../proyectos/portal-santani/proyecto.json';
import tiempos from './veni_tiempos.json';

/**
 * Línea creativa "Vení a conocer Portal de Santaní" (video 14 s + flyer collage). Archivos nuevos.
 * Datos y contacto SOLO desde proyectos/portal-santani/proyecto.json; voz autorizada del asesor de ESTE proyecto.
 */
const P = proyecto.proyecto.nombre.toUpperCase();
const ASESOR = proyecto.contacto.asesor.toUpperCase();
const ROL = proyecto.contacto.rol.toUpperCase();
const WA = proyecto.contacto.whatsapp;
const CUOTA = proyecto.datos_comerciales.cuota_desde_gs.toLocaleString('es-PY').replace(/,/g, '.');
const M2 = `${proyecto.datos_comerciales.superficie_desde_m2} m²`;

const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ORO = '#F7C948';
const VERDE = '#062A1B';
const VERDE2 = '#0E7A3E';
const WAV = '#25D366';
const FONT = 'Montserrat';
const sombra = '0 6px 28px rgba(0,0,0,.75), 0 2px 6px rgba(0,0,0,.6)';

export const DUR_VENI = s(tiempos.total);

const Pop: React.FC<{d?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({d = 0, children, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - d, fps, config: {damping: 13, stiffness: 200}});
  return <div style={{...style, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`}}>{children}</div>;
};

const Media: React.FC<{src: string; video?: number; d: number; zoom?: [number, number]; oscuro?: number}> = ({src, video, d, zoom = [1.08, 1.2], oscuro = 0.3}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, d], zoom, clamp);
  const st: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'saturate(1.2) contrast(1.08)'};
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      {video !== undefined ? <OffthreadVideo src={staticFile(src)} startFrom={s(video)} muted style={st} /> : <Img src={staticFile(src)} style={st} />}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${oscuro}) 0%, rgba(0,0,0,${oscuro * 0.3}) 45%, rgba(0,0,0,${oscuro}) 100%)`}} />
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 4], [0.45, 0], clamp)}} />
    </AbsoluteFill>
  );
};

const Aereo: React.FC<{d: number; desde: Cam3D; hasta: Cam3D}> = ({d, desde, hasta}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, d], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cam: Cam3D = {
    x: desde.x + (hasta.x - desde.x) * p, y: desde.y + (hasta.y - desde.y) * p,
    mpp: Math.exp(Math.log(desde.mpp) + (Math.log(hasta.mpp) - Math.log(desde.mpp)) * p),
    rot: desde.rot + (hasta.rot - desde.rot) * p, tilt: desde.tilt + (hasta.tilt - desde.tilt) * p,
  };
  return (
    <AbsoluteFill>
      <Mapa3D cam={cam} oscurecer={0.12} />
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 4], [0.45, 0], clamp)}} />
    </AbsoluteFill>
  );
};

/** Etiqueta chica (qué muestra cada toma: todo material real del proyecto). */
const Etiqueta: React.FC<{t: string; top?: number}> = ({t, top = 1270}) => (
  <Pop d={3} style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: 'rgba(6,42,27,.88)', border: `3px solid ${ORO}`, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 40, padding: '10px 28px', borderRadius: 40, letterSpacing: 1}}>{t}</div>
  </Pop>
);

const Titular: React.FC<{lineas: {t: string; c?: string; z: number}[]; top: number; d?: number}> = ({lineas, top, d = 1}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontFamily: FONT, fontWeight: 900, lineHeight: 1.04, textShadow: sombra}}>
    {lineas.map((l, i) => (
      <Pop key={i} d={d + i * 4}>
        <div style={{fontSize: l.z, color: l.c ?? '#fff'}}>{l.t}</div>
      </Pop>
    ))}
  </div>
);

// Escenas (s): cortes rápidos, varias tomas reales
const E = tiempos.escenas as unknown as Record<string, [number, number]>;
const dur = (k: string) => s(E[k][1]) - s(E[k][0]);
const Esc: React.FC<{k: string; children: React.ReactNode}> = ({k, children}) => (
  <Sequence from={s(E[k][0])} durationInFrames={dur(k)}>{children}</Sequence>
);

export const AdsVeniVideo: React.FC = () => {
  const f = useCurrentFrame();
  const vol = (fr: number) => {
    const t = fr / FPS;
    const enVoz = tiempos.voz.some((v: {desde: number; hasta: number}) => t > v.desde - 0.15 && t < v.hasta + 0.1);
    const base = enVoz ? 0.16 : 0.62;
    return base * interpolate(fr, [0, 6], [0, 1], clamp);
  };
  return (
    <AbsoluteFill style={{background: VERDE}}>
      <Esc k="entrada">
        <Media src="v2/entrada.mp4" video={37.5} d={dur('entrada')} zoom={[1.05, 1.18]} />
        <Titular top={330} lineas={[{t: 'VENÍ A CONOCER', z: 84}]} />
        <Etiqueta t="ENTRADA" />
      </Esc>
      <Esc k="aereo">
        <Aereo d={dur('aereo')} desde={{x: 0, y: 0, mpp: 2.4, rot: -45, tilt: 0}} hasta={{x: 0, y: 0, mpp: 1.3, rot: -38, tilt: 0}} />
        <Titular top={300} d={0} lineas={[{t: 'PORTAL DE', z: 92}, {t: 'SANTANÍ', z: 124, c: ORO}]} />
        <Etiqueta t="650 LOTES · VISTA AÉREA" />
      </Esc>
      <Esc k="calles">
        <Media src="v2/calles.mp4" video={14.5} d={dur('calles')} zoom={[1.12, 1.26]} />
        <Etiqueta t="CALLES ABIERTAS" />
      </Esc>
      <Esc k="lotes">
        <Media src="v2/foto7.jpg" d={dur('lotes')} zoom={[1.04, 1.16]} />
        <Etiqueta t="LOTES AMOJONADOS" />
      </Esc>
      <Esc k="precio">
        <Media src="v2/foto1.jpg" d={dur('precio')} zoom={[1.05, 1.15]} oscuro={0.55} />
        <Titular top={420} d={1} lineas={[{t: 'LLEVÁ TU LOTE DESDE', z: 64}, {t: `G. ${CUOTA}`, z: 168, c: ORO}, {t: 'AL MES', z: 88}]} />
      </Esc>
      <Esc k="acceso">
        <Media src="v2/ruta.mp4" video={26.6} d={dur('acceso')} zoom={[1.1, 1.22]} />
        <Etiqueta t="ACCESO DESDE RUTA 3" />
      </Esc>
      <Esc k="camino">
        <Media src="v2/foto3.jpg" d={dur('camino')} zoom={[1.06, 1.18]} />
        <Etiqueta t="SAN ESTANISLAO · SANTANÍ" />
      </Esc>
      <Esc k="m2">
        <Aereo d={dur('m2')} desde={{x: 30, y: 20, mpp: 0.55, rot: -45, tilt: 30}} hasta={{x: 0, y: 0, mpp: 0.95, rot: -45, tilt: 0}} />
        <Titular top={330} d={1} lineas={[{t: 'LOTES DESDE', z: 76}, {t: M2, z: 150, c: ORO}]} />
      </Esc>
      <Esc k="cierre">
        <Cierre d={dur('cierre')} />
      </Esc>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [DUR_VENI - 12, DUR_VENI - 1], [0, 1], clamp), pointerEvents: 'none'}} />
      <Audio src={staticFile('ads2/musica_ads2.wav')} volume={vol} />
      {tiempos.voz.map((v: {archivo: string; desde: number}, i: number) => (
        <Sequence key={i} from={s(v.desde)}>
          <Audio src={staticFile(`ads2/${v.archivo}`)} volume={1.0} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cierre: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, d], [1.1, 1.0], clamp);
  return (
    <AbsoluteFill style={{background: VERDE}}>
      <AbsoluteFill style={{overflow: 'hidden', opacity: interpolate(f, [0, 8], [0, 1], clamp)}}>
        <Img src={staticFile('v2/foto2.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'blur(6px) saturate(1.1)'}} />
        <AbsoluteFill style={{background: 'rgba(6,42,27,.86)'}} />
      </AbsoluteFill>
      <Pop d={2} style={{position: 'absolute', left: 0, right: 0, top: 340, textAlign: 'center', fontFamily: FONT, color: '#fff'}}>
        <div style={{width: 120, height: 5, background: ORO, borderRadius: 3, margin: '0 auto 28px'}} />
        <div style={{fontWeight: 900, fontSize: 88, lineHeight: 1.02}}>{ASESOR}</div>
        <div style={{fontWeight: 700, fontSize: 40, color: ORO, letterSpacing: 7, marginTop: 14}}>{ROL}</div>
      </Pop>
      <Pop d={10} style={{position: 'absolute', left: 80, right: 80, top: 700, borderRadius: 34, background: WAV, boxShadow: '0 18px 50px rgba(0,0,0,.5)', padding: '24px 10px 28px', textAlign: 'center', fontFamily: FONT, color: '#fff'}}>
        <div style={{fontWeight: 900, fontSize: 48, letterSpacing: 2}}>WHATSAPP</div>
        <div style={{fontWeight: 900, fontSize: 80, marginTop: 4}}>{WA}</div>
      </Pop>
      <Pop d={18} style={{position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', fontFamily: FONT}}>
        <div style={{display: 'inline-block', border: `4px solid ${ORO}`, borderRadius: 22, padding: '14px 34px', fontWeight: 900, fontSize: 60, color: '#fff'}}>{P}</div>
      </Pop>
    </AbsoluteFill>
  );
};

// ---------- flyer collage (misma identidad) ----------
const Tile: React.FC<{src: string; label: string; style: React.CSSProperties; pos?: string}> = ({src, label, style, pos = '50% 60%'}) => (
  <div style={{position: 'absolute', overflow: 'hidden', borderRadius: 18, border: '4px solid #fff', boxShadow: '0 10px 28px rgba(0,0,0,.4)', ...style}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: 'saturate(1.2) contrast(1.06)'}} />
    <div style={{position: 'absolute', left: 10, bottom: 10, background: 'rgba(6,42,27,.88)', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 20, padding: '5px 12px', borderRadius: 16, letterSpacing: 1}}>{label}</div>
  </div>
);

export const AdsVeniFlyer: React.FC<{alto: number}> = ({alto}) => {
  const q = alto === 1080;
  const tiles = q
    ? [
        {src: 'ads2/entrada.jpg', label: 'ENTRADA', style: {left: 40, top: 440, width: 238, height: 330}, pos: '50% 62%'},
        {src: 'ads2/aereo.jpg', label: 'VISTA AÉREA', style: {left: 294, top: 440, width: 238, height: 330}, pos: '50% 50%'},
        {src: 'v2/foto2.jpg', label: 'CALLES', style: {left: 548, top: 440, width: 238, height: 330}, pos: '50% 70%'},
        {src: 'v2/foto7.jpg', label: 'LOTES', style: {left: 802, top: 440, width: 238, height: 330}, pos: '50% 78%'},
      ]
    : [
        {src: 'ads2/entrada.jpg', label: 'ENTRADA', style: {left: 40, top: 560, width: 492, height: 250}, pos: '50% 62%'},
        {src: 'ads2/aereo.jpg', label: 'VISTA AÉREA · 650 LOTES', style: {left: 548, top: 560, width: 492, height: 250}, pos: '50% 50%'},
        {src: 'v2/foto2.jpg', label: 'CALLES ABIERTAS', style: {left: 40, top: 826, width: 492, height: 250}, pos: '50% 72%'},
        {src: 'v2/foto7.jpg', label: 'LOTES AMOJONADOS', style: {left: 548, top: 826, width: 492, height: 250}, pos: '50% 80%'},
      ];
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${VERDE} 0%, #0a3a24 55%, ${VERDE} 100%)`, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: q ? 34 : 44, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: ORO, color: VERDE, fontWeight: 900, fontSize: q ? 44 : 52, padding: '10px 32px', borderRadius: 14, letterSpacing: 1}}>TERRENOS EN SANTANÍ</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: q ? 128 : 150, textAlign: 'center', color: '#fff', lineHeight: 1}}>
        <div style={{fontWeight: 900, fontSize: q ? 58 : 70}}>DESDE</div>
        <div style={{whiteSpace: 'nowrap', color: ORO, fontWeight: 900, margin: q ? '6px 0' : '10px 0'}}>
          <span style={{fontSize: q ? 86 : 100, marginRight: 12}}>G.</span>
          <span style={{fontSize: q ? 160 : 190, letterSpacing: -3}}>{CUOTA}</span>
        </div>
        <div style={{fontWeight: 900, fontSize: q ? 58 : 70}}>AL MES</div>
      </div>
      {tiles.map((t) => (
        <Tile key={t.label} src={t.src} label={t.label} style={t.style} pos={t.pos} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: q ? 800 : 1096, textAlign: 'center', color: '#fff'}}>
        <span style={{fontWeight: 800, fontSize: q ? 38 : 40}}>LOTES DESDE <span style={{color: ORO}}>{M2}</span></span>
        <span style={{fontWeight: 900, fontSize: q ? 38 : 40, margin: '0 18px', color: ORO}}>·</span>
        <span style={{fontWeight: 900, fontSize: q ? 38 : 40}}>{P}</span>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, bottom: q ? 46 : 50, borderRadius: 26, background: WAV, boxShadow: '0 14px 40px rgba(0,0,0,.45)', padding: q ? '14px 10px 16px' : '16px 10px 18px', textAlign: 'center', color: '#fff'}}>
        <div style={{fontWeight: 900, fontSize: q ? 34 : 36}}>CONSULTÁ LOS LOTES DISPONIBLES</div>
        <div style={{fontWeight: 900, fontSize: q ? 44 : 48, marginTop: 2}}>WHATSAPP {WA}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Vista aérea fija del KMZ para el collage (se renderiza a public/ads2/aereo.jpg). */
export const AereoFijo: React.FC = () => <Mapa3D cam={{x: 0, y: 0, mpp: 1.15, rot: -45, tilt: 0}} />;
export {VERDE2};
