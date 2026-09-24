import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, GEO, SAT} from '../config';
import {Cam3D, Mapa3D} from '../v2/Mapa3D';
import datos from './datos_v3.json';
import tapiracuai from '../../public/geo/tapiracuai.json';

/**
 * Portal de Santaní v3: viaje → Santaní → leyenda del Tapiracuái → regreso → entrada →
 * vista 360 real del Tour (referencias que el Tour muestra) → loteamiento (KMZ) → cuotas →
 * Tour Virtual → cierre emocional → placa final.
 * Locución aprobada (locucion_v3_adolfo_fadeout.wav) colocada tal cual, desde datos.vo.
 */
export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const DUR_V3 = s(datos.total);

// Escenas (segundos absolutos del video)
const T = {
  viaje: [0, 6.4], santani: [6.4, 20.6], regreso: [20.6, 26.4], entrada: [26.4, 31.4], vista360: [31.4, 35.6],
  lotes: [35.6, 38.6], oferta: [38.6, 45.6], tour: [45.6, 50.4], cierre: [50.4, 55.3], placa: [55.3, datos.total],
} as const;
type Id = keyof typeof T;
const dur = (id: Id) => s(T[id][1]) - s(T[id][0]);

// ---------- piezas ----------
const Clip: React.FC<{src: string; desde: number; d: number; zoom?: [number, number]; grade?: string}> = ({src, desde, d, zoom = [1.04, 1.13], grade = ''}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, d], zoom, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={staticFile(src)} startFrom={s(desde)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: `saturate(1.15) contrast(1.07) brightness(1.03) ${grade}`}} />
    </AbsoluteFill>
  );
};

const Foto: React.FC<{src: string; d: number; zoom?: [number, number]; panY?: number; grade?: string}> = ({src, d, zoom = [1.02, 1.14], panY = -120, grade = ''}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, d], zoom, clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateY(${(z - 1) * panY}px)`, filter: `saturate(1.12) contrast(1.05) ${grade}`}} />
    </AbsoluteFill>
  );
};

/** Fundido cruzado de entrada (evita cortes secos entre escenas). */
const Entra: React.FC<{children: React.ReactNode; f0?: number}> = ({children, f0 = 8}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(f, [0, f0], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};

const Grande: React.FC<{lineas: {t: string; size: number; color?: string; peso?: number; italic?: boolean}[]; top: number; desde?: number}> = ({lineas, top, desde = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontFamily: 'Montserrat', lineHeight: 1.08, textShadow: '0 6px 26px rgba(0,0,0,.75)'}}>
      {lineas.map((l, i) => {
        const p = spring({frame: f - desde - i * 6, fps, config: {damping: 16, stiffness: 120}});
        return (
          <div key={i} style={{fontSize: l.size, fontWeight: l.peso ?? 900, fontStyle: l.italic ? 'italic' : 'normal', color: l.color ?? '#fff', opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 40}px)`}}>
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

