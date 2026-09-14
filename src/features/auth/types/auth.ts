/** Critério de senha do RN002, conferido enquanto a pessoa digita. */
export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

/** Um critério junto com o resultado da conferência da senha atual. */
export interface PasswordCheck {
  id: string
  label: string
  met: boolean
}

/** Faixa de força da senha, derivada de quantos critérios já foram atendidos. */
export interface PasswordStrength {
  label: string
  /** Largura da barra, pronta para ir ao estilo inline. */
  width: string
  tone: 'danger' | 'warning' | 'brand' | 'idle'
}

/** O que a tela de acesso envia para autenticar. */
export interface Credentials {
  email: string
  password: string
  /** "Manter-me conectado": a sessão dura dias em vez de expirar por inatividade. */
  rememberMe?: boolean
}

/** Dados que o cadastro envia para criar uma conta de titular. */
export interface NewAccount {
  name: string
  email: string
  password: string
}

/** Perfil da conta — decide para onde o login leva (RF003). */
export type AccountRole = 'titular' | 'encarregado'

/** Conta autenticada, como a API a devolve. */
export interface Account {
  id: string
  name: string
  email: string
  role: AccountRole
  /** Falso enquanto o link do RN005 não for aberto. */
  emailConfirmed: boolean
  /** A organização a que o encarregado está vinculado; ausente no titular. */
  organizationId?: string
  organizationName?: string
}
