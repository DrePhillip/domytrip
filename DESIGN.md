# DESIGN.md — Sistema de design DoMyTrip

A referência é o **Uber**: preto, branco, cinzentos frios, tipografia densa e funcional, o mapa a mandar no ecrã. Nada decorativo, sem gradientes, sem fotografia de fundo.

A única coisa nossa, e deliberada, é o **verde** `#00B37E` e o **boneco** do utilizador. O verde só aparece onde é informação: onde estás, para onde vais, o que está escolhido. O boneco é o único sítio do mapa onde há carácter — tudo o resto recua para o deixar ler.

Este documento é normativo. Se o código e este documento discordarem, um dos dois é um bug.

---

## 1. Princípios visuais

1. **Preto, branco, cinzento — e um verde.** O acento aparece em quatro sítios: posição do utilizador, rota, paragens do roteiro e estado selecionado. Mais nada.
2. **O mapa é o fundo, não um cartão.** De bordo a bordo. A UI flutua por cima.
3. **Nada de gradientes nem fotografia.** Os ecrãs de marca são preto sólido; os de trabalho são branco. A única exceção é o cone de direção do boneco, que precisa de esbater para não parecer uma fatia sólida.
4. **Contraste por peso, não por cor.** Hierarquia com tamanho e peso de letra.
5. **Bordas antes de sombras.** 1px em `--line` separa melhor do que um blur.
6. **Movimento curto e com mola.** Entre 140ms e 380ms; só o traçado da rota chega aos 640ms.
7. **Tudo plano.** O mapa não tem relevo e os pins não têm volume. O único elemento com personalidade no mapa é o boneco do utilizador. Ver ADR-016.

---

## 2. Tokens

Todos em `prototype/css/tokens.css`. **Nenhuma cor literal pode aparecer fora desse ficheiro.**

### 2.1 Cor — base

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#000000` | Texto principal, botão primário, ecrãs de marca |
| `--ink-2` | `#1A1A1A` | Estado premido do preto |
| `--ink-3` | `#545454` | Texto secundário |
| `--ink-4` | `#8E8E93` | Texto terciário, ícones inativos |
| `--surface` | `#FFFFFF` | Folhas, cartões, barras |
| `--surface-2` | `#F5F5F6` | Campos, miniaturas, botões secundários |
| `--surface-3` | `#EAEAEC` | Estados premidos |
| `--line` | `#E2E2E4` | Bordas e divisórias |
| `--line-strong` | `#C7C7CC` | Pega da folha, radios |

### 2.2 Cor — acento

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#00B37E` | **Exclusivo**: posição, rota, paragens do roteiro, seleção |
| `--accent-press` | `#00946A` | Premido, e texto verde sobre branco (contraste) |
| `--accent-soft` | `#E4F7F0` | Fundo de estado selecionado |
| `--amber` | `#B36B00` | "Fecha às …" |
| `--red` | `#D6301C` | Erro, fechado, remover |

Nota de contraste: `--accent` sobre branco fica em 2.9:1. **Texto verde usa sempre `--accent-press`** (4.6:1). O `--accent` puro é só para preenchimentos e traços.

### 2.3 Cor — mapa

| Token | Valor | Uso |
|---|---|---|
| `--map-land` | `#EDEDEF` | Terreno |
| `--map-road` | `#FFFFFF` | Ruas, avenidas, piazzas, pontes |
| `--map-water` | `#CBDCEA` | Rio Tibre |
| `--map-park` | `#DDE6D9` | Parques |
| `--map-label` | `#8E8E93` | Nomes |
| `--map-block` | `#E3E3E6` | Quarteirões |

O contraste entre `--map-block` e `--map-land` é de propósito quase nulo: os quarteirões são textura, não informação. Se os destacares, começam a competir com os pins.

### 2.4 Tipografia

`Inter` (Google Fonts), fallback `-apple-system, "Segoe UI", Roboto`. É a substituta livre mais próxima do *Uber Move*.

