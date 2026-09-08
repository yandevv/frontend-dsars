import { CONFIRMATION_RESEND_SECONDS } from '@/features/auth/constants/confirmationPolicy'
import { delay } from '@/features/auth/services/fakeNetwork'
import { normalizeEmail } from '@/features/auth/data/accounts'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API de confirmação de e-mail.
 *
 * O servidor gera o link, guarda quando foi enviado e diz o que aconteceu ao
 * validá-lo. Enquanto ele não existe, os envios ficam em memória e o link é
 * representado por fichas de demonstração, uma para cada desfecho possível.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** De onde veio o pedido de confirmação: do cadastro ou da troca de e-mail. */
export type ConfirmationOrigin = 'cadastro' | 'troca'

/** O que a validação do link encontrou. */
export type ConfirmationResult =
  | { kind: 'cadastro'; email: string }
  | { kind: 'troca'; email: string; previous: string }

export type ConfirmationFailure = 'expirado' | 'invalido' | 'intervalo'

export class ConfirmationError extends Error {
  constructor(
    readonly reason: ConfirmationFailure,
    /** Para quem o link vencido tinha sido enviado, e quando. */
    readonly detail?: { email?: string; sentAt?: string; retryAt?: string },
  ) {
    super(reason)
    this.name = 'ConfirmationError'
  }
}

/**
 * Fichas de demonstração, uma por desfecho, para percorrer a tela sem caixa de
 * entrada de verdade: `/confirmar-email/demo-cadastro` e assim por diante.
 */
export const DEMO_CONFIRMATION_TOKENS = {
  cadastro: 'demo-cadastro',
  troca: 'demo-troca',
  expirado: 'demo-expirado',
} as const

const sentAt = new Map<string, number>()
const confirmed = new Set<string>()

/** Registra um envio — o cadastro chama ao criar a conta. */
export function recordConfirmationSent(email: string, now: number = Date.now()): void {
  sentAt.set(normalizeEmail(email), now)
}

/** Quando o último link foi enviado para este endereço, se foi. */
export function lastConfirmationSentAt(email: string): number | undefined {
  return sentAt.get(normalizeEmail(email))
}

/** A conta cujo link foi aberto nesta sessão passa a entrar normalmente. */
export function isConfirmedInSession(email: string): boolean {
  return confirmed.has(normalizeEmail(email))
}

/**
 * Envia um novo link, respeitando o intervalo mínimo entre envios.
 *
 * A resposta é a mesma exista ou não conta para o endereço: dizer "esse e-mail
 * não tem cadastro" entregaria quem usa o portal.
 */
export async function resendConfirmation(
  email: string,
  now: number = Date.now(),
): Promise<{ sentAt: string }> {
  const key = normalizeEmail(email)
  const last = sentAt.get(key)
  if (last !== undefined && now - last < CONFIRMATION_RESEND_SECONDS * 1000) {
    throw new ConfirmationError('intervalo', {
      retryAt: new Date(last + CONFIRMATION_RESEND_SECONDS * 1000).toISOString(),
    })
  }

  await delay()
  sentAt.set(key, now)
  return { sentAt: new Date(now).toISOString() }
}

/**
 * Valida o link aberto pela pessoa.
 *
 * Link inexistente e link já usado dão a mesma recusa, pelo mesmo motivo do
 * reenvio: o portal não confirma se existe conta para um endereço.
 */
export async function confirmEmail(token: string): Promise<ConfirmationResult> {
  await delay()

  if (token === DEMO_CONFIRMATION_TOKENS.cadastro) {
    confirmed.add('pendente@exemplo.com.br')
    return { kind: 'cadastro', email: 'pendente@exemplo.com.br' }
  }
  if (token === DEMO_CONFIRMATION_TOKENS.troca) {
    return {
      kind: 'troca',
      email: 'marina.almeida@exemplo.com.br',
      previous: 'titular@exemplo.com.br',
    }
  }
  if (token === DEMO_CONFIRMATION_TOKENS.expirado) {
    throw new ConfirmationError('expirado', {
      email: 'pendente@exemplo.com.br',
      sentAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
  }
  throw new ConfirmationError('invalido')
}
