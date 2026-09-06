import { describe, it, expect, vi } from 'vitest'

import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import {
  MessageRuleError,
  deleteMessage,
  editMessage,
  fetchRequest,
  sendMessage,
} from '../requestService'
import { canEditMessage } from '@/features/requests/utils/messages'
import type { MessageActor, RequestMessage } from '@/features/requests/types/request'

/** O último item — `Array.prototype.at` fica fora da versão da biblioteca do projeto. */
const last = <T>(list: readonly T[]): T | undefined => list[list.length - 1]


vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

function idOf(protocol: string): string {
  return DEMO_REQUESTS.find((request) => request.protocol === protocol)!.id
}

const MARINA: MessageActor = { name: 'Marina Torres de Almeida', role: 'titular' }
const RODRIGO: MessageActor = { name: 'Rodrigo Amaral Neves', role: 'titular' }
const HELENA: MessageActor = { name: 'Helena Prado Vasconcelos', role: 'encarregado' }

function minutesAfter(message: RequestMessage, minutes: number): Date {
  return new Date(new Date(message.sentAt).getTime() + minutes * 60_000)
}

describe('mensagens da requisição', () => {
  it('registra a mensagem no fim da conversa, sem espaços nas pontas', async () => {
    const request = await sendMessage(idOf('2026-000447'), {
      text: '  Posso receber a declaração em PDF?  ',
      actor: MARINA,
    })

    expect(last(request.messages)).toMatchObject({
      kind: 'mensagem',
      author: MARINA.name,
      authorRole: 'titular',
      text: 'Posso receber a declaração em PDF?',
    })
  })

  it('aceita mensagem só com anexo, mas não mensagem vazia', async () => {
    const request = await sendMessage(idOf('2026-000447'), {
      text: '',
      attachments: [{ name: 'rg.jpg', meta: 'JPG · 800 KB' }],
      actor: MARINA,
    })
    expect(last(request.messages)?.attachments).toHaveLength(1)

    await expect(
      sendMessage(idOf('2026-000447'), { text: '   ', actor: MARINA }),
    ).rejects.toMatchObject({ rule: 'mensagem-vazia' })
  })

  it('recusa mensagem acima de 2.000 caracteres', async () => {
    await expect(
      sendMessage(idOf('2026-000447'), { text: 'a'.repeat(2001), actor: MARINA }),
    ).rejects.toMatchObject({ rule: 'mensagem-longa' })
  })

  it('não aceita mensagens numa requisição encerrada', async () => {
    await expect(
      sendMessage(idOf('2026-000392'), { text: 'Mais uma dúvida.', actor: MARINA }),
    ).rejects.toMatchObject({ rule: 'requisicao-encerrada' })
  })

  it('devolve à análise a requisição que aguardava complemento quando o titular responde', async () => {
    const request = await sendMessage(idOf('2026-000431'), {
      text: 'Segue a foto do documento.',
      attachments: [{ name: 'documento.jpg', meta: 'JPG · 1,1 MB' }],
      actor: RODRIGO,
    })

    expect(request.status).toBe('em-analise')
    expect(request.timeline[0]?.title).toBe('Complemento enviado pelo titular')
  })

  it('edita a própria mensagem dentro da janela e guarda o original na trilha', async () => {
    const sent = await sendMessage(idOf('2026-000444'), { text: 'Texto com erro.', actor: MARINA })
    const message = last(sent.messages)!

    const edited = await editMessage(
      idOf('2026-000444'),
      message.id,
      { text: 'Texto corrigido.', actor: MARINA },
      minutesAfter(message, 10),
    )

    const after = edited.messages.find((item) => item.id === message.id)!
    expect(after.text).toBe('Texto corrigido.')
    expect(after.editedAt).toBeDefined()
    expect(edited.timeline[0]).toMatchObject({ title: 'Mensagem editada', internal: true })
    expect(edited.timeline[0]?.detail).toContain('Texto com erro.')
  })

  it('não edita depois de 30 minutos', async () => {
    const sent = await sendMessage(idOf('2026-000444'), { text: 'Enviada agora.', actor: MARINA })
    const message = last(sent.messages)!

    expect(canEditMessage(message, minutesAfter(message, 30))).toBe(true)
    expect(canEditMessage(message, minutesAfter(message, 31))).toBe(false)
    await expect(
      editMessage(idOf('2026-000444'), message.id, { text: 'Tarde demais.', actor: MARINA }, minutesAfter(message, 31)),
    ).rejects.toMatchObject({ rule: 'prazo-de-edicao' })
  })

  it('não deixa editar nem excluir a mensagem de outra pessoa', async () => {
    const request = await fetchRequest(idOf('2026-000418'))
    const fromTeam = request.messages.find((message) => message.authorRole === 'encarregado')!

    await expect(
      editMessage(idOf('2026-000418'), fromTeam.id, { text: 'Alterada.', actor: MARINA }),
    ).rejects.toMatchObject({ rule: 'nao-e-autor' })
    await expect(
      deleteMessage(idOf('2026-000418'), fromTeam.id, { actor: HELENA }),
    ).rejects.toBeInstanceOf(MessageRuleError)
  })

  it('exclui a própria mensagem: some da conversa e fica na trilha', async () => {
    const sent = await sendMessage(idOf('2026-000418'), { text: 'Mandei no lugar errado.', actor: MARINA })
    const message = last(sent.messages)!

    const after = await deleteMessage(idOf('2026-000418'), message.id, { actor: MARINA })

    expect(after.messages.find((item) => item.id === message.id)?.deletedAt).toBeDefined()
    expect(after.timeline[0]).toMatchObject({ title: 'Mensagem excluída', internal: true })
    expect(after.timeline[0]?.detail).toContain('Mandei no lugar errado.')
  })
})
