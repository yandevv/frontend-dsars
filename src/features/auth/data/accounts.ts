import type { Account } from '@/features/auth/types/auth'

/** Conta de demonstração, com a senha que o protótipo aceita. */
export interface DemoAccount extends Account {
  password: string
}

/**
 * Contas do protótipo, iguais às publicadas no rodapé do quadro 1a de
 * `Login.dc.html`.
 *
 * Existem só para que os estados das telas de conta (RN004, RN005, RN008 a
 * RN010) possam ser percorridos e testados antes de haver uma API. Não são
 * credenciais de ninguém e somem quando o serviço real entrar — veja o aviso
 * em `services/accountService.ts`.
 */
export const DEMO_PASSWORD = 'SenhaSegura!123'

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    name: 'Marina Torres de Almeida',
    email: 'titular@exemplo.com.br',
    role: 'titular',
    emailConfirmed: true,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Helena Prado Vasconcelos',
    email: 'helena.vasconcelos@meridianosaude.org.br',
    role: 'encarregado',
    emailConfirmed: true,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Rafael Nogueira Lima',
    email: 'pendente@exemplo.com.br',
    role: 'titular',
    emailConfirmed: false,
    password: DEMO_PASSWORD,
  },
]

/** Normaliza o endereço antes de comparar: e-mail não diferencia maiúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function findDemoAccount(email: string): DemoAccount | undefined {
  const wanted = normalizeEmail(email)
  return DEMO_ACCOUNTS.find((account) => normalizeEmail(account.email) === wanted)
}
