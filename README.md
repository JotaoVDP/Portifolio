# Portfólio · Data Engineer

Site estático, multilíngue (EN · PT-BR · ES · FR · FI), com tema escuro/claro,
publicado **gratuitamente no GitHub Pages**. Sem backend, sem build:
é só HTML, CSS e JS puro.

```
.
├── index.html
├── README.md
└── assets/
    ├── css/styles.css      # design system (tokens, dark/light, layout)
    ├── img/                # profile.jpg (foto) e scrap-truck.webp (opcional)
    └── js/
        ├── i18n.js         # TODOS os textos, nos 3 idiomas
        ├── bg.js           # fundo animado em grafo (canvas)
        ├── charts.js       # gráficos e diagramas SVG (sem biblioteca)
        └── main.js         # idioma, tema, navegação, animações
```

## 1. Fonte da verdade: o CV

Os números e fatos do site (pipelines, score de qualidade, modelos, agentes,
certificações) devem bater com o currículo. Ao atualizar o CV, revise `i18n.js`.

## Imagens

- **Foto:** salve em `assets/img/profile.jpg` (quadrada, ≥ 400×400). Sem o
  arquivo, o site mostra as iniciais "JV" no lugar.
- **Caminhão de sucata (opcional):** salve uma foto/render em
  `assets/img/scrap-truck.webp` (proporção 16:10, ex. 1600×1000). Ela aparece
  por baixo do HUD da câmera (caixas de detecção, alertas). Sem o arquivo, é
  usada a ilustração SVG. Prompt sugerido para gerar a imagem:

  > Top-down overhead security-camera view of an open-bed dump truck parked
  > horizontally at a steel plant scrap yard gate, cab on the left side of the
  > frame, the open bed filling the center 60% of the image, loaded with mixed
  > ferrous scrap metal: rusty steel plates, rebar, shredded steel, cast iron
  > chunks. Dark asphalt with faded yellow lane markings, slight wide-angle CCTV
  > look, overcast daylight, muted industrial colors, realistic photo, no text,
  > no people, no logos, 16:10.

## 2. Editar os textos (5 idiomas)

Todo o conteúdo textual fica em `assets/js/i18n.js`, num único objeto com as
chaves repetidas em `en`, `pt`, `es`, `fr` e `fi`. O inglês é o idioma padrão (usado
quando o navegador não está em PT/ES) e o fallback de qualquer chave faltando.
As tags no HTML (`data-i18n="..."`) apontam para essas chaves.

Nomes de tecnologias (chips), rótulos internos dos diagramas e dos gráficos
ficam em inglês de propósito.

## 3. Gráficos

`assets/js/charts.js` desenha os gráficos em SVG e lê as cores do tema via
variáveis CSS. Regra: **números de destaque são reais** (vindos do CV); o que
for ilustrativo precisa dizer isso na legenda (`figcaption`).

Diagramas (nós clicáveis abrem o modal; em telas estreitas viram layout vertical):
`lakehouse`, `system`, `observability`, `model`, `truck`.

- `dq` — score de qualidade ~70% → 94,78% (pontas reais, caminho ilustrativo)
- `iso` — dimensões ISO/IEC 25012 em "dumbbell" (ilustrativo, médias batem com o score)
- `accept` — ~70% de aceitação dos agentes (real) e motivos de rejeição (ilustrativo)
- `anomaly` — série sintética de sensor com anomalias (ilustrativo)
- `scrap` — waffle com a distribuição de classes de sucata (ilustrativo)

## 4. Cores e identidade visual

Tudo vem de variáveis CSS no topo de `assets/css/styles.css`, em `:root`
(tema escuro) e `[data-theme="light"]` (tema claro). O acento principal é
`--accent` (laranja industrial); troque ali para mudar a cara do site inteiro.

## 5. Publicar no GitHub Pages

1. Crie um repositório no GitHub. Para usar a URL curta
   `https://SEU-USUARIO.github.io`, nomeie o repo exatamente
   `SEU-USUARIO.github.io`. Qualquer outro nome também funciona (a URL fica
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`).
2. Suba os arquivos mantendo a estrutura de pastas, com o `index.html` na raiz:
   ```bash
   git init
   git add .
   git commit -m "portfolio"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```
3. No repositório: **Settings → Pages → Build and deployment → Source: _Deploy
   from a branch_**, selecione a branch `main` e a pasta `/ (root)`. Salve.
4. Aguarde ~1 minuto. O site fica disponível na URL indicada na própria página
   de Settings → Pages.

As fontes (Saira, IBM Plex Sans, JetBrains Mono) carregam do Google Fonts no
site publicado; se algum visitante estiver offline, há fallback para fontes do
sistema.

## Acessibilidade e detalhes

- Idioma inicial: usa o último escolhido (salvo no navegador), senão o idioma do
  navegador, senão Inglês.
- Tema inicial: segue o sistema (`prefers-color-scheme`); o botão alterna e a
  escolha é lembrada.
- Respeita `prefers-reduced-motion` (desliga animações de entrada).
- `<html lang>` é atualizado conforme o idioma selecionado.
