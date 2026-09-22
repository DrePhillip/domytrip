# CLAUDE.md — DoMyTrip

Regras de trabalho para qualquer agente ou pessoa que toque neste repositório.
Lê este ficheiro **antes** de escrever código. `DESIGN.md` manda no visual, `DECISIONS.md` regista o porquê.

---

## 1. O que é o DoMyTrip

App móvel que planeia **o que fazer agora, onde estás**.

O utilizador chega a uma cidade (ex.: Roma), abre a app e em menos de 10 segundos tem:
1. um **mapa** com o que há de interessante à volta dele, filtrado pelos gostos dele;
2. um **roteiro para hoje** já montado (ordem, horas, tempos de deslocação);
3. a opção de **juntar-se a outras pessoas** (hangouts) a fazer o mesmo.

Frase que resolve tudo em caso de dúvida de produto:

> **É last-minute. O utilizador está de pé, na rua, com bateria a 30%. Decide por ele.**

### O que o DoMyTrip NÃO é
- Não é um planeador de férias com meses de antecedência.
- Não é um guia turístico para ler. É para *fazer*.
- Não é uma rede social. Os hangouts servem o roteiro, não o contrário.

---

## 2. Princípios de produto (por ordem de prioridade)

1. **Zero-input por defeito.** Se conseguimos inferir, não perguntamos. O onboarding é a única altura em que pedimos gostos: uma pergunta por ecrã, cada uma com uma linha a explicar porque a fazemos.
2. **Uma decisão por ecrã.** Tal como o Uber: vês um mapa, uma folha por baixo, um botão preto. Nunca dois CTAs primários no mesmo ecrã.
3. **O mapa é a casa.** Toda a navegação principal volta ao mapa. O mapa nunca é um ecrã secundário.
4. **Proximidade ganha a popularidade.** Um museu a 6 minutos bate um museu 5 estrelas a 40 minutos. Ordenar sempre por custo de deslocação primeiro.
5. **O roteiro é uma sugestão, não um contrato.** Tudo tem de poder ser removido, trocado ou reordenado com um toque.
6. **Estado sempre visível.** O utilizador tem de saber, a qualquer momento: onde está, o que vem a seguir, e quanto tempo falta.

---

## 3. Arquitetura de informação

```
Splash
 └─ Login
     └─ Onboarding (5 passos: cidade → interesses → ritmo → orçamento → hangouts)
         └─ Home
             ├─ [tab] Explorar   → Mapa + bottom sheet (scroll = roteiro do dia)
             ├─ [tab] Roteiro    → Timeline do dia, editável
             ├─ [tab] Hangouts   → Grupos perto de ti
             └─ [tab] Perfil     → Gostos, histórico, recibos
         └─ Detalhe de local  (overlay sobre o mapa, com rota traçada)
         └─ Viagem ativa      (a decorrer, ETA, próximo passo)
         └─ Recibo do dia     (resumo, custo, distância — estilo recibo Uber)
```

Regra: **nada com mais de 2 níveis de profundidade a partir do mapa.**

---

## 4. Stack e estrutura de ficheiros

Protótipo atual — ver `DECISIONS.md` (ADR-001) para o porquê:

```
DoMyTrip/
├── CLAUDE.md          ← este ficheiro
├── DESIGN.md          ← sistema de design, tokens, componentes
├── DECISIONS.md       ← registo de decisões (ADR)
├── brand/             ← logo (SVG vetorizado + fonte fal.ai)
├── tools/
│   ├── serve.js         ← servidor estático sem dependências, só para dev
│   ├── build-brand.js   ← converte o SVG do fal.ai e injeta o sprite no index.html
│   ├── build-publish.js ← gera _artifact.html para publicar no claude.ai
│   └── build-site.js    ← injeta a palavra-passe real no build do Netlify
└── prototype/
    ├── index.html     ← todos os ecrãs, um por <section class="screen">
    ├── css/tokens.css ← APENAS variáveis. Nenhuma regra de componente.
    ├── css/app.css    ← componentes e ecrãs
    └── js/
        ├── data.js    ← dados mock (POIs, hangouts, interesses). Sem lógica.
        ├── map.js     ← desenho do mapa SVG, pins, rotas, câmara
        ├── app.js     ← estado, navegação, geração do roteiro
        └── gate.js    ← porta com palavra-passe (obstáculo, não segurança)
```

### Regras de código
- **Vanilla JS, sem build step.** Abrir `prototype/index.html` no browser tem de funcionar. Sem `npm install`, sem bundler, sem framework.
- **Sem dependências externas em runtime.** Nada de CDN de JS. A única exceção permitida é a folha de estilo de tipos do Google Fonts, com fallback de sistema.
- **Estado num só sítio.** Todo o estado da app vive no objeto `state` em `app.js`. Nunca guardar estado no DOM (excepto `data-*` de apresentação).
- **Dados fora da lógica.** Se é um POI, um hangout ou um interesse, vive em `data.js`. Se é uma regra, vive em `app.js`.
- **Nomes em português nos dados, inglês no código.** `poi.nome`, `poi.categoria`; mas `function renderItinerary()`.
- **Nada de cores literais fora de `tokens.css`.** Se precisas de uma cor nova, adiciona um token. Ver `DESIGN.md §2`.
- **Nunca `!important`.** Se precisas dele, a cascata está errada.
- **Comentários só para o "porquê".** O "o quê" tem de se ler no código.

---

## 5. Regras de UI que não se negoceiam

Estas vêm diretamente da linguagem Uber e estão detalhadas em `DESIGN.md`:

