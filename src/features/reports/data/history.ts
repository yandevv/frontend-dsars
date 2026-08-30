import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { daysFromNow } from '@/shared/utils/date'
import type { ReportRecord } from '@/features/reports/types/report'
import type { RequestStatus } from '@/features/requests/types/request'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Histórico sintético de atendimentos, para o relatório gerencial.
 *
 * A fila de demonstração tem oito requisições — o bastante para uma tela de
 * trabalho, pouco demais para um gráfico dizer alguma coisa. Este módulo
 * completa o ano com os atendimentos já encerrados, na mesma proporção que o
 * mockup usava: acesso e correção respondem pela maior parte dos pedidos,
 * quase todos concluídos, alguns fora do prazo.
 *
 * A base é **determinística**: o mesmo gerador congruente linear, com a mesma
 * semente, devolve sempre os mesmos números. Um relatório que mudasse a cada
 * recarga não serviria nem para conferir uma conta nem para ilustrar um texto.
 * As datas, em compensação, são relativas a hoje, pelo mesmo motivo das
 * requisições de demonstração: "últimos 90 dias" precisa continuar querendo
 * dizer alguma coisa.
 *
 * Some junto com o serviço falso, como todo o resto de `data/`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RECORD_COUNT = 88

/** Distribuição dos direitos: um sorteio em dez com os pesos observados. */
const RIGHT_WEIGHTS = ['II', 'II', 'II', 'III', 'III', 'III', 'VI', 'VI', 'V', 'IX']

const STATUS_WEIGHTS: RequestStatus[] = [
  'concluida',
  'concluida',
  'concluida',
  'concluida',
  'concluida',
  'concluida',
  'concluida',
  'em-analise',
  'aguardando-complemento',
  'cancelada',
]

/**
 * Gerador congruente linear — o mesmo dos livros de Knuth.
 *
 * `Math.random()` daria uma base diferente a cada carregamento; aqui a semente
 * fixa é o que torna o relatório conferível.
 */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)] as T
}

function build(): readonly ReportRecord[] {
  const random = seeded(20260914)
  const records: ReportRecord[] = []

  for (let index = 0; index < RECORD_COUNT; index += 1) {
    // Espalhados pelos últimos nove meses, com os mais antigos ao fundo.
    const age = 20 + Math.floor(random() * 250)
    const rightNumeral = pick(RIGHT_WEIGHTS, random)
    let status = pick(STATUS_WEIGHTS, random)

    // O que entrou há pouco ainda não teve tempo de ser respondido.
    if (age < 20 && status === 'concluida' && random() < 0.5) status = 'em-analise'

    const daysToAnswer =
      status === 'concluida' ? 2 + Math.floor(random() * (LEGAL_DEADLINE_DAYS + 2)) : undefined

    // Pouco mais da metade de quem foi respondido avalia o atendimento.
    const rating =
      status === 'concluida' && random() < 0.55
        ? Math.min(5, 2 + Math.floor(random() * 4.2))
        : undefined

    records.push({
      registeredAt: daysFromNow(-age),
      rightNumeral,
      status,
      daysToAnswer,
      rating,
    })
  }

  return records
}

export const DEMO_HISTORY: readonly ReportRecord[] = build()
