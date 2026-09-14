import type { RequestMessage } from '@/features/requests/types/request'

/**
 * Uma mensagem própria pode ser editada até o fim da janela que o servidor
 * informa — meia hora depois do envio.
 *
 * Fica fora do componente porque a mesma regra decide se o botão de editar
 * aparece; quem recusa de verdade uma edição atrasada é o servidor.
 */
export function canEditMessage(message: RequestMessage, now: Date = new Date()): boolean {
  if (!message.mine || !message.editableUntil) return false
  return new Date(message.editableUntil).getTime() > now.getTime()
}
