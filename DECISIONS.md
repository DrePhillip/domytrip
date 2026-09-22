# DECISIONS.md — Registo de decisões

Formato ADR leve. Uma decisão por entrada. **Nunca editar um ADR aceite** — se a decisão mudar, escreve um novo que substitua o antigo e marca o antigo como `Substituído por ADR-00X`.

Estados possíveis: `Aceite` · `Substituído` · `Proposto`

---

## ADR-001 — Protótipo em HTML/CSS/JS puro, não em React Native

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** O DoMyTrip é uma app móvel. O caminho natural seria Expo ou React Native. Mas o objetivo desta fase é validar o *fluxo* e a *linguagem visual*, não a implementação.

**Decisão.** O protótipo é uma página única em HTML, CSS e JavaScript sem build, dentro de uma moldura de telemóvel de 390×844.

**Porquê.**
- Abre com um duplo clique. Zero instalação, zero emulador, zero `npm install`. Qualquer pessoa consegue ver o protótipo.
- O que queremos testar — hierarquia, densidade, o gesto da bottom sheet, a leitura do mapa — vê-se igualmente bem em HTML.
- Os tokens de `tokens.css` migram para RN quase 1 para 1. Nada do que escrevemos aqui se deita fora.

**Custo assumido.** Não há gestos nativos reais, nem performance de dispositivo, nem GPS. O protótipo é clicável, não funcional.

**Quando reverter.** Assim que o fluxo estiver validado e for preciso testar em dispositivo real. O alvo é **Expo + React Native**, reutilizando os tokens e a estrutura de ecrãs.

---

## ADR-002 — Linguagem visual copiada do Uber, de forma deliberada

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** O pedido foi explícito: layout muito ao estilo Uber, com cores semelhantes.

**Decisão.** Adotar a gramática visual do Uber: mapa a ocupar o ecrã todo, bottom sheet com encaixes, botão preto de largura total, campo "Onde queres ir?", pins pretos, azul `#276EF1` reservado para posição e rota.

**Porquê.**
- É um padrão que milhões de pessoas já sabem usar. Numa app de última hora, na rua, a familiaridade vale mais do que a originalidade.
- O par "mapa em cima, folha em baixo" resolve exatamente o nosso problema: ver onde estão as coisas e, ao arrastar, ver o que fazer com elas.

**Limite.** Copiamos a *gramática de interação*, não a *marca*. O logo, o nome e o ícone são nossos. Não usamos o logo do Uber, a wordmark, nem o tipo de letra Uber Move (proprietário) — usamos Inter.

**Risco aceite.** Parecer derivativo. Vale a pena nesta fase; a diferenciação do DoMyTrip está no roteiro automático, não na moldura.

---

## ADR-003 — O mapa é a home, o roteiro está debaixo dela

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Havia duas hipóteses: abrir num feed de sugestões com o mapa atrás de um botão, ou abrir no mapa com as sugestões numa folha.

**Decisão.** Abrir sempre no mapa. O roteiro do dia revela-se ao fazer scroll para baixo na bottom sheet.

**Porquê.**
- A primeira pergunta de quem está na rua é *"o que tenho aqui à volta?"*, e essa pergunta é espacial. Um feed responde à pergunta errada.
- Faz do scroll um gesto de aprofundamento natural: mapa (onde) → lista (o quê) → roteiro (por que ordem).
- Mantém o princípio 3 do `CLAUDE.md`: o mapa é a casa.

**Alternativa rejeitada.** Feed primeiro. Testaria melhor em retenção, mas falha no momento de uso real, que é de pé e com pressa.

---

## ADR-004 — Mapa desenhado à mão em SVG, sem provedor de mapas

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** O protótipo precisa de um mapa credível. As opções eram Google Maps, Mapbox, Leaflet com OSM, ou desenhar.

**Decisão.** Gerar o mapa em SVG por código (`map.js`), sobre um canvas de 1200×1200 unidades, com uma Roma estilizada. As coordenadas dos POIs são coordenadas de canvas, não lat/lon.

**Porquê.**
- Sem chaves de API, sem conta, sem limites de pedidos, sem custo — e funciona offline.
- Controlo total do aspeto. Um mapa de provedor traz o estilo do provedor; nós queremos exatamente a paleta de `DESIGN.md §2.3`.
- Nenhuma dependência de runtime, que é regra em `CLAUDE.md §4`.

**Custo assumido.** O mapa não é geograficamente correto. As distâncias e tempos a pé são valores dos dados mock, não calculados.

**Quando reverter.** Na app real. Nessa altura, os POIs passam a ter `lat`/`lon` e o campo `xy` do canvas desaparece. O resto da UI não muda.

---

## ADR-005 — Os gostos são perguntados uma vez, no onboarding, e nunca mais

**Data:** 2026-09-22 · **Estado:** Aceite · o número de passos foi revisto em **ADR-018**

**Contexto.** O sistema tem de saber que o utilizador gosta de museus. Ou pergunta, ou infere do comportamento.

**Decisão.** Perguntar uma vez no onboarding, em 4 passos curtos (interesses, ritmo, orçamento, hangouts), e a partir daí só ajustar em silêncio com base no que ele aceita ou salta.

