import React from 'react';
import {Composition, continueRender, delayRender, Still} from 'remotion';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/700-italic.css';
import {FPS, H, TOTAL, W} from './config';
import {Reel} from './Reel';
import {Portada} from './Portada';
import {DUR_PRUEBA, FPS2, PruebaRecorrido} from './v2/PruebaRecorrido';
import {DUR_V2, ReelV2} from './v2/ReelV2';
import {DUR_V3, ReelV3} from './v3/ReelV3';
import {PlacaCierre} from './comun/PlacaCierre';

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
    <Composition id="ReelV2" component={ReelV2} durationInFrames={DUR_V2} fps={30} width={W} height={H} defaultProps={{subtitulos: false}} />
    <Composition id="ReelV2Subtitulado" component={ReelV2} durationInFrames={DUR_V2} fps={30} width={W} height={H} defaultProps={{subtitulos: true}} />
    <Composition id="V2PruebaRecorrido" component={PruebaRecorrido} durationInFrames={DUR_PRUEBA} fps={FPS2} width={W} height={H} />
    <Composition id="ReelV3" component={ReelV3} durationInFrames={DUR_V3} fps={30} width={W} height={H} defaultProps={{subtitulos: false}} />
    <Composition id="ReelV3Subtitulado" component={ReelV3} durationInFrames={DUR_V3} fps={30} width={W} height={H} defaultProps={{subtitulos: true}} />
    <Composition id="ReelV3SubDestacado" component={ReelV3} durationInFrames={DUR_V3} fps={30} width={W} height={H} defaultProps={{subtitulos: true, destacados: true}} />
    {/* Vista previa de la placa genérica (plantilla Video Terrenos): los datos reales van por --props desde proyecto.json */}
    <Composition id="PlacaCierre" component={PlacaCierre} durationInFrames={270} fps={30} width={W} height={H} defaultProps={{proyecto: 'NOMBRE DEL PROYECTO', asesor: 'Nombre del Asesor', rol: 'Asesor Inmobiliario', whatsapp: '+595 9XX XXX XXX'}} />
    <Still id="PortadaFeed" component={Portada} width={1080} height={1350} defaultProps={{feed: true}} />
  </>
);
