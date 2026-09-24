import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {C, GEO} from '../config';
import {Cam3D, Mapa3D, proyectar3D} from './Mapa3D';
import {DESCENSO, SUBIDA, recorrer} from './PruebaRecorrido';
import datos from './datos_v2.json';

/**
 * Portal de Santaní v2 — video nuevo e independiente del Reel anterior.
 * Recorrido: viaje → llegada → entrada → recorrido por una manzana → lotes → panorámica →
 * ubicación → oferta → Tour Virtual → contacto. Tiempos en src/v2/datos_v2.json (armado
 * automáticamente a partir de la locución real con v2/voz/montar_v2.py).
 */
export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type Escena = {id: string; desde: number; dur: number};
const ESC = datos.escenas as Escena[];
const esc = (id: string) => ESC.find((e) => e.id === id)!;
export const DUR_V2 = s(datos.total);

// ---------- piezas visuales ----------
const Clip: React.FC<{src: string; desde: number; dur: number; zoom?: [number, number]; fundido?: boolean}> = ({src, desde, dur, zoom = [1.03, 1.12], fundido = true}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, clamp);
  const blur = fundido ? interpolate(f, [0, 5], [10, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={staticFile(src)} startFrom={s(desde)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: `blur(${blur}px) saturate(1.15) contrast(1.07) brightness(1.03)`}} />
    </AbsoluteFill>
  );
};

const Foto: React.FC<{src: string; dur: number; zoom?: [number, number]; panY?: number}> = ({src, dur, zoom = [1.02, 1.15], panY = -120}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, clamp);
  const o = interpolate(f, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: o}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateY(${(z - 1) * panY}px)`, filter: 'saturate(1.12) contrast(1.05)'}} />
    </AbsoluteFill>
  );
};

/** Etiqueta de lugar chica, estilo referencia (pin + nombre). */
const Lugar: React.FC<{texto: string; desde?: number; dur: number}> = ({texto, desde = 8, dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [desde, desde + 8, dur - 8, dur], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(6,42,27,.78)', padding: '14px 26px', borderRadius: 40, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 40, color: '#fff', letterSpacing: 1}}>
        <svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 39C9 30 1 24 1 15a14 14 0 1 1 28 0c0 9-8 15-14 24z" fill={C.acento} /><circle cx="15" cy="15" r="5" fill={C.verdeOscuro} /></svg>
        {texto}
      </div>
    </div>
  );
};

const Grande: React.FC<{lineas: {t: string; size: number; color?: string}[]; top: number; desde?: number}> = ({lineas, top, desde = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, lineHeight: 1.05, textShadow: '0 6px 24px rgba(0,0,0,.7)'}}>
      {lineas.map((l, i) => {
        const p = spring({frame: f - desde - i * 6, fps, config: {damping: 14, stiffness: 160}});
        return (
          <div key={i} style={{fontSize: l.size, color: l.color ?? '#fff', opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 50}px) scale(${0.9 + 0.1 * p})`}}>
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

// ---------- escenas ----------
const Viaje: React.FC<{dur: number}> = ({dur}) => (
  <>
    <Clip src="v2/ruta.mp4" desde={11.5} dur={dur} fundido={false} zoom={[1.08, 1.2]} />
    <Lugar texto="RUTA 3" dur={dur} desde={s(1.2)} />
  </>
);

const Llegada: React.FC<{dur: number}> = ({dur}) => {
  const mitad = Math.round(dur * 0.5);
  return (
    <>
      <Sequence durationInFrames={mitad}>
        <Clip src="v2/ruta.mp4" desde={33.0} dur={mitad} />
      </Sequence>
      <Sequence from={mitad} durationInFrames={dur - mitad}>
        <Foto src="v2/foto3.jpg" dur={dur - mitad} />
      </Sequence>
      <Lugar texto="SAN ESTANISLAO · SANTANÍ" dur={dur} desde={6} />
    </>
  );
};