**Porquê.**
- Inferir do zero exige histórico que um utilizador novo não tem. O primeiro dia em Roma seria mau, e não haveria segundo.
- 4 passos é o máximo antes de a taxa de abandono disparar. Cada passo tem de ser respondível num toque.
- Os interesses são chips múltiplos porque as pessoas não têm um gosto só, têm três ou quatro.

**Consequência.** Nunca voltar a pôr um questionário à frente do utilizador. Mudanças de gosto fazem-se no Perfil, por iniciativa dele.

---

## ADR-006 — O roteiro é gerado por heurística transparente, não por caixa preta

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** O coração da app é montar o dia sozinha.

**Decisão.** Nesta fase, `generateItinerary()` ordena por uma pontuação simples e legível:

```
pontuação = correspondência de interesses (peso 3)
          − custo de deslocação em minutos (peso 1)
          + bónus de estar aberto agora (peso 2)
          + bónus de encaixar no ritmo escolhido (peso 1)
```

Depois distribui por blocos de manhã, tarde e noite, respeitando o ritmo (relaxado: 3 paragens; equilibrado: 5; intenso: 6).

**Porquê.**
- Dá para explicar ao utilizador porque é que um sítio apareceu. "Porque gostas de museus e está a 6 minutos" é uma frase que a app pode mesmo mostrar.
- Dá para depurar. Um modelo opaco num protótipo impede perceber se o problema é o ranking ou o ecrã.
- É suficientemente boa. A parte difícil não é o ranking, é a ordem geográfica e os horários.

**Quando reverter.** Quando houver dados reais de utilização. Mesmo aí, manter a explicação visível — é o que distingue de um feed qualquer.

---

## ADR-007 — Hangouts são opcionais e nunca interrompem o roteiro

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** A funcionalidade social podia ser central (app de conhecer pessoas a viajar) ou periférica.

**Decisão.** Periférica. Os hangouts são um separador próprio e aparecem no fim da folha do mapa. Nunca aparecem como pop-up, nunca cortam o roteiro, e há um interruptor no onboarding para os desligar por completo.

**Porquê.**
- Quem quer companhia procura-a; quem não quer não pode ser incomodado. Uma app de viagem que obriga a socializar perde o viajante solitário, que é exatamente o nosso utilizador principal.
- Mantém o produto focado: o valor é o roteiro. Os hangouts aumentam-no, não o substituem.

**Consequência de segurança.** Qualquer funcionalidade de encontro com desconhecidos precisa de perfis verificados, local público e partilha de localização opcional antes de sair do protótipo. Fica registado como pré-requisito de lançamento, não como detalhe de implementação.

---

## ADR-008 — Logo gerado com fal.ai e vetorizado com fal.ai

**Data:** 2026-09-22 · **Estado:** Aceite · a execução ficou registada em **ADR-012**

**Contexto.** O pedido foi explícito: gerar o logo com o fal.ai e depois vetorizar com o fal.ai.

**Decisão.** Pipeline em dois passos:
1. `fal-ai/nano-banana-pro` — marca monocromática, 1:1, 2K, PNG.
2. `fal-ai/recraft/vectorize` — converte o PNG em SVG.

Os prompts e os comandos exatos ficam em `brand/README.md` para serem reproduzíveis.

**Estado da execução.** **Bloqueado.** A conta fal.ai ligada devolveu `403 balance_exhausted` no primeiro pedido. Não houve nova tentativa. É preciso carregar saldo em https://fal.ai/dashboard/billing.

**Mitigação temporária.** `brand/logo-mark.svg` e `brand/logo-lockup.svg` foram desenhados à mão, na direção visual exata do prompt: pin geométrico com um trajeto em negativo, preto sobre transparente. O protótipo usa-os já. Quando o fal.ai correr, substituem-se os dois ficheiros e mais nada muda — o protótipo referencia-os por caminho.

**Porquê registar isto.** Para que ninguém pense que o logo à mão foi uma escolha de design. Foi uma consequência de um bloqueio de faturação, e tem data de validade.

---

## ADR-009 — Identidade azul por cima da gramática Uber

**Data:** 2026-09-22 · **Estado:** **Substituído por ADR-013**

**Contexto.** O ADR-002 adotou a linguagem do Uber, que é monocromática. O moodboard trazido depois — marcas de viagem como *Triplo* e *Luven* — pede azul profundo, gradientes, fotografia e vidro. As duas coisas parecem incompatíveis.

**Decisão.** Não são. Separámos os dois mundos por função:

- **Ecrãs de marca** (splash, login, onboarding, a montar o dia, recibo): escuros, fotográficos, gradientes, vidro, tipografia grande. É aqui que a app se apresenta.
- **Ecrãs de trabalho** (mapa, folha, listas): claros e densos, com a disciplina do Uber intacta.

A ligação entre os dois é a cor: o preto da UI passou a ser `#0B1020`, um preto azulado, e o acento `#3D7BFF` é o mesmo azul dos gradientes.

