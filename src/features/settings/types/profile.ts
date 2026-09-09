/** Os dados cadastrais que a conta mostra e deixa editar (RF016 / RF017). */
export interface AccountProfile {
  name: string
  email: string
  /** CPF completo; a tela só o mostra mascarado, salvo ação explícita. */
  document: string
  phone: string
  /** Novo e-mail à espera de confirmação — o atual continua valendo até lá. */
  pendingEmail?: string
}

/** Os campos que a pessoa pode alterar por conta própria. O documento não entra. */
export type EditableField = 'name' | 'email' | 'phone'

/** As seções da área de configurações, na ordem da navegação lateral. */
export type SettingsSection = 'hub' | 'dados' | 'seguranca' | 'notificacoes'
