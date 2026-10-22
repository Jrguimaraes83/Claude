import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register } from 'claude-code'

import type { Modo, Nivel } from '../types'

const nivelAtual = atom({ plugin: 'auto-modelo', key: 'nivel' } as const, null)
const modoAtual = atom({ plugin: 'auto-modelo', key: 'modo' } as const, 'auto')
const abaixoAtual = atom({ plugin: 'auto-modelo', key: 'abaixo' } as const, 0)

type Esforco = 'low' | 'medium' | 'high'
type Rota = { model: string; effort: Esforco }

const ESFORCO: Record<Nivel, Esforco> = { simples: 'low', moderada: 'medium', complexa: 'high' }

const PADRAO: Record<Nivel, string> = {
  simples: 'claude-sonnet-5-5',
  moderada: 'claude-sonnet-5-5',
  complexa: 'claude-opus-5-5',
}

const NIVEIS: readonly Nivel[] = ['simples', 'moderada', 'complexa']

/** Os modelos vêm do `/config` do mod; o esforço acompanha o nível. */
export const rotas = (options: PluginOptions): Record<Nivel, Rota> => {
  const modelo = (n: Nivel) => {
    const v = options[`modelo_${n}`]
    return typeof v === 'string' && v !== '' ? v : PADRAO[n]
  }
  return {
    simples: { model: modelo('simples'), effort: ESFORCO.simples },
    moderada: { model: modelo('moderada'), effort: ESFORCO.moderada },
    complexa: { model: modelo('complexa'), effort: ESFORCO.complexa },
  }
}

const rotulo = (r: Rota) => `${r.model.replace(/^claude-/, '')} · ${r.effort}`

/**
 * Trocar de modelo entre turnos descarta o cache do prompt: o novo modelo
 * relê a conversa inteira a preço cheio. Subir de nível é imediato (errar
 * para baixo custa qualidade); descer exige prompts seguidos pedindo menos.
 */
export const REBAIXAR_APOS = 2

export const proximoNivel = (
  anterior: Nivel | null,
  pedido: Nivel,
  abaixo: number,
): { nivel: Nivel; abaixo: number } => {
  if (anterior === null || NIVEIS.indexOf(pedido) >= NIVEIS.indexOf(anterior)) {
    return { nivel: pedido, abaixo: 0 }
  }
  const seguidos = abaixo + 1
  return seguidos >= REBAIXAR_APOS ? { nivel: pedido, abaixo: 0 } : { nivel: anterior, abaixo: seguidos }
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
  // Um sinal isolado num prompt curto ("como ativo o modo debug?") é
  // ambíguo demais para pagar o Opus sem perguntar ao classificador.
  if (complexos === 1 && simples === 0 && t.length >= 120) {
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

const mostrar = ($: EngineInterface, rota: Record<Nivel, Rota>, modo: Modo, nivel: Nivel | null) => {
  if (modo === 'off') {
    $.ui.status(undefined)
    return
  }
  if (nivel === null) {
    $.ui.status(`auto-modelo: ${modo}`)
    return
  }
  const fixo = modo === 'auto' ? '' : ' (fixo)'
  $.ui.status(`auto-modelo: ${nivel} → ${rotulo(rota[nivel])}${fixo}`)
}

const MODOS: readonly Modo[] = ['auto', 'off', 'simples', 'moderada', 'complexa']

export const register: Register = (on, options) => {
  const ROTA = rotas(options)

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'auto-modelo',
      description: 'auto | off | simples | moderada | complexa | status: controla a troca automática de modelo',
    })
    mostrar($, ROTA, await read($, modoAtual), await read($, nivelAtual))

    return next(e)
  })

  on('command.run', { command: 'auto-modelo' }, async ($, e) => {
    const pedido = e.args.trim().toLowerCase()

    if (pedido === '' || pedido === 'status') {
      const modo = await read($, modoAtual)
      const nivel = await read($, nivelAtual)
      const linhas = NIVEIS.map(n => `  ${n}: ${ROTA[n].model} (${ROTA[n].effort})`)

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
    await update($, abaixoAtual, () => 0)
    mostrar($, ROTA, modo, nivel)

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
    const pedido = nivelHeuristico(e.text, anterior) ?? (await classificar($, e.text))
    const { nivel, abaixo } = proximoNivel(anterior, pedido, await read($, abaixoAtual))
    await update($, nivelAtual, () => nivel)
    await update($, abaixoAtual, () => abaixo)
    mostrar($, ROTA, modo, nivel)

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
