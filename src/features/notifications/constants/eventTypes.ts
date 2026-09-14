import type { ApiNotificationEvent } from '@/shared/api/contracts'
import type { NotificationTone } from '@/features/notifications/types/notification'

/**
 * Como cada tipo de evento aparece na lista: o rótulo curto e o tom do filete.
 * Alerta para prazo vencido e segurança, pendência para o que espera uma ação.
 */
export const EVENT_PRESENTATION: Record<ApiNotificationEvent, { type: string; tone: NotificationTone }> = {
  REQUEST_REGISTERED: { type: 'Requisição registrada', tone: 'neutro' },
  REQUEST_MESSAGE_RECEIVED: { type: 'Nova mensagem', tone: 'pendencia' },
  REQUEST_COMPLETED: { type: 'Requisição concluída', tone: 'neutro' },
  REQUEST_CANCELLED: { type: 'Requisição cancelada', tone: 'neutro' },
  REQUEST_DEADLINE_APPROACHING: { type: 'Prazo próximo', tone: 'pendencia' },
  REQUEST_DEADLINE_EXPIRED: { type: 'Prazo vencido', tone: 'alerta' },
  SATISFACTION_SURVEY_AVAILABLE: { type: 'Pesquisa de satisfação', tone: 'pendencia' },
  ACCOUNT_SECURITY_ALERT: { type: 'Segurança da conta', tone: 'alerta' },
  DPO_INVITE_RECEIVED: { type: 'Convite de encarregado', tone: 'pendencia' },
}
