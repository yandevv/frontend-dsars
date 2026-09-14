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
export type ExportFormat = 'csv' | 'pdf'
