import React from 'react';
import {Composition, continueRender, delayRender, Still} from 'remotion';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {FPS, H, TOTAL, W} from './config';
import {Reel} from './Reel';
import {Portada} from './Portada';

// Espera a que Montserrat esté cargada antes de capturar frames
if (typeof document !== 'undefined') {
  const h = delayRender('fuentes');
  Promise.all([500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Montserrat`))).then(() => continueRender(h));
}

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{subtitulos: false}} />
    <Composition id="ReelSubtitulado" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{subtitulos: true}} />
    <Still id="Portada" component={Portada} width={W} height={H} defaultProps={{feed: false}} />
    <Still id="PortadaFeed" component={Portada} width={1080} height={1350} defaultProps={{feed: true}} />
  </>
);