**Porquê.**
- A identidade tem de aparecer onde há tempo para a ver. Na rua, com pressa, o que importa é ler o mapa — e aí o excesso de cor atrapalha.
- Mantém a regra do acento único: o azul continua reservado a posição, rota e seleção. Os gradientes não competem com ele porque não aparecem no mapa.
- O cartão do dia é a única exceção deliberada: é colorido dentro da folha branca precisamente para ser o foco do ecrã.

**Custo assumido.** Dois vocabulários visuais para manter. Está mitigado por os tokens serem os mesmos — muda a superfície, não a escala.

---

## ADR-010 — Imagens de fundo geradas no fal.ai e servidas localmente

**Data:** 2026-09-22 · **Estado:** **Substituído por ADR-013**

**Contexto.** Os ecrãs de marca precisam de fotografia. As opções eram banco de imagens, fotografia própria, ou geração.

**Decisão.** Gerar com `fal-ai/nano-banana-pro` e guardar os ficheiros em `prototype/assets/`. Duas imagens:

- `bg-dusk.jpg` — vista da janela do avião ao anoitecer, para o login.
- `bg-flow.jpg` — gradiente azul desfocado, para splash, onboarding e a montar o dia.

Os prompts exatos estão em `brand/README.md`.

**Porquê.**
- Controlo total do enquadramento: precisávamos de espaço negativo na metade superior para o texto assentar, e isso não se encomenda a um banco de imagens.
- Sem licenças por resolver mais tarde.
- Ficheiros locais: o protótipo continua a funcionar offline, como manda o ADR-001.

**Custo assumido.** ~2 MB de imagens no repositório. Aceitável para dois ficheiros que definem a identidade do produto.

---

## ADR-011 — Animação em SVG nunca no elemento que carrega a posição

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Os pins do mapa desapareceram depois de ganharem uma animação de entrada. A causa: uma animação CSS de `transform` num `<g>` que usava o **atributo** `transform` para se posicionar. O atributo é mapeado para a propriedade CSS `transform`, por isso a animação substitui-o — e no fim, com `to { transform: none }`, todos os pins colapsaram para a origem do mapa. O mesmo aconteceu à etiqueta do mapa, centrada com `translateX(-50%)`.

**Decisão.** Regra estrutural, não um remendo:

1. Em SVG, o elemento que posiciona (`transform="translate(x y)"`) **nunca** recebe animação nem transição de `transform`. A animação vive num grupo filho.
2. Em HTML, uma keyframe que toque em `transform` tem de repetir as transformações de layout que o elemento já tinha (ver `pillIn`, que repete o `translateX(-50%)`).
3. Entradas em SVG fazem-se por transição de atributo (`scale(.4)` → `scale(1)`) mais opacidade, nunca por `@keyframes`.

**Porquê registar.** Foi um bug silencioso: sem erro na consola, sem aviso, só elementos invisíveis. Custou duas rondas de depuração. Está em `DESIGN.md §2.9` porque é uma regra de desenho, não um detalhe de implementação.

---

## ADR-012 — Logo gerado, vetorizado e instalado

**Data:** 2026-09-22 · **Estado:** **Substituído por ADR-015** (a marca mudou; o método mantém-se)

**Contexto.** O ADR-008 definiu o pipeline mas a execução ficou bloqueada por falta de saldo na conta fal.ai. O saldo foi carregado.

**Decisão e resultado.** O pipeline correu como estava escrito:

1. `fal-ai/nano-banana-pro` gerou 4 marcas. A escolhida é um avião de papel em contorno contínuo, cantos redondos, da mesma família da referência do moodboard.
2. `fal-ai/recraft/vectorize` converteu-a em SVG.
3. `tools/build-brand.js` converte o resultado para uso próprio e gera `logo-mark.svg`, `logo-lockup.svg` e `app-icon.svg`.

**O passo que não era óbvio.** O vetorizador não devolve uma forma com buracos: devolve camadas de preto e branco empilhadas, e o branco só funciona porque o fundo é branco. Sobre fundo escuro a marca desfazia-se. O script converte essas camadas numa **máscara** — preto e branco alternados — aplicada a um retângulo com `fill="currentColor"`. O resultado é uma forma única, com recortes verdadeiros, que herda a cor do contexto.

**Consequência.** A marca vive inline no `index.html` como um `<symbol>`, injetado pelo script, e é usada por `<use href="#dmt-mark">`. Inline porque `<img>` não herda `currentColor` e a marca tem de ser branca sobre escuro e preta sobre claro.

**Nota de processo.** Na primeira tentativa vetorizámos a imagem errada: a API devolveu 4 imagens mas só 3 tinham pré-visualização, e os índices não coincidiam com a ordem apresentada. Confirmar sempre o `url` exato, não a posição na lista.

---

## ADR-013 — Volta ao Uber estrito, com um verde

**Data:** 2026-09-22 · **Estado:** Aceite · substitui ADR-009 e ADR-010

**Contexto.** O ADR-009 tinha separado a app em dois mundos: ecrãs de marca escuros com gradientes azuis e fotografia gerada, e ecrãs de trabalho claros. Posto à frente do utilizador, o veredicto foi direto: prefere o visual do Uber, e as cores podiam ser trabalhadas.

