# Portfólio · Data Engineer

Site estático, multilíngue (PT-BR · EN · ES · FI), com tema escuro/claro,
pensado para publicação **gratuita no GitHub Pages**. Sem backend, sem build:
é só HTML, CSS e JS puro.

```
.
├── index.html
├── README.md
└── assets/
    ├── css/styles.css      # design system (tokens, dark/light, layout)
    └── js/
        ├── i18n.js         # TODOS os textos, nos 4 idiomas
        ├── charts.js       # gráficos SVG (mockups ilustrativos)
        └── main.js         # troca de idioma, tema, navegação, animações
```

## 1. Preencher os placeholders

Antes de publicar, troque 3 coisas (marcadas com `<!-- PLACEHOLDER -->` no HTML):

| O quê | Onde (`index.html`) |
|-------|---------------------|
| Nome no topo (marca) | `<span id="brandName">Seu Nome</span>` |
| Nome no título do hero | `<h1>Seu <span class="accent">Nome</span></h1>` |
| E-mail de contato | `<a id="contactEmail" href="mailto:...">` — troque **o `href` e o texto visível** |

O título da aba do navegador é montado automaticamente como
`Seu Nome · Portfólio · Data Engineer` a partir do `#brandName`.

## 2. Editar os textos (4 idiomas)

Todo o conteúdo textual fica em `assets/js/i18n.js`, num único objeto com as
chaves repetidas em `pt`, `en`, `es` e `fi`. Para ajustar uma frase, edite a
chave correspondente nos quatro idiomas. As tags no HTML (`data-i18n="..."`)
apontam para essas chaves — não precisa mexer no HTML para trocar texto.

> O cargo aparece como **"Data Engineer"** em todos os idiomas (mantido em inglês
> de propósito). Bronze/Silver/Gold, nomes de dimensões ISO/IEC 25012 e rótulos
> técnicos dos gráficos também ficam neutros em inglês.

## 3. Ajustar os gráficos (opcional)

Os números em `assets/js/charts.js` são **mockups ilustrativos** (há um aviso
visível no site deixando isso claro). Os gráficos são SVG desenhados à mão, sem
biblioteca externa, e leem as cores do tema ativo via variáveis CSS — então se
adaptam sozinhos ao alternar claro/escuro. Edite os arrays de dados em cada
função (`ingestion`, `kpiTrend`, `isoRadar`, `blend`, `frontier`, `scrapDist`,
`predActual`) se quiser outros valores.

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
  navegador, senão Português.
- Tema inicial: escuro por padrão; o botão alterna e a escolha é lembrada.
- Respeita `prefers-reduced-motion` (desliga animações de entrada).
- `<html lang>` é atualizado conforme o idioma selecionado.
