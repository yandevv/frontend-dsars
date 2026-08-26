/** Aviso exibido no sino do cabeçalho. */
export interface AppNotification {
  id: string
  title: string
  detail: string
  /** Momento em linguagem corrente — "Hoje, 07:00", "Ontem, 18:40". */
  when: string
  unread: boolean
}