| Token | Tamanho / Peso / Entrelinha | Uso |
|---|---|---|
| `--t-hero` | 38 / 700 / 1.05 | Só o título do login |
| `--t-display` | 30 / 700 / 1.12 | Títulos de onboarding |
| `--t-title` | 21 / 700 / 1.2 | Título de painel, nome de local |
| `--t-heading` | 16 / 650 / 1.3 | Cabeçalho de secção |
| `--t-body` | 15 / 500 / 1.45 | Texto corrente, listas |
| `--t-meta` | 13 / 500 / 1.35 | Distância, hora, categoria |
| `--t-micro` | 11 / 650 / 1.2 | Etiquetas maiúsculas, letter-spacing .09em |

- Estado numérico (ETA, preço, distância) leva `.num` → `tabular-nums`.
- Peso mínimo 500. Títulos a 650 ou 700.
- Letter-spacing negativo cresce com o tamanho: −.01em no corpo, −.035em no hero.

### 2.5 Espaçamento, raio, elevação

Escala de 4 (`--s1` … `--s8`). **Respiro lateral: `--s5` (20px).**

Raios mais fechados do que a média: `--r-sm 8`, `--r-md 12`, `--r-lg 16`, `--r-xl 22` (topo da folha), `--r-pill`. O Uber não é arredondado.

`--e-1` cartão, `--e-2` flutuante sobre o mapa, `--e-3` folha. Sombras neutras e curtas; blur nunca acima de 30px. No SVG usa-se `filter: drop-shadow()`, porque as sombras têm de seguir a forma.

### 2.6 Movimento

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 140ms | Estados premidos |
| `--dur` | 240ms | Transição de ecrã, chips |
| `--dur-slow` | 380ms | Encaixe da folha, pins, entradas |
| `--dur-xslow` | 640ms | Câmara do mapa e traçado da rota |
| `--ease` / `--ease-out` / `--ease-spring` | — | Geral / entradas e câmara / tudo o que é tocado |

- **Tudo o que é premido encolhe**, com `--ease-spring`: botões 0.975, chips 0.94, botões de mapa 0.90.
- Entradas escalonadas: `.stagger > *` com 50ms entre filhos; pins com 40ms.
- `prefers-reduced-motion` desliga pulso, entradas e encurta durações para 0.

### 2.7 Regra de animação em SVG — não negociável

**Nunca animar `transform` por CSS num elemento SVG que use o atributo `transform` para se posicionar.** A animação substitui o atributo e o elemento salta para a origem do mapa quando ela acaba.

Padrão correto, dois grupos:

```xml
<g class="pin" transform="translate(x y)">   <!-- posição: só atributo -->
  <g class="pin-scale" transform="scale(1)"> <!-- animação: só transição -->
```

Vale o mesmo em HTML para elementos centrados com `translateX(-50%)`: a keyframe tem de repetir o translate (ver `pillIn`). Ver ADR-011.

---

## 3. Grelha e layout

- Viewport de referência: **390 × 844**. Testar também a 360 × 800.
- Safe area: 44px em cima, 34px em baixo. Barra de separadores 58px + safe area.
- Encaixes da bottom sheet:

| Encaixe | Altura | Quando |
|---|---|---|
| `peek` | 28% | Estado inicial. Só a saudação numa linha e a barra de pesquisa |
| `half` | 64% | Detalhe de local |
| `full` | 93% | Roteiro, hangouts, perfil, lista completa |

Arrasto com **resistência elástica** (0.32) para lá do último encaixe; um gesto acima de 0.55 px/ms salta um encaixe. No desktop a roda do rato faz o mesmo.

A folha rola em `full` sempre, e em `half` só nos painéis compridos (detalhe de local e viagem ativa). Em `peek` nunca: o peek é um cartaz, não uma lista. A classe `.can-scroll` marca essa decisão num sítio só.

**Durante a viagem ativa a folha fica em `peek`.** Quem está a andar na rua quer ver o caminho, não a lista. O painel da viagem está construído para que o cabeçalho e o botão "Cheguei, seguir" caibam inteiros dentro dos 28% — tudo o resto fica abaixo da dobra. Ver ADR-019.

---

## 4. O mapa

