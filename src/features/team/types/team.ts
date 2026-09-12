/** Quem atende requisições pela organização, com a carga que carrega agora. */
export interface TeamMember {
  name: string
  email: string
  /** A função na equipe — o perfil de acesso é o mesmo para todos. */
  jobTitle: string
  /** Quem responde pela equipe e envia os convites. */
  lead?: boolean
  joinedAt: string
  lastAccessAt: string
}

export interface TeamMemberWorkload extends TeamMember {
  /** Requisições em aberto sob a responsabilidade desta pessoa. */
  open: number
  overdue: number
}

/** Situação do convite, derivada das datas — nunca guardada. */
export type InviteStatus = 'pendente' | 'vencido' | 'revogado' | 'aceito'
