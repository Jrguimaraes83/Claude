export type Nivel = 'simples' | 'moderada' | 'complexa'

/** `auto`: classifica cada prompt; um nível fixa esse nível; `off` não mexe. */
export type Modo = 'auto' | 'off' | Nivel

declare module 'claude-code' {
  interface PluginState {
    /**
     * `abaixo`: quantos prompts seguidos pediram um nível menor que o atual;
     * o rebaixamento só acontece quando chega a `REBAIXAR_APOS`.
     */
    'auto-modelo': { nivel: Nivel | null; modo: Modo; abaixo: number }
  }
}
