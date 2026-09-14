import { ref, type Ref } from 'vue'

import {
  deleteMessage,
  editMessage,
  fetchRequest,
  sendMessage,
} from '@/features/requests/services/requestService'
import { messageOf } from '@/shared/api/ApiError'
import type { DataRequest, RequestAttachment } from '@/features/requests/types/request'

/**
 * Enviar, editar e excluir mensagens a partir de uma tela de detalhe.
 *
 * As duas telas — do titular e do encarregado — fazem exatamente o mesmo com a
 * conversa. Depois de cada operação a requisição é relida, para que conversa,
 * estado e histórico mostrem o que o servidor registrou.
 */
export function useRequestMessages(request: Ref<DataRequest | null>) {
  const sending = ref(false)
  const error = ref<string | null>(null)

  async function run(operation: (id: string) => Promise<unknown>): Promise<boolean> {
    const current = request.value
    if (!current || sending.value) return false

    sending.value = true
    error.value = null
    try {
      await operation(current.id)
      request.value = await fetchRequest(current.id)
      return true
    } catch (failure) {
      error.value = messageOf(failure)
      return false
    } finally {
      sending.value = false
    }
  }

  return {
    sending,
    error,
    send: (message: { text: string; attachments: RequestAttachment[] }) =>
      run((id) => sendMessage(id, message)),
    edit: ({ id: messageId, text }: { id: string; text: string }) =>
      run((id) => editMessage(id, messageId, text)),
    remove: (messageId: string) => run((id) => deleteMessage(id, messageId)),
  }
}