const Entrada: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [s(0.8), s(1.2), dur - 8, dur], [0, 1, 1, 0], clamp);
  return (
    <>
      <Clip src="v2/entrada.mp4" desde={9.5} dur={dur} zoom={[1.0, 1.1]} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: o, transform: `scale(${0.92 + 0.08 * o})`, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 104, color: '#fff', textShadow: '0 6px 28px rgba(0,0,0,.75)', lineHeight: 1}}>
        PORTAL DE<br />SANTANÍ
      </div>
    </>
  );
};

const Descenso: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const salida = interpolate(f, [dur - s(0.3), dur], [0, 1], clamp);
  return (
    <AbsoluteFill style={{filter: `blur(${salida * 12}px)`, transform: `scale(${1 + salida * 0.15})`}}>
      <Mapa3D cam={recorrer(DESCENSO, f * (s(3.5) / dur))} />
    </AbsoluteFill>
  );
};

const Recorrido: React.FC<{dur: number}> = ({dur}) => {
  const d1 = s(3.5);
  const d3 = s(1.6);
  const d2 = dur - d1 - d3;
  return (
    <>
      <Sequence durationInFrames={d1}>
        <Descenso dur={d1} />
      </Sequence>
      <Sequence from={d1} durationInFrames={d2}>
        <Clip src="v2/calles.mp4" desde={14.5} dur={d2} />
      </Sequence>
      <Sequence from={d1 + d2} durationInFrames={d3}>
        <Foto src="v2/foto5.jpg" dur={d3} />
      </Sequence>
    </>
  );
};

const Lotes: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const entrada = interpolate(f, [0, 5], [12, 0], clamp);
  const cam: Cam3D = recorrer(SUBIDA, Math.min(f, s(3.2)));
  return (
    <AbsoluteFill style={{filter: `blur(${entrada}px)`}}>
      <Mapa3D cam={cam} oscurecer={interpolate(f, [s(2.8), s(3.4)], [0, 0.25], clamp)} />
      <Grande top={290} desde={s(2.6)} lineas={[{t: '650 LOTES', size: 116, color: C.acento}, {t: 'DESDE 360 m²', size: 72}]} />
    </AbsoluteFill>
  );
};

const Panoramica: React.FC<{dur: number}> = ({dur}) => {
  const mitad = Math.round(dur * 0.55);
  return (
    <>
      <Sequence durationInFrames={mitad}>
        <Foto src="v2/foto7.jpg" dur={mitad} zoom={[1.18, 1.02]} panY={80} />
      </Sequence>
      <Sequence from={mitad} durationInFrames={dur - mitad}>
        <Foto src="v2/foto4.jpg" dur={dur - mitad} zoom={[1.02, 1.12]} />
      </Sequence>
    </>
  );
};

const RUTA_PT = [729.5, 1781.3];
const Ubicacion: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], clamp);
  const cam: Cam3D = {x: 2600, y: -250 + 150 * p, mpp: 6.9 - 0.4 * p, rot: 0, tilt: 0};
  const P = proyectar3D(cam);
  const lin = interpolate(f, [s(0.3), s(1.4)], [0, 1], clamp);
  const pr = P([0, 0]);
  const ce = P(GEO.poi.centro);
  const ru = P(RUTA_PT);
  const chip = (x: number, y: number, t: string, o: number, fondo = C.verdeOscuro, ancla = 50) => (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-${ancla}%, -140%)`, opacity: o, background: fondo, color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 32, padding: '10px 18px', borderRadius: 12, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,.45)'}}>{t}</div>
  );
  const path = (pts: number[][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${P(q).map((v) => v.toFixed(1)).join(' ')}`).join('');
  return (
    <AbsoluteFill>
      <Mapa3D cam={cam} lotes={0} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {GEO.ruta3.map((l, i) => (
          <path key={i} d={path(l)} stroke={C.acento} strokeWidth={9} fill="none" strokeLinecap="round" opacity={lin} />
        ))}
        <line x1={pr[0]} y1={pr[1]} x2={pr[0] + (ce[0] - pr[0]) * lin} y2={pr[1] + (ce[1] - pr[1]) * lin} stroke="#fff" strokeWidth={5} strokeDasharray="14 10" />
        <path d={path(GEO.perimetro)} fill={C.acento} fillOpacity={0.5} stroke="#fff" strokeWidth={4} />
        <circle cx={ce[0]} cy={ce[1]} r={14} fill={C.acento} stroke={C.verdeOscuro} strokeWidth={5} opacity={lin} />
      </svg>
      {chip(pr[0] - 40, pr[1] - 30, 'PORTAL DE SANTANÍ', 1, C.verde, 0)}
      {chip(ce[0] + 30, ce[1] - 10, 'CENTRO DE SANTANÍ', lin, C.verdeOscuro, 100)}
      {chip(ru[0], ru[1] + 90, 'RUTA 3 · ≈ 1,4 km', lin)}
    </AbsoluteFill>
  );
};

