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
  /** A que se refere, para a linha de apoio. */
  reference?: string
  /** O aviso aponta para algum recurso — requisição, conta, convite. */
  hasTarget: boolean
  /** Por que o recurso não está mais disponível — explicado no lugar do link morto. */
  unavailableReason?: string
  unread: boolean
}

/** Onde abrir o aviso: a rota do recurso, ou nada quando ele sumiu. */
export type NotificationDestination =
  | { kind: 'rota'; to: RouteLocationRaw }
  | { kind: 'indisponivel'; reason: string }
  | { kind: 'nenhum' }
