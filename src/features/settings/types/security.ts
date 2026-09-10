/** Uma sessão aberta na conta, com a origem do acesso (RF018). */
export interface AccountSession {
  id: string
  /** Navegador e sistema — "Chrome em Windows". */
  device: string
  /** Cidade estimada e endereço de origem, como o servidor os registra. */
  origin: string
  /** Quando a sessão começou. */
  startedAt: string
  /** Último uso; "agora" para a sessão de quem está na tela. */
  lastSeenAt: string
  current: boolean
}

export interface SecurityOverview {
  passwordChangedAt: string
  sessions: readonly AccountSession[]
}
