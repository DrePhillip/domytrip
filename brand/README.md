# Marca DoMyTrip

A marca é um **monograma D**: barra reta, barriga curva da mesma espessura, e um corte diagonal limpo na parte inferior direita. Gerada no fal.ai e vetorizada no fal.ai — ver `DECISIONS.md` → ADR-008, ADR-012 e ADR-015.

## Ficheiros

| Ficheiro | O que é |
|---|---|
| `logo-mark.svg` | Marca isolada, `currentColor` |
| `logo-lockup.svg` | Marca + palavra, para cabeçalhos |
| `app-icon.svg` | Ícone de app 512×512, preto com a marca a branco |
| `logo-mark-fal.svg` | **Fonte.** O SVG cru que saiu do vetorizador. Não usar diretamente |

`logo-mark-fal.svg` não serve para usar na app: o vetorizador devolve camadas de preto e branco empilhadas, e o branco só "funciona" porque o fundo é branco. Sobre fundo escuro a marca desfaz-se.

## Regenerar

```bash
node tools/build-brand.js
```

O script lê `logo-mark-fal.svg`, transforma as camadas numa **máscara** (preto/branco alternados) aplicada a um retângulo com `fill="currentColor"`, e escreve os três ficheiros acima. Também injeta o `<symbol id="dmt-mark">` entre os marcadores `<!--LOGO-SPRITE-->` do `prototype/index.html`.

No protótipo a marca é usada assim:

```html
<svg class="logo-mark" width="44" height="44"><use href="#dmt-mark"/></svg>
```

Inline e por `<use>`, porque `<img>` não herda `currentColor` e a marca tem de ser branca sobre escuro e preta sobre claro.

---

## Pipeline de geração

### 1 — Marca

Modelo **`fal-ai/nano-banana-pro`**, `aspect_ratio: "1:1"`, `resolution: "2K"`, `num_images: 3`.

```
A bold geometric monogram logo mark: the single capital letter D. The stem is a
straight solid vertical bar of uniform thickness; the bowl is one confident wide
curve of the same thickness. A single clean diagonal cut slices through the lower
right of the bowl, leaving a narrow white gap that breaks the curve and creates
tension. Solid black letterform on a pure flat white background. CRITICAL FRAMING:
the letterform is small and perfectly centered, occupying only the middle 55 percent
of the square canvas, with very large empty white margins on all four sides. Nothing
touches or bleeds off any edge. Swiss modernist logotype, strict geometric
construction, extremely simple, readable at 24 pixels. Flat 2D vector silhouette,
no gradients, no shadows, no 3D, no outline, no container shape, no other letters
or words.
```

A instrução de enquadramento não é opcional: sem ela a letra sai a sangrar pelas quatro bordas e não há viewBox que a salve.

Escolher a que continuar legível reduzida a 24px. **Atenção:** a resposta pode trazer 4 imagens mas só 3 pré-visualizações, e os índices não coincidem com a ordem apresentada. Confirmar o `url` exato antes de vetorizar.

### 2 — Vetorizar

Modelo **`fal-ai/recraft/vectorize`**, com `image_url` do PNG escolhido. Gravar o SVG como `brand/logo-mark-fal.svg`.

### 3 — Ajustar a caixa

`tools/build-brand.js` tem no topo:

```js
const VB = { x: 573, y: 573, w: 902, h: 902 };
```

É a caixa quadrada à volta da marca. Se a marca nova tiver outro enquadramento, medir a bounding box do caminho preto e centrar um quadrado com ~10% de folga. Depois correr o script.

---

## Imagens dos ecrãs de marca — retiradas

Chegaram a existir duas (`bg-dusk.jpg` e `bg-flow.jpg`, geradas com o mesmo modelo em 9:16)
para o login e o onboarding. Foram apagadas quando a direção voltou ao Uber estrito: preto
sólido e branco, sem fotografia de fundo. Ver ADR-013.

Os prompts ficam registados no ADR-010 caso a direção volte atrás.

---

## Regras de utilização

- Margem livre à volta da marca: metade da sua largura. Nada encosta.
- Tamanho mínimo da marca isolada: **20px**. Abaixo disso o corte diagonal fecha.
- Tamanho mínimo do lockup: **120px** de largura.
- Duas versões apenas: **preto sobre claro** e **branco sobre escuro**. Nunca a cores, nunca com contorno.
- A palavra escreve-se **DoMyTrip**: uma palavra, D, M e T maiúsculos, sem espaços nem hífen.
