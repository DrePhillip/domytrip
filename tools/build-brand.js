/* Converte o SVG cru do fal.ai (camadas sobrepostas branco/preto) num shape
   único com recortes reais, que herda a cor por `currentColor`.
   Correr uma vez sempre que o logo for regerado. Ver brand/README.md. */
const fs = require('fs');

const SRC = 'brand/logo-mark-fal.svg';
const VB = { x: 573, y: 573, w: 902, h: 902 };   // caixa quadrada à volta da marca

const src = fs.readFileSync(SRC, 'utf8');
const re = /<path[^>]*fill="rgb\((\d+),(\d+),(\d+)\)"[^>]*d="([^"]+)"[^>]*\/>/g;
const paths = [];
let m;
while ((m = re.exec(src))) paths.push({ dark: +m[1] < 128, d: m[4] });
paths.shift();                                      // fora o fundo branco do vetorizador

const vb = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
const rect = a => `<rect x="${VB.x}" y="${VB.y}" width="${VB.w}" height="${VB.h}" ${a}/>`;
const mask = id =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="${VB.x}" y="${VB.y}" width="${VB.w}" height="${VB.h}">` +
  rect('fill="#000"') +
  paths.map(p => `<path fill="${p.dark ? '#fff' : '#000'}" d="${p.d}"/>`).join('') +
  `</mask>`;
const body = id => mask(id) + rect(`fill="currentColor" mask="url(#${id})"`);

fs.writeFileSync('brand/logo-mark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="64" height="64" role="img" aria-label="DoMyTrip"><title>DoMyTrip</title>${body('dmt-a')}</svg>\n`);

fs.writeFileSync('brand/logo-lockup.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 268 64" width="268" height="64" role="img" aria-label="DoMyTrip"><title>DoMyTrip</title>` +
  `<svg x="0" y="4" width="56" height="56" viewBox="${vb}" overflow="visible">${body('dmt-b')}</svg>` +
  `<text x="70" y="41" fill="currentColor" font-family="Inter, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700" letter-spacing="-1.2">DoMyTrip</text></svg>\n`);

fs.writeFileSync('brand/app-icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="DoMyTrip"><title>DoMyTrip</title>` +
  `<defs><linearGradient id="dmt-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A1A1A"/><stop offset="1" stop-color="#000000"/></linearGradient></defs>` +
  `<rect width="512" height="512" rx="114" fill="url(#dmt-bg)"/>` +
  `<svg x="124" y="124" width="264" height="264" viewBox="${vb}" color="#FFFFFF">${body('dmt-c')}</svg></svg>\n`);

/* Sprite inline para o protótipo: um <symbol> só, usado por <use href="#dmt-mark">.
   Fica inline porque a marca tem de herdar a cor do contexto. */
const sprite =
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true">` +
  `<symbol id="dmt-mark" viewBox="${vb}">${body('dmt-s')}</symbol></svg>`;

const page = 'prototype/index.html';
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  const next = html.replace(
    /<!--LOGO-SPRITE-->[\s\S]*?<!--\/LOGO-SPRITE-->/,
    `<!--LOGO-SPRITE-->${sprite}<!--/LOGO-SPRITE-->`);
  if (!/<!--LOGO-SPRITE-->/.test(html)) console.log('AVISO: marcador LOGO-SPRITE ausente de', page);
  else if (next !== html) { fs.writeFileSync(page, next); console.log('sprite injetado em', page); }
  else console.log('sprite ja atualizado em', page);
}
console.log('paths:', paths.length, '| mark', fs.statSync('brand/logo-mark.svg').size + 'B');
