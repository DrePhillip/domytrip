# DoMyTrip

App móvel que decide o teu dia à última hora, onde quer que estejas.

Chegas a Roma, abres a app: ela sabe que gostas de museus, vê o que tens à volta,
monta-te o roteiro do dia e mostra-te o caminho. Se quiseres companhia, há hangouts.

---

## Ver o protótipo

Abre `prototype/index.html` no browser. Não precisa de instalação nem de servidor.

Se preferires servir por HTTP:

```bash
node tools/serve.js . 4173
```

E abre <http://localhost:4173/prototype/index.html>.

O protótipo foi desenhado para **390 × 844** (iPhone 14/15) e aparece dentro de uma moldura
de telemóvel. Numa janela baixa, a moldura reduz automaticamente.

### Como se navega

| Passo | O que fazer |
|---|---|
| Splash | Espera ou clica |
| Login | Qualquer botão entra — não há autenticação real |
| Onboarding | Escolhe 3 ou mais gostos, depois ritmo, orçamento e hangouts. "Saltar" usa museus, história e comida |
| Mapa | **Roda o rato sobre a folha de baixo** para a abrir: peek → metade → cheia. É aí que está o roteiro do dia. Os pins numerados são as paragens, pela ordem do roteiro |
| Mapa | **Arrasta** para mover, **roda do rato** ou os botões `+` / `−` para zoom, duplo clique para aproximar. A mira volta a centrar em ti |
| Pins | Clica num pin para ver o local, a rota e a justificação da sugestão |
| Roteiro | Separador "Roteiro" → "Começar roteiro" → "Cheguei, seguir" até ao fim |
| Recibo | Aparece no fim do dia, ou pelo Perfil → Histórico |

---

## Onde vive

| | |
|---|---|
| **Site** | **[drephillip.github.io/domytrip](https://drephillip.github.io/domytrip/)** |
| Código | [github.com/DrePhillip/domytrip](https://github.com/DrePhillip/domytrip) — público |
| Publicação | GitHub Pages, automático a cada `git push` |

O `netlify.toml` fica no repositório como alternativa, para o dia em que fizer falta um domínio próprio ou headers HTTP a sério.

---

## A porta

O site pede uma palavra-passe antes de mostrar seja o que for ([prototype/js/gate.js](prototype/js/gate.js)).

**A palavra-passe do site vem do secret `GATE_PASSWORD`**, injetado no build por `tools/build-site.js`. Define-o em *Settings → Secrets and variables → Actions*:

```bash
gh secret set GATE_PASSWORD
```

Sem esse secret, o site usa `roma2026` — que está no código, num repositório público, e portanto não protege nada.

> **A porta não é segurança.** A palavra-passe acaba sempre no JavaScript que o browser recebe. Serve para o link não ficar aberto a quem passe por ele por acaso. Ver ADR-023 e ADR-025.

Abaixo de 480px de largura a moldura de telemóvel desaparece e a app ocupa o ecrã todo.

---
## Documentos

Ler por esta ordem:

| Ficheiro | O que tem |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Regras de produto e de código. Ler antes de tocar em alguma coisa |
| [DESIGN.md](DESIGN.md) | Tokens, componentes, regras do mapa. Normativo |
| [DECISIONS.md](DECISIONS.md) | Porque é que as coisas são como são. Formato ADR |
| [brand/README.md](brand/README.md) | Logo: prompts fal.ai, pipeline e regras de uso |

---

## Estado

Protótipo **clicável, não funcional**. Sem backend, sem GPS, sem mapa real, sem pagamentos.
O mapa é uma Roma estilizada desenhada em SVG por código; as distâncias vêm dos dados mock.

A marca é um **monograma D** gerado no fal.ai e vetorizado no fal.ai — ver [brand/README.md](brand/README.md)
e os ADR-008, 012 e 015. Para regenerar: `node tools/build-brand.js`.

O mapa é **2.5D**: câmara inclinada e edifícios extrudidos, desenhados por código em SVG,
sem provedor de mapas e sem dependências. Ver ADR-014.

O caminho de produção é **Expo + React Native**, reaproveitando os tokens e a estrutura
de ecrãs. Ver ADR-001.