SVG desenhado por código (`map.js`) sobre um mundo de `1200 × 1200`, visto de cima. Plano, sem projeção e sem relevo. Ver ADR-016.

Camadas, de baixo para cima: terreno, parques, quarteirões, ruas (grelha de 72, avenidas, duas piazzas circulares), rio, pontes, etiquetas, rota, pins, boneco.

Os quarteirões são retângulos com jitter determinístico, excluídos em cima do rio e dentro dos parques, com 14% de células vazias para dar praças. O Tibre é uma polilinha, e `riverX(y)` serve tanto para o desenhar como para excluir quarteirões.

### 4.0 Câmara, arrasto e zoom

A câmara é um estado (`MapView.cam = { tx, ty, s }`) e não um cálculo descartável: sem isso não há de onde continuar quando o dedo começa a arrastar.

- **Arrastar** move o mapa. Limiar de **9 unidades** (`TAP_SLOP`) a separar um toque de um arrasto. Com 4, um dedo a tremer cancelava o toque; um dedo nunca fica parado.
- Depois de um arrasto, `MapView.panned` fica a `true` e **suprime o click seguinte**, tanto no pin como no fundo do mapa. Repõe-se no `pointerdown` a seguir.
- A **captura de ponteiro só se faz quando o gesto vira arrasto**, nunca no `pointerdown`. Capturar logo faz o browser entregar o `click` ao `<svg>` em vez do pin, e nenhum pin volta a abrir.
- `clampCam()` trava a câmara dentro do mundo. Sem ele arrasta-se para o cinzento infinito.
- Durante o arrasto a transição do grupo é `none`; as animações de câmara voltam em `moveTo`.
- O botão de recentrar existe precisamente porque o mapa se arrasta.

**Zoom** entre `0.55` e `3.2`, por quatro vias: roda do rato, pinça de dois dedos, duplo clique e os botões `+` / `−`.

- Todo o zoom é **ancorado**: o ponto debaixo do dedo ou do cursor fica debaixo do dedo ou do cursor. Um zoom centrado no ecrã desorienta.
- O trackpad manda a pinça como um `wheel` com `ctrlKey`; por isso esse caso leva um fator maior.
- Levantar um dedo a meio de uma pinça continua o gesto como arrasto com o dedo que ficou.
- O botão de recentrar repõe a escala de casa (1.05), não só a posição.

**Marcadores e etiquetas mantêm o tamanho no ecrã.** Pins, boneco e nomes vivem num grupo com contra-escala `MARKER_REF / cam.s`, recalculada em `rescaleMarkers()` a cada frame de câmara. Sem isto, a 3x os pins ficam do tamanho de um quarteirão e os nomes de bairro atravessam o ecrã.

Daí os três níveis de grupo em cada pin, cada um com um trabalho só:

```xml
<g class="pin" transform="translate(x y)">      <!-- posição: só atributo -->
  <g class="pin-zoom" transform="scale(k)">     <!-- contra-escala: muda a cada frame -->
    <g class="pin-scale" transform="scale(1)">  <!-- seleção: tem mola, tem transição -->
```

Juntar a contra-escala e a seleção no mesmo grupo faria a transição da mola disparar a cada passo do zoom.

### 4.1 O boneco

O marcador do utilizador é o **único elemento do mapa com personalidade**, e é isso que justifica todo o resto ser discreto:

- halo de precisão que pulsa a cada 2.6s
- **cone de direção** em gradiente do acento, a dizer para onde está virado
- disco branco de raio 19 com sombra, disco preto de raio 15 por dentro
- a **inicial do utilizador** ao centro

É deliberadamente maior do que qualquer pin (38 contra 23 unidades de largura). Se os dois pesarem o mesmo, o utilizador perde-se no próprio mapa.

### 4.2 Pins

Mínimos: um disco de raio 13 (27px no ecrã), aro branco de 2.4, sombra curta, e um glifo ou um número. Sem haste, sem gradiente, sem volume.

| Estado | Aspeto |
|---|---|
| Normal | `--ink`, glifo da categoria a branco |
| No roteiro | `--accent`, **número** da paragem em vez do glifo |
| Selecionado | `--accent`, escala 1.3, trazido para a frente |
| Visitado | `--ink-4` a 42% |

