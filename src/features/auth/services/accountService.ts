import { http } from '@/shared/api/http'
import type { NewAccount } from '@/features/auth/types/auth'
import { recordConfirmationSent } from '@/features/auth/services/emailConfirmationService'

/**
 * Cria a conta do titular (RF002).
 *
 * A resposta é a mesma para endereço novo e para endereço já cadastrado: o
 * RN004 continua valendo — um e-mail, uma conta —, mas quem descobre isso é o
 * dono do endereço, pelo e-mail que recebe, e não quem digitou no formulário.
 * O aceite único da tela cobre os termos de uso e o aviso de privacidade.
 */
export async function createAccount(input: NewAccount): Promise<string> {
  const email = input.email.trim().toLowerCase()

  await http.post('/auth/register', {
    fullName: input.name.trim(),
    email,
    password: input.password,
    passwordConfirmation: input.password,
    acceptedTerms: true,
    acceptedPrivacyNotice: true,
  })

  recordConfirmationSent(email)
  return email
}
