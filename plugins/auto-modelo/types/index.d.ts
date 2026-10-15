export type Nivel = 'simples' | 'moderada' | 'complexa'

/** `auto`: classifica cada prompt; um nível fixa esse nível; `off` não mexe. */
export type Modo = 'auto' | 'off' | Nivel

declare module 'claude-code' {
  interface PluginState {
    'auto-modelo': { nivel: Nivel | null; modo: Modo }
  }
}
