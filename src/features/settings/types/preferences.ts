/** Por onde um aviso pode chegar. */
export type NotificationChannel = 'email' | 'portal' | 'sms'

export type NotificationEventId =
  | 'transicao'
  | 'seguranca'
  | 'prazo'
  | 'complemento'
  | 'mensagem'
  | 'pesquisa'
  | 'relatorio'

/** Ligado ou desligado, por evento e por canal — cada canal é independente. */
export type NotificationPreferences = Record<
  NotificationEventId,
  Record<NotificationChannel, boolean>
>
