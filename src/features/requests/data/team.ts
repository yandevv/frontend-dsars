/**
 * Quem atende requisições no Instituto Meridiano.
 *
 * A encarregada é a mesma pessoa que o portal público apresenta em
 * `features/tenant/data/instituto-meridiano.ts` — o design trazia outro nome no
 * cabeçalho da área interna, e manter dois seria dizer ao leitor do TCC que a
 * organização tem duas encarregadas. As analistas vêm da coluna "responsável"
 * da fila, onde o mockup as abrevia como "B. Falcão" e "C. Duarte".
 */
export const DPO_NAME = 'Helena Prado Vasconcelos'

export const ANALYSTS = ['Beatriz Falcão Ribeiro', 'Caio Duarte Salgado'] as const

/** Quem pode assumir uma requisição, para a reatribuição e os filtros. */
export const REQUEST_HANDLERS: readonly string[] = [DPO_NAME, ...ANALYSTS]
