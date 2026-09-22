/* Gera prototype/_artifact.html a partir do index.html.

   O Artifact envolve o ficheiro publicado no seu próprio esqueleto
   (doctype, html, head, body, reset), por isso o que publicamos tem de ser
   só o conteúdo do body, com o <title> e os <link> no topo.
   Os CSS e JS vão como ficheiros de apoio, nos mesmos caminhos relativos.

   Correr sempre que o index.html mudar, antes de republicar. */

const fs = require('fs');

const SRC = 'prototype/index.html';
const OUT = 'prototype/_artifact.html';

const html = fs.readFileSync(SRC, 'utf8');

const i = html.indexOf('<body>');
const j = html.lastIndexOf('</body>');
if (i < 0 || j < 0 || j < i) {
  console.error('body não encontrado em', SRC);
  process.exit(1);
}
const corpo = html.slice(i + '<body>'.length, j).trim();

/* Os <link> do head original, na mesma ordem. */
const links = (html.slice(0, i).match(/<link[^>]*>/g) || []).join('\n');

const saida = [
  '<title>DoMyTrip</title>',
  links,
  '',
  corpo,
  '',
].join('\n');

fs.writeFileSync(OUT, saida);
console.log(OUT, '—', saida.length, 'bytes |', (corpo.match(/<section/g) || []).length, 'ecrãs');
