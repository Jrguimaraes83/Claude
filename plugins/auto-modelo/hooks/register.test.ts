import { expect, test } from 'claude-code/testing'

import { nivelHeuristico, proximoNivel } from './register'

const drain = async (s: AsyncIterable<unknown>) => {
  for await (const _ of s) {
  }
}

test('heurística separa os casos claros', async () => {
  expect(nivelHeuristico('qual é o comando para listar branches?', null)).toBe('simples')
  expect(nivelHeuristico('refatore o módulo de pagamentos e planeje a migração do banco', null)).toBe('complexa')
  expect(nivelHeuristico('ok, continua', 'complexa')).toBe('complexa')
})

test('um sinal isolado num prompt curto vai para o classificador', async () => {
  expect(nivelHeuristico('como ativo o modo debug no vite?', null)).toBeUndefined()
})

test('sobe na hora e só desce depois de dois prompts seguidos', async () => {
  expect(proximoNivel('simples', 'complexa', 0)).toEqual({ nivel: 'complexa', abaixo: 0 })
  expect(proximoNivel('complexa', 'simples', 0)).toEqual({ nivel: 'complexa', abaixo: 1 })
  expect(proximoNivel('complexa', 'simples', 1)).toEqual({ nivel: 'simples', abaixo: 0 })
  expect(proximoNivel('complexa', 'complexa', 1)).toEqual({ nivel: 'complexa', abaixo: 0 })
})

test('prompt complexo leva o loop principal ao Opus', async ($, on) => {
  const vistos: string[] = []
  on('turn.step', async function* ($, e) {
    vistos.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } as never
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))

  await $.prompt.submit({ text: 'investigue a causa raiz desse deadlock e refatore a fila', wait: false } as never)
  await drain($.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', effort: 'medium', messageCount: 1 }))
  expect(vistos[0]).toBe('claude-opus-5-5')

  // O primeiro prompt simples depois de um complexo ainda fica no Opus,
  // para não descartar o cache por uma pergunta isolada.
  await $.prompt.submit({ text: 'qual é a versão do node?', wait: false } as never)
  await drain($.turn.step({ turnId: 't2', index: 0, model: 'claude-opus-5-5', effort: 'high', messageCount: 3 }))
  expect(vistos[1]).toBe('claude-opus-5-5')

  await $.prompt.submit({ text: 'qual é a versão do npm?', wait: false } as never)
  await drain($.turn.step({ turnId: 't3', index: 0, model: 'claude-opus-5-5', effort: 'high', messageCount: 5 }))
  expect(vistos[2]).toBe('claude-sonnet-5-5')
})

test('o modelo de cada nível vem do /config', { options: { modelo_complexa: 'claude-fable-5-1' } }, async ($, on) => {
  const vistos: string[] = []
  on('turn.step', async function* ($, e) {
    vistos.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } as never
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))

  await $.prompt.submit({ text: 'investigue a causa raiz desse deadlock e refatore a fila', wait: false } as never)
  await drain($.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', effort: 'medium', messageCount: 1 }))
  expect(vistos[0]).toBe('claude-fable-5-1')
})