**Decisão.** Um só mundo visual, o do Uber:

- **Preto real** (`#000000`), branco e cinzentos frios neutros. O preto azulado do ADR-009 desaparece.
- **Zero gradientes de superfície e zero fotografia de fundo.** Splash e "a montar o dia" passam a preto sólido; login e onboarding passam a branco.
- **Um acento: verde `#00B37E`**, reservado a posição, rota, paragens do roteiro e seleção.
- Raios mais fechados (8/12/16/22). O Uber não é arredondado.

**Porquê o verde e não o azul.** O azul de mapa é a cor por omissão de toda a categoria — Uber, Google, Apple, Citymapper. Sobre o cinzento do mapa o verde destaca-se mais e não se confunde com a água do rio. É a única coisa cromaticamente nossa, e custa nada.

**Consequências.**
- As imagens `bg-dusk.jpg` e `bg-flow.jpg` foram apagadas. Ficam os prompts em `brand/README.md` caso a direção volte atrás.
- Os únicos gradientes que sobrevivem são os radiais dentro dos pins, e existem para dar volume, não cor.
- Cuidado de contraste: `--accent` sobre branco fica em 2.9:1. **Texto verde usa `--accent-press`.** Está em `DESIGN.md §2.2`.

**Custo assumido.** Dois dias de trabalho de identidade deitados fora e créditos de fal.ai gastos em imagens que não se usam. Foi o preço de ter escolhido uma direção sem a validar primeiro.

---

## ADR-014 — Mapa e pins em 2.5D por projeção, não por WebGL

**Data:** 2026-09-22 · **Estado:** **Substituído por ADR-016**

**Contexto.** O pedido foi mostrar o mapa e os pinos "mais tipo 3D". As opções eram: um provedor de mapas com camada 3D (Mapbox GL), three.js, uma transformação CSS 3D sobre o SVG, ou projetar à mão.

**Decisão.** Projeção axonométrica calculada no próprio SVG:

```
KY    = 0.58   comprime o eixo Y  →  câmara a ~55° do zénite
EXT_X = 0.34   desvio horizontal da extrusão, por unidade de altura
```

O chão inteiro vive num `<g transform="scale(1 KY)">`. Os edifícios são extrudidos à mão em três polígonos — face sul, face este, telhado — e desenhados de trás para a frente. Os pins e as etiquetas são desenhados fora do grupo comprimido, com coordenadas já projetadas, para ficarem direitos.

**Porquê não as alternativas.**
- **Mapbox/WebGL:** traz chave de API, conta, limites e o estilo do provedor. Mata o ADR-004 e o "abre com duplo clique" do ADR-001.
- **three.js:** uma dependência de runtime inteira para desenhar caixas. Proibido por `CLAUDE.md §4`.
- **`transform: perspective() rotateX()` sobre o SVG:** inclina tudo, incluindo pins e nomes de ruas. Ficavam ilegíveis, e contra-rodar cada um dá mais trabalho do que projetar.

**O que faz o volume ler.** Não é a extrusão, é o **salto de valor entre as três faces**. Na primeira versão `--bld-top` e `--bld-front` estavam a 32 pontos de distância e o mapa continuava plano; a 55 pontos passou a ler-se de relance. Está registado em `DESIGN.md §2.3`.

**Custo assumido.** ~530 polígonos no DOM. Sem impacto notório porque são estáticos: a câmara move-se por um `transform` no grupo pai, não por redesenho.

---

## ADR-015 — A marca é um monograma D, não um avião de papel

**Data:** 2026-09-22 · **Estado:** Aceite · substitui ADR-012

**Contexto.** O ADR-012 instalou um avião de papel em contorno contínuo. O veredicto do utilizador: "extremamente preguiçoso". Tinha razão — o avião de papel é o clichê número um da categoria (Telegram, e metade das apps de viagem).

**Decisão.** Um monograma **D**: barra reta, barriga curva da mesma espessura, e um corte diagonal limpo na parte inferior direita que quebra a curva.

Foram geradas seis marcas em três direções — monograma, planos dobrados e roseta abstrata — e postas lado a lado. Quatro eram clichés diferentes (pássaro de origami, estrela de "IA", hélice). Ficaram duas defensáveis, e a escolha foi do utilizador.

**Porquê o monograma.**
- É **ownable**: o D do nome não pertence a mais ninguém na categoria. Um símbolo abstrato de viagem pertence a toda a gente.
- A austeridade geométrica é da mesma família da marca do Uber, que é a referência declarada.
- Aguenta-se a 24px, que é o tamanho a que aparece mais vezes.

**Risco aceite.** Monogramas são menos memoráveis do que símbolos. Compensa-se com consistência: a marca aparece sempre igual, sempre preta ou branca.

**O método mantém-se.** `fal-ai/nano-banana-pro` → `fal-ai/recraft/vectorize` → `tools/build-brand.js`, com a conversão de camadas empilhadas em máscara descrita no ADR-012. Só mudaram o prompt e a caixa de enquadramento (`VB` no script).

