import type { OriginChannel } from '@/features/requests/types/request'

/**
 * Os canais por onde um pedido chega fora do portal (RN018).
 *
 * `phrase` é o canal dentro de uma frase — "recebido por telefone", "recebido
 * no balcão" —, porque a preposição muda de canal para canal e o titular lê
 * essa frase na própria requisição.
 */
export const ORIGIN_CHANNELS: readonly {
  id: OriginChannel
  label: string
  detail: string
  phrase: string
}[] = [
  { id: 'balcao', label: 'Balcão', detail: 'Atendimento presencial na unidade.', phrase: 'no balcão' },
  { id: 'telefone', label: 'Telefone', detail: 'Central de relacionamento.', phrase: 'por telefone' },
  {
    id: 'email',
    label: 'E-mail',
    detail: 'Mensagem ao endereço do encarregado.',
    phrase: 'por e-mail',
  },
  {
    id: 'carta',
    label: 'Carta',
    detail: 'Correspondência física protocolada.',
    phrase: 'por carta',
  },
  {
    id: 'ouvidoria',
    label: 'Ouvidoria',
    detail: 'Encaminhado pela ouvidoria interna.',
    phrase: 'pela ouvidoria',
  },
  {
    id: 'autoridade',
    label: 'ANPD ou órgão público',
    detail: 'Ofício recebido de autoridade.',
    phrase: 'por ofício de autoridade',
  },
]

export function findOriginChannel(id: OriginChannel) {
  return ORIGIN_CHANNELS.find((channel) => channel.id === id)!
}
