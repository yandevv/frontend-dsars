import { normalizeEmail } from '@/features/auth/data/accounts'
import { currentPasswordOf } from '@/features/settings/services/securityService'
import { DEMO_PROFILES } from '@/features/settings/data/profiles'
import { delay } from '@/features/auth/services/fakeNetwork'
import { formatPhone, isValidPhone } from '@/features/settings/utils/mask'
import { recordConfirmationSent } from '@/features/auth/services/emailConfirmationService'
import type { AccountProfile, EditableField } from '@/features/settings/types/profile'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API de dados da conta.
 *
 * As telas de configuração já conversam com estas funções, inclusive nas
 * recusas. Toda alteração bem-sucedida seria registrada em auditoria pelo
 * servidor, com data, hora e origem; aqui ela só muda a cópia em memória.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ProfileRefusal =
  | 'nome-invalido'
  | 'email-invalido'
  | 'email-igual'
  | 'telefone-invalido'
  | 'senha-incorreta'
  | 'sem-troca-pendente'

export class ProfileError extends Error {
  constructor(readonly refusal: ProfileRefusal) {
    super(refusal)
    this.name = 'ProfileError'
  }
}

const profiles = new Map<string, AccountProfile>(
  DEMO_PROFILES.map((profile) => [normalizeEmail(profile.email), { ...profile }]),
)

function profileOf(email: string): AccountProfile {
  const key = normalizeEmail(email)
  let profile = profiles.get(key)
  if (!profile) {
    // Conta criada nesta sessão: começa só com o que o cadastro pediu.
    profile = { name: '', email: key, document: '', phone: '' }
    profiles.set(key, profile)
  }
  return profile
}

export async function fetchProfile(email: string): Promise<AccountProfile> {
  await delay()
  return { ...profileOf(email) }
}

/** Nome e telefone mudam na hora; o e-mail tem fluxo próprio. */
export async function updateProfile(
  email: string,
  field: Exclude<EditableField, 'email'>,
  value: string,
): Promise<AccountProfile> {
  await delay()
  const profile = profileOf(email)

  if (field === 'name') {
    const name = value.trim().replace(/\s+/g, ' ')
    if (name.split(' ').length < 2) throw new ProfileError('nome-invalido')
    profile.name = name
  } else {
    if (!isValidPhone(value)) throw new ProfileError('telefone-invalido')
    profile.phone = formatPhone(value)
  }

  return { ...profile }
}

/**
 * Pede a troca de e-mail. O novo endereço fica pendente até a confirmação: o
 * atual continua sendo o de acesso e o dos avisos. Pede a senha atual porque
 * quem troca o e-mail passa a controlar a recuperação da conta.
 */
export async function requestEmailChange(
  email: string,
  { newEmail, password }: { newEmail: string; password: string },
): Promise<AccountProfile> {
  await delay()
  const profile = profileOf(email)
  const next = normalizeEmail(newEmail)

  if (!/.+@.+\..+/.test(next)) throw new ProfileError('email-invalido')
  if (next === normalizeEmail(profile.email)) throw new ProfileError('email-igual')

  if (password !== currentPasswordOf(email)) throw new ProfileError('senha-incorreta')

  profile.pendingEmail = next
  recordConfirmationSent(next)
  return { ...profile }
}

export async function cancelEmailChange(email: string): Promise<AccountProfile> {
  await delay()
  const profile = profileOf(email)
  if (!profile.pendingEmail) throw new ProfileError('sem-troca-pendente')
  delete profile.pendingEmail
  return { ...profile }
}
