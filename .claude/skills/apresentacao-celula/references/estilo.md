# Guia visual e catálogo de layouts

Leia antes de escrever os slides. O exemplo completo, com as 21 `<section>` prontas,
está em `exemplo-slides.html`. Copie os blocos de lá e troque o conteúdo: é mais rápido
e mais consistente do que desenhar do zero.

## Sumário
1. Tela e tipografia
2. Paleta
3. Classes prontas (base.html)
4. Catálogo de layouts (qual slide do exemplo usar)
5. Logo
6. Imagens
7. Armadilhas já encontradas

## 1. Tela e tipografia

- Cada slide é uma `<section class="slide">` de **1920×1080 px**. O base.html escala para
  a tela e imprime 1 slide por página.
- Posicione com `class="abs"` + `left/top/width` em px (o exemplo faz assim). Margem
  lateral padrão: 96 px. Não deixe nada passar de y ≈ 1030; o número da página fica em
  `bottom:22px`.
- Fontes: **Playfair Display** (títulos, citações bíblicas em itálico) e **Montserrat**
  (texto corrido). Já vêm no `<head>` do base.html.
- Escala de tamanhos: títulos 60–76 px (capa e destaques 120–190 px), texto 28–44 px,
  referências 24–32 px. Nada abaixo de 24 px: é projetado no telão.
- A Montserrat é larga. Conte cerca de 0,62 × tamanho da fonte por caractere para saber
  se uma linha cabe; em caso de dúvida, dê mais largura ou corte texto.

## 2. Paleta (variáveis já definidas no base.html)

| Variável | Hex | Uso |
|---|---|---|
| `--creme` | #F2EFE8 | fundo da maioria dos slides |
| `--creme-2`, `--areia` | #E9E3D6, #DCCFBA | cartões, caixas de destaque |
| `--vinho` | #9E1B32 | referências bíblicas, fios, palavras-chave |
| `--vinho-forte` | #A10A24 | faixas de rodapé (`.faixa-vinho`), selo de aviso |
| `--vinho-claro` | #D6404F | título da capa sobre fundo taupe |
| `--dourado`, `--dourado-claro` | #C9A25A, #E3C27E | rótulos sobre fundo escuro, fios |
| `--marinho` | #0E1A2B | **slides de destaque de tela cheia** (cor da logo) |
| `--taupe` | #55504A | capa e slide final da Ceia |
| `--tinta`, `--cinza` | #1E1C1A, #5E5953 | texto |

Slides de destaque de tela cheia usam **azul-marinho**, não vermelho: o usuário pediu para
trocar os fundos vermelhos. O vinho continua nos detalhes: faixas, fios e referências.

## 3. Classes prontas (base.html)

- `.secao`: cabeçalho pequeno em serifa no topo, com um fio até a logo. Com a logo à
  direita, ponha `class="slide com-logo"` na section.
- `.logo`: logo no canto superior direito (110 px).
- `.ref`: referência bíblica (Montserrat bold, vinho).
- `.faixa-vinho` (e `.faixa-vinho.sans`): faixa de frase-síntese no rodapé.
- `.comp`: tabela comparativa com a coluna da direita em vinho (`td.dir`) e um rótulo à
  esquerda (`td.rot`).
- `.serif`, `.vinho`, `.dourado`: utilitários.

## 4. Catálogo de layouts (número = slide em exemplo-slides.html)

| Tipo de conteúdo | Use o slide |
|---|---|
| Recados (caixas com ícones de data e local, selo de vagas) | 1 |
| Capa (taupe, fio vinho vertical, título grande, dados no canto) | 2 |
| Texto-base com versículos numerados e ilustração ao lado | 3 |
| Problema + ilustração em SVG + cartão com uma história bíblica | 4 |
| Frase-chave em tela cheia (fundo marinho) | 5 ou 19 |
| Conceito com diagrama de sobreposição | 6 |
| Antes/depois em duas metades com imagens e faixa no rodapé | 7 |
| Afirmação à esquerda + versículo em cartão à direita | 8 |
| Três cartões + versículo central + faixa | 9 |
| Dois personagens em colunas, com fio vinho no meio | 10 |
| Tabela "tentativa humana × plano de Deus" | 11 ou 16 |
| Linha do caminho com 4 pontos (sequência de fatos) | 12 |
| Dois retratos em contraste | 13 |
| Diagrama de relação (cruz com setas entre personagens) | 14 |
| Linha do tempo sobre imagem, com chave e conclusão | 15 |
| Citação enorme com imagem esmaecida no canto | 17 |
| Diagrama circular (infinito) com texto dos dois lados | 18 |
| Encerramento/apelo com brilho e curva | 20 |
| Slide final da Ceia (espelha a capa) | 21 |

Varie os layouts: dois slides seguidos com a mesma estrutura cansam. Alterne fundo claro
e escuro nos momentos de ênfase (no máximo 3 ou 4 slides escuros por pregação).

## 5. Logo

`{{logo_navy}}` em fundo claro e `{{logo_branca}}` em fundo escuro (marinho ou taupe).
Os dois arquivos estão em `assets/img/` e já têm fundo transparente. Se o usuário mandar
uma logo nova, gere as duas versões assim: canal alfa = quanto o pixel é mais escuro que
o branco; cor = azul-marinho #0E1A2B ou creme #F5F0E6.

## 6. Imagens

- As de `assets/img/exemplo/` (montanha, carneiro, retratos de Judas e Paulo, faixa do
  templo à cruz, arbusto) servem para Gênesis 22, Judas e Paulo, Esdras e a cruz. Use
  quando o tema combinar.
- Se o usuário mandar um PDF ou imagens de referência, recorte as ilustrações com
  PyMuPDF + Pillow **sem** pegar texto nem marcas d'água (por exemplo, o selo "Gemini
  Notebook" no canto inferior direito) e salve na pasta de imagens da pregação.
- Não invente foto de pessoa real. Na falta de imagem, use diagramas em SVG ou CSS, como
  nos slides 4, 6, 12, 14 e 18.
- Para esmaecer a borda de uma imagem, aplique o degradê na própria imagem com o Pillow.
  `mask-image` do CSS deixa uma linha dura no PDF.

## 7. Armadilhas já encontradas

- **Fontes.** Sem internet, o navegador troca as fontes e o layout muda: o texto fica mais
  estreito e parece caber. Revise sempre pelos PNGs do `render.mjs`, que carrega as fontes
  de verdade.
- **Rótulos sobre linhas.** Em diagramas SVG, confira se nenhum rótulo cruza uma linha ou
  curva. Isso aconteceu nos slides 4, 12 e 20 e foi corrigido.
- **Palavra sozinha na última linha.** Uma palavra solta no fim de uma citação ("mim.")
  pede mais largura na caixa.
- **Rótulos que quebram.** Rótulo de tabela quebrando em duas linhas ("O desfecho"):
  aumente `td.rot` ou use `white-space:nowrap`.
