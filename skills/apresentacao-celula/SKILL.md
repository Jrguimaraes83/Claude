---
name: apresentacao-celula
description: Transforma a transcrição de uma pregação/culto (texto com ou sem marcações de tempo) em uma apresentação de slides no padrão visual da Bola de Neve Londrina — recados primeiro, depois tema, pregador e data, versículos na NVI, visual creme/vinho/dourado/azul-marinho com a logo da igreja — entregue como HTML único (para projetar) e PDF (para imprimir/compartilhar). Use sempre que o usuário colar a transcrição ou o resumo de uma mensagem, sermão, pregação, ministração, culto ou encontro de célula e pedir slides, apresentação, telão, "PowerPoint", resumo em slides ou material do culto, mesmo que não mencione a igreja, o HTML ou o PDF. Use também para revisar, corrigir ou atualizar slides já gerados por esta skill, ou quando pedir a "skill de apresentação Célula".
---

# Apresentação Célula — Bola de Neve Londrina

Você recebe a transcrição (geralmente automática, cheia de erros de reconhecimento de voz
e marcações de tempo) e os recados da semana. Entrega uma apresentação que a igreja
projeta no culto e compartilha depois. O público é a própria congregação: gente que
ouviu a mensagem e quer lembrar dos pontos e dos versículos.

## Entradas

Tire da mensagem do usuário, sem perguntar o que já estiver lá:
- **Tema**, **pregador** e **data** do culto.
- **Recados**: eventos, datas, valores, vagas. Não invente recado. Sem recados, pergunte
  se é para omitir o slide.
