import type { AccountProfile } from '@/features/settings/types/profile'

/**
 * Cadastro das contas de demonstração, com os mesmos e-mails de
 * `features/auth/data/accounts.ts`. Documento e telefone são fictícios — não
 * pertencem a ninguém — e somem junto com o serviço falso.
 */
export const DEMO_PROFILES: readonly AccountProfile[] = [
  {
    name: 'Marina Torres de Almeida',
    email: 'titular@exemplo.com.br',
    document: '476.201.789-04',
    phone: '(16) 99482-3071',
  },
  {
    name: 'Helena Prado Vasconcelos',
    email: 'helena.vasconcelos@meridianosaude.org.br',
    document: '318.554.260-77',
    phone: '(16) 3721-4410',
  },
  {
    name: 'Rafael Nogueira Lima',
    email: 'pendente@exemplo.com.br',
    document: '205.918.334-51',
    phone: '(16) 98110-2267',
  },
]