const Pin: React.FC<{x: number; y: number; texto: string; sub?: string; o: number; color?: string}> = ({x, y, texto, sub, o, color = C.acento}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) translateY(${(1 - o) * 16}px)`, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <div style={{background: 'rgba(6,42,27,.86)', borderRadius: 16, padding: '12px 24px', textAlign: 'center', fontFamily: 'Montserrat', boxShadow: '0 8px 26px rgba(0,0,0,.5)'}}>
      <div style={{fontWeight: 900, fontSize: 44, color: '#fff', letterSpacing: 2}}>{texto}</div>
      {sub ? <div style={{fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,.85)', marginTop: 2}}>{sub}</div> : null}
    </div>
    <div style={{width: 4, height: 46, background: color}} />
    <div style={{width: 20, height: 20, borderRadius: 10, background: color, border: '4px solid #fff', marginTop: -4}} />
  </div>
);

// ---------- satélite plano (Esri World Imagery) para Santaní y el arroyo ----------
type CamP = {x: number; y: number; mpp: number; rot: number};
const proy = (cam: CamP) => {
  const r = (cam.rot * Math.PI) / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  return (p: number[]): [number, number] => {
    const dx = (p[0] - cam.x) / cam.mpp;
    const dy = (p[1] - cam.y) / cam.mpp;
    return [540 + dx * c - dy * sn, 960 + dx * sn + dy * c];
  };
};
const Satelite: React.FC<{cam: CamP; capas: string[]}> = ({cam, capas}) => {
  const P = proy(cam);
  return (
    <AbsoluteFill style={{background: '#20301f', overflow: 'hidden'}}>
      {capas.map((n) => {
        const [x0, y0, x1, y1] = SAT[n].rel;
        const [sx, sy] = P([x0, y0]);
        return (
          <Img key={n} src={staticFile(SAT[n].file)} style={{position: 'absolute', left: 0, top: 0, width: (x1 - x0) / cam.mpp, height: (y1 - y0) / cam.mpp, transformOrigin: '0 0', transform: `translate(${sx}px, ${sy}px) rotate(${cam.rot}deg)`, filter: 'saturate(1.2) contrast(1.08) brightness(1.02)'}} />
        );
      })}
    </AbsoluteFill>
  );
};

type KF = CamP & {t: number};
const camEn = (kfs: KF[], t: number): CamP => {
  let i = 0;
  while (i < kfs.length - 2 && t > kfs[i + 1].t) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const p = interpolate(t, [a.t, b.t], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return {x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, mpp: Math.exp(Math.log(a.mpp) + (Math.log(b.mpp) - Math.log(a.mpp)) * p), rot: a.rot + (b.rot - a.rot) * p};
};

const CENTRO = GEO.poi.centro;
const ARROYO = tapiracuai.linea as number[][];
const ARROYO_MED = [7433, -1512];
// cámara (segundos locales de la escena "santani", que empieza en 6,4 s)
const CAM_SANTANI: KF[] = [
  {t: 0, x: 2300, y: -500, mpp: 11, rot: 0},
  {t: 0.6, x: 2600, y: -600, mpp: 10, rot: 0},
  {t: 3.2, x: CENTRO[0], y: CENTRO[1] + 250, mpp: 3.1, rot: 0},
  {t: 6.8, x: CENTRO[0] + 120, y: CENTRO[1] + 150, mpp: 2.8, rot: 0},
  {t: 9.6, x: ARROYO_MED[0], y: ARROYO_MED[1], mpp: 3.9, rot: 57},
  {t: 14.2, x: ARROYO_MED[0] + 150, y: ARROYO_MED[1] + 80, mpp: 3.4, rot: 60},
];

const Santani: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camEn(CAM_SANTANI, t);
  const P = proy(cam);
  const path = (pts: number[][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${P(q).map((v) => v.toFixed(1)).join(' ')}`).join('');
  const capas = cam.mpp < 9 ? ['L0', 'L3'] : ['L0'];
  const oRuta = interpolate(t, [0.2, 0.9, 2.6, 3.4], [0, 1, 1, 0], clamp);
  const oSantani = interpolate(t, [0.9, 1.4, 6.6, 7.2], [0, 1, 1, 0], clamp);
  // leyenda
  const tl = t - 6.8;
  const dibujo = interpolate(tl, [1.2, 4.2], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const oArroyo = interpolate(tl, [2.2, 2.8], [0, 1], clamp);
  const oTitulo = interpolate(tl, [0.3, 1.0, 13.4, 13.8], [0, 1, 1, 0], clamp);
  const brillo = 0.6 + 0.4 * Math.sin(f / 5);
  const ce = P(CENTRO);
  const tramo = GEO.ruta3[Math.floor(GEO.ruta3.length / 2)];
  const ru = P(tramo[Math.floor(tramo.length / 2)]);
  const et = P(ARROYO[Math.round(ARROYO.length * 0.55)]);
  const oscuro = interpolate(tl, [0, 1.5], [0, 0.28], clamp);
  return (
    <AbsoluteFill>
      <Satelite cam={cam} capas={capas} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.35 + oscuro}) 100%)`}} />
      <AbsoluteFill style={{background: `rgba(4,20,30,${oscuro})`}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {GEO.ruta3.map((l, i) => (
          <path key={i} d={path(l)} stroke={C.acento} strokeWidth={8} fill="none" strokeLinecap="round" opacity={oRuta} />
        ))}
        {dibujo > 0 ? (
          <>
            <path d={path(ARROYO)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dibujo} stroke="#7fd4ff" strokeOpacity={0.35} strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{filter: 'blur(6px)'}} />
            <path d={path(ARROYO)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dibujo} stroke="#bfeaff" strokeOpacity={0.75 + 0.25 * brillo} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </svg>
      <Pin x={ru[0]} y={ru[1]} texto="RUTA 3" o={oRuta} />
      <Pin x={ce[0]} y={ce[1]} texto="SANTANÍ" sub="San Estanislao · San Pedro" o={oSantani} />
      <Pin x={et[0]} y={et[1] - 10} texto="ARROYO TAPIRACUÁI" o={oArroyo} color="#7fd4ff" />
      <div style={{position: 'absolute', left: 60, right: 60, top: 250, textAlign: 'center', opacity: oTitulo, fontFamily: 'Montserrat', textShadow: '0 4px 20px rgba(0,0,0,.8)'}}>
        <div style={{fontWeight: 800, fontSize: 30, letterSpacing: 8, color: C.acento}}>LEYENDA POPULAR</div>
        <div style={{fontWeight: 700, fontStyle: 'italic', fontSize: 74, color: '#fff', marginTop: 6}}>El Tapiracuái</div>
        <div style={{fontWeight: 600, fontSize: 28, color: 'rgba(255,255,255,.85)', marginTop: 6}}>Tradición de Santaní</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- vista 360 real del Tour Virtual (grabación del sitio de Trebol) ----------
const VK = 960 / 332; // el visor del Tour ocupa x 26–358, y 245–715 en la grabación (382×848)
const Visor360: React.FC<{desde: number; rate: number}> = ({desde, rate}) => (
  <div style={{position: 'absolute', left: 60, top: 190, width: 960, height: 470 * VK, borderRadius: 40, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.6)', border: '3px solid rgba(255,255,255,.85)'}}>
    <OffthreadVideo src={staticFile('v2/tour.mp4')} startFrom={s(desde)} playbackRate={rate} muted style={{position: 'absolute', left: -26 * VK, top: -245 * VK, width: 382 * VK, height: 848 * VK, filter: 'saturate(1.12) contrast(1.05)'}} />
  </div>
);
const Fondo360: React.FC<{desde: number; rate: number}> = ({desde, rate}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <OffthreadVideo src={staticFile('v2/tour.mp4')} startFrom={s(desde)} playbackRate={rate} muted style={{position: 'absolute', left: -26 * 4.4 - 190, top: -245 * 4.4 - 60, width: 382 * 4.4, height: 848 * 4.4, filter: 'blur(28px) brightness(.55) saturate(1.2)'}} />
  </AbsoluteFill>
);
// carteles que muestra el Tour (mismos nombres y distancias), en segundos locales de la escena
const REFS: [number, number, string[]][] = [
  [0.1, 0.85, ['ASUNCIÓN']],
  [0.85, 1.63, ['CORONEL OVIEDO']],
  [1.63, 2.45, ['RUTA 3', 'CRUCE TACUARA · 10,1 km']],
  [2.68, 4.2, ['SANTANÍ · 3,9 km', 'ARROYO TAPIRACUÁI · 6,5 km', "ALMACÉN KA'AVO · 3 km"]],
];
const P1 = {desde: 28.3, hasta: 34.5, d: 2.4};
const P2 = {desde: 34.5, hasta: 37.1, d: 1.8};
const Vista360: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const r1 = (P1.hasta - P1.desde) / P1.d;
  const r2 = (P2.hasta - P2.desde) / P2.d;
  const ref = REFS.find(([a, b]) => t >= a && t < b);
  const oRef = ref ? interpolate(t, [ref[0], ref[0] + 0.12, ref[1] - 0.1, ref[1]], [0, 1, 1, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{background: C.verdeOscuro}}>
      <Sequence durationInFrames={s(P1.d)}>
        <Fondo360 desde={P1.desde} rate={r1} />
        <Visor360 desde={P1.desde} rate={r1} />
      </Sequence>
      <Sequence from={s(P1.d)}>
        <Fondo360 desde={P2.desde} rate={r2} />
        <Visor360 desde={P2.desde} rate={r2} />
      </Sequence>
      <div style={{position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 700, fontSize: 28, letterSpacing: 3, color: 'rgba(255,255,255,.9)'}}>VISTA 360 · TOUR VIRTUAL</div>
      {ref ? (
        <div style={{position: 'absolute', left: 90, right: 90, top: 1010, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: oRef}}>
          {ref[2].map((x) => (
            <div key={x} style={{background: 'rgba(6,42,27,.9)', border: `3px solid ${C.acento}`, color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: ref[2].length > 2 ? 36 : 44, padding: '10px 26px', borderRadius: 40, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)'}}>
              {x}
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- loteamiento (KMZ real): la cámara baja del horizonte a la vista cenital ----------
const LOTES_KF: (Cam3D & {t: number})[] = [
  {t: 0, x: 60, y: 380, mpp: 0.85, rot: -45, tilt: 64},
  {t: 2.3, x: 0, y: 0, mpp: 1.22, rot: -45, tilt: 0},
];
const Lotes: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const [a, b] = LOTES_KF;
  const p = interpolate(t, [a.t, b.t], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cam: Cam3D = {x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, mpp: Math.exp(Math.log(a.mpp) + (Math.log(b.mpp) - Math.log(a.mpp)) * p), rot: -45, tilt: a.tilt * (1 - p)};
  return (
    <Entra f0={6}>
      <Mapa3D cam={cam} oscurecer={interpolate(t, [1.6, 2.4], [0, 0.22], clamp)} />
      <Grande top={300} desde={s(0.1)} lineas={[{t: '650 LOTES', size: 124, color: C.acento}, {t: 'DESDE 360 m²', size: 76}]} />
    </Entra>
  );
};

// ---------- oferta ----------
const Oferta: React.FC = () => {
  const d1 = s(3.4);
  const d2 = dur('oferta') - d1;
  return (
    <>
      <Sequence durationInFrames={d1}>
        <Entra f0={6}>
          <Clip src="v2/calles.mp4" desde={14.5} d={d1} />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,42,27,.1) 0%, rgba(6,42,27,.55) 40%, rgba(6,42,27,.1) 75%)'}} />
          <Grande top={500} desde={s(0.1)} lineas={[{t: 'CUOTAS DESDE', size: 76}, {t: 'Gs. 200.000', size: 150, color: C.acento}]} />
        </Entra>
      </Sequence>
      <Sequence from={d1} durationInFrames={d2}>
        <Entra f0={8}>
          <Foto src="v2/foto5.jpg" d={d2} zoom={[1.03, 1.14]} />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,42,27,.1) 0%, rgba(6,42,27,.55) 40%, rgba(6,42,27,.1) 75%)'}} />
          <Grande top={470} desde={s(0.05)} lineas={[{t: 'HASTA 130 MESES', size: 82}, {t: 'O AL CONTADO', size: 82, color: C.acento}]} />
          <div style={{position: 'absolute', left: 80, right: 80, top: 780, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 600, fontSize: 30, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,.8)'}}>Cada lote tiene su propia cuota y condición comercial.</div>
        </Entra>
      </Sequence>
    </>
  );
};

// ---------- Tour Virtual: grabación real, montos tapados (varían por lote) ----------
const TOUR_DESDE = 47.3;
const POPUPS = [[49.15, 51.25]];
const Tour: React.FC = () => {
  const f = useCurrentFrame();
  const t = TOUR_DESDE + f / FPS;
  const popup = POPUPS.some(([a, b]) => t >= a && t <= b);
  const k = 620 / 382;
  const top = -90 * k;
  const caja = (y0: number, y1: number) => (
    <div style={{position: 'absolute', left: 20 * k, width: 345 * k, top: top + y0 * k, height: (y1 - y0) * k, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, paddingLeft: 28 * k}}>
      <div style={{width: '62%', height: 14, borderRadius: 7, background: '#d7dfd9'}} />
      <div style={{width: '44%', height: 14, borderRadius: 7, background: '#d7dfd9'}} />
    </div>
  );
  const ent = interpolate(f, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.verde} 0%, ${C.verdeOscuro} 100%)`, opacity: ent}}>
      <Grande top={170} lineas={[{t: 'TOUR VIRTUAL', size: 78}]} />
      <div style={{position: 'absolute', left: 540 - 310 - 16, top: 340, width: 620 + 32, height: 1030 + 32, borderRadius: 64, background: '#0b0f0d', boxShadow: '0 40px 90px rgba(0,0,0,.6)', transform: `translateY(${(1 - ent) * 160}px)`}}>
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
      <div style={{position: 'absolute', left: 40, right: 40, top: 272, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 600, fontSize: 25, color: 'rgba(255,255,255,.88)'}}>Recorré el proyecto y elegí tu lote</div>
    </AbsoluteFill>
  );
};

