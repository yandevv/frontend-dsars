import { http } from '@/shared/api/http'
import { recordConfirmationSent } from '@/features/auth/services/emailConfirmationService'
import type { ApiAccountView, ApiRevealedPersonalData } from '@/shared/api/contracts'
import type {
  AccountProfile,
  EditableField,
  RevealableField,
} from '@/features/settings/types/profile'

/**
 * Dados da conta (RF016 / RF017).
 *
 * Documento e telefone saem do servidor já mascarados; o valor inteiro só vem
 * por pedido explícito, que o servidor registra na trilha de auditoria. Toda
 * alteração também é registrada lá, com data, hora e origem.
 */

export function toProfile(view: ApiAccountView): AccountProfile {
  return {
    name: view.fullName,
    email: view.email,
    documentMasked: view.document?.masked,
    documentType: view.document?.type,
    documentVerified: view.document?.verified ?? false,
    phoneMasked: view.phone?.masked,
    pendingEmail: view.pendingEmailChange?.newEmail,
    passwordSet: view.passwordSet,
  }
}

export async function fetchProfile(): Promise<AccountProfile> {
  return toProfile(await http.get<ApiAccountView>('/me'))
}

/** Nome e telefone mudam na hora; o e-mail tem fluxo próprio. */
export async function updateProfile(
  field: Exclude<EditableField, 'email'>,
  value: string,
): Promise<AccountProfile> {
  const body = field === 'name' ? { fullName: value.trim() } : { phone: value.trim() }
  return toProfile(await http.patch<ApiAccountView>('/me', body))
}

/**
 * Pede a troca de e-mail. O novo endereço fica pendente até a confirmação: o
 * atual continua sendo o de acesso e o dos avisos.
 */
export async function requestEmailChange(newEmail: string): Promise<AccountProfile> {
  const email = newEmail.trim().toLowerCase()
  await http.post('/me/email-change', { newEmail: email })
  recordConfirmationSent(email)
  return fetchProfile()
}

/** O valor sem máscara de um dado de identificação. */
export async function revealPersonalData(field: RevealableField): Promise<string> {
  const data = await http.post<ApiRevealedPersonalData>('/me/personal-data/reveal', {
    fields: [field],
  })
  return (field === 'document' ? data.document?.value : data.phone) ?? ''
}