**Nota de processo.** A primeira geração saiu com a letra a sangrar pelas quatro bordas. O prompt precisou de uma instrução de enquadramento explícita — "occupying only the middle 55 percent of the canvas" — para a marca vir centrada com margem.


---

## ADR-016 — O mapa volta a ser plano

**Data:** 2026-09-22 · **Estado:** Aceite · substitui ADR-014

**Contexto.** O ADR-014 pôs o mapa em 2.5D com edifícios extrudidos, a pedido. Visto em uso, o veredicto foi para trás: melhor a 2D.

**Decisão.** Mapa plano, visto de cima. Fora a projeção `KY`, fora a extrusão, fora as três faces por edifício. Os quarteirões voltam a ser retângulos de um só valor, quase igual ao do terreno.

**Porquê isto está certo, apesar de eu ter construído o contrário.**
- Os edifícios extrudidos eram ~530 polígonos de ruído cinzento **atrás** dos elementos que carregam informação. Competiam com os pins e com a rota.
- Num produto cuja promessa é "decide por mim em 10 segundos, na rua", tudo o que atrasa a leitura do ecrã é custo.
- O mapa do Uber é plano, e a referência declarada era essa.

**O que se aprendeu.** O relevo tinha valor estético e nenhum valor funcional. A regra que fica em `DESIGN.md §1`: o mapa é fundo; quem tem personalidade é o boneco.

**Custo assumido.** A projeção axonométrica foi deitada fora. O trabalho de exclusão de quarteirões sobre o rio e os parques sobreviveu, porque era independente da projeção.

---

## ADR-017 — O boneco é o único elemento do mapa com personalidade

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Com o mapa plano, era preciso decidir onde é que o produto ganha carácter visual. A posição do utilizador era um ponto verde genérico, igual ao de qualquer app de mobilidade.

**Decisão.** Concentrar toda a personalidade num só elemento — o marcador do utilizador — e tornar tudo o resto discreto:

- **Boneco:** halo de precisão, cone de direção em gradiente, disco branco de raio 19 com sombra, disco preto por dentro, e a **inicial do utilizador** ao centro.
- **Pins:** disco de raio 11.5, aro branco, sombra curta, glifo ou número. Nada mais.

**Porquê.**
- O marcador é o único elemento do ecrã que é *a pessoa*. Desperdiçá-lo num ponto genérico é deitar fora a única oportunidade de identidade dentro do mapa.
- Hierarquia por tamanho: 38 contra 23 unidades. Na primeira versão os dois tinham peso parecido e o utilizador perdia-se no próprio mapa — foi preciso corrigir depois de ver.
- Os pins recuam porque são muitos. Um pin com haste, sombra e gradiente é aceitável quando há um; com nove, é ruído.

**Evolução prevista.** A inicial é um substituto: em produção é a fotografia de perfil, recortada no mesmo disco. O cone de direção passa a vir da bússola do telemóvel.

---

## ADR-018 — Onboarding passo-a-passo, cinco passos, cada um com uma ajuda

**Data:** 2026-09-22 · **Estado:** Aceite · revê o número de passos do ADR-005

**Contexto.** O ADR-005 fixou 4 passos como teto, por causa do abandono. O pedido foi tornar o onboarding mais passo-a-passo, com pequenas ajudas, uma pergunta por ecrã.

**Decisão.** Cinco passos, uma pergunta cada, e **uma linha de ajuda por passo** a explicar porque perguntamos:

1. Onde estás? — confirma a cidade num toque
2. De que gostas? — interesses, mínimo 3
3. Que ritmo queres?
4. Quanto queres gastar?
5. Queres conhecer gente?

Cada ecrã leva um contador ("Passo 2 de 5") e uma caixa `.onb-help` com a justificação.

**Porquê cinco e não mais.** Já eram 4 ecrãs com 4 perguntas — o que faltava não eram passos, eram ajudas. O passo novo, a cidade, é o único que se justifica: responde-se num toque, e faz a app parecer que já sabe onde estás em vez de começar por um questionário. Acrescentar mais passos aumentaria o abandono sem acrescentar sinal ao roteiro.

**Nota.** Só o passo dos interesses tem mínimo obrigatório. Os outros têm sempre uma resposta pré-selecionada, para que "Continuar" nunca esteja bloqueado sem motivo.

---

## ADR-019 — O mapa arrasta-se, e durante a viagem a folha fica pequena

**Data:** 2026-09-22 · **Estado:** Aceite · a parte do zoom foi revertida em **ADR-021**

**Contexto.** Duas falhas apontadas em uso: começar o roteiro deixava a folha a meio ecrã, tapando o caminho; e o mapa não se mexia.

**Decisão.**

1. **`startTrip()` deixa a folha em `peek` (28%)**, não em `half`. Quem está a andar na rua quer ver o caminho.
2. **O mapa arrasta-se**, com o dedo ou com o rato, dentro de limites.

**O que o primeiro ponto obrigou a mudar.** Não bastava trocar o encaixe: em 28% só há ~124px úteis acima da barra de separadores, e o botão "Cheguei, seguir" ficava abaixo da dobra — ou seja, a ação principal da viagem passava a exigir um gesto para aparecer. O painel foi reordenado: nome da paragem e minutos numa linha, contexto noutra, e **o botão logo a seguir**. Os factos e o "Saltar esta paragem" desceram. Agora a ação cabe inteira no peek.

