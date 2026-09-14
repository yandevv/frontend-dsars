/**
 * Entrega um arquivo gerado no navegador.
 *
 * Fica em `shared` porque a fila e o relatório exportam do mesmo jeito. O BOM
 * no começo do texto é o que faz o Excel em português abrir o arquivo em UTF-8
 * em vez de trocar os acentos.
 */
export function downloadText(filename: string, content: string, type = 'text/csv'): void {
  const blob = new Blob([`﻿${content}`], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/** Entrega um arquivo que já veio pronto do servidor. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