O número no pin e o número no rail da timeline são o mesmo número: é o que liga o mapa à lista.
**Área tocável: raio 27, ou seja 57px no ecrã** — bem acima dos 44 do mínimo. Isto é mobile: o alvo tem de perdoar um dedo.

Nunca mais de 9 pins visíveis — mas **o selecionado entra sempre**, mesmo que não passe no filtro de interesses: pode ter sido escolhido numa lista em vez de no mapa.

**Só a camada dos pins recebe toques.** As camadas de etiquetas, rota e boneco levam `pointer-events: none`. O halo do boneco é um disco de 70px desenhado por cima dos pins e engolia os toques dos vizinhos; a rota tem um glow de 13 de largura e faria o mesmo. O fundo continua a receber o arrasto porque o evento borbulha até ao `<svg>`.

### 4.3 Rota
Duas linhas: `.route-glow` (13, 20% de opacidade) e `.route-line` (5). Caminhada tracejada `1.5 10`; transporte sólida.
A rota **desenha-se**: o glow anima `stroke-dashoffset` em `--dur-xslow` e a tracejada aparece 180ms depois. É a única animação do mapa que o utilizador repara.

---

## 5. Componentes

### 5.1 Botão primário `.btn`
54px, largura total, `--r-sm`, 16/650. Variantes: `.ghost` (`--surface-2`), `.accent` (verde), `.on-dark` (branco, sobre preto). **Só um primário por ecrã.**
`.on-dark:disabled` tem de ser declarado à parte — o branco de `.on-dark` ganharia ao cinzento de `:disabled`.

### 5.2 Controlos do mapa `.map-float` / `.map-btn`
Coluna de três botões circulares de 46px — aproximar, afastar, recentrar — encostada à direita. Acompanha a folha mas **para à altura de `half`** e desaparece em `full`, para não colidir com o avatar.

Os botões existem apesar de a roda e a pinça já chegarem: num protótipo que se clica com rato, o zoom tem de ser visível para ser encontrado.

### 5.3 Barra de pesquisa `.search`
54px, `--surface-2`. Texto: **"Onde queres ir?"** — o eco direto do "Where to?" do Uber.

### 5.4 Chip `.chip`
Pill de 42px, borda 1px. Selecionado: **preto sólido com texto branco**, e o ícone da categoria é substituído por uma marca de visto.

### 5.5 Opção `.option`
Escolha única: ícone 46px, título, descrição, radio. Selecionada: borda preta, radio preto e o ícone passa a `--accent-soft`.

### 5.6 Cartão de local `.place`
Miniatura 46px, nome, meta `categoria · estado`, tempo a pé em tabular à direita. Dentro de `.divided` ganha divisórias.

### 5.7 Item de roteiro `.step`
Rail de 26px com **botão numerado** de 24px e fio contínuo. Concluído: `--line-strong` com visto. A decorrer: verde com halo `--accent-soft`.

### 5.8 Cartão do dia `.day-card`
**Preto sólido**, texto branco, etiqueta em verde, três números e um botão branco. É o único bloco preto dentro da folha branca, e por isso é o foco do ecrã.

### 5.9 Cartão de hangout `.hangout`
Borda 1px, avatares sobrepostos com contagem, botão pill. Inscrito: borda e fundo `--accent-soft`.

### 5.10 Bottom sheet `.sheet`
`--r-xl` no topo, `--e-3`, pega de 40px que **engrossa para 52px ao arrastar**. Scroll só em `full`.

### 5.11 Etiqueta de mapa `.pill-info`
Pílula preta ancorada ao topo do mapa, 62px abaixo da safe area — a meio colidia com a rota e com o ponto do utilizador. `max-width` limitado. Desaparece em `full`.

### 5.12 Faixa de factos `.facts`
Três células iguais numa caixa com borda. Nunca mais de três.

### 5.13 Justificação `.why`
Caixa `--surface-2` com razões precedidas por um visto verde. É onde a app explica porque sugeriu aquilo (ADR-006). Máximo quatro linhas.