**O que o segundo ponto obrigou a resolver.** Um mapa que se arrasta partia duas coisas que já existiam:

- **A câmara era um cálculo descartável.** `moveTo()` calculava `tx`/`ty` e escrevia-os no atributo, sem guardar nada. Para arrastar é preciso saber de onde se parte, por isso a câmara passou a ser estado (`MapView.cam`) e `moveTo()` delega em `applyCam()`.
- **O arrasto roubava os toques.** Arrastar com o dedo em cima de um pin abria-o ao levantar, e arrastar sobre o mapa fechava o detalhe aberto. Resolvido com um limiar de 4 unidades e uma bandeira `panned` que suprime o click seguinte.

**Porque não há zoom.** Seria o passo seguinte natural, mas o produto não precisa: o enquadramento é sempre calculado pela app (`frame`, `frameAll`, `home`) em função do que está selecionado. Dar zoom manual convida a perder o enquadramento e obriga a repor estado que ninguém pediu. Fica de fora até alguém dar por falta dele.

---

## ADR-020 — O detalhe de local responde primeiro ao roteiro

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Clicar num pino numerado já abria o detalhe, mas o detalhe era magro — nome, categoria, três números e a justificação — e, pior, não dizia nada sobre o lugar daquele sítio no dia. Quem clica no "2" está a perguntar "o que é isto e porque está aqui a meio da minha tarde?".

**Decisão.** O painel passa a ter duas camadas de resposta, por esta ordem:

1. **A faixa do roteiro** (`.plan-strip`), logo a seguir ao cabeçalho, quando o local é uma paragem: número, "Paragem 2 de 5", horário e minutos a pé desde a paragem anterior.
2. **O conteúdo do sítio**: destaques, uma dica de quem lá foi, horário, morada e como chegar.

E o botão deixa de ser informativo: numa paragem do roteiro é "Ver no roteiro" mais "Remover do roteiro"; fora dele, "Adicionar ao roteiro".

**Os dados tiveram de crescer.** Cada POI ganhou `abre`, `morada`, `destaques` e `dica`. Escritos à mão, específicos, não genéricos — uma dica que serve para qualquer museu não serve para nenhum.

**Três coisas que isto partiu, e que foram corrigidas:**

- **O painel ficou comprido de mais para o encaixe em que abre.** O detalhe abre em `half`, e o scroll só existia em `full`. Passou a existir uma função `canScroll()` e uma classe `.can-scroll`: rola em `full` sempre, e em `half` só nos painéis compridos.
- **Os minutos não batiam certo.** A pílula do mapa mostrava a perna desde a paragem anterior e o "Como chegar" mostrava os minutos desde o início do dia, com o rótulo da paragem anterior. Duas fontes para o mesmo número é sempre um erro à espera de acontecer.
- **Escolher um local numa lista não desenhava o pino.** `pinItems()` filtra por interesses e corta aos 9; um local escolhido em "Também aqui perto" podia não passar no filtro e ficava sem pino selecionado no mapa. O selecionado passa a entrar sempre.

**O que ficou de fora.** Fotografias dos locais. Dariam muito ao painel, mas seriam 16 imagens geradas, e gerar só para alguns deixaria o painel inconsistente. Fica para quando houver imagens reais.

---

## ADR-021 — O mapa tem zoom

**Data:** 2026-09-22 · **Estado:** Aceite · reverte a última secção do ADR-019

**Contexto.** O ADR-019 deixou o zoom de fora, com o argumento de que o enquadramento é sempre calculado pela app e que o zoom manual convidaria a perdê-lo. O argumento estava errado na prática: quem tem um mapa à frente espera poder aproximá-lo, e o enquadramento automático serve para *começar* bem, não para prender.

**Decisão.** Zoom entre 0.55 e 3.2, por quatro vias: roda do rato, pinça, duplo clique e botões `+` / `−` numa coluna com o recentrar.

Todo o zoom é **ancorado no ponto do gesto**. Um zoom centrado no ecrã faz perder a referência do que se estava a olhar.

**O que isto obrigou a resolver.**

- **Os marcadores cresciam com o mapa.** A 3x os pins ficavam do tamanho de um quarteirão. Pins, boneco e etiquetas passaram a viver num grupo com contra-escala `MARKER_REF / cam.s`, o que mantém o tamanho no ecrã constante — como em qualquer mapa a sério.
- **A contra-escala colidia com a animação de seleção.** O pin já tinha dois grupos (posição e seleção com mola); a contra-escala muda a cada frame e faria a mola disparar continuamente. Passaram a ser três níveis, cada um com um trabalho só.
- **A pinça e o arrasto são o mesmo gesto com outro número de dedos.** `enablePan()` virou `enableGestures()`, com um registo de ponteiros ativos: um é arrasto, dois é pinça, e levantar um dedo volta ao arrasto sem saltos.

