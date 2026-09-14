/** Uma sessão aberta na conta, com a origem do acesso (RF018). */
export interface AccountSession {
  id: string
  /** Navegador e sistema — "Chrome em Windows". */
  device: string
  /** O endereço de origem, como o servidor o registrou. */
  origin: string
  /** Quando a sessão começou. */
  startedAt: string
  /** Último uso. */
  lastSeenAt: string
  current: boolean
}

export interface SecurityOverview {
  /** Falso na conta criada pelo Google, que ainda não definiu senha. */
  passwordSet: boolean
  passwordChangedAt: string | null
  sessions: readonly AccountSession[]
}