- Botão primário é **preto, largura total, texto branco, raio 8px**. Só um por ecrã.
- A **bottom sheet** tem sempre 3 posições de encaixe: `peek` / `half` / `full`. Nunca uma posição livre.
- **Durante a viagem ativa a folha fica em `peek`**, e a ação principal do painel tem de caber lá dentro. Se não couber, o painel está mal ordenado — não é o encaixe que muda. Ver ADR-019.
- O **verde `--accent`** é reservado a quatro coisas: posição do utilizador, rota, paragens do roteiro e seleção. Mais nada, em lado nenhum.
- **Rotas a verde**, sólidas para transporte e tracejadas para caminhada.
- **Texto verde usa `--accent-press`**, nunca `--accent` — este último não passa o contraste sobre branco.
- Nada de sombras difusas grandes. Elevação faz-se com **1px de borda** ou uma sombra curta e escura.
- Texto de estado (ETA, distância, preço) é **tabular e alinhado à direita**.
- Toda a área tocável tem no mínimo **44×44 px**.
- **Abaixo de 480px a moldura de telemóvel desaparece** e a app ocupa o ecrã todo. Qualquer regra nova que a moldura precise tem de ser anulada lá. Ver ADR-023.
- **Tudo o que é premido encolhe**, com `--ease-spring`. Um elemento tocável sem resposta é um bug.
- **No mapa, só o boneco tem personalidade.** Pins e quarteirões são discretos de propósito. Ver ADR-017.
- **Um número só tem uma fonte.** Se os minutos a pé aparecem na pílula e no painel, vêm do mesmo sítio. Duas fontes para o mesmo valor divergem sempre. Ver ADR-020.
- **O mapa arrasta-se e tem zoom.** Qualquer gesto novo sobre o mapa tem de respeitar o limiar de arrasto e a bandeira `MapView.panned`, senão volta a roubar os toques aos pins.
- **Marcadores e etiquetas não crescem com o zoom.** Tudo o que é marcador vive num grupo com contra-escala. Ver ADR-021.
- **No mapa, só a camada dos pins recebe toques.** Etiquetas, rota e boneco levam `pointer-events: none`. Uma camada decorativa por cima dos pins rouba-lhes os toques sem dar erro nenhum. Ver ADR-022.
- **Alvo de toque dos pins: 57px.** O mínimo de 44 é o mínimo, não o objetivo.
- **Mudanças no mapa verificam-se a clicar**, não a chamar a função por consola. `selectPoi(id)` pode funcionar enquanto nenhum pin abre.
- **Nunca animar `transform` por CSS num elemento SVG posicionado pelo atributo `transform`.**
  A animação substitui o atributo e o elemento desaparece. Ver `DESIGN.md §2.7` e ADR-011.

---

## 6. Como trabalhar aqui

### Antes de mudar alguma coisa
1. Lê `DESIGN.md` se a alteração for visual.
2. Lê `DECISIONS.md` se a alteração contrariar algo já decidido. Se contrariar mesmo, **escreve um ADR novo** que substitua o antigo — não edites o antigo em silêncio.

### Ao acrescentar um ecrã
1. Acrescenta `<section class="screen" id="screen-x">` em `index.html`.
2. Regista-o em `SCREENS` em `app.js`.
3. Navega sempre por `go('x')`. Nunca mexas em `classList` de ecrãs diretamente.

### Ao acrescentar um componente visual
1. Verifica se já existe em `DESIGN.md §5`. Reutiliza antes de criar.
2. Se for mesmo novo, documenta-o em `DESIGN.md` **na mesma alteração**. Um componente não documentado é considerado um bug.

### Dados mock
- Cidade de referência: **Roma**. Todos os exemplos e ecrãs usam Roma.
- Cada POI tem `destaques` e `dica` escritos à mão e **específicos daquele sítio**. Uma dica que serve para qualquer museu não serve para nenhum — nesse caso, não se escreve.
- Utilizador de referência: **André**, gosta de museus, história e comida.
- As coordenadas dos POIs são coordenadas do canvas do mapa (`0–1200`), **não** lat/lon. Ver ADR-004.

---

## 7. Marca

- Nome: **DoMyTrip** (uma palavra, T maiúsculo).
- O logo vive em `brand/`. É gerado com fal.ai e vetorizado com fal.ai — os prompts e o comando exatos estão em `brand/README.md`. Não desenhar logos à mão sem registar porquê.
- A marca é um **monograma D**. Paleta: preto real, branco, cinzentos frios e um verde `#00B37E`. Ver `DESIGN.md §2` e ADR-013/015.

---

## 8. Onde isto vive

- **Código:** `github.com/DrePhillip/domytrip`, privado. Ramo `main`.
- **Site:** Netlify, a partir de `prototype/`. Cada push republica.
- **A palavra-passe do site nunca é commitada.** Vem da variável de ambiente `GATE_PASSWORD` e é injetada por `tools/build-site.js` no build. A que está no repositório é só a de desenvolvimento. Ver ADR-024.

---

## 9. Estado atual e limites conhecidos

- O protótipo é **clicável, não funcional**: não há backend, login real, GPS ou mapa real.
- O mapa é desenhado à mão em SVG, plano, e representa Roma de forma estilizada, não geográfica. Ver ADR-016.
- O roteiro é gerado por uma heurística simples sobre os dados mock (ver `generateItinerary()` em `app.js`), não por um motor de recomendação.
- Estes limites são intencionais nesta fase. Ver `DECISIONS.md`.
