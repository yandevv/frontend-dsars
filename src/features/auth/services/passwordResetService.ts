import { http } from '@/shared/api/http'

/**
 * Recuperação de acesso por e-mail.
 *
 * O pedido responde igual exista ou não conta para o endereço; o link vale
 * poucos minutos e, usado, encerra as outras sessões da conta.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await http.post('/auth/password/forgot', { email: email.trim().toLowerCase() })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await http.post('/auth/password/reset', {
    token,
    password,
    passwordConfirmation: password,
  })
}
