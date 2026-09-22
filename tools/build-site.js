/* Prepara a pasta do protótipo para ser publicada.

   Se existir a variável de ambiente GATE_PASSWORD, substitui a palavra-passe
   de desenvolvimento pela real. Assim a palavra-passe que está no repositório
   nunca é a que protege o site.

   Corre como build command no Netlify. Ver DECISIONS.md → ADR-024. */

const fs = require('fs');

const FICHEIRO = 'prototype/js/gate.js';
const pw = process.env.GATE_PASSWORD;

if (!pw) {
  console.log('Sem GATE_PASSWORD definida: fica a palavra-passe do repositório.');
  process.exit(0);
}

const antes = fs.readFileSync(FICHEIRO, 'utf8');
/* Sem âncora de fim de linha: a linha tem um comentário a seguir. */
const depois = antes.replace(
  /^const GATE_PASSWORD = '[^']*';/m,
  `const GATE_PASSWORD = '${pw.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';`
);

if (antes === depois) {
  console.error('Não encontrei a linha GATE_PASSWORD em', FICHEIRO);
  process.exit(1);
}

fs.writeFileSync(FICHEIRO, depois);
console.log('Palavra-passe substituída pela variável de ambiente.');