### 5.14 Barra de viagem ativa `.nav-bar`
Faixa preta no topo do mapa: ícone verde, destino e hora de chegada. Só existe durante a viagem.

### 5.15 Barra de separadores `.tabbar`
Branco a 92% com blur. Ícone 23px — **o traço engrossa de 1.7 para 2.1 no separador ativo**, além da mudança de cor.

### 5.16 Faixa do roteiro `.plan-strip`
Caixa em `--accent-soft` com o número da paragem, a posição no dia ("Paragem 2 de 5"), o horário e os minutos a pé desde a paragem anterior. Só aparece quando o local **já é** uma paragem do roteiro, e é a primeira coisa depois do cabeçalho: responde de imediato a "o que é que isto tem a ver com o meu dia?".

### 5.17 Destaques `.bullets`
Lista de 2 a 3 linhas com marcador redondo pequeno, sob a etiqueta "O que não podes perder". É conteúdo, não decoração: se um local não tiver destaques concretos, não se inventa a secção.

### 5.18 Dica `.tip`
Caixa `--surface-2` com o ícone de brilho e **uma** frase. É a única coisa do painel escrita na voz de quem já lá foi — horário a evitar, fila, entrada lateral. Uma por local, nunca duas.

### 5.19 Cabeçalho compacto `.greet`
Uma linha só: saudação à esquerda, cidade e bairro à direita. Existe porque em `peek` (28%) só cabem duas linhas e a barra de pesquisa. O título grande do dia vive no cartão preto, mais abaixo.

### 5.20 Ajuda de onboarding `.onb-help`
Caixa `--surface-2` com um "i" preto e uma linha a explicar **porque** perguntamos aquilo. Uma por passo, sempre a última coisa do ecrã. É o que faz o onboarding parecer passo-a-passo em vez de formulário. Ver ADR-018.

### 5.21 Recibo `.receipt`
Cabeçalho preto, cartão do total, linhas de detalhe, mini-mapa da rota (com a mesma projeção do mapa grande) e a timeline do dia.

---

## 6. Iconografia

Conjunto próprio em `data.js`, desenhado sobre uma grelha de 24.

- **Traço, não preenchimento.** `stroke-width` 1.8 por defeito; 1.9 nos chips, 2.1–2.4 em vistos e fechos, 2.4 dentro dos pins.
- Pontas e juntas redondas, sempre.
- Um ponto faz-se com um segmento de comprimento zero (`h.01`) — a ponta redonda transforma-o num círculo.
- Só a estrela de avaliação é preenchida. Está em `FILLED`.
- Um ícone de categoria novo tem de funcionar dentro de um pin a 16px.

---

## 7. Marca

Monograma **D**: barra reta, barriga curva da mesma espessura, e um corte diagonal limpo na parte inferior direita. Gerado no fal.ai e vetorizado no fal.ai — ver `brand/README.md` e ADR-015.

Duas versões: preto sobre claro e branco sobre escuro. Nunca a cores, nunca com contorno. Tamanho mínimo da marca isolada: 20px.

---

## 8. Escrita

- Tratamento por **tu**, português de Portugal.
- Títulos curtos, sem ponto final. O login é a exceção: "Chega. Abre. Vai." usa o ponto como ritmo.
- Verbo primeiro nos botões: "Começar roteiro", "Juntar-me", "Ver roteiro".
- Tempos relativos e concretos: "6 min a pé", nunca "perto".
- Sem exclamações. Sem emojis na UI do produto.

---

## 9. Acessibilidade

- Contraste mínimo 4.5:1 para texto. `--ink-4` sobre branco fica em 3.5:1 — só para 15px ou maior, e nunca para informação essencial.
- **Texto verde usa `--accent-press`, nunca `--accent`.**
- Alvos tocáveis de 44×44 no mínimo, incluindo os pins.
- O estado nunca é só cor: o chip selecionado troca o ícone por um visto, o pin selecionado muda de tamanho, o separador ativo engrossa o traço, a paragem concluída ganha um visto.
- `prefers-reduced-motion` desliga o pulso do utilizador e todas as entradas.
