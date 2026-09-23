import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {at, C, D, esc} from './config';
import {Mapa} from './components/Mapa';
import {Subtitulos} from './components/Subtitulos';
import {Sonido} from './components/Sonido';
import {Cercania, Cta, Financiacion, Gancho, Precio, Proyecto, Ubicacion} from './scenes/Escenas';
import {Tour} from './scenes/Tour';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ESCENA: Record<string, React.FC> = {
  gancho: Gancho,
  ubicacion: Ubicacion,
  proyecto: Proyecto,
  precio: Precio,
  financiacion: Financiacion,
  cercania: Cercania,
  tour: Tour,
  cta: Cta,
};

export const Reel: React.FC<{subtitulos: boolean}> = ({subtitulos}) => {
  const f = useCurrentFrame();
  // Oscurecido y desenfoque del mapa según la escena (transiciones suaves)
  const oscurecer = interpolate(
    f,
    [at('gancho', 0), at('gancho', 1), at('precio', 0), at('precio', 0.08), at('financiacion', 0.9), at('cercania', 0.1), at('tour', 0), at('tour', 0.1), at('cta', 0), at('cta', 0.12)],
    [0.35, 0.1, 0.1, 0.5, 0.4, 0.05, 0.05, 0.3, 0.3, 0.68],
    clamp,
  );
  const desenfoque = interpolate(f, [at('tour', 0), at('tour', 0.12), at('tour', 0.9), at('cta', 0.1)], [0, 9, 9, 4], clamp);

  const ids = D.escenas.map((e) => e.id);
  return (
    <AbsoluteFill style={{background: C.verdeOscuro}}>
      <Mapa oscurecer={oscurecer} desenfoque={desenfoque} />
      {ids.map((id) => {
        const e = esc(id);
        const Comp = ESCENA[id];
        return (
          <Sequence key={id} from={e.from} durationInFrames={e.dur} layout="none">
            <Comp />
          </Sequence>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 500, fontSize: 17, color: 'rgba(255,255,255,.6)'}}>
        {D.creditoImagen}
      </div>
      {subtitulos ? <Subtitulos /> : null}
      <Sonido />
    </AbsoluteFill>
  );
};