**Nota honesta.** Isto foi trabalho que se poupava se não tivesse decidido por antecipação que o zoom não fazia falta. A regra que fica: num mapa, não se corta uma interação que toda a gente espera com o argumento de que a app sabe melhor.

---

## ADR-022 — O alvo de toque dos pins, e o bloco duplicado que o escondeu

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Queixa: os pins não são grandes o suficiente para clicar, e isto é para telemóvel. A medição mostrou outra coisa — o alvo tinha 48px, acima do mínimo de 44, e mesmo assim **um clique limpo em cima de um pin não abria nada**.

**A causa não era o tamanho.** Eram três coisas empilhadas:

1. **O halo do boneco engolia os toques.** É um disco de 70px na camada `user`, que é desenhada por cima da camada `pins`. Qualquer pin perto do utilizador — e o primeiro do roteiro está sempre perto — ficava por baixo dele. `elementFromPoint` no centro do pin devolvia `user-halo`.
2. **A captura de ponteiro no `pointerdown`.** Com `setPointerCapture` ativo no `<svg>`, o browser entrega o `click` ao elemento que capturou, não ao que está debaixo do dedo.
3. **O limiar de arrasto era de 4 unidades.** Num telemóvel, um dedo move-se sempre mais do que isso ao tocar.

**Decisão.**

- `pointer-events: none` nas camadas de etiquetas, rota e boneco. Só os pins são tocáveis; o fundo continua a receber o arrasto por borbulhamento.
- Captura de ponteiro só quando o gesto passa o limiar e vira arrasto.
- `TAP_SLOP` de 4 para 9 unidades.
- Pin visual de 11.5 para 13 de raio (27px) e alvo de 23 para 27 (57px).

**E a razão pela qual nada disto estava a funcionar como eu reportei.** O patch do ADR-021 fatiou o `map.js` com os índices trocados e **duplicou 153 linhas** — de `renderPins` até `enablePan`. Num literal de objeto, a última chave ganha, por isso as definições **antigas** estavam ativas e as novas eram código morto. Foi por isso que reportei as etiquetas como tamanho constante quando não eram: a `rescaleMarkers` que as trata era a cópia morta.

**O que fica como regra.** Um patch que fatia um ficheiro por duas âncoras tem de verificar que a segunda vem depois da primeira. E uma alteração a `map.js` verifica-se **a clicar**, não a chamar a função por consola: `selectPoi(id)` funcionava perfeitamente enquanto nenhum pin abria.

---

## ADR-023 — Partilhar o protótipo: ecrã cheio no telemóvel e uma porta que não é segurança

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Pôr o protótipo online para alguém abrir no telemóvel, com palavra-passe.

**Duas coisas tiveram de mudar antes de haver link nenhum.**

1. **A moldura.** O protótipo desenha um telemóvel de 390×844 sobre fundo escuro. Num telemóvel a sério isso é um telemóvel dentro de outro, e a barra de estado falsa fica por cima da verdadeira. Abaixo de 480px de largura a moldura desaparece, a app passa a ocupar o ecrã todo, e a barra de estado e o home indicator falsos escondem-se — o aparelho já tem os verdadeiros.
2. **Uma porta.** `js/gate.js` pede uma palavra-passe antes de mostrar o que quer que seja, e o splash só começa a contar depois de ela passar.

**A porta não é segurança, e isso está escrito no próprio ficheiro.** A palavra-passe está no código; qualquer pessoa a lê no source do browser. O que ela resolve é o problema real de partilhar um protótipo — que o link não fique aberto a quem passe por ele por acaso. Segurança a sério exige validação no servidor, e um protótipo estático não tem servidor.

**Sobre onde alojar.** Nenhuma das opções gratuitas junta as três coisas que se quer (link público, palavra-passe a sério, sem conta para quem vê):

| Via | Link | Palavra-passe | Quem vê precisa de |
|---|---|---|---|
| Artifact do claude.ai | permanente | a nossa, por cima | conta Claude e partilha explícita |
| Netlify Drop / Cloudflare Pages | permanente | só a nossa | nada |
| Túnel `cloudflared` | temporário | só a nossa | nada |

O Artifact foi publicado porque é imediato e privado por omissão. Para enviar a alguém sem conta Claude, a via é um alojamento estático com a porta do `gate.js` por cima — assumindo que é obstáculo, não fechadura.

**Consequência para o código.** `tools/build-publish.js` gera `prototype/_artifact.html` a partir do `index.html`: o Artifact envolve o ficheiro no seu próprio esqueleto, por isso o que se publica é só o conteúdo do `<body>`. Correr sempre antes de republicar.

**Uma armadilha que apanhei.** O bloco `@media (max-width: 480px)` estava a meio do ficheiro e não fazia nada: media queries **não acrescentam especificidade**, por isso só ganham ao que vem antes delas. `.statusbar { display: flex }` aparecia depois e continuava a ganhar. O bloco vive agora no fim do `app.css`, de propósito.

---

## ADR-024 — Repositório privado no GitHub, site no Netlify

**Data:** 2026-09-22 · **Estado:** **Substituído por ADR-025**