- **Transcrição**.
- **Opcional**: PDF ou imagens de referência visual, logo nova, pedidos de ênfase ("inclua
  a menção sobre…").

## Regras de conteúdo (pedidas pelo usuário)

1. **O primeiro slide é o de recados.** O segundo traz tema, pregador e data.
2. **Linguagem clara, objetiva e humana.** Frases curtas, sem excesso de adjetivos, em
   português do dia a dia ("você", "a gente" só se o pregador falar assim). Um slide
   carrega uma ideia.
3. **Cite os versículos.** Cada ponto da mensagem mostra a referência (Livro cap.vers). As
   citações entre aspas seguem a NVI; veja `references/nvi.md`.
4. **Seja fiel à pregação.** A ordem dos slides acompanha a ordem da mensagem. As
   ilustrações do pregador (Elias, Matias, "tigrinho", a casa de Judas…) viram slides
   quando sustentam um ponto. Piadas e trechos de condução do culto ficam de fora.
5. **Termine no momento do culto.** Em culto de Ceia, feche com um slide da Ceia (por
   exemplo, Lucas 22.19). Em culto com apelo, com a frase de apelo.

## Checagem de fatos

A transcrição traz afirmações bíblicas e históricas imprecisas: números errados, datas
arredondadas, especulação apresentada como fato. Slide projetado vira "verdade oficial"
para a igreja, então:

- **Erro verificável** (número, nome, referência): no slide vai a versão correta. Na
  resposta, liste o que mudou e por quê. Exemplos já vistos: "Elias matou 850 homens"
  (1 Reis 18 fala de 450 profetas de Baal); "700 como você" (1 Reis 19.18 diz 7.000);
  "decreto 600 anos antes" (Dario, c. 520 a.C.; cruz, c. 30 d.C.).
- **Interpretação do pregador** (teoria sem base clara no texto): se o usuário pedir para
  incluir, inclua. Mantenha o grau de certeza que o próprio pregador usou ("muito
  provavelmente") e cite os textos em que ela se apoia. Na resposta, diga quais são os
  pontos fracos da interpretação. O usuário pediu para ser contrariado quando for o caso,
  não para ouvir que está tudo certo.
- Não acrescente doutrina, aplicação ou versículo que o pregador não usou, a não ser como
  referência de um versículo que ele citou sem dizer onde está.

## Culto ou célula

Veja qual dos dois o usuário pediu. Se não disser, pergunte.

- **Culto** (projeção da pregação): 15 a 22 slides seguindo a mensagem.
  Modelo: `references/exemplo-slides.html`.
- **Célula** (encontro em grupo, revisando a mensagem de domingo): 10 a 13 slides.
  Modelo: `references/exemplo-celula.html`. Ordem: recados, capa ("Célula", tema, quem
  pregou e a data do culto), quebra-gelo ligado ao tema, leitura do texto-base, resumo em
  3 ideias, 2 ou 3 slides de conversa (a história bíblica num cartão à esquerda, 2 ou 3
  perguntas abertas à direita), uma frase de destaque, o desafio da semana (3 ações
  concretas) e oração em trios, e o encerramento. Cada etapa leva um selo com o tempo
  sugerido (o total fica perto de 75 minutos).
  - As perguntas são abertas, pessoais e ligadas a um versículo. Evite perguntas de
    sim ou não e perguntas de "teste de conhecimento".
  - Em pergunta sensível (pecado, vícios), ofereça a conversa em duplas ou com o
    líder depois do encontro.
  - Especulações da pregação (por exemplo, a teoria do decreto de Esdras) ficam fora
    da célula, a não ser que o usuário peça: numa conversa em grupo elas viram o
    assunto principal.

## Fluxo de trabalho

1. **Leia a transcrição inteira** e monte o roteiro: 15 a 22 slides, cada um com tipo,
   ideia principal, versículos e layout (use o catálogo em `references/estilo.md`).
   Numa conversa rápida, siga direto; só pare para perguntar se faltar algo essencial,
   como os recados.
2. **Leia `references/estilo.md` e `references/nvi.md`.** Para montar os slides, abra
   `references/exemplo-slides.html`, a pregação "Em Memória de Mim" completa, e copie os
   blocos `<section>` que servirem.
3. **Prepare as imagens** numa pasta da pregação (por exemplo `img/`): recortes do PDF
   de referência, se houver, ou as do exemplo, quando o tema bater. As logos já estão em
   `assets/img/`.
4. **Escreva `slides.html`** só com as `<section class="slide">`, em ordem. Imagens
   entram como `{{nome}}` (o nome do arquivo sem extensão).
5. **Monte o HTML:**
   `python3 <skill>/scripts/build.py --slides slides.html --titulo "…" --pregador "…" --out <nome>.html --img-dir img`
6. **Gere o PDF e as imagens de revisão:**
   `node <skill>/scripts/render.mjs <nome>.html <nome>.pdf revisao/` e depois
   `python3 <skill>/scripts/folhas.py revisao/`
7. **Revise as folhas de contato**, olhando de verdade: texto sobre linha ou imagem,
   palavra sozinha numa linha, texto cortado ou fora da margem, rótulo quebrado, slide
   vazio demais. Corrija `slides.html`, repita os passos 5 e 6 e confira de novo. Se o
   `render.mjs` avisar que as fontes não carregaram, avise o usuário: o layout do PDF vai
   sair diferente.
8. **Entregue** o HTML e o PDF ao usuário (use a ferramenta de envio de arquivos, se
   houver). Se estiver num repositório git, faça commit e push na branch de trabalho.

O nome do arquivo sai do tema, em minúsculas e com hífens: `em-memoria-de-mim.html` e
`.pdf`.

## Resposta ao usuário

Seja curto:
- O que foi entregue (quantos slides, HTML para projetar com setas e **F** para tela
  cheia, PDF para imprimir).
- **Correções de fato** feitas em relação à transcrição, em lista.
- **Interpretações** que ficaram, com a ressalva.
- **O que conferir antes do culto**: citações NVI feitas de memória, valores dos recados
  e somas que você não fez (por exemplo, se a inscrição e o ônibus são cobrados juntos).

## Pedidos de ajuste

Pedidos como "troque a cor", "mude a versão da Bíblia" ou "inclua tal menção": edite o
`slides.html` (ou o `base.html`, se for mudança de paleta global), refaça os passos 5 a 7
e reenvie os dois arquivos. Mudanças de paleta que valem para todas as pregações vão para
`assets/base.html` e `references/estilo.md`, para a próxima pregação já sair certa.
