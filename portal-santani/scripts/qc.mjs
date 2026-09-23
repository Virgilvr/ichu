// Control de calidad previo al render + generación de subtítulos SRT.
// Uso: npm run qc   (falla con código 1 si hay errores bloqueantes)
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const D = JSON.parse(fs.readFileSync(path.join(raiz, 'src/datos.json'), 'utf8'));
const errores = [];
const avisos = [];

const resolver = (t) => (t.startsWith('@') ? D.distancias[t.slice(1)].texto : t);
const textos = D.escenas.flatMap((e) => e.textos.map(resolver));
const todo = [...textos, ...D.locucion.map((l) => l.texto)].join(' | ');

// 1. Datos verificados que deben aparecer
const requeridos = ['650', '360 m²', '200.000', '130 MESES', 'CONTADO', 'SANTANÍ', 'WHATSAPP', 'Cada lote tiene su propia cuota'];
const todoCta = `${todo} | WhatsApp: ${D.whatsapp} | ${D.asesor?.nombre ?? ''}`.toUpperCase();
for (const r of requeridos) if (!todoCta.includes(r.toUpperCase())) errores.push(`Falta en pantalla/locución: "${r}"`);

// 2. Montos: solo se permite Gs. 200.000 (cuota "desde"); nada de valores por lote
const montos = [...todo.matchAll(/Gs\.?\s*([\d.]+)/g)].map((m) => m[1]);
for (const m of montos) if (m !== '200.000') errores.push(`Monto no autorizado en el Reel: Gs. ${m}`);

// 3. Afirmaciones de ubicación no verificadas
if (/700\s*m/.test(todo)) errores.push('"700 m de la Ruta 3" contradice el KMZ + OSM (≈1,4 km). Confirmar antes de usar.');
if (/2\s*min/.test(todo)) avisos.push('"2 min" al almacén Ka\'avo no es verificable (≥2,4 km en línea recta).');
for (const [k, v] of Object.entries(D.distancias)) if (!v.verificado) avisos.push(`Distancia "${k}" marcada como NO verificada.`);

// 4. Disponibilidad inventada
if (/quedan|últimos|agotad|disponibles:\s*\d/i.test(todo)) errores.push('Texto sugiere disponibilidad específica: no permitido.');

// 5. Archivos
const existe = (p) => fs.existsSync(path.join(raiz, 'public', p));
for (const n of ['L0', 'L1', 'L2']) if (!existe(`sat/${n}.jpg`)) errores.push(`Falta imagen satelital public/sat/${n}.jpg`);
if (!existe('geo/proyecto.json')) errores.push('Falta public/geo/proyecto.json (npm run geo)');
if (D.audio.sfx && !existe('audio/sfx/impacto.wav')) errores.push('Faltan SFX (npm run sfx)');
for (const k of ['voz', 'musica']) {
  if (D.audio[k] && !existe(D.audio[k])) errores.push(`Audio "${k}" declarado pero no existe: public/${D.audio[k]}`);
  if (!D.audio[k]) avisos.push(`Sin ${k}: el video saldrá ${k === 'voz' ? 'sin locución' : 'sin música'}.`);
}
if (D.tour.grabacion && !existe(D.tour.grabacion)) errores.push(`Grabación del Tour no encontrada: public/${D.tour.grabacion}`);
if (D.marca.logo && !existe(D.marca.logo)) errores.push(`Logo no encontrado: public/${D.marca.logo}`);
if (!D.marca.logo) avisos.push('Sin logo de Trebol Loteadora: se muestra solo texto.');
if (D.whatsapp.includes('[')) avisos.push('WhatsApp sin número real: se muestra el marcador [WHATSAPP].');
if (!/^\+595 9\d{2} \d{3} \d{3}$/.test(D.whatsapp) && !D.whatsapp.includes('[')) errores.push(`Formato de WhatsApp inesperado: ${D.whatsapp}`);

// 6. Duración
const total = D.escenas.reduce((a, e) => a + e.dur, 0);
if (total < 30 || total > 45) errores.push(`Duración ${total}s fuera del rango 30–45 s`);
const tour = D.escenas.find((e) => e.id === 'tour');
if (tour && (tour.dur < 5 || tour.dur > 6)) avisos.push(`Escena Tour dura ${tour.dur}s (pedido: 5–6 s)`);
const fin = D.locucion.at(-1).hasta;
if (fin > total) errores.push(`La locución termina (${fin}s) después del video (${total}s)`);

// SRT
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`;
};
const srt = D.locucion.map((l, i) => `${i + 1}\n${ts(l.desde)} --> ${ts(l.hasta)}\n${l.texto}\n`).join('\n');
fs.mkdirSync(path.join(raiz, 'output'), {recursive: true});
fs.writeFileSync(path.join(raiz, 'output/subtitulos.srt'), srt);

console.log(`Duración: ${total}s · Escenas: ${D.escenas.length} · SRT: output/subtitulos.srt`);
avisos.forEach((a) => console.log('  AVISO  ', a));
errores.forEach((e) => console.log('  ERROR  ', e));
if (errores.length) {
  console.log(`\n✗ QC con ${errores.length} error(es). No renderizar.`);
  process.exit(1);
}
console.log('\n✓ QC sin errores bloqueantes.');