**Contexto.** O ADR-023 pôs o protótipo num Artifact do claude.ai e deixou o alojamento por decidir. O Artifact resolveu-se mal: o link pede conta Claude, por isso não serve para enviar a alguém de fora. E o projeto não estava sequer em git — dez rondas de trabalho sem histórico nenhum.

**Decisão.** Separar as duas coisas que estavam a ser tratadas como uma:

- **Repositório privado** em `github.com/DrePhillip/domytrip` — guarda o código, os ADR e o histórico.
- **Site no Netlify**, a partir da pasta `prototype/` — link permanente, sem conta para quem abre.

**Porque não o GitHub Pages.** Pages a partir de repositório privado exige plano pago. As alternativas eram tornar o repositório público — o que expõe o código e torna a palavra-passe pesquisável — ou separar código de alojamento. Separar é mais limpo de qualquer maneira: o repositório serve o histórico, o Netlify serve o site, e nenhum dos dois tem de fazer concessões ao outro.

**A palavra-passe deixa de estar no repositório.** `tools/build-site.js` corre como build command e substitui `GATE_PASSWORD` pela variável de ambiente do Netlify. A que fica versionada é só a de desenvolvimento. Continua a não ser segurança — quem abrir o source do site lê a real — mas deixa de estar no histórico do git para sempre.

**O ficheiro `netlify.toml` publica só `prototype/`.** Os documentos não vão para o ar. E manda `X-Robots-Tag: noindex`: um protótipo não tem nada que andar em motores de busca.

**Uma armadilha.** A primeira versão do `build-site.js` ancorava a expressão regular no fim da linha (`$`) e nunca encontrava nada, porque a linha da palavra-passe tem um comentário a seguir. Apanhado a correr o script antes de o pôr no ar, não depois.

---

## ADR-025 — Repositório público e site no GitHub Pages

**Data:** 2026-09-22 · **Estado:** Aceite · substitui ADR-024

**Contexto.** O ADR-024 tinha optado por repositório privado com o site no Netlify, por o Pages a partir de privado exigir plano pago. O utilizador decidiu abrir o repositório, com o argumento de que ninguém lá chega sem o link.

**O argumento não se aguenta, e vale a pena ficar escrito.** Um repositório público é indexado pela pesquisa do GitHub e pelos motores de busca. É encontrado sem ninguém dar link nenhum. O que protege o site não é a obscuridade do endereço — é a palavra-passe vir de um secret e não do código.

**Decisão.** Repositório público, e o site passa a sair do próprio repositório via GitHub Pages. O `netlify.toml` fica como alternativa, se um dia fizer falta um domínio próprio ou headers a sério.

**Porquê Pages agora.** Com o repositório público é gratuito e dispensa inscrição em qualquer outro serviço. Um serviço a menos para manter.

**Duas coisas tiveram de ser feitas antes de abrir:**

1. **O email pessoal saiu do histórico.** Os três commits tinham `dreduarte72@gmail.com` no autor e no committer. Num repositório público isso é raspado por bots em horas. Reescritos para o endereço `noreply` do GitHub, com `git filter-branch`, limpeza dos `refs/original` e force push. O `git config` local ficou com o mesmo endereço, para não voltar a acontecer.
2. **O Pages não define headers HTTP**, por isso o `X-Robots-Tag` do Netlify não se aplica. Foi para o `index.html` um `<meta name="robots" content="noindex, nofollow">`.

**Limite conhecido.** O force push deixa os commits antigos como objetos órfãos no GitHub até serem recolhidos. Não estão em nenhum ramo e não são descobríveis sem o SHA, mas existem. Para um repositório de três commits com um email dentro, é um risco aceite; para um segredo a sério, a resposta correta seria apagar e recriar o repositório.

---

## ADR-026 — Os ficheiros do site levam versão no URL

**Data:** 2026-09-22 · **Estado:** Aceite

**Contexto.** Depois de definir o secret `GATE_PASSWORD` e republicar, o servidor já tinha a palavra-passe nova — mas o browser continuava a aceitar a antiga. O `gate.js` vinha da cache.

**A causa.** O GitHub Pages manda `Cache-Control: max-age=600`. Quem já tivesse aberto o site ficava dez minutos com o JavaScript antigo, e portanto com a palavra-passe antiga a funcionar depois de ela ter sido mudada. Numa porta, isso não é um detalhe de performance: é a porta a continuar aberta com a chave velha.

**Decisão.** `tools/build-site.js` carimba todos os CSS e JS do `index.html` com `?v=<sha do commit>` no momento do deploy. Cada publicação muda os URL, por isso a cache não tem como servir a versão antiga.

**O que fica por resolver, e não tem solução neste alojamento.** O próprio `index.html` também é cacheado dez minutos, e é ele que traz os URL carimbados. Quem abriu o site nos dez minutos anteriores a uma mudança de palavra-passe continua a entrar com a antiga até a cache expirar. Resolve-se sozinho, mas convém saber: **uma palavra-passe mudada só está mesmo mudada dez minutos depois.**

**Como foi apanhado.** A testar o site publicado, não em local. Em local não há cache de dez minutos e o problema não existe. Vale para a próxima: uma mudança de alojamento verifica-se no alojamento.
