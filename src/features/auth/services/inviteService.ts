import { http } from '@/shared/api/http'
import { isApiError } from '@/shared/api/ApiError'
import type { ApiAcceptedInvite, ApiInvitePreview } from '@/shared/api/contracts'
import type { InvitePreview } from '@/features/auth/types/invite'

/**
 * Convites de encarregado.
 *
 * Quem valida um convite é o servidor: o link é nominal, e aceitá-lo exige
 * entrar com a conta do endereço convidado — é isso que impede alguém de
 * assumir o perfil com um link que chegou a outra pessoa.
 */

/** Motivos pelos quais um convite não leva ao aceite. */
export type InviteFailure = 'expirado' | 'utilizado' | 'invalido'

export class InviteError extends Error {
  constructor(
    readonly reason: InviteFailure,
    /** O convite recusado, quando existe — a tela cita o endereço e as datas. */
    readonly invite?: InvitePreview,
  ) {
    super(reason)
    this.name = 'InviteError'
  }
}

/** Busca o convite do link e recusa o que não pode mais ser aceito. */
export async function fetchInvite(token: string): Promise<InvitePreview> {
  let preview: ApiInvitePreview
  try {
    preview = await http.get<ApiInvitePreview>(`/invites/${encodeURIComponent(token)}`)
  } catch (error) {
    if (isApiError(error, 404)) throw new InviteError('invalido')
    throw error
  }

  const invite: InvitePreview = {
    token,
    email: preview.email,
    organizationName: preview.organizationName,
    expiresAt: preview.expiresAt,
  }

  // Revogado responde como inválido: o link não diz por que deixou de valer.
  if (preview.status === 'REVOKED') throw new InviteError('invalido')
  if (preview.status === 'ACCEPTED') throw new InviteError('utilizado', invite)
  if (preview.status === 'EXPIRED') throw new InviteError('expirado', invite)
  return invite
}

/** Aceita o convite com a conta da sessão, que passa a responder pela organização. */
export async function acceptInvite(token: string): Promise<ApiAcceptedInvite> {
  return http.post<ApiAcceptedInvite>(`/invites/${encodeURIComponent(token)}/accept`)
}
