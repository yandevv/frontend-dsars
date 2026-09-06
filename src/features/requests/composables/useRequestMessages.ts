import { ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

import {
  MessageRuleError,
  deleteMessage,
  editMessage,
  sendMessage,
  type MessageRule,
} from '@/features/requests/services/requestService'
import { MESSAGE_EDIT_WINDOW_MINUTES } from '@/features/requests/constants/requestPolicy'
import type {
  DataRequest,
  MessageActor,
  MessageKind,
  RequestAttachment,
} from '@/features/requests/types/request'

/** Cada recusa do serviço em linguagem de quem está na tela. */
export const MESSAGE_RULE_TEXTS: Record<MessageRule, string> = {
  'requisicao-encerrada':
    'A requisição foi encerrada enquanto você escrevia e não aceita mais mensagens.',
  'nao-e-autor': 'Só quem enviou a mensagem pode alterá-la ou excluí-la.',
  'prazo-de-edicao': `O prazo de ${MESSAGE_EDIT_WINDOW_MINUTES} minutos para editar esta mensagem acabou. Ela ainda pode ser excluída.`,
  'mensagem-vazia': 'Escreva a mensagem ou anexe um arquivo.',
  'mensagem-longa': 'A mensagem passou do limite de caracteres.',
  'sem-resultado': 'Anexe o resultado do atendimento para finalizar.',
}

/**
 * Enviar, editar e excluir mensagens a partir de uma tela de detalhe.
 *
 * As duas telas — do titular e do encarregado — fazem exatamente o mesmo com a
 * conversa; o que muda é quem está agindo. Cada operação troca a requisição
 * inteira pela que o serviço devolve, para que estado e histórico acompanhem.
 */
export function useRequestMessages(
  request: Ref<DataRequest | null>,
  actor: MaybeRefOrGetter<MessageActor>,
) {
  const sending = ref(false)
  const error = ref<string | null>(null)

  async function run(operation: (id: string) => Promise<DataRequest>): Promise<boolean> {
    const current = request.value
    if (!current || sending.value) return false

    sending.value = true
    error.value = null
    try {
      request.value = { ...(await operation(current.id)) }
      return true
    } catch (failure) {
      if (!(failure instanceof MessageRuleError)) throw failure
      error.value = MESSAGE_RULE_TEXTS[failure.rule]
      return false
    } finally {
      sending.value = false
    }
  }

  return {
    sending,
    error,
    send: (
      message: { text: string; attachments: RequestAttachment[] },
      kind: Exclude<MessageKind, 'parecer'> = 'mensagem',
    ) => run((id) => sendMessage(id, { ...message, kind, actor: toValue(actor) })),
    edit: ({ id: messageId, text }: { id: string; text: string }) =>
      run((id) => editMessage(id, messageId, { text, actor: toValue(actor) })),
    remove: (messageId: string) =>
      run((id) => deleteMessage(id, messageId, { actor: toValue(actor) })),
  }
}