const Oferta: React.FC<{dur: number}> = ({dur}) => (
  <>
    <Foto src="v2/foto2.jpg" dur={dur} zoom={[1.05, 1.16]} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,42,27,.15) 0%, rgba(6,42,27,.55) 45%, rgba(6,42,27,.15) 80%)'}} />
    <Grande top={470} desde={s(0.4)} lineas={[{t: 'CUOTAS DESDE', size: 76}, {t: 'Gs. 200.000', size: 150, color: C.acento}]} />
    <Grande top={900} desde={s(1.8)} lineas={[{t: 'HASTA 130 MESES', size: 62}, {t: 'O AL CONTADO', size: 62}]} />
  </>
);

// Tour: grabación real del sitio dentro de un celular; montos difuminados (varían por lote)
const TOUR_DESDE = 47.3;
const POPUPS = [[49.15, 51.25]];
const Tour: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const t = TOUR_DESDE + f / FPS;
  const popup = POPUPS.some(([a, b]) => t >= a && t <= b);
  const k = 620 / 382; // escala del video (382×848) dentro de la pantalla del celular
  const top = -90 * k; // se oculta la barra de estado/URL del navegador
  // Tapa los montos (cambian por lote) con barras neutras; se mantienen visibles los rótulos
  const caja = (y0: number, y1: number) => (
    <div style={{position: 'absolute', left: 20 * k, width: 345 * k, top: top + y0 * k, height: (y1 - y0) * k, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, paddingLeft: 28 * k}}>
      <div style={{width: '62%', height: 14, borderRadius: 7, background: '#d7dfd9'}} />
      <div style={{width: '44%', height: 14, borderRadius: 7, background: '#d7dfd9'}} />
    </div>
  );
  const ent = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.verde} 0%, ${C.verdeOscuro} 100%)`}}>
      <Grande top={190} lineas={[{t: 'TOUR VIRTUAL', size: 78}]} />
      <div style={{position: 'absolute', left: 540 - 310 - 16, top: 360, width: 620 + 32, height: 1030 + 32, borderRadius: 64, background: '#0b0f0d', boxShadow: '0 40px 90px rgba(0,0,0,.6)', opacity: ent, transform: `translateY(${(1 - ent) * 200}px)`}}>
        <div style={{position: 'absolute', left: 16, top: 16, width: 620, height: 1030, borderRadius: 50, overflow: 'hidden', background: '#fff'}}>
          <OffthreadVideo src={staticFile('v2/tour.mp4')} startFrom={s(TOUR_DESDE)} muted style={{position: 'absolute', left: 0, top, width: 382 * k, height: 848 * k}} />
          {popup ? (
            <>
              {caja(502, 531)}
              {caja(557, 616)}
            </>
          ) : null}
        </div>
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 292, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 600, fontSize: 25, color: 'rgba(255,255,255,.85)'}}>Valores referenciales: cada lote tiene su propia cuota y condición.</div>
    </AbsoluteFill>
  );
};

const Contacto: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - 4, fps, config: {damping: 14, stiffness: 140}});
  const q = spring({frame: f - 18, fps, config: {damping: 14, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #ffffff 0%, #eef5f0 60%, #d9e8de 100%)`}}>
      <Img src={staticFile('v2/logo_trebol.png')} style={{position: 'absolute', left: 540 - 300, top: 330, width: 600, opacity: p, transform: `scale(${0.85 + 0.15 * p})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 660, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 72, color: C.verdeOscuro, opacity: p}}>PORTAL DE SANTANÍ</div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 820, borderRadius: 32, background: '#fff', boxShadow: '0 20px 50px rgba(6,42,27,.25)', padding: '34px 24px', textAlign: 'center', fontFamily: 'Montserrat', opacity: q, transform: `translateY(${(1 - q) * 60}px)`}}>
        <div style={{fontWeight: 800, fontSize: 46, color: C.verdeOscuro}}>Adolfo Castillo</div>
        <div style={{fontWeight: 600, fontSize: 34, color: '#58705f', marginTop: 4}}>Asesor Inmobiliario</div>
        <div style={{marginTop: 22, background: '#25D366', color: '#fff', borderRadius: 18, padding: '14px 10px 18px'}}>
          <div style={{fontWeight: 700, fontSize: 32}}>WhatsApp</div>
          <div style={{fontWeight: 900, fontSize: 66, lineHeight: 1.05}}>+595 976 557 380</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 700, fontSize: 30, color: '#3d5a47', opacity: q}}>Tour Virtual: trebolote.com.py</div>
    </AbsoluteFill>
  );
};

const ESCENAS: Record<string, React.FC<{dur: number}>> = {
  viaje: Viaje, llegada: Llegada, entrada: Entrada, recorrido: Recorrido, lotes: Lotes,
  panoramica: Panoramica, ubicacion: Ubicacion, oferta: Oferta, tour: Tour, contacto: Contacto,
};

// ---------- subtítulos y sonido ----------
const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = datos.subtitulos.find((x) => t >= x.desde && t <= x.hasta);
  if (!c) return null;
  const o = interpolate(t, [c.desde, c.desde + 0.1, c.hasta - 0.1, c.hasta], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1440, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{background: 'rgba(0,0,0,.74)', color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 48, lineHeight: 1.22, textAlign: 'center', padding: '12px 26px', borderRadius: 16, maxWidth: 960}}>{c.texto}</div>
    </div>
  );
};

const volMusica = (f: number) => {
  const t = f / FPS;
  const enVoz = datos.frases.some((x) => t >= x.desde - 0.25 && t <= x.hasta + 0.25);
  const fin = interpolate(t, [datos.total - 1.2, datos.total], [1, 0], clamp);
  const ini = interpolate(t, [0, 0.6], [0, 1], clamp);
  return (enVoz ? 0.2 : 0.8) * fin * ini;
};

export const ReelV2: React.FC<{subtitulos: boolean}> = ({subtitulos}) => (
  <AbsoluteFill style={{background: C.verdeOscuro}}>
    {ESC.map((e) => {
      const Comp = ESCENAS[e.id];
      return (
        <Sequence key={e.id} from={s(e.desde)} durationInFrames={s(e.dur)}>
          <Comp dur={s(e.dur)} />
        </Sequence>
      );
    })}
    {subtitulos ? <Subtitulos /> : null}
    <Audio src={staticFile('v2/voz_v2.wav')} />
    <Audio src={staticFile('v2/musica_v2.wav')} volume={volMusica} />
    {ESC.slice(1).map((e) => (
      <Sequence key={`w${e.id}`} from={Math.max(0, s(e.desde) - 5)} durationInFrames={s(1)}>
        <Audio src={staticFile('audio/sfx/whoosh.wav')} volume={0.35} />
      </Sequence>
    ))}
    <Sequence from={s(esc('oferta').desde + 0.4)} durationInFrames={s(1.5)}>
      <Audio src={staticFile('audio/sfx/impacto.wav')} volume={0.5} />
    </Sequence>
    <Sequence from={s(esc('contacto').desde + 0.6)} durationInFrames={s(1)}>
      <Audio src={staticFile('audio/sfx/notif.wav')} volume={0.6} />
    </Sequence>
  </AbsoluteFill>
);
