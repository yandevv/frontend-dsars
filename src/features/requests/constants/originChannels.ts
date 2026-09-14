import type { OriginChannel } from '@/features/requests/types/request'

/**
 * Os canais por onde um pedido chega fora do portal (RN018), os mesmos que a
 * API aceita.
 *
 * `phrase` é o canal dentro de uma frase — "recebido por telefone", "recebido
 * presencialmente" —, porque a preposição muda de canal para canal e o titular
 * lê essa frase na própria requisição.
 */
export const ORIGIN_CHANNELS: readonly {
  id: OriginChannel
  label: string
  detail: string
  phrase: string
}[] = [
  {
    id: 'IN_PERSON',
    label: 'Presencial',
    detail: 'Atendimento no balcão da unidade.',
    phrase: 'presencialmente',
  },
  { id: 'PHONE', label: 'Telefone', detail: 'Central de relacionamento.', phrase: 'por telefone' },
  {
    id: 'EMAIL',
    label: 'E-mail',
    detail: 'Mensagem ao endereço do encarregado.',
    phrase: 'por e-mail',
  },
  {
    id: 'POSTAL_MAIL',
    label: 'Carta',
    detail: 'Correspondência física protocolada.',
    phrase: 'por carta',
  },
  {
    id: 'OTHER',
    label: 'Outro canal',
    detail: 'Ouvidoria, ofício de autoridade ou outro meio.',
    phrase: 'por outro canal',
  },
]

export function findOriginChannel(id: OriginChannel) {
  return ORIGIN_CHANNELS.find((channel) => channel.id === id) ?? ORIGIN_CHANNELS[4]!
}
