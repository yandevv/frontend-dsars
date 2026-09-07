import type { RouteLocationRaw } from 'vue-router'

/**
 * O tom do aviso, que decide o filete à esquerda: alerta para prazo vencido,
 * pendência para o que espera uma ação, neutro para o resto.
 */
export type NotificationTone = 'alerta' | 'pendencia' | 'neutro'

/** Um aviso da plataforma (RF023). */
export interface AppNotification {
  id: string
  /** O tipo de evento, em linguagem de gente — "Requisição concluída". */
  type: string
  tone: NotificationTone
  title: string
  detail: string
  /** Quando aconteceu, em ISO; o texto "Hoje, 07:00" é derivado dele. */
  at: string
  /** A que se refere, para a linha de apoio — "Protocolo 2026-000418". */
  reference?: string
  /** Para onde o aviso leva ao ser acionado. Ausente quando o recurso sumiu. */
  target?: RouteLocationRaw
  /** Por que o recurso não está mais disponível — explicado no lugar do link morto. */
  unavailableReason?: string
  unread: boolean
}

/** O que um serviço informa ao registrar um aviso novo; o resto é preenchido na entrada. */
export type NewNotification = Omit<AppNotification, 'id' | 'at' | 'unread'>
