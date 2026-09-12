import type { RouteLocationRaw } from 'vue-router'

/** Um tópico da ajuda: um título curto e a explicação em linguagem corrente. */
export interface HelpTopic {
  title: string
  text: string
}

/** Uma seção da página, com âncora própria para o índice. */
export interface HelpSection {
  id: string
  title: string
  intro: string
  topics: readonly HelpTopic[]
  /** Atalho para a tela de que a seção fala. */
  action?: { label: string; to: RouteLocationRaw }
}

export interface HelpQuestion {
  question: string
  answer: string
}

/** Um termo técnico ou jurídico explicado sem jargão. */
export interface GlossaryTerm {
  term: string
  meaning: string
}
