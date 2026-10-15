import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Modo, Nivel } from '../types'

const nivelAtual = atom({ plugin: 'auto-modelo', key: 'nivel' } as const, null)
const modoAtual = atom({ plugin: 'auto-modelo', key: 'modo' } as const, 'auto')

type Esforco = 'low' | 'medium' | 'high'

export const ROTA: Record<Nivel, { model: string; effort: Esforco; rotulo: string }> = {
  simples: { model: 'claude-sonnet-5-5', effort: 'low', rotulo: 'Sonnet · low' },
  moderada: { model: 'claude-sonnet-5-5', effort: 'medium', rotulo: 'Sonnet · medium' },
  complexa: { model: 'claude-opus-5-5', effort: 'high', rotulo: 'Opus · high' },
}

const SINAIS_COMPLEXA = [
  /arquitet/i, /refator/i, /\bmigr(a|ação|ar)/i, /\bdesenh(e|ar) (o|um) sistema/i,
  /investig/i, /causa raiz/i, /\bdepur/i, /\bdebug/i, /estrat[ée]g/i, /\bplanej/i,
  /otimiz/i, /performance|desempenho/i, /seguran[çc]a|vulnerab/i, /concorr[êe]ncia|race condition|deadlock/i,
  /do zero/i, /v[áa]rios arquivos|todo o (projeto|reposit[óo]rio)/i, /trade-?offs?/i,
  /\barchitect/i, /\brefactor/i, /\bmigrat/i, /root cause/i, /\binvestigat/i, /from scratch/i,
]

const SINAIS_SIMPLES = [
  /^(o que [ée]|qual [ée]|quanto [ée]|como se escreve)\b/i, /\brenomei/i, /\brename\b/i, /\btypo\b/i,
  /erro de digita[çc][ãa]o/i, /\btraduz/i, /\bformat(e|ar)\b/i, /\bgit (status|log|diff)\b/i,
  /^(liste|mostre|abra|leia)\b/i, /\bresum(a|o) (curto|r[áa]pido)/i,
]

const CONTINUACAO = /^(ok|sim|s|n[ãa]o|continu[ae]|segue|pode|manda|isso|beleza|valeu|obrigad[oa]|go|yes|no|next)\b/i

/**
 * Decide sem chamar modelo quando os sinais são claros; `undefined` quando é
 * ambíguo e vale perguntar ao classificador.
 */
export const nivelHeuristico = (texto: string, anterior: Nivel | null): Nivel | undefined => {
  const t = texto.trim()

  // Respostas curtas no meio de uma tarefa herdam o nível dela: rebaixar o
  // modelo num "ok, continua" quebraria uma tarefa complexa em andamento.
  if (anterior && t.length <= 40 && CONTINUACAO.test(t)) {
    return anterior
  }

  const blocosDeCodigo = (t.match(/```/g) ?? []).length / 2
  const complexos = SINAIS_COMPLEXA.filter(r => r.test(t)).length
  const simples = SINAIS_SIMPLES.filter(r => r.test(t)).length

  if (t.length > 1500 || complexos >= 2 || blocosDeCodigo >= 3) {
    return 'complexa'
  }
  if (complexos === 1 && simples === 0) {
    return 'complexa'
  }
  if (simples > 0 && complexos === 0 && t.length < 300) {
    return 'simples'
  }
  if (t.length < 60 && complexos === 0) {
    return 'simples'
  }

  return undefined
}

const ROTULOS: Record<string, Nivel> = {
  'trivial: pergunta factual curta, comando unico, edicao pequena e localizada': 'simples',
  'moderada: implementar ou corrigir algo bem delimitado, explicar codigo, escrever texto': 'moderada',
  'complexa: arquitetura, depuracao dificil, refatoracao ampla, analise ou planejamento em varias etapas': 'complexa',
}

const classificar = async ($: EngineInterface, texto: string): Promise<Nivel> => {
  const pergunta = $.model
    .classify(texto.slice(0, 4000), Object.keys(ROTULOS), { model: 'haiku' })
    .then(r => (r === undefined ? undefined : ROTULOS[r]))
    .catch(() => undefined)
  // Um classificador lento não pode segurar o prompt da pessoa.
  const limite = $.clock.sleep(4000).then(() => undefined)
  const nivel = await Promise.race([pergunta, limite])

  return nivel ?? 'moderada'
}

const mostrar = ($: EngineInterface, modo: Modo, nivel: Nivel | null) => {
  if (modo === 'off') {
    $.ui.status(undefined)
    return
  }
  if (nivel === null) {
    $.ui.status(`auto-modelo: ${modo}`)
    return
  }
  const fixo = modo === 'auto' ? '' : ' (fixo)'
  $.ui.status(`auto-modelo: ${nivel} → ${ROTA[nivel].rotulo}${fixo}`)
}

const MODOS: readonly Modo[] = ['auto', 'off', 'simples', 'moderada', 'complexa']

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'auto-modelo',
      description: 'auto | off | simples | moderada | complexa | status: controla a troca automática de modelo',
    })
    mostrar($, await read($, modoAtual), await read($, nivelAtual))

    return next(e)
  })

  on('command.run', { command: 'auto-modelo' }, async ($, e) => {
    const pedido = e.args.trim().toLowerCase()

    if (pedido === '' || pedido === 'status') {
      const modo = await read($, modoAtual)
      const nivel = await read($, nivelAtual)
      const linhas = Object.entries(ROTA).map(([n, r]) => `  ${n}: ${r.model} (${r.effort})`)

      return {
        text: [`modo: ${modo}`, `último nível: ${nivel ?? '—'}`, 'rotas:', ...linhas].join('\n'),
      }
    }
    if (!(MODOS as readonly string[]).includes(pedido)) {
      return { text: `Use: /auto-modelo ${MODOS.join(' | ')} | status` }
    }

    const modo = pedido as Modo
    await update($, modoAtual, () => modo)
    const nivel = modo === 'auto' || modo === 'off' ? await read($, nivelAtual) : modo
    await update($, nivelAtual, () => nivel)
    mostrar($, modo, nivel)

    return { text: `auto-modelo: ${modo}` }
  })

  // Se a classificação falhar, o prompt segue intacto com o modelo da sessão.
  on('prompt.submit', async ($, e, next) => {
    // Comandos e mensagens que a pessoa não digitou não definem o nível.
    if (e.command || e.isMeta || e.turnId !== undefined) {
      return next(e)
    }

    const modo = await read($, modoAtual)
    if (modo !== 'auto') {
      return next(e)
    }

    const anterior = await read($, nivelAtual)
    const nivel = nivelHeuristico(e.text, anterior) ?? (await classificar($, e.text))
    await update($, nivelAtual, () => nivel)
    mostrar($, modo, nivel)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.step', async function* ($, e, next) {
    // Só o loop principal: subagentes seguem o modelo que lhes foi dado.
    if (e.agentId !== undefined) {
      return yield* next(e)
    }

    const modo = await read($, modoAtual)
    const nivel = await read($, nivelAtual)
    if (modo === 'off' || nivel === null) {
      return yield* next(e)
    }

    const rota = ROTA[nivel]
    // Esforço só onde o modelo da sessão já o aceita.
    const effort = e.effort === undefined ? undefined : rota.effort

    return yield* next({ ...e, model: rota.model, ...(effort ? { effort } : {}) })
  })
}
