import { SUBJECT_REGISTRY, type RegisteredSubject } from '@/features/requests/data/subjectRegistry'
import { cpfDigits } from '@/features/requests/utils/onBehalf'
import { delay } from '@/features/auth/services/fakeNetwork'

/**
 * Busca no cadastro de titulares da organização controladora.
 *
 * No sistema real a busca roda no servidor e só devolve titulares desta
 * organização; aqui o cadastro inteiro já é dela.
 */

/** Menos que isso devolveria meio cadastro a cada letra digitada. */
export const SUBJECT_SEARCH_MIN_LENGTH = 3

const MAX_RESULTS = 5

/** Sem acento e sem maiúscula: "Joao" acha "João". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** Por CPF, e-mail ou nome — o que a pessoa tiver em mãos no atendimento. */
export async function searchSubjects(query: string): Promise<RegisteredSubject[]> {
  await delay(300)

  const wanted = normalize(query)
  if (wanted.length < SUBJECT_SEARCH_MIN_LENGTH) return []

  // Só algarismos, pontos e traço: é um CPF, inteiro ou em parte.
  const byDocument = /^[\d.\-\s]+$/.test(wanted)
  const digits = cpfDigits(wanted)

  return SUBJECT_REGISTRY.filter((subject) =>
    byDocument
      ? cpfDigits(subject.cpf).includes(digits)
      : normalize(subject.name).includes(wanted) || normalize(subject.email).includes(wanted),
  ).slice(0, MAX_RESULTS)
}