// ---------- cierre emocional ----------
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const luz = interpolate(f, [0, dur('cierre')], [0.0, 0.18], clamp);
  return (
    <Entra f0={12}>
      <Foto src="v2/foto7.jpg" d={dur('cierre')} zoom={[1.16, 1.03]} panY={70} grade="sepia(.18) saturate(1.15) brightness(1.04)" />
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(255,190,90,${0.12 + luz}) 0%, rgba(255,170,80,0) 45%, rgba(6,42,27,.55) 100%)`}} />
      <Grande top={360} desde={s(0.15)} lineas={[{t: 'PORTAL DE', size: 96}, {t: 'SANTANÍ', size: 128, color: C.acento}]} />
      <Grande top={690} desde={s(2.0)} lineas={[{t: 'un lugar para empezar', size: 52, peso: 700, italic: true}, {t: 'tu próxima historia', size: 52, peso: 700, italic: true}]} />
    </Entra>
  );
};

// ---------- placa final (se sostiene con música después de la voz) ----------
const Placa: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = (t: number) => spring({frame: f - s(t), fps, config: {damping: 16, stiffness: 120}});
  const a = sp(0.1);
  const b = sp(0.35);
  const c = sp(3.5); // "Escribinos por WhatsApp" (58,9 s)
  const d = sp(3.8);
  const e = sp(0.9);
  const z = interpolate(f, [0, dur('placa')], [1.12, 1.0], clamp);
  const [x0, y0, x1, y1] = SAT.L2.rel;
  return (
    <Entra f0={12}>
      <AbsoluteFill style={{overflow: 'hidden', background: C.verdeOscuro}}>
        <Img src={staticFile(SAT.L2.file)} style={{position: 'absolute', left: 540 - (x1 - x0) / 2.6 / 2, top: 960 - (y1 - y0) / 2.6 / 2, width: (x1 - x0) / 2.6, height: (y1 - y0) / 2.6, transform: `rotate(-45deg) scale(${z})`, filter: 'blur(3px) saturate(1.1)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(6,42,27,.72) 0%, rgba(6,42,27,.93) 70%)'}} />
      </AbsoluteFill>
      {/* 1 · proyecto y mensaje */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 92, color: '#fff', lineHeight: 1.02, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, textShadow: '0 6px 24px rgba(0,0,0,.5)'}}>
        PORTAL DE<br /><span style={{color: C.acento}}>SANTANÍ</span>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 500, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 48, color: '#fff', lineHeight: 1.2, opacity: b, transform: `translateY(${(1 - b) * 40}px)`}}>
        ¿QUERÉS CONOCER LOS LOTES DISPONIBLES?
      </div>
      {/* 2 · asesor independiente (sin logos de terceros cerca) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontFamily: 'Montserrat', opacity: e, transform: `translateY(${(1 - e) * 30}px)`}}>
        <div style={{width: 120, height: 4, background: C.acento, borderRadius: 2, margin: '0 auto 26px'}} />
        <div style={{fontWeight: 800, fontSize: 74, color: '#fff', lineHeight: 1.05, textShadow: '0 4px 18px rgba(0,0,0,.45)'}}>Adolfo Castillo</div>
        <div style={{fontWeight: 700, fontSize: 34, color: C.acento, letterSpacing: 6, marginTop: 10}}>ASESOR INMOBILIARIO</div>
      </div>
      {/* 3 · WhatsApp */}
      <div style={{position: 'absolute', left: 100, right: 100, top: 960, borderRadius: 30, background: '#25D366', boxShadow: '0 18px 50px rgba(0,0,0,.45)', padding: '20px 10px 24px', textAlign: 'center', fontFamily: 'Montserrat', color: '#fff', opacity: c, transform: `scale(${0.9 + 0.1 * c})`}}>
        <div style={{fontWeight: 800, fontSize: 36, letterSpacing: 2}}>ESCRIBINOS POR WHATSAPP</div>
        <div style={{fontWeight: 900, fontSize: 70, lineHeight: 1.1, marginTop: 4, opacity: d}}>+595 976 557 380</div>
      </div>
    </Entra>
  );
};

// ---------- montaje ----------
const Escena: React.FC<{id: Id; children: React.ReactNode}> = ({id, children}) => (
  <Sequence from={s(T[id][0])} durationInFrames={dur(id)}>
    {children}
  </Sequence>
);

const TituloPortal: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, s(1.15), s(1.45)], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: o, transform: `scale(${0.94 + 0.06 * o})`, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 108, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.8)', lineHeight: 1}}>
      PORTAL DE<br /><span style={{color: C.acento}}>SANTANÍ</span>
    </div>
  );
};

const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = datos.subtitulos.find((x) => t >= x.desde && t <= x.hasta);
  if (!c) return null;
  const o = interpolate(t, [c.desde, c.desde + 0.1, c.hasta - 0.1, c.hasta], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1440, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{background: 'rgba(0,0,0,.74)', color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, lineHeight: 1.22, textAlign: 'center', padding: '12px 26px', borderRadius: 16, maxWidth: 960}}>{c.texto}</div>
    </div>
  );
};

// música: baja suave bajo la voz, sube en los espacios y sostiene la placa final
const volMusica = (f: number) => {
  const t = f / FPS;
  let dmin = 99;
  for (const x of datos.frases) dmin = Math.min(dmin, t < x.desde ? x.desde - t : t > x.hasta ? t - x.hasta : 0);
  const base = 0.2 + 0.45 * interpolate(dmin, [0.15, 0.7], [0, 1], clamp);
  const cola = t > datos.finVoz - 1.4 ? interpolate(t, [datos.finVoz - 1.4, datos.finVoz + 0.4], [0.2, 0.7], clamp) : 0;
  return Math.max(base, cola);
};

const CORTES = [6.4, 20.6, 26.4, 31.4, 35.6, 38.6, 45.6, 50.4, 55.3];

export const ReelV3: React.FC<{subtitulos: boolean}> = ({subtitulos}) => {
  const f = useCurrentFrame();
  const negro = interpolate(f, [DUR_V3 - s(1.0), DUR_V3 - 1], [0, 1], clamp);
  const abre = interpolate(f, [0, s(0.8)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Escena id="viaje">
        <Clip src="v2/ruta.mp4" desde={28.0} d={dur('viaje')} zoom={[1.1, 1.22]} grade="sepia(.08)" />
      </Escena>
      <Escena id="santani">
        <Entra f0={10}>
          <Santani />
        </Entra>
      </Escena>
      <Escena id="regreso">
        <Sequence durationInFrames={s(2.9)}>
          <Entra f0={8}>
            <Clip src="v2/ruta.mp4" desde={35.0} d={s(2.9)} />
          </Entra>
        </Sequence>
        <Sequence from={s(2.9)}>
          <Entra f0={8}>
            <Foto src="v2/foto3.jpg" d={dur('regreso') - s(2.9)} />
          </Entra>
        </Sequence>
      </Escena>
      <Escena id="entrada">
        <Entra f0={8}>
          <Clip src="v2/entrada.mp4" desde={9.5} d={dur('entrada')} zoom={[1.0, 1.1]} />
        </Entra>
      </Escena>
      <Escena id="vista360">
        <Entra f0={8}>
          <Vista360 />
        </Entra>
      </Escena>
      <Escena id="lotes">
        <Lotes />
      </Escena>
      <Escena id="oferta">
        <Oferta />
      </Escena>
      <Escena id="tour">
        <Tour />
      </Escena>
      <Escena id="cierre">
        <Cierre />
      </Escena>
      <Escena id="placa">
        <Placa />
      </Escena>
      {/* "Portal de Santaní" (30,4 s): título sobre la entrada que continúa al subir la vista 360 */}
      <Sequence from={s(30.3)} durationInFrames={s(1.5)}>
        <TituloPortal />
      </Sequence>
      {subtitulos ? <Subtitulos /> : null}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(negro, abre), pointerEvents: 'none'}} />

      <Sequence from={s(datos.vo)}>
        <Audio src={staticFile('v3/voz_v3.wav')} />
      </Sequence>
      <Audio src={staticFile('v3/musica_v3.wav')} volume={volMusica} />
      {CORTES.filter((c) => c !== 55.3 && c !== 50.4).map((c) => (
        <Sequence key={c} from={s(c) - 6} durationInFrames={s(1)}>
          <Audio src={staticFile('audio/sfx/whoosh.wav')} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={s(T.placa[0] + 3.8)} durationInFrames={s(1)}>
        <Audio src={staticFile('audio/sfx/notif.wav')} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
