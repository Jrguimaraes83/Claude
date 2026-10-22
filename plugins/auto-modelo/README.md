# auto-modelo

Mod do Claude Code que troca o modelo e o esforço de raciocínio do loop principal conforme a complexidade de cada prompt.

| Nível | Modelo padrão | Esforço |
|---|---|---|
| simples | claude-sonnet-5-5 | low |
| moderada | claude-sonnet-5-5 | medium |
| complexa | claude-opus-5-5 | high |

O modelo de cada nível pode ser trocado em `/config` (opções: Haiku, Sonnet, Opus e Fable). O esforço acompanha o nível.

A classificação usa heurística (palavras-chave, tamanho, blocos de código) e, nos casos ambíguos, o Haiku com limite de 4 s. Uma palavra-chave isolada num prompt curto não basta para subir ao nível complexo: o caso vai para o classificador. Respostas curtas como "ok" ou "continua" herdam o nível anterior. Subagentes não são afetados.

Trocar de modelo descarta o cache do prompt, e o novo modelo relê a conversa inteira a preço cheio. Por isso o mod sobe de nível na hora, mas só desce depois de dois prompts seguidos pedindo um nível menor.

Comando: `/auto-modelo auto | off | simples | moderada | complexa | status`.

## Instalação

No prompt de uma sessão do Claude Code:

```
/plugin install auto-modelo --marketplace Jrguimaraes83/Claude
```

Responda `y` para adicionar o marketplace e escolha o escopo **user** para ter o mod em todas as sessões.

Pelo shell:

```
claude plugin install auto-modelo --marketplace Jrguimaraes83/Claude
```
