import type { RequestStatus } from '@/features/requests/types/request'

/**
 * Uma requisição vista pelo relatório: sem nome, sem e-mail, sem protocolo.
 *
 * O recorte é deliberado. O relatório serve para defender números diante da
 * diretoria e da autoridade, e nada nele precisa apontar para uma pessoa — nem
 * para quem pediu, nem para quem respondeu a pesquisa de satisfação.
 */
export interface ReportRecord {
  registeredAt: string
  rightNumeral: string
  status: RequestStatus
  /** Dias corridos do registro à resposta final; ausente enquanto não houve. */
  daysToAnswer?: number
  /** Nota de 1 a 5; ausente quando a pesquisa não foi respondida. */
  rating?: number
}

/** Um dos números grandes do topo do relatório. */
export interface ReportIndicator {
  label: string
  value: string
  unit: string
  note: string
  tone: string
}

/** Uma barra dos gráficos de composição. */
export interface ReportBar {
  label: string
  total: number
  /** Participação no conjunto, já formatada: "34%". */
  share: string
  /** Largura relativa à maior barra, pronta para o estilo. */
  width: string
  color: string
}

/** Os formatos em que o relatório pode sair. */
export type ExportFormat = 'csv' | 'pdf' | 'base'
