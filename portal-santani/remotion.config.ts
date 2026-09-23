import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

// Chromium preinstalado en el entorno (evita descargas). Si no existe, Remotion usa el suyo.
const shell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(shell)) Config.setBrowserExecutable(shell);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(17);
Config.setAudioCodec('aac');
Config.setOverwriteOutput(true);
