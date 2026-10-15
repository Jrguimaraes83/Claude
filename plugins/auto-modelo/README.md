# auto-modelo

Mod do Claude Code que troca o modelo e o esforço de raciocínio do loop principal conforme a complexidade de cada prompt.

| Nível | Modelo | Esforço |
|---|---|---|
| simples | claude-sonnet-5-5 | low |
| moderada | claude-sonnet-5-5 | medium |
| complexa | claude-opus-5-5 | high |

A classificação usa heurística (palavras-chave, tamanho, blocos de código) e, nos casos ambíguos, o Haiku com limite de 4 s. Respostas curtas como "ok" ou "continua" herdam o nível anterior. Subagentes não são afetados.

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
