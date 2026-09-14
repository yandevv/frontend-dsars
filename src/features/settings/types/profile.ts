/** Os dados cadastrais que a conta mostra e deixa editar (RF016 / RF017). */
export interface AccountProfile {
  name: string
  email: string
  /** O documento como o servidor o devolve: já mascarado. */
  documentMasked?: string
  documentType?: string
  documentVerified: boolean
  /** O telefone como o servidor o devolve: já mascarado. */
  phoneMasked?: string
  /** Novo e-mail à espera de confirmação — o atual continua valendo até lá. */
  pendingEmail?: string
  /** Falso na conta criada pelo Google, que ainda não definiu senha. */
  passwordSet: boolean
}

/** Os campos que a pessoa pode alterar por conta própria. O documento não entra. */
export type EditableField = 'name' | 'email' | 'phone'

/** Os dados que chegam mascarados e só aparecem por ação explícita. */
export type RevealableField = 'document' | 'phone'

/** As seções da área de configurações, na ordem da navegação lateral. */
export type SettingsSection = 'hub' | 'dados' | 'seguranca' | 'notificacoes'
