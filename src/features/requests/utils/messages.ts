import { MESSAGE_EDIT_WINDOW_MINUTES } from '@/features/requests/constants/requestPolicy'
import type { RequestMessage } from '@/features/requests/types/request'

/**
 * Uma mensagem pode ser editada até meia hora depois do envio.
 *
 * Fica fora do serviço porque a tela usa a mesma regra para decidir se mostra
 * o botão de editar — e as duas não podem discordar.
 */
export function canEditMessage(message: RequestMessage, now: Date = new Date()): boolean {
  const elapsed = now.getTime() - new Date(message.sentAt).getTime()
  return elapsed <= MESSAGE_EDIT_WINDOW_MINUTES * 60_000
}
