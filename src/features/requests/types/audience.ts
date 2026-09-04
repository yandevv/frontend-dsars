/**
 * Para quem um bloco da requisição está sendo mostrado.
 *
 * A requisição é a mesma para o titular e para o encarregado; o que muda é o
 * que cada um precisa ler — o titular não vê o trabalho interno da equipe nem
 * as instruções dirigidas a quem atende.
 */
export type RequestAudience = 'encarregado' | 'titular'
