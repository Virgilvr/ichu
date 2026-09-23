import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {D, esc, ESCENAS, FPS, TOTAL} from '../config';

const s = (seg: number) => Math.round(seg * FPS);

/** Eventos de efectos de sonido anclados a las escenas. */
const EVENTOS: {archivo: string; frame: number; vol?: number}[] = [
  ...ESCENAS.slice(1).map((e) => ({archivo: 'whoosh', frame: e.from - 4, vol: 0.55})),
  {archivo: 'pop', frame: esc('ubicacion').from + s(0.4)},
  {archivo: 'brillo', frame: esc('proyecto').from + Math.round(esc('proyecto').dur * 0.45), vol: 0.6},
  {archivo: 'impacto', frame: esc('precio').from + s(1.4), vol: 0.9},
  {archivo: 'pop', frame: esc('financiacion').from + 4, vol: 0.7},
  {archivo: 'pop', frame: esc('financiacion').from + s(1.2) + 2, vol: 0.7},
  {archivo: 'pop', frame: esc('cercania').from + s(1.1), vol: 0.6},
  {archivo: 'tap', frame: esc('tour').from + s(1.75)},
  {archivo: 'notif', frame: esc('cta').from + s(1.7) + 8, vol: 0.9},
];

export const Sonido: React.FC = () => {
  const a = D.audio;
  const hayVoz = Boolean(a.voz);
  // Música con "ducking": baja cuando hay locución
  const volMusica = (f: number) => {
    const t = f / FPS;
    const fadeOut = interpolate(f, [TOTAL - s(1), TOTAL], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const enVoz = hayVoz && D.locucion.some((l) => t >= l.desde - 0.2 && t <= l.hasta + 0.2);
    return (enVoz ? a.volumenMusicaBajoVoz : a.volumenMusica) * fadeOut;
  };
  return (
    <>
      {a.voz ? <Audio src={staticFile(a.voz)} /> : null}
      {a.musica ? <Audio src={staticFile(a.musica)} volume={volMusica} /> : null}
      {a.sfx
        ? EVENTOS.map((e, i) => (
            <Sequence key={i} from={Math.max(0, e.frame)} durationInFrames={s(2.5)}>
              <Audio src={staticFile(`audio/sfx/${e.archivo}.wav`)} volume={e.vol ?? 0.8} />
            </Sequence>
          ))
        : null}
    </>
  );
};
