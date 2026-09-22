/* Prepara a pasta do protótipo para ser publicada. Corre no workflow do
   GitHub Pages (e serve igualmente como build command do Netlify).

   Faz duas coisas:

   1. Substitui a palavra-passe pela variável de ambiente GATE_PASSWORD,
      para a que está no repositório nunca ser a que protege o site.

   2. Carimba os CSS e JS com uma versão, para a cache não servir os
      ficheiros antigos. O GitHub Pages manda cache de 10 minutos: sem isto,
      quem já tivesse aberto o site continuava com a palavra-passe antiga a
      funcionar depois de ela mudar.

   Ver DECISIONS.md → ADR-024 e ADR-026. */

const fs = require('fs');

const GATE = 'prototype/js/gate.js';
const HTML = 'prototype/index.html';

/* ---------- 1. palavra-passe ---------- */
const pw = process.env.GATE_PASSWORD;

if (!pw) {
  console.log('Sem GATE_PASSWORD definida: fica a palavra-passe do repositório.');
} else {
  const antes = fs.readFileSync(GATE, 'utf8');
  /* Sem âncora de fim de linha: a linha tem um comentário a seguir. */
  const depois = antes.replace(
    /^const GATE_PASSWORD = '[^']*';/m,
    `const GATE_PASSWORD = '${pw.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';`
  );
  if (antes === depois) {
    console.error('Não encontrei a linha GATE_PASSWORD em', GATE);
    process.exit(1);
  }
  fs.writeFileSync(GATE, depois);
  console.log('Palavra-passe substituída pela variável de ambiente.');
}

/* ---------- 2. versão nos ficheiros ---------- */
const versao = (process.env.GITHUB_SHA || String(Date.now())).slice(0, 8);

const html = fs.readFileSync(HTML, 'utf8');
let n = 0;
const carimbado = html.replace(
  /(href|src)="((?:css|js)\/[^"?]+)"/g,
  (_, attr, caminho) => { n++; return `${attr}="${caminho}?v=${versao}"`; }
);

if (!n) {
  console.error('Não carimbei nenhum ficheiro em', HTML, '— o padrão mudou?');
  process.exit(1);
}

fs.writeFileSync(HTML, carimbado);
console.log(`${n} ficheiros carimbados com a versão ${versao}.`);
