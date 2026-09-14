import { CONFIRMATION_RESEND_SECONDS } from '@/features/auth/constants/confirmationPolicy'
import { http } from '@/shared/api/http'
import { isApiError } from '@/shared/api/ApiError'

/**
 * Confirmação de e-mail: do cadastro (RF002) e da troca de endereço (RF017).
 *
 * O servidor responde do mesmo jeito exista ou não conta para o endereço, e
 * recusa com a mesma mensagem link vencido, usado ou inexistente — dizer qual
 * dos três entregaria quem usa o portal. O intervalo mínimo entre envios
 * (RN063) é conferido lá também, em silêncio; a contagem aqui só existe para
 * que a pessoa veja quanto falta em vez de clicar num botão que não faz nada.
 */

/** De onde veio o pedido de confirmação: do cadastro ou da troca de e-mail. */
export type ConfirmationOrigin = 'cadastro' | 'troca'

/** O que a validação do link encontrou. */
export type ConfirmationResult =
  | { kind: 'cadastro' }
  | { kind: 'troca'; email: string; previous?: string }

export type ConfirmationFailure = 'invalido' | 'intervalo'

export class ConfirmationError extends Error {
  constructor(
    readonly reason: ConfirmationFailure,
    readonly detail?: { retryAt?: string },
  ) {
    super(reason)
    this.name = 'ConfirmationError'
  }
}

const sentAt = new Map<string, number>()

function keyOf(email: string): string {
  return email.trim().toLowerCase()
}

/** Registra um envio — o cadastro chama ao criar a conta. */
export function recordConfirmationSent(email: string, now: number = Date.now()): void {
  sentAt.set(keyOf(email), now)
}

/** Quando o último link foi enviado para este endereço, nesta aba. */
export function lastConfirmationSentAt(email: string): number | undefined {
  return sentAt.get(keyOf(email))
}

/** Pede um novo link, respeitando o intervalo mínimo entre envios. */
export async function resendConfirmation(
  email: string,
  now: number = Date.now(),
): Promise<{ sentAt: string }> {
  const last = sentAt.get(keyOf(email))
  if (last !== undefined && now - last < CONFIRMATION_RESEND_SECONDS * 1000) {
    throw new ConfirmationError('intervalo', {
      retryAt: new Date(last + CONFIRMATION_RESEND_SECONDS * 1000).toISOString(),
    })
  }

  await http.post('/auth/confirm-email/resend', { email: keyOf(email) })
  sentAt.set(keyOf(email), now)
  return { sentAt: new Date(now).toISOString() }
}

/** Valida o link do cadastro. */
export async function confirmEmail(token: string): Promise<ConfirmationResult> {
  try {
    await http.post('/auth/confirm-email', { token })
    return { kind: 'cadastro' }
  } catch (error) {
    if (isApiError(error, 400)) throw new ConfirmationError('invalido')
    throw error
  }
}

/** Valida o link da troca de e-mail — só com a sessão da própria conta. */
export async function confirmEmailChange(token: string): Promise<ConfirmationResult> {
  try {
    const { email } = await http.post<{ email: string }>('/me/email-change/confirm', { token })
    return { kind: 'troca', email }
  } catch (error) {
    if (isApiError(error, 400)) throw new ConfirmationError('invalido')
    throw error
  }
}
