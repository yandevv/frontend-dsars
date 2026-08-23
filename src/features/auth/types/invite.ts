import type { AccountRole } from '@/features/auth/types/auth'

/**
 * Convite para atuar em nome da organização.
 *
 * O perfil não é escolhido por quem se cadastra: vem no convite e prende a
 * conta a esta organização. É a diferença entre esta tela e o cadastro comum.
 */
export interface Invite {
  token: string
  /** Endereço para o qual o convite foi enviado — não pode ser trocado. */
  email: string
  role: AccountRole
  /** Quem enviou o convite, para que dê para reconhecê-lo. */
  invitedBy: string
  invitedByRole: string
  /** Datas em ISO, como uma API devolveria. */
  issuedAt: string
  expiresAt: string
  /** Presente quando a conta do convite já foi criada. */
  usedAt?: string
}

/** Dados que a tela de convite envia para criar a conta vinculada. */
export interface InviteAcceptance {
  token: string
  name: string
  password: string
}
